import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/UserService';
import { AuthService } from '../../services/AuthService';
import { User } from '../../models/userModel';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginPageComponent implements OnInit {
  user: User | null = null;
  loading = true;
  
  // Pour la création de mot de passe
  newPassword = '';
  confirmPassword = '';
  
  // Pour la connexion
  password = '';
  
  errorMessage = '';

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadUser();
  }

  loadUser(): void {
    this.loading = true;
    this.userService.getAll().subscribe({
      next: (users) => {
        if (users && users.length > 0) {
          this.user = users[0]; // On prend le premier utilisateur
        } else {
          this.user = null;
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Erreur lors du chargement de l\'utilisateur:', error);
        this.errorMessage = 'Erreur lors du chargement de l\'utilisateur';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  createPassword(): void {
    this.errorMessage = '';
    
    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Les mots de passe ne correspondent pas';
      this.cdr.detectChanges();
      return;
    }
    
    if (this.newPassword.length < 4) {
      this.errorMessage = 'Le mot de passe doit contenir au moins 4 caractères';
      this.cdr.detectChanges();
      return;
    }
    
    if (!this.user) return;
    
    const updatedUser: User = {
      ...this.user,
      password: this.newPassword
    };
    
    this.userService.update(this.user.uuid, updatedUser).subscribe({
      next: () => {
        // Pas de token lors de la création, on redirige vers le login
        this.user!.password = '***'; // Simuler qu'un mot de passe existe maintenant
        this.newPassword = '';
        this.confirmPassword = '';
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Erreur lors de la création du mot de passe:', error);
        this.errorMessage = 'Erreur lors de la création du mot de passe';
        this.cdr.detectChanges();
      }
    });
  }

  login(): void {
    this.errorMessage = '';
    
    if (!this.user) return;
    
    this.userService.login({ 
      name: this.user.name, 
      password: this.password 
    }).subscribe({
      next: () => {
        // Le backend a défini le cookie HttpOnly
        this.authService.login();
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Erreur de connexion:', error);
        if (error.error && error.error.message) {
          this.errorMessage = error.error.message;
        } else {
          this.errorMessage = 'Mot de passe incorrect';
        }
        this.password = '';
        this.cdr.detectChanges();
      }
    });
  }
}
