import { Component, EventEmitter, Input, Output, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Picture } from '../../models/pictureModel';
import { PictureService } from '../../services/PictureService';

@Component({
  selector: 'app-photo-viewer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './photo-viewer.html',
  styleUrls: ['./photo-viewer.scss'],
})
export class PhotoViewer implements OnInit {
  @Input() pointId: string | null = null;
  @Input() securityZoneId: string | null = null;
  @Output() close = new EventEmitter<void>();
  
  showPhotoDialog = false;
  pictures: Picture[] = [];
  currentPictureIndex = 0;
  loadingPictures = false;
  
  private pictureService = inject(PictureService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.showPhotoDialog = true;
    if (this.pointId) {
      this.loadPicturesForPoint();
    } else if (this.securityZoneId) {
      this.loadPicturesForSecurityZone();
    }
  }

  loadPicturesForPoint(): void {
    if (!this.pointId) return;

    this.loadingPictures = true;
    this.pictures = [];
    this.currentPictureIndex = 0;
    this.cdr.detectChanges();

    // Récupérer les pictures pour ce point directement
    this.pictureService.getByPointId(this.pointId).subscribe({
      next: (pictures) => {
        this.pictures = pictures;
        this.loadingPictures = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingPictures = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadPicturesForSecurityZone(): void {
    if (!this.securityZoneId) return;

    this.loadingPictures = true;
    this.pictures = [];
    this.currentPictureIndex = 0;
    this.cdr.detectChanges();

    this.pictureService.getBySecurityZoneId(this.securityZoneId).subscribe({
      next: (pictures) => {
        this.pictures = pictures;
        this.loadingPictures = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingPictures = false;
        this.cdr.detectChanges();
      }
    });
  }

  get hasPictures(): boolean {
    return this.pictures.length > 0;
  }

  get currentPicture(): Picture | null {
    return this.pictures.length > 0 ? this.pictures[this.currentPictureIndex] : null;
  }

  nextPicture(): void {
    if (this.currentPictureIndex < this.pictures.length - 1) {
      this.currentPictureIndex++;
    }
  }

  previousPicture(): void {
    if (this.currentPictureIndex > 0) {
      this.currentPictureIndex--;
    }
  }

  get pictureCountText(): string {
    return `${this.currentPictureIndex + 1} / ${this.pictures.length}`;
  }

  getPictureSrc(picture: Picture): string {
    if (picture.pictureData.startsWith('data:')) {
      return picture.pictureData;
    }
    return `data:image/jpeg;base64,${picture.pictureData}`;
  }

  closeModal(): void {
    this.showPhotoDialog = false;
    this.pictures = [];
    this.currentPictureIndex = 0;
    this.close.emit();
  }
}
