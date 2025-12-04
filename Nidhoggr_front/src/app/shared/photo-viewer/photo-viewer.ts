import { Component, EventEmitter, Input, Output, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Dialog } from 'primeng/dialog';
import { Photo } from '../../models/photoModel';
import { ImagePointService } from '../../services/ImagePointsService';
import { PhotoService } from '../../services/PhotoService';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-photo-viewer',
  standalone: true,
  imports: [CommonModule, Dialog],
  templateUrl: './photo-viewer.html',
  styleUrls: ['./photo-viewer.scss'],
})
export class PhotoViewer implements OnInit {
  @Input() pointId: string | null = null;
  @Output() close = new EventEmitter<void>();
  
  showPhotoDialog = false;
  photos: Photo[] = [];
  currentPhotoIndex = 0;
  loadingPhotos = false;
  
  private imagePointService = inject(ImagePointService);
  private photoService = inject(PhotoService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.showPhotoDialog = true;
    if (this.pointId) {
      this.loadPhotosForPoint();
    }
  }

  loadPhotosForPoint(): void {
    if (!this.pointId) return;

    this.loadingPhotos = true;
    this.photos = [];
    this.currentPhotoIndex = 0;
    this.cdr.detectChanges();

    // D'abord récupérer les ImagePoints pour ce point
    this.imagePointService.getByPointId(this.pointId).subscribe({
      next: (imagePoints) => {
        if (imagePoints.length === 0) {
          this.loadingPhotos = false;
          this.cdr.detectChanges();
          return;
        }

        // Ensuite charger chaque photo par son imageId
        const photoRequests = imagePoints.map(ip => this.photoService.getById(ip.imageId));
        
        forkJoin(photoRequests).subscribe({
          next: (photos) => {
            this.photos = photos.filter((photo): photo is Photo => photo !== null && photo !== undefined);
            this.loadingPhotos = false;
            this.cdr.detectChanges();
          },
          error: () => {
            this.loadingPhotos = false;
            this.cdr.detectChanges();
          }
        });
      },
      error: () => {
        this.loadingPhotos = false;
        this.cdr.detectChanges();
      }
    });
  }

  get hasPhotos(): boolean {
    return this.photos.length > 0;
  }

  get currentPhoto(): Photo | null {
    return this.photos.length > 0 ? this.photos[this.currentPhotoIndex] : null;
  }

  nextPhoto(): void {
    if (this.currentPhotoIndex < this.photos.length - 1) {
      this.currentPhotoIndex++;
    }
  }

  previousPhoto(): void {
    if (this.currentPhotoIndex > 0) {
      this.currentPhotoIndex--;
    }
  }

  get photoCountText(): string {
    return `${this.currentPhotoIndex + 1} / ${this.photos.length}`;
  }

  getPhotoSrc(photo: Photo): string {
    if (photo.picture.startsWith('data:')) {
      return photo.picture;
    }
    return `data:image/jpeg;base64,${photo.picture}`;
  }

  closeModal(): void {
    this.showPhotoDialog = false;
    this.photos = [];
    this.currentPhotoIndex = 0;
    this.close.emit();
  }
}
