import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
  confirmIcon?: string;
  showCancel?: boolean;
  showIcon?: boolean;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal fade show" style="display: block;" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header" [class]="headerClass">
            <h5 class="modal-title">
              <i *ngIf="data.showIcon !== false" [class]="iconClass" class="me-2"></i>
              {{ data.title }}
            </h5>
            <button type="button" class="btn-close" (click)="onCancel()" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <p class="mb-0">{{ data.message }}</p>
          </div>
          <div class="modal-footer">
            <button 
              *ngIf="data.showCancel !== false" 
              type="button" 
              class="btn btn-secondary" 
              (click)="onCancel()"
            >
              {{ data.cancelText || 'Cancel' }}
            </button>
            <button 
              type="button" 
              [class]="confirmButtonClass" 
              (click)="onConfirm()"
            >
              <i *ngIf="data.confirmIcon" [class]="data.confirmIcon" class="me-1"></i>
              {{ data.confirmText || 'Confirm' }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-backdrop fade show"></div>
  `,
  styles: [`
    .modal {
      display: block !important;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 1050;
    }
    
    .modal-dialog {
      z-index: 1051;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfirmDialogComponent {
  @Input() data: ConfirmDialogData = {
    title: 'Confirm Action',
    message: 'Are you sure?',
    type: 'warning'
  };

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  get headerClass(): string {
    const typeClasses = {
      danger: 'bg-danger text-white',
      warning: 'bg-warning',
      info: 'bg-info text-white',
      success: 'bg-success text-white'
    };
    return typeClasses[this.data.type || 'warning'];
  }

  get iconClass(): string {
    const iconClasses = {
      danger: 'fas fa-exclamation-triangle',
      warning: 'fas fa-exclamation-triangle',
      info: 'fas fa-info-circle',
      success: 'fas fa-check-circle'
    };
    return iconClasses[this.data.type || 'warning'];
  }

  get confirmButtonClass(): string {
    const typeClasses = {
      danger: 'btn btn-danger',
      warning: 'btn btn-warning',
      info: 'btn btn-info',
      success: 'btn btn-success'
    };
    return typeClasses[this.data.type || 'warning'];
  }

  onConfirm(): void {
    this.confirm.emit();
  }

  onCancel(): void {
    this.cancel.emit();
  }
}