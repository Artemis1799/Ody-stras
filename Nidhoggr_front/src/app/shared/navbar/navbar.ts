import { Component, OnDestroy } from '@angular/core';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/AuthService';
import { UserService } from '../../services/UserService';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar implements OnDestroy {
  showDropdown = false;
  showAccountDropdown = false;
  private hideTimeout: any;
  private hideAccountTimeout: any;
  isPersonnelsActive = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private userService: UserService
  ) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.isPersonnelsActive = this.router.url.startsWith('/personnels');
    });
  }

  onMouseEnter() {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
  }

  onMouseLeave() {
    if (this.showDropdown) {
      this.hideTimeout = setTimeout(() => {
        this.showDropdown = false;
        this.hideTimeout = null;
      }, 1000);
    }
  }

  onToggleDropdown() {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
    this.showDropdown = !this.showDropdown;
    if (this.showDropdown) {
      this.hideTimeout = setTimeout(() => {
        this.showDropdown = false;
      }, 1000);
    }
  }

  onDropdownItemClick() {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
    this.showDropdown = false;
  }

  // Gestion du dropdown Compte
  onMouseEnterAccount() {
    if (this.hideAccountTimeout) {
      clearTimeout(this.hideAccountTimeout);
      this.hideAccountTimeout = null;
    }
  }

  onMouseLeaveAccount() {
    if (this.showAccountDropdown) {
      this.hideAccountTimeout = setTimeout(() => {
        this.showAccountDropdown = false;
        this.hideAccountTimeout = null;
      }, 1000);
    }
  }

  onToggleAccountDropdown() {
    this.onDropdownItemClick();
    if (this.hideAccountTimeout) {
      clearTimeout(this.hideAccountTimeout);
      this.hideAccountTimeout = null;
    }
    this.showAccountDropdown = !this.showAccountDropdown;
    if (this.showAccountDropdown) {
      this.hideAccountTimeout = setTimeout(() => {
        this.showAccountDropdown = false;
      }, 1000);
    }
  }

  resetPassword() {
    // Fermer le dropdown
    this.showAccountDropdown = false;
    if (this.hideAccountTimeout) {
      clearTimeout(this.hideAccountTimeout);
      this.hideAccountTimeout = null;
    }

    // Récupérer l'utilisateur et réinitialiser son mot de passe
    this.userService.getAll().subscribe({
      next: (users) => {
        if (users && users.length > 0) {
          const user = users[0];
          // Mettre le mot de passe à undefined
          this.userService.update(user.uuid, { ...user, password: undefined }).subscribe({
            next: () => {
              console.log('Mot de passe réinitialisé');
              // Déconnecter via l'API pour supprimer le cookie
              this.userService.logout().subscribe({
                next: () => {
                  this.authService.logout();
                },
                error: (error) => {
                  console.error('Erreur lors de la déconnexion:', error);
                  // Déconnecter quand même côté frontend
                  this.authService.logout();
                }
              });
            },
            error: (error) => {
              console.error('Erreur lors de la réinitialisation du mot de passe:', error);
              alert('Erreur lors de la réinitialisation du mot de passe');
            }
          });
        }
      },
      error: (error) => {
        console.error('Erreur lors de la récupération de l\'utilisateur:', error);
        alert('Erreur lors de la récupération de l\'utilisateur');
      }
    });
  }

  logout() {
    // Fermer le dropdown
    this.showAccountDropdown = false;
    if (this.hideAccountTimeout) {
      clearTimeout(this.hideAccountTimeout);
      this.hideAccountTimeout = null;
    }
    
    // Appeler l'endpoint de logout pour supprimer le cookie
    this.userService.logout().subscribe({
      next: () => {
        this.authService.logout();
      },
      error: (error) => {
        console.error('Erreur lors de la déconnexion:', error);
        // Déconnecter quand même côté frontend
        this.authService.logout();
      }
    });
  }

  ngOnDestroy() {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
    if (this.hideAccountTimeout) {
      clearTimeout(this.hideAccountTimeout);
      this.hideAccountTimeout = null;
    }
  }
}
