import { Component, OnDestroy } from '@angular/core';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/AuthService';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar implements OnDestroy {
  showDropdown = false;
  private hideTimeout: any;
  isPersonnelsActive = false;

  constructor(
    private router: Router,
    private authService: AuthService
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

  logout() {
    this.authService.logout();
  }

  ngOnDestroy() {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
  }
}
