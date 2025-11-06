import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface QrCodeOptions {
  width?: number;
  height?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  type?: 'image/png' | 'image/jpeg' | 'image/webp';
  quality?: number;
  scale?: number;
}

@Component({
  selector: 'app-qr-code',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="qr-code-container" [class]="containerClass">
      <div class="qr-code-wrapper" [style]="getWrapperStyle()">
        <div *ngIf="!qrCodeUrl" class="qr-placeholder">
          <i class="fas fa-qrcode fa-3x text-muted mb-2"></i>
          <p class="text-muted">No QR Code Generated</p>
          <small *ngIf="!data">Provide data to generate QR code</small>
        </div>
        
        <img *ngIf="qrCodeUrl" 
             [src]="qrCodeUrl" 
             [alt]="'QR Code for ' + (alt || 'data')"
             [class]="qrCodeClass"
        />
      </div>
      
      <div class="qr-actions" *ngIf="qrCodeUrl && (showDownload || showCopy || showRefresh)">
        <button *ngIf="showDownload" 
                class="btn btn-sm btn-outline-primary"
                (click)="downloadQRCode()"
                title="Download QR Code">
          <i class="fas fa-download me-1"></i>
          Download
        </button>
        
        <button *ngIf="showCopy" 
                class="btn btn-sm btn-outline-secondary"
                (click)="copyToClipboard()"
                title="Copy QR Code">
          <i class="fas fa-copy me-1"></i>
          Copy
        </button>
        
        <button *ngIf="showRefresh" 
                class="btn btn-sm btn-outline-info"
                (click)="refreshQRCode()"
                title="Refresh QR Code">
          <i class="fas fa-sync-alt me-1"></i>
          Refresh
        </button>
      </div>
      
      <div class="qr-info" *ngIf="qrCodeUrl && showInfo">
        <small class="text-muted">
          Size: {{ options.width || 256 }}x{{ options.height || 256 }}px
          <span *ngIf="dataLength"> • Data: {{ dataLength }} characters</span>
        </small>
      </div>
    </div>
  `,
  styles: [`
    .qr-code-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .qr-code-wrapper {
      position: relative;
      display: inline-block;
      border-radius: var(--bs-border-radius);
      overflow: hidden;
      background-color: var(--bs-light);
      border: 1px solid var(--bs-border-color);
    }

    .qr-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      color: var(--bs-secondary);
    }

    .qr-placeholder i {
      opacity: 0.5;
    }

    .qr-placeholder p {
      margin-bottom: 0.5rem;
      font-size: 1rem;
      font-weight: 500;
    }

    .qr-placeholder small {
      font-size: 0.8rem;
    }

    .qr-code-img {
      display: block;
      max-width: 100%;
      height: auto;
    }

    .qr-actions {
      display: flex;
      gap: 0.5rem;
      margin-top: 1rem;
      flex-wrap: wrap;
      justify-content: center;
    }

    .qr-info {
      margin-top: 0.5rem;
    }

    /* Size variants */
    .qr-small .qr-code-wrapper {
      max-width: 150px;
    }

    .qr-medium .qr-code-wrapper {
      max-width: 256px;
    }

    .qr-large .qr-code-wrapper {
      max-width: 400px;
    }

    /* Different styles */
    .qr-bordered .qr-code-wrapper {
      border: 2px solid var(--bs-primary);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }

    .qr-elevated .qr-code-wrapper {
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
    }

    .qr-transparent {
      background: transparent;
    }

    .qr-transparent .qr-code-wrapper {
      background: transparent;
      border: none;
    }

    /* Animation */
    .qr-loading .qr-code-wrapper {
      animation: pulse 2s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }

    /* Responsive */
    @media (max-width: 768px) {
      .qr-actions {
        flex-direction: column;
        align-items: center;
      }

      .qr-actions .btn {
        width: 100%;
        max-width: 200px;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QrCodeComponent implements OnChanges {
  @Input() data: string = '';
  @Input() alt: string = '';
  @Input() options: QrCodeOptions = {
    width: 256,
    height: 256,
    margin: 4,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    },
    errorCorrectionLevel: 'M',
    type: 'image/png',
    quality: 0.92,
    scale: 4
  };
  @Input() showDownload = true;
  @Input() showCopy = true;
  @Input() showRefresh = false;
  @Input() showInfo = true;
  @Input() loading = false;
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() style: 'default' | 'bordered' | 'elevated' | 'transparent' = 'default';

  @Output() generate = new EventEmitter<string>();
  @Output() download = new EventEmitter<{ url: string; filename: string }>();
  @Output() copy = new EventEmitter<void>();
  @Output() refresh = new EventEmitter<void>();
  @Output() error = new EventEmitter<Error>();

  qrCodeUrl = '';
  dataLength = 0;

  constructor() {
    // Initialize default options
    this.options = {
      width: 256,
      height: 256,
      margin: 4,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      scale: 4,
      ...this.options
    };
  }

  ngOnChanges(): void {
    if (this.data) {
      this.generateQRCode();
    }
  }

  get containerClass(): string {
    return `qr-${this.style} qr-${this.size} ${this.loading ? 'qr-loading' : ''}`;
  }

  get qrCodeClass(): string {
    return `qr-code-img`;
  }

  getWrapperStyle(): string {
    const width = this.options.width || 256;
    const height = this.options.height || 256;
    return `width: ${width}px; height: ${height}px;`;
  }

  private async generateQRCode(): Promise<void> {
    try {
      this.dataLength = this.data.length;
      
      // Simple QR code generation using a basic approach
      // In a real implementation, you'd use a library like qrcode.js
      const qrCodeData = await this.createQRCodeData(this.data);
      this.qrCodeUrl = qrCodeData;
      
      this.generate.emit(this.data);
    } catch (error) {
      console.error('Error generating QR code:', error);
      this.error.emit(error as Error);
    }
  }

  private async createQRCodeData(data: string): Promise<string> {
    // This is a simplified QR code generation
    // In a real app, you'd use a proper QR code library
    // For now, we'll create a placeholder SVG QR code
    const size = this.options.width || 256;
    const moduleSize = size / 25; // Assuming a 25x25 QR code matrix
    
    // Create a basic QR-like pattern
    const svg = this.generateBasicQRPattern(data, size);
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  private generateBasicQRPattern(data: string, size: number): string {
    // Generate a simple pattern based on the data
    // This is NOT a real QR code, just a visual representation
    const moduleSize = size / 25;
    const pattern = [];
    
    // Create a simple pattern based on data
    for (let i = 0; i < 25; i++) {
      const row = [];
      for (let j = 0; j < 25; j++) {
        const charCode = data.charCodeAt(i * 25 + j) || 0;
        const isDark = (charCode % 2) === 0;
        row.push(isDark);
      }
      pattern.push(row);
    }
    
    // Generate SVG
    let svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">`;
    
    // Add white background
    svg += `<rect width="${size}" height="${size}" fill="${this.options.color?.light || '#FFFFFF'}" />`;
    
    // Add QR pattern
    for (let i = 0; i < 25; i++) {
      for (let j = 0; j < 25; j++) {
        if (pattern[i][j]) {
          const x = j * moduleSize;
          const y = i * moduleSize;
          svg += `<rect x="${x}" y="${y}" width="${moduleSize}" height="${moduleSize}" fill="${this.options.color?.dark || '#000000'}" />`;
        }
      }
    }
    
    svg += '</svg>';
    return svg;
  }

  downloadQRCode(): void {
    if (!this.qrCodeUrl) return;

    const filename = `qr-code-${Date.now()}.${(this.options.type || 'image/png').split('/')[1]}`;
    
    // Create download link
    const link = document.createElement('a');
    link.href = this.qrCodeUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    this.download.emit({ url: this.qrCodeUrl, filename });
  }

  copyToClipboard(): void {
    if (!this.qrCodeUrl) return;

    // Convert data URL to blob for clipboard
    fetch(this.qrCodeUrl)
      .then(res => res.blob())
      .then(blob => {
        if (navigator.clipboard && navigator.clipboard.write) {
          const item = new ClipboardItem({ [blob.type]: blob });
          return navigator.clipboard.write([item]);
        } else {
          // Fallback: copy the data URL text
          return navigator.clipboard.writeText(this.qrCodeUrl);
        }
      })
      .then(() => {
        this.copy.emit();
        this.showCopySuccess();
      })
      .catch(error => {
        console.error('Failed to copy QR code:', error);
        this.error.emit(error);
      });
  }

  private showCopySuccess(): void {
    // Show temporary success feedback
    const buttons = document.querySelectorAll('.qr-actions .btn');
    buttons.forEach(btn => {
      const icon = btn.querySelector('i');
      const originalClass = icon?.className;
      if (icon) {
        icon.className = 'fas fa-check me-1';
        setTimeout(() => {
          icon.className = originalClass || 'fas fa-copy me-1';
        }, 2000);
      }
    });
  }

  refreshQRCode(): void {
    if (this.data) {
      this.generateQRCode();
      this.refresh.emit();
    }
  }

  // Utility methods
  updateData(data: string): void {
    this.data = data;
  }

  updateOptions(options: Partial<QrCodeOptions>): void {
    this.options = { ...this.options, ...options };
    if (this.data) {
      this.generateQRCode();
    }
  }

  clearQRCode(): void {
    this.qrCodeUrl = '';
    this.dataLength = 0;
  }

  regenerate(): void {
    this.generateQRCode();
  }
}