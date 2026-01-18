import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Employee } from '../models/employeeModel';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private apiUrl = `${environment.apiUrl}/api/Employee`;
  
  // Signals pour la réactivité
  private _employees = signal<Employee[]>([]);
  private _loading = signal<boolean>(false);
  private _initialized = signal<boolean>(false);
  
  // Signals exposés en lecture seule
  readonly employees = this._employees.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly initialized = this._initialized.asReadonly();
  
  // Signal calculé pour le nombre d'employés
  readonly count = computed(() => this._employees().length);

  // Signal pour les employés favoris en tête de liste
  readonly sortedEmployees = computed(() => {
    const employees = this._employees();
    return [...employees].sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return 0;
    });
  });

  constructor(private http: HttpClient) {}

  /** Charge les employés depuis l'API */
  load(): void {
    if (this._loading()) return;
    
    this._loading.set(true);
    this.http.get<Employee[]>(this.apiUrl).subscribe({
      next: (employees) => {
        this._employees.set(employees);
        this._initialized.set(true);
        this._loading.set(false);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des employés:', error);
        this._loading.set(false);
      }
    });
  }

  /** Rafraîchit silencieusement (sans loading) */
  refresh(): void {
    this.http.get<Employee[]>(this.apiUrl).subscribe({
      next: (employees) => {
        this._employees.set(employees);
      },
      error: (error) => {
        console.error('Erreur lors du rafraîchissement:', error);
      }
    });
  }

  /** Crée un employé avec mise à jour optimiste */
  create(employee: Employee): Observable<Employee> {
    const tempId = 'temp-' + Date.now();
    const tempEmployee = { ...employee, uuid: tempId };
    this._employees.update(employees => [...employees, tempEmployee]);
    
    return this.http.post<Employee>(this.apiUrl, employee).pipe(
      tap({
        next: (created) => {
          this._employees.update(employees => 
            employees.map(e => e.uuid === tempId ? created : e)
          );
        },
        error: () => {
          this._employees.update(employees => 
            employees.filter(e => e.uuid !== tempId)
          );
        }
      })
    );
  }

  /** Met à jour un employé avec mise à jour optimiste */
  update(id: string, employee: Employee): Observable<Employee> {
    const oldEmployees = this._employees();
    
    this._employees.update(employees => 
      employees.map(e => e.uuid === id ? { ...e, ...employee } : e)
    );
    
    return this.http.put<Employee>(`${this.apiUrl}/${id}`, employee).pipe(
      tap({
        next: (updated) => {
          this._employees.update(employees => 
            employees.map(e => e.uuid === id ? updated : e)
          );
        },
        error: () => {
          this._employees.set(oldEmployees);
        }
      })
    );
  }

  /** Supprime un employé avec mise à jour optimiste */
  delete(id: string): Observable<void> {
    const oldEmployees = this._employees();
    
    this._employees.update(employees => employees.filter(e => e.uuid !== id));
    
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap({
        error: () => {
          this._employees.set(oldEmployees);
        }
      })
    );
  }

  getAll(): Observable<Employee[]> {
    return this.http.get<Employee[]>(this.apiUrl);
  }

  getById(id: string): Observable<Employee> {
    return this.http.get<Employee>(`${this.apiUrl}/${id}`);
  }

  deleteAll(): Observable<{ deletedCount: number }> {
    const oldEmployees = this._employees();
    this._employees.set([]);
    
    return this.http.delete<{ deletedCount: number }>(this.apiUrl).pipe(
      tap({
        error: () => {
          this._employees.set(oldEmployees);
        }
      })
    );
  }

  /** Toggle le statut favori d'un employé */
  toggleFavorite(id: string): Observable<Employee> {
    const employee = this._employees().find(e => e.uuid === id);
    if (!employee) {
      throw new Error('Employee not found');
    }
    
    const updatedEmployee: Employee = { ...employee, isFavorite: !employee.isFavorite };
    return this.update(id, updatedEmployee);
  }
}
