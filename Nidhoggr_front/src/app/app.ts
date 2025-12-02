import { Component, signal, OnInit, ChangeDetectorRef, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { forkJoin } from 'rxjs';
import { PointService } from './services/PointService';
import { PhotoService } from './services/PhotoService';
import { ImagePointService } from './services/ImagePointsService';
import { EquipmentService } from './services/EquipmentService';
import { AuthService } from './services/AuthService';
import { UserService } from './services/UserService';
import { Navbar } from './shared/navbar/navbar';
import { LoginPageComponent } from './components/login-page/login.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, Navbar, LoginPageComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('Nidhoggr_front');
  isAuthenticated = false;
  isInitialized = false;
  isBrowser = false;

  constructor(
    private pointService: PointService,
    private photoService: PhotoService,
    private imagePointService: ImagePointService,
    private equipmentService: EquipmentService,
    private authService: AuthService,
    private userService: UserService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }
  async ngOnInit(): Promise<void> {
    // Vérifier l'authentification via l'API (cookie HttpOnly)
    if (this.isBrowser) {
      this.userService.verifyAuth().subscribe({
        next: (result) => {
          this.authService.setAuthenticated(result.authenticated);
          this.authService.markAsInitialized();
        },
        error: () => {
          this.authService.setAuthenticated(false);
          this.authService.markAsInitialized();
        }
      });
    }

    // Écouter les changements d'authentification
    this.authService.isAuthenticated$.subscribe(isAuth => {
      this.isAuthenticated = isAuth;
      this.cdr.markForCheck();
      this.cdr.detectChanges();
    });

    // Écouter l'initialisation
    this.authService.isInitialized$.subscribe(isInit => {
      this.isInitialized = isInit;
      this.cdr.markForCheck();
      this.cdr.detectChanges();
    });

    try {
      if (typeof window === 'undefined') { return; }

      // load data from services (non-blocking)
      forkJoin({
        points: this.pointService.getAll(),
        photos: this.photoService.getAll(),
        imagePoints: this.imagePointService.getAll(),
        equipments: this.equipmentService.getAll(),
      }).subscribe();
    } catch {
      // Ignore initialization errors
    }
  }
}
