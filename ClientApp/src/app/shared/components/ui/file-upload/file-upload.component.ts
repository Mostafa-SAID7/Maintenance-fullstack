import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface UploadedFile {
  file: File;
  id: string;
  name: string;
  size: number;
  type: string;
  progress?: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  url?: string;
}

export interface FileUploadOptions {
  accept?: string[];
  multiple?: boolean;
  maxSize?: number; // in bytes
  maxFiles?: number;
  autoUpload?: boolean;
  showProgress?: boolean;
  allowRemove?: boolean;
}

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="file-upload-container">
      <div class="upload-area" 
           [class.dragover]="isDragOver"
           (dragover)="onDragOver($event)"
           (dragleave)="onDragLeave($event)"
           (drop)="onDrop($event)"
           (click)="fileInput.click()">
        
        <div class="upload-content">
          <i class="fas fa-cloud-upload-alt upload-icon"></i>
          <h5 class="upload-title">Drop files here or click to browse</h5>
          <p class="upload-description">
            <ng-container *ngIf="options.accept?.length">
              Accepted formats: {{ (options.accept || []).join(', ') }}
            </ng-container>
            <ng-container *ngIf="options.maxSize">
              • Max size: {{ formatFileSize(options.maxSize) }}
            </ng-container>
            <ng-container *ngIf="options.maxFiles">
              • Max files: {{ options.maxFiles }}
            </ng-container>
          </p>
        </div>
        
        <input #fileInput
               type="file"
               class="file-input"
               [attr.accept]="getAcceptAttribute()"
               [multiple]="options.multiple"
               (change)="onFileSelect($event)"
               style="display: none;" />
      </div>

      <div class="file-list" *ngIf="uploadedFiles.length > 0">
        <div class="file-item" 
             *ngFor="let uploadedFile of uploadedFiles; trackBy: trackByFileId">
          
          <div class="file-info">
            <div class="file-icon">
              <i [class]="getFileIcon(uploadedFile.type)"></i>
            </div>
            <div class="file-details">
              <div class="file-name">{{ uploadedFile.name }}</div>
              <div class="file-meta">
                {{ formatFileSize(uploadedFile.size) }} • {{ uploadedFile.type }}
                <span *ngIf="uploadedFile.status === 'uploading'" class="text-info">
                  Uploading...
                </span>
                <span *ngIf="uploadedFile.status === 'error'" class="text-danger">
                  Error: {{ uploadedFile.error }}
                </span>
              </div>
            </div>
          </div>

          <div class="file-actions">
            <div *ngIf="options.showProgress && uploadedFile.status === 'uploading'" 
                 class="progress me-2" style="width: 100px;">
              <div class="progress-bar" 
                   [style.width.%]="uploadedFile.progress || 0"></div>
            </div>

            <button *ngIf="uploadedFile.status === 'success'" 
                    class="btn btn-sm btn-outline-success me-1"
                    (click)="downloadFile(uploadedFile)"
                    title="Download">
              <i class="fas fa-download"></i>
            </button>

            <button *ngIf="options.allowRemove !== false" 
                    class="btn btn-sm btn-outline-danger"
                    (click)="removeFile(uploadedFile)"
                    title="Remove">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
      </div>

      <div class="upload-actions" *ngIf="uploadedFiles.length > 0 && !options.autoUpload">
        <button class="btn btn-primary" 
                [disabled]="!hasPendingFiles()"
                (click)="uploadAll()">
          <i class="fas fa-upload me-1"></i>
          Upload All ({{ getPendingCount() }})
        </button>
        <button class="btn btn-outline-secondary" 
                (click)="clearAll()">
          <i class="fas fa-trash me-1"></i>
          Clear All
        </button>
      </div>
    </div>
  `,
  styles: [`
    .file-upload-container {
      width: 100%;
    }

    .upload-area {
      border: 2px dashed var(--bs-border-color);
      border-radius: var(--bs-border-radius);
      padding: 2rem;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s ease;
      background-color: var(--bs-body-bg);
    }

    .upload-area:hover,
    .upload-area.dragover {
      border-color: var(--bs-primary);
      background-color: rgba(var(--bs-primary-rgb), 0.1);
    }

    .upload-content {
      pointer-events: none;
    }

    .upload-icon {
      font-size: 3rem;
      color: var(--bs-secondary);
      margin-bottom: 1rem;
    }

    .upload-title {
      color: var(--bs-body-color);
      margin-bottom: 0.5rem;
    }

    .upload-description {
      color: var(--bs-secondary);
      margin-bottom: 0;
      font-size: 0.875rem;
    }

    .file-list {
      margin-top: 1rem;
    }

    .file-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem;
      border: 1px solid var(--bs-border-color);
      border-radius: var(--bs-border-radius);
      margin-bottom: 0.5rem;
      background-color: var(--bs-body-bg);
    }

    .file-item:last-child {
      margin-bottom: 0;
    }

    .file-info {
      display: flex;
      align-items: center;
      flex: 1;
      min-width: 0;
    }

    .file-icon {
      width: 40px;
      text-align: center;
      font-size: 1.25rem;
      color: var(--bs-secondary);
      margin-right: 0.75rem;
    }

    .file-details {
      min-width: 0;
      flex: 1;
    }

    .file-name {
      font-weight: 500;
      color: var(--bs-body-color);
      margin-bottom: 0.25rem;
      word-break: break-word;
    }

    .file-meta {
      font-size: 0.75rem;
      color: var(--bs-secondary);
    }

    .file-actions {
      display: flex;
      align-items: center;
      margin-left: 1rem;
    }

    .upload-actions {
      margin-top: 1rem;
      display: flex;
      gap: 0.5rem;
    }

    .progress {
      height: 0.5rem;
    }

    .progress-bar {
      transition: width 0.3s ease;
    }

    .btn {
      border-radius: var(--bs-border-radius);
    }

    @media (max-width: 768px) {
      .upload-area {
        padding: 1.5rem;
      }

      .upload-icon {
        font-size: 2rem;
      }

      .upload-title {
        font-size: 1rem;
      }

      .file-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }

      .file-actions {
        margin-left: 0;
        align-self: flex-end;
      }

      .upload-actions {
        flex-direction: column;
      }

      .upload-actions .btn {
        width: 100%;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FileUploadComponent {
  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef<HTMLInputElement>;

  @Input() options: FileUploadOptions = {
    accept: [],
    multiple: true,
    maxSize: 10 * 1024 * 1024, // 10MB default
    maxFiles: 10,
    autoUpload: false,
    showProgress: true,
    allowRemove: true
  };

  @Output() fileSelect = new EventEmitter<File[]>();
  @Output() fileUpload = new EventEmitter<UploadedFile>();
  @Output() fileRemove = new EventEmitter<string>();
  @Output() fileDownload = new EventEmitter<UploadedFile>();
  @Output() uploadComplete = new EventEmitter<UploadedFile[]>();

  uploadedFiles: UploadedFile[] = [];
  isDragOver = false;

  constructor() {
    // Initialize with provided options
    this.options = {
      ...this.options,
      ...this.options
    };
  }

  ngOnInit(): void {
    // Apply default options
    this.options = {
      ...this.options,
      multiple: true,
      autoUpload: false,
      showProgress: true,
      allowRemove: true,
      ...this.options
    };
  }

  getAcceptAttribute(): string | null {
    return this.options.accept?.length ? this.options.accept.join(',') : null;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getFileIcon(type: string): string {
    if (type.startsWith('image/')) return 'fas fa-file-image text-success';
    if (type.startsWith('video/')) return 'fas fa-file-video text-info';
    if (type.startsWith('audio/')) return 'fas fa-file-audio text-warning';
    if (type.includes('pdf')) return 'fas fa-file-pdf text-danger';
    if (type.includes('word') || type.includes('document')) return 'fas fa-file-word text-primary';
    if (type.includes('excel') || type.includes('spreadsheet')) return 'fas fa-file-excel text-success';
    if (type.includes('powerpoint') || type.includes('presentation')) return 'fas fa-file-powerpoint text-danger';
    if (type.includes('zip') || type.includes('compressed')) return 'fas fa-file-archive text-warning';
    return 'fas fa-file text-secondary';
  }

  trackByFileId(index: number, file: UploadedFile): string {
    return file.id;
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = Array.from(event.dataTransfer?.files || []);
    this.processFiles(files);
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    this.processFiles(files);
    input.value = ''; // Reset input
  }

  processFiles(files: File[]): void {
    const validFiles = files.filter(file => this.validateFile(file));
    
    if (this.uploadedFiles.length + validFiles.length > (this.options.maxFiles || 10)) {
      alert(`Maximum ${this.options.maxFiles} files allowed`);
      return;
    }

    const newFiles: UploadedFile[] = validFiles.map(file => ({
      file,
      id: this.generateFileId(),
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'pending'
    }));

    this.uploadedFiles = [...this.uploadedFiles, ...newFiles];
    this.fileSelect.emit(files);

    if (this.options.autoUpload) {
      this.uploadAll();
    }
  }

  validateFile(file: File): boolean {
    // Check file type
    if (this.options.accept?.length && !this.options.accept.some(accepted => 
        file.type.match(new RegExp(accepted.replace('*', '.*'))))) {
      alert(`File type not accepted: ${file.type}`);
      return false;
    }

    // Check file size
    if (this.options.maxSize && file.size > this.options.maxSize) {
      alert(`File too large: ${this.formatFileSize(file.size)}. Maximum allowed: ${this.formatFileSize(this.options.maxSize)}`);
      return false;
    }

    return true;
  }

  generateFileId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  removeFile(uploadedFile: UploadedFile): void {
    this.uploadedFiles = this.uploadedFiles.filter(f => f.id !== uploadedFile.id);
    this.fileRemove.emit(uploadedFile.id);
  }

  downloadFile(uploadedFile: UploadedFile): void {
    const url = URL.createObjectURL(uploadedFile.file);
    const a = document.createElement('a');
    a.href = url;
    a.download = uploadedFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.fileDownload.emit(uploadedFile);
  }

  uploadAll(): void {
    const pendingFiles = this.uploadedFiles.filter(f => f.status === 'pending');
    
    pendingFiles.forEach(file => {
      this.uploadFile(file);
    });
  }

  uploadFile(uploadedFile: UploadedFile): void {
    uploadedFile.status = 'uploading';
    uploadedFile.progress = 0;

    // Simulate upload progress
    const interval = setInterval(() => {
      if (uploadedFile.progress! < 90) {
        uploadedFile.progress! += Math.random() * 20;
      } else {
        clearInterval(interval);
        // Simulate completion
        setTimeout(() => {
          uploadedFile.status = 'success';
          uploadedFile.progress = 100;
          this.fileUpload.emit(uploadedFile);
          
          // Check if all uploads are complete
          if (this.uploadedFiles.every(f => f.status === 'success' || f.status === 'error')) {
            this.uploadComplete.emit(this.uploadedFiles);
          }
        }, 500);
      }
    }, 200);
  }

  clearAll(): void {
    this.uploadedFiles = [];
  }

  hasPendingFiles(): boolean {
    return this.uploadedFiles.some(f => f.status === 'pending');
  }

  getPendingCount(): number {
    return this.uploadedFiles.filter(f => f.status === 'pending').length;
  }
}