import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface PageSizeOption {
  label: string;
  value: number;
}

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="pagination-container" [class]="containerClass">
      <div class="d-flex justify-content-between align-items-center">
        <div class="pagination-info" *ngIf="showInfo">
          <span class="text-muted">
            Showing {{ getStartIndex() }} to {{ getEndIndex() }} 
            of {{ totalItems }} entries
          </span>
        </div>

        <nav aria-label="Page navigation">
          <ul class="pagination" [class]="sizeClass">
            <li class="page-item" [class.disabled]="isFirstPage">
              <a class="page-link" (click)="goToFirstPage()" [attr.aria-label]="ariaLabel.first">
                <i class="fas fa-angle-double-left"></i>
              </a>
            </li>
            <li class="page-item" [class.disabled]="isFirstPage">
              <a class="page-link" (click)="goToPreviousPage()" [attr.aria-label]="ariaLabel.previous">
                <i class="fas fa-angle-left"></i>
              </a>
            </li>
            <li *ngFor="let page of visiblePages" 
                class="page-item" 
                [class.active]="page === currentPage">
              <a class="page-link" (click)="goToPage(page)">{{ page }}</a>
            </li>
            <li class="page-item" [class.disabled]="isLastPage">
              <a class="page-link" (click)="goToNextPage()" [attr.aria-label]="ariaLabel.next">
                <i class="fas fa-angle-right"></i>
              </a>
            </li>
            <li class="page-item" [class.disabled]="isLastPage">
              <a class="page-link" (click)="goToLastPage()" [attr.aria-label]="ariaLabel.last">
                <i class="fas fa-angle-double-right"></i>
              </a>
            </li>
          </ul>
        </nav>

        <div class="page-size-selector" *ngIf="showPageSizeSelector">
          <div class="input-group">
            <label class="input-group-text">Items per page:</label>
            <select class="form-select" [value]="pageSize" (change)="onPageSizeChange($event)">
              <option *ngFor="let option of pageSizeOptions" [value]="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .pagination-container {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid var(--bs-border-color);
    }

    .pagination-info {
      font-size: 0.875rem;
      color: var(--bs-secondary);
    }

    .page-link {
      cursor: pointer;
      border-color: var(--bs-border-color);
    }

    .page-link:hover {
      background-color: var(--bs-secondary-bg);
      border-color: var(--bs-border-color);
    }

    .page-item.active .page-link {
      background-color: var(--bs-primary);
      border-color: var(--bs-primary);
      color: var(--bs-white);
    }

    .page-item.disabled .page-link {
      color: var(--bs-secondary);
      pointer-events: none;
    }

    .page-size-selector {
      min-width: 200px;
    }

    .page-size-selector .input-group-text {
      background-color: var(--bs-body-bg);
      border-color: var(--bs-border-color);
      font-size: 0.875rem;
    }

    .form-select {
      border-color: var(--bs-border-color);
    }

    .form-select:focus {
      border-color: var(--bs-primary);
      box-shadow: 0 0 0 0.2rem rgba(var(--bs-primary-rgb), 0.25);
    }

    /* Size variants */
    .pagination-sm .page-link {
      padding: 0.25rem 0.5rem;
      font-size: 0.875rem;
    }

    .pagination-lg .page-link {
      padding: 0.75rem 1.5rem;
      font-size: 1.125rem;
    }

    @media (max-width: 768px) {
      .pagination-container .d-flex {
        flex-direction: column;
        gap: 1rem;
        align-items: center !important;
      }

      .pagination-info {
        text-align: center;
      }

      .page-size-selector {
        width: 100%;
        max-width: 250px;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaginationComponent {
  @Input() totalItems = 0;
  @Input() currentPage = 1;
  @Input() pageSize = 10;
  @Input() pageSizeOptions: PageSizeOption[] = [
    { label: '5', value: 5 },
    { label: '10', value: 10 },
    { label: '25', value: 25 },
    { label: '50', value: 50 },
    { label: '100', value: 100 }
  ];
  @Input() showInfo = true;
  @Input() showPageSizeSelector = true;
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() ariaLabel = {
    first: 'First page',
    previous: 'Previous page',
    next: 'Next page',
    last: 'Last page'
  };

  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize);
  }

  get isFirstPage(): boolean {
    return this.currentPage <= 1;
  }

  get isLastPage(): boolean {
    return this.currentPage >= this.totalPages;
  }

  get startIndex(): number {
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalItems);
  }

  get visiblePages(): number[] {
    if (this.totalPages <= 7) {
      return Array.from({ length: this.totalPages }, (_, i) => i + 1);
    }

    const pages: number[] = [];
    const start = Math.max(1, this.currentPage - 3);
    const end = Math.min(this.totalPages, this.currentPage + 3);

    if (start > 1) {
      pages.push(1);
      if (start > 2) {
        pages.push(-1); // ellipsis marker
      }
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < this.totalPages) {
      if (end < this.totalPages - 1) {
        pages.push(-1); // ellipsis marker
      }
      pages.push(this.totalPages);
    }

    return pages;
  }

  get containerClass(): string {
    return `pagination-${this.size}`;
  }

  get sizeClass(): string {
    const sizeClasses = {
      small: 'pagination-sm',
      medium: '',
      large: 'pagination-lg'
    };
    return sizeClasses[this.size];
  }

  getStartIndex(): number {
    return this.startIndex;
  }

  getEndIndex(): number {
    return this.endIndex;
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) {
      return;
    }
    this.currentPage = page;
    this.pageChange.emit(page);
  }

  goToFirstPage(): void {
    this.goToPage(1);
  }

  goToPreviousPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  goToNextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  goToLastPage(): void {
    this.goToPage(this.totalPages);
  }

  onPageSizeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const newSize = parseInt(target.value, 10);
    this.pageSize = newSize;
    this.currentPage = 1; // Reset to first page when page size changes
    this.pageSizeChange.emit(newSize);
    this.pageChange.emit(1);
  }

  // Utility methods
  setCurrentPage(page: number): void {
    this.currentPage = page;
  }

  setPageSize(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
  }

  setTotalItems(total: number): void {
    this.totalItems = total;
  }
}