import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-point-type-popup',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="popup-overlay" (click)="onCancel()">
      <div class="popup-dialog" (click)="$event.stopPropagation()">
        <button class="popup-close" (click)="onCancel()">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        
        <div class="dialog-header">
          <div class="header-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          </div>
          <div class="header-text">
            <h4>Type de point</h4>
            <p>Choisissez le type de point à créer</p>
          </div>
        </div>
        
        <div class="dialog-content">
          <p class="info-text">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            Les points d'intérêt sont marqués avec "!" et n'apparaissent pas dans la liste
          </p>

          <div class="point-types">
            <button class="point-type-card normal" (click)="onSelectPointType(false)">
              <div class="card-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
              </div>
              <div class="card-content">
                <h5>Point normal</h5>
                <p>Apparaît dans la liste et le parcours</p>
              </div>
              <div class="card-arrow">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </div>
            </button>

            <button class="point-type-card interest" (click)="onSelectPointType(true)">
              <div class="card-icon">
                <span class="interest-icon">!</span>
              </div>
              <div class="card-content">
                <h5>Point d'intérêt</h5>
                <p>Marqué spécialement, hors parcours</p>
              </div>
              <div class="card-arrow">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </div>
            </button>
          </div>
        </div>
        
        <div class="dialog-actions">
          <button class="cancel-btn" (click)="onCancel()">
            Annuler
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    // Design System Tokens
    $bg-primary: #0d1117;
    $bg-secondary: #161b22;
    $bg-card: #171c22;
    $bg-elevated: #1a2028;

    $primary: #3b82f6;
    $primary-dark: #2563eb;
    $primary-gradient: linear-gradient(135deg, $primary 0%, $primary-dark 100%);

    $interest: #ff9800;
    $interest-dark: #f57c00;
    $interest-gradient: linear-gradient(135deg, $interest 0%, $interest-dark 100%);

    $text-primary: #ffffff;
    $text-secondary: #c9d1d9;
    $text-muted: #8b949e;

    $border-primary: #30363d;
    $border-hover: #484f58;

    .popup-overlay {
      position: fixed;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.75);
      z-index: 10000;
      backdrop-filter: blur(8px);
      animation: fadeIn 0.2s ease-out;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    @keyframes slideIn {
      from {
        transform: translateY(-20px) scale(0.95);
        opacity: 0;
      }
      to {
        transform: translateY(0) scale(1);
        opacity: 1;
      }
    }

    .popup-dialog {
      background: linear-gradient(145deg, $bg-elevated 0%, $bg-card 100%);
      padding: 0;
      border-radius: 20px;
      min-width: 420px;
      max-width: 480px;
      width: 90%;
      position: relative;
      box-shadow: 
        0 25px 80px rgba(0, 0, 0, 0.5),
        0 0 0 1px rgba(59, 130, 246, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.05);
      animation: slideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: $primary-gradient;
      }
    }

    .popup-close {
      position: absolute;
      top: 16px;
      right: 16px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      cursor: pointer;
      color: $text-muted;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      transition: all 0.2s ease;
      z-index: 10;

      &:hover {
        background: rgba(255, 255, 255, 0.1);
        color: $text-primary;
      }
    }

    .dialog-header {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1.75rem 1.75rem 1.25rem;
      background: linear-gradient(180deg, rgba(59, 130, 246, 0.08) 0%, transparent 100%);

      .header-icon {
        width: 52px;
        height: 52px;
        background: $primary-gradient;
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: $text-primary;
        flex-shrink: 0;
        box-shadow: 0 8px 24px rgba(59, 130, 246, 0.3);
      }

      .header-text {
        flex: 1;
        padding-top: 0.125rem;

        h4 {
          margin: 0 0 0.25rem 0;
          font-size: 1.375rem;
          font-weight: 700;
          color: $text-primary;
          letter-spacing: -0.02em;
        }

        p {
          margin: 0;
          color: $text-muted;
          font-size: 0.85rem;
        }
      }
    }

    .dialog-content {
      padding: 0 1.75rem 1.5rem;

      .info-text {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1rem;
        background: rgba(59, 130, 246, 0.1);
        border: 1px solid rgba(59, 130, 246, 0.2);
        border-radius: 10px;
        color: $text-secondary;
        font-size: 0.85rem;
        line-height: 1.5;
        margin-bottom: 1.25rem;

        svg {
          flex-shrink: 0;
          color: $primary;
        }
      }

      .point-types {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .point-type-card {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid $border-primary;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
        width: 100%;
        text-align: left;

        &:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: $border-hover;
          transform: translateX(4px);
        }

        &.normal:hover {
          border-color: $primary;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        &.interest:hover {
          border-color: $interest;
          box-shadow: 0 0 0 3px rgba(255, 152, 0, 0.1);
        }

        .card-icon {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        &.normal .card-icon {
          background: $primary-gradient;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);

          svg {
            color: $text-primary;
          }
        }

        &.interest .card-icon {
          background: $interest-gradient;
          box-shadow: 0 4px 12px rgba(255, 152, 0, 0.25);

          .interest-icon {
            font-size: 1.5rem;
            font-weight: 900;
            color: $text-primary;
          }
        }

        .card-content {
          flex: 1;

          h5 {
            margin: 0 0 0.25rem 0;
            font-size: 1rem;
            font-weight: 600;
            color: $text-primary;
          }

          p {
            margin: 0;
            font-size: 0.8rem;
            color: $text-muted;
          }
        }

        .card-arrow {
          color: $text-muted;
          transition: transform 0.2s ease;
        }

        &:hover .card-arrow {
          transform: translateX(4px);
        }
      }
    }

    .dialog-actions {
      padding: 1.25rem 1.75rem;
      background: rgba(255, 255, 255, 0.02);
      border-top: 1px solid $border-primary;
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;

      button {
        padding: 0.625rem 1.25rem;
        border-radius: 8px;
        font-size: 0.9rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        border: 1px solid transparent;

        &:active {
          transform: scale(0.98);
        }
      }

      .cancel-btn {
        background: rgba(255, 255, 255, 0.05);
        color: $text-secondary;
        border-color: $border-primary;

        &:hover {
          background: rgba(255, 255, 255, 0.08);
          color: $text-primary;
        }
      }
    }
  `]
})
export class PointTypePopupComponent {
  @Output() pointTypeSelected = new EventEmitter<boolean>();
  @Output() cancelled = new EventEmitter<void>();

  onSelectPointType(isPointOfInterest: boolean): void {
    this.pointTypeSelected.emit(isPointOfInterest);
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
