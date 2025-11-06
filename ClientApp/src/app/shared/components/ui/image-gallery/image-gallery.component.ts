import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface GalleryImage {
  id: string;
  url: string;
  thumbnail?: string;
  alt?: string;
  title?: string;
  description?: string;
  width?: number;
  height?: number;
  tags?: string[];
  metadata?: { [key: string]: any };
}

export interface GalleryOptions {
  thumbnailSize?: number;
  maxColumns?: number;
  showLightbox?: boolean;
  showNavigation?: boolean;
  showThumbnails?: boolean;
  autoplay?: boolean;
  autoplayDelay?: number;
  lazyLoading?: boolean;
  enableZoom?: boolean;
  enableDownload?: boolean;
  enableDelete?: boolean;
}

@Component({
  selector: 'app-image-gallery',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="image-gallery">
      <div class="gallery-grid" [style]="getGridStyle()">
        <div *ngFor="let image of images; trackBy: trackByImageId" 
             class="gallery-item"
             (click)="openLightbox(image)">
          
          <div class="image-container">
            <img [src]="getImageUrl(image)" 
                 [alt]="image.alt || image.title || 'Gallery image'"
                 [class.loading]="isLoading(image)"
                 (load)="onImageLoad(image)"
                 (error)="onImageError(image)"
                 [style]="getImageStyle()"
            />
            
            <div class="image-overlay" *ngIf="image.title || image.description">
              <div class="overlay-content">
                <h6 *ngIf="image.title" class="image-title">{{ image.title }}</h6>
                <p *ngIf="image.description" class="image-description">{{ image.description }}</p>
              </div>
            </div>

            <div class="image-actions">
              <button *ngIf="options.enableZoom" 
                      class="btn btn-sm btn-light"
                      (click)="zoomImage(image, $event)"
                      title="Zoom">
                <i class="fas fa-search-plus"></i>
              </button>
              <button *ngIf="options.enableDownload" 
                      class="btn btn-sm btn-light"
                      (click)="downloadImage(image, $event)"
                      title="Download">
                <i class="fas fa-download"></i>
              </button>
              <button *ngIf="options.enableDelete" 
                      class="btn btn-sm btn-danger"
                      (click)="deleteImage(image, $event)"
                      title="Delete">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>

          <div class="image-tags" *ngIf="image.tags?.length">
            <span *ngFor="let tag of image.tags" class="badge badge-secondary me-1">
              {{ tag }}
            </span>
          </div>
        </div>
      </div>

      <div class="empty-gallery text-center py-5" *ngIf="images.length === 0">
        <i class="fas fa-images fa-3x text-muted mb-3"></i>
        <h5 class="text-muted">{{ emptyMessage }}</h5>
      </div>

      <!-- Lightbox Modal -->
      <div class="lightbox-overlay" *ngIf="currentLightboxImage" (click)="closeLightbox()">
        <div class="lightbox-container" (click)="$event.stopPropagation()">
          <button class="lightbox-close" (click)="closeLightbox()">
            <i class="fas fa-times"></i>
          </button>

          <button *ngIf="options.showNavigation" 
                  class="lightbox-nav lightbox-prev" 
                  (click)="previousImage()">
            <i class="fas fa-chevron-left"></i>
          </button>

          <button *ngIf="options.showNavigation" 
                  class="lightbox-nav lightbox-next" 
                  (click)="nextImage()">
            <i class="fas fa-chevron-right"></i>
          </button>

          <div class="lightbox-content">
            <img [src]="getImageUrl(currentLightboxImage)" 
                 [alt]="currentLightboxImage.alt || currentLightboxImage.title || 'Gallery image'"
                 class="lightbox-image"
            />
          </div>

          <div class="lightbox-info" *ngIf="currentLightboxImage.title || currentLightboxImage.description">
            <h5 *ngIf="currentLightboxImage.title">{{ currentLightboxImage.title }}</h5>
            <p *ngIf="currentLightboxImage.description">{{ currentLightboxImage.description }}</p>
          </div>

          <div class="lightbox-thumbs" *ngIf="options.showThumbnails && images.length > 1">
            <div class="thumbnails-container">
              <div *ngFor="let image of images; trackBy: trackByImageId"
                   class="thumbnail"
                   [class.active]="image.id === currentLightboxImage?.id"
                   (click)="setLightboxImage(image)">
                <img [src]="getImageUrl(image)" [alt]="image.alt || image.title || 'Thumbnail'" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .image-gallery {
      width: 100%;
    }

    .gallery-grid {
      display: grid;
      gap: 1rem;
    }

    .gallery-item {
      cursor: pointer;
      transition: transform 0.2s ease;
    }

    .gallery-item:hover {
      transform: scale(1.02);
    }

    .image-container {
      position: relative;
      overflow: hidden;
      border-radius: var(--bs-border-radius);
      background-color: var(--bs-light);
    }

    .image-container img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: opacity 0.3s ease;
    }

    .image-container img.loading {
      opacity: 0.5;
    }

    .image-overlay {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
      color: white;
      padding: 1rem;
      transform: translateY(100%);
      transition: transform 0.3s ease;
    }

    .image-container:hover .image-overlay {
      transform: translateY(0);
    }

    .overlay-content {
      pointer-events: none;
    }

    .image-title {
      margin-bottom: 0.25rem;
      font-size: 0.875rem;
      font-weight: 600;
    }

    .image-description {
      margin-bottom: 0;
      font-size: 0.75rem;
      opacity: 0.9;
    }

    .image-actions {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      display: flex;
      gap: 0.25rem;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .image-container:hover .image-actions {
      opacity: 1;
    }

    .image-tags {
      margin-top: 0.5rem;
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
    }

    .badge {
      font-size: 0.7rem;
    }

    /* Lightbox Styles */
    .lightbox-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.9);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }

    .lightbox-container {
      position: relative;
      max-width: 90vw;
      max-height: 90vh;
      cursor: default;
    }

    .lightbox-close {
      position: absolute;
      top: -50px;
      right: 0;
      background: none;
      border: none;
      color: white;
      font-size: 1.5rem;
      cursor: pointer;
      z-index: 10000;
    }

    .lightbox-nav {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: white;
      font-size: 2rem;
      padding: 1rem;
      cursor: pointer;
      border-radius: 50%;
      transition: background-color 0.3s ease;
    }

    .lightbox-nav:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    .lightbox-prev {
      left: -80px;
    }

    .lightbox-next {
      right: -80px;
    }

    .lightbox-content {
      text-align: center;
    }

    .lightbox-image {
      max-width: 100%;
      max-height: 70vh;
      border-radius: var(--bs-border-radius);
    }

    .lightbox-info {
      margin-top: 1rem;
      color: white;
      text-align: center;
    }

    .lightbox-info h5 {
      margin-bottom: 0.5rem;
    }

    .lightbox-thumbs {
      margin-top: 1rem;
      text-align: center;
    }

    .thumbnails-container {
      display: flex;
      justify-content: center;
      gap: 0.5rem;
      max-width: 80vw;
      overflow-x: auto;
      padding: 0.5rem;
    }

    .thumbnail {
      width: 60px;
      height: 60px;
      border-radius: var(--bs-border-radius);
      overflow: hidden;
      cursor: pointer;
      opacity: 0.6;
      transition: opacity 0.3s ease;
      border: 2px solid transparent;
    }

    .thumbnail:hover,
    .thumbnail.active {
      opacity: 1;
      border-color: var(--bs-primary);
    }

    .thumbnail img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .empty-gallery {
      color: var(--bs-secondary);
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .gallery-grid {
        grid-template-columns: repeat(2, 1fr) !important;
        gap: 0.5rem;
      }

      .lightbox-nav {
        font-size: 1.5rem;
        padding: 0.5rem;
      }

      .lightbox-prev {
        left: -50px;
      }

      .lightbox-next {
        right: -50px;
      }

      .lightbox-thumbs {
        margin-top: 0.5rem;
      }

      .thumbnail {
        width: 40px;
        height: 40px;
      }
    }

    @media (max-width: 480px) {
      .gallery-grid {
        grid-template-columns: 1fr !important;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImageGalleryComponent {
  @Input() images: GalleryImage[] = [];
  @Input() options: GalleryOptions = {
    thumbnailSize: 200,
    maxColumns: 4,
    showLightbox: true,
    showNavigation: true,
    showThumbnails: true,
    autoplay: false,
    autoplayDelay: 3000,
    lazyLoading: true,
    enableZoom: true,
    enableDownload: true,
    enableDelete: false
  };
  @Input() emptyMessage = 'No images to display';

  @Output() imageClick = new EventEmitter<GalleryImage>();
  @Output() imageLoad = new EventEmitter<GalleryImage>();
  @Output() imageError = new EventEmitter<GalleryImage>();
  @Output() imageDelete = new EventEmitter<GalleryImage>();
  @Output() imageDownload = new EventEmitter<GalleryImage>();

  currentLightboxImage?: GalleryImage;
  loadingImages = new Set<string>();
  private autoplayTimer?: any;

  constructor() {
    // Initialize default options
    this.options = {
      thumbnailSize: 200,
      maxColumns: 4,
      showLightbox: true,
      showNavigation: true,
      showThumbnails: true,
      autoplay: false,
      autoplayDelay: 3000,
      lazyLoading: true,
      enableZoom: true,
      enableDownload: true,
      enableDelete: false,
      ...this.options
    };
  }

  ngOnInit(): void {
    if (this.options.autoplay) {
      this.startAutoplay();
    }
  }

  ngOnDestroy(): void {
    this.stopAutoplay();
  }

  getGridStyle(): string {
    const columns = this.options.maxColumns || 4;
    return `grid-template-columns: repeat(${columns}, 1fr); grid-template-rows: repeat(auto-fit, minmax(${this.options.thumbnailSize}px, auto));`;
  }

  getImageStyle(): string {
    const size = this.options.thumbnailSize || 200;
    return `width: ${size}px; height: ${size}px;`;
  }

  getImageUrl(image: GalleryImage): string {
    return image.thumbnail || image.url;
  }

  isLoading(image: GalleryImage): boolean {
    return this.loadingImages.has(image.id);
  }

  onImageLoad(image: GalleryImage): void {
    this.loadingImages.delete(image.id);
    this.imageLoad.emit(image);
  }

  onImageError(image: GalleryImage): void {
    this.loadingImages.delete(image.id);
    this.imageError.emit(image);
  }

  openLightbox(image: GalleryImage): void {
    if (!this.options.showLightbox) {
      this.imageClick.emit(image);
      return;
    }

    this.currentLightboxImage = image;
    this.imageClick.emit(image);
    this.stopAutoplay(); // Stop autoplay when lightbox is open
  }

  closeLightbox(): void {
    this.currentLightboxImage = undefined;
    if (this.options.autoplay) {
      this.startAutoplay(); // Resume autoplay
    }
  }

  setLightboxImage(image: GalleryImage): void {
    this.currentLightboxImage = image;
  }

  nextImage(): void {
    if (!this.currentLightboxImage) return;
    
    const currentIndex = this.images.findIndex(img => img.id === this.currentLightboxImage!.id);
    const nextIndex = (currentIndex + 1) % this.images.length;
    this.currentLightboxImage = this.images[nextIndex];
  }

  previousImage(): void {
    if (!this.currentLightboxImage) return;
    
    const currentIndex = this.images.findIndex(img => img.id === this.currentLightboxImage!.id);
    const prevIndex = (currentIndex - 1 + this.images.length) % this.images.length;
    this.currentLightboxImage = this.images[prevIndex];
  }

  zoomImage(image: GalleryImage, event: Event): void {
    event.stopPropagation();
    // Implement zoom functionality or open in new window
    window.open(image.url, '_blank');
  }

  downloadImage(image: GalleryImage, event: Event): void {
    event.stopPropagation();
    
    const link = document.createElement('a');
    link.href = image.url;
    link.download = image.title || image.alt || 'image';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    this.imageDownload.emit(image);
  }

  deleteImage(image: GalleryImage, event: Event): void {
    event.stopPropagation();
    
    if (confirm('Are you sure you want to delete this image?')) {
      this.images = this.images.filter(img => img.id !== image.id);
      this.imageDelete.emit(image);
    }
  }

  startAutoplay(): void {
    if (this.autoplayTimer) return;
    
    this.autoplayTimer = setInterval(() => {
      if (this.images.length > 0 && !this.currentLightboxImage) {
        if (!this.currentImageIndex) {
          this.currentImageIndex = 0;
        }
        this.currentImageIndex = (this.currentImageIndex + 1) % this.images.length;
        this.currentLightboxImage = this.images[this.currentImageIndex];
      }
    }, this.options.autoplayDelay || 3000);
  }

  stopAutoplay(): void {
    if (this.autoplayTimer) {
      clearInterval(this.autoplayTimer);
      this.autoplayTimer = undefined;
    }
  }

  currentImageIndex?: number;

  trackByImageId(index: number, image: GalleryImage): string {
    return image.id;
  }

  // Utility methods
  addImage(image: GalleryImage): void {
    this.images = [...this.images, image];
  }

  removeImage(imageId: string): void {
    this.images = this.images.filter(img => img.id !== imageId);
  }

  clearImages(): void {
    this.images = [];
  }

  updateImages(images: GalleryImage[]): void {
    this.images = [...images];
  }
}