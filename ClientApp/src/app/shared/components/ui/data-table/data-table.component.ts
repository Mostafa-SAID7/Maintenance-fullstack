import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  type?: 'text' | 'number' | 'date' | 'boolean' | 'currency';
  format?: string;
  template?: any;
}

export interface TableAction {
  label: string;
  icon?: string;
  class?: string;
  action: (row: any) => void;
  disabled?: (row: any) => boolean;
}

export interface SortOption {
  column: string;
  direction: 'asc' | 'desc';
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="data-table-container">
      <div *ngIf="showSearch" class="table-search">
        <div class="input-group">
          <span class="input-group-text">
            <i class="fas fa-search"></i>
          </span>
          <input
            type="text"
            class="form-control"
            placeholder="Search..."
            [(ngModel)]="searchTerm"
            (input)="onSearch()"
          />
          <button *ngIf="searchTerm" class="btn btn-outline-secondary" (click)="clearSearch()">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>

      <div class="table-responsive">
        <table class="table table-striped table-hover">
          <thead>
            <tr>
              <th *ngFor="let column of columns" 
                  [class]="getColumnClass(column)"
                  (click)="onColumnClick(column)"
              >
                <div class="d-flex align-items-center">
                  {{ column.label }}
                  <i *ngIf="column.sortable" 
                     [class]="getSortIcon(column.key)" 
                     class="ms-1 sort-icon"></i>
                </div>
                <input *ngIf="column.filterable" 
                       type="text" 
                       class="form-control form-control-sm mt-1 column-filter"
                       [value]="columnFilters[column.key] || ''"
                       (input)="onColumnFilter(column.key, $event)"
                       placeholder="Filter..."
                />
              </th>
              <th *ngIf="actions && actions.length > 0" class="text-center" style="width: 100px;">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let row of paginatedData; trackBy: trackByFn">
              <td *ngFor="let column of columns" [class]="getColumnClass(column)">
                <ng-container [ngSwitch]="column.type || 'text'">
                  <span *ngSwitchCase="'text'">{{ getCellValue(row, column.key) }}</span>
                  <span *ngSwitchCase="'number'">{{ formatNumber(getCellValue(row, column.key)) }}</span>
                  <span *ngSwitchCase="'date'">{{ formatDate(getCellValue(row, column.key), column.format) }}</span>
                  <span *ngSwitchCase="'boolean'">
                    <i [class]="getBooleanIcon(getCellValue(row, column.key))"></i>
                  </span>
                  <span *ngSwitchCase="'currency'">{{ formatCurrency(getCellValue(row, column.key)) }}</span>
                  <ng-container *ngSwitchDefault>{{ getCellValue(row, column.key) }}</ng-container>
                </ng-container>
              </td>
              <td *ngIf="actions && actions.length > 0" class="text-center">
                <div class="btn-group">
                  <button *ngFor="let action of actions"
                          [disabled]="action.disabled && action.disabled(row)"
                          [class]="action.class || 'btn btn-sm btn-outline-secondary'"
                          (click)="action.action(row)"
                          [title]="action.label"
                  >
                    <i *ngIf="action.icon" [class]="action.icon"></i>
                    {{ !action.icon ? action.label : '' }}
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="filteredData.length === 0">
              <td [attr.colspan]="columns.length + (actions && actions.length > 0 ? 1 : 0)" class="text-center py-4">
                <div class="text-muted">
                  <i class="fas fa-inbox fa-2x mb-2"></i>
                  <div>{{ emptyMessage }}</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div *ngIf="showPagination && filteredData.length > 0" class="table-pagination">
        <div class="d-flex justify-content-between align-items-center">
          <div class="pagination-info">
            Showing {{ startIndex + 1 }} to {{ endIndexDisplay }}
            of {{ filteredData.length }} entries
          </div>
          <nav>
            <ul class="pagination pagination-sm mb-0">
              <li class="page-item" [class.disabled]="currentPage === 1">
                <a class="page-link" (click)="goToPage(1)">
                  <i class="fas fa-angle-double-left"></i>
                </a>
              </li>
              <li class="page-item" [class.disabled]="currentPage === 1">
                <a class="page-link" (click)="goToPage(currentPage - 1)">
                  <i class="fas fa-angle-left"></i>
                </a>
              </li>
              <li *ngFor="let page of visiblePages" 
                  class="page-item" 
                  [class.active]="page === currentPage">
                <a class="page-link" (click)="goToPage(page)">{{ page }}</a>
              </li>
              <li class="page-item" [class.disabled]="currentPage === totalPages">
                <a class="page-link" (click)="goToPage(currentPage + 1)">
                  <i class="fas fa-angle-right"></i>
                </a>
              </li>
              <li class="page-item" [class.disabled]="currentPage === totalPages">
                <a class="page-link" (click)="goToPage(totalPages)">
                  <i class="fas fa-angle-double-right"></i>
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .data-table-container {
      width: 100%;
    }

    .table-search {
      margin-bottom: 1rem;
      max-width: 300px;
    }

    th {
      position: relative;
      user-select: none;
      cursor: pointer;
    }

    th:hover {
      background-color: var(--bs-light);
    }

    .sort-icon {
      font-size: 0.7rem;
      opacity: 0.7;
    }

    .column-filter {
      border: none;
      border-top: 1px solid var(--bs-border-color);
      border-radius: 0;
      font-size: 0.75rem;
    }

    .table-responsive {
      border-radius: var(--bs-border-radius);
      border: 1px solid var(--bs-border-color);
    }

    .table-pagination {
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
    }

    .btn-group .btn {
      margin-right: 0.25rem;
    }

    .btn-group .btn:last-child {
      margin-right: 0;
    }

    @media (max-width: 768px) {
      .table-responsive {
        font-size: 0.875rem;
      }

      .pagination-info {
        font-size: 0.75rem;
        margin-bottom: 0.5rem;
      }

      .table-pagination .d-flex {
        flex-direction: column;
        align-items: center !important;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataTableComponent implements OnInit, OnDestroy {
  @Input() data: any[] = [];
  @Input() columns: TableColumn[] = [];
  @Input() actions: TableAction[] = [];
  @Input() showSearch = true;
  @Input() showPagination = true;
  @Input() pageSize = 10;
  @Input() pageSizeOptions: number[] = [5, 10, 25, 50, 100];
  @Input() emptyMessage = 'No data available';
  @Input() loading = false;

  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();
  @Output() sortChange = new EventEmitter<SortOption>();
  @Output() searchChange = new EventEmitter<string>();
  @Output() rowClick = new EventEmitter<any>();

  // Internal state
  filteredData: any[] = [];
  paginatedData: any[] = [];
  searchTerm = '';
  columnFilters: { [key: string]: string } = {};
  currentPage = 1;
  sortOption: SortOption = { column: '', direction: 'asc' };

  // Computed properties
  get totalPages(): number {
    return Math.ceil(this.filteredData.length / this.pageSize);
  }

  get startIndex(): number {
    return (this.currentPage - 1) * this.pageSize;
  }

  get endIndex(): number {
    return Math.min(this.startIndex + this.pageSize, this.filteredData.length);
  }

  get endIndexDisplay(): number {
    return this.endIndex;
  }

  get visiblePages(): number[] {
    const pages: number[] = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.totalPages, this.currentPage + 2);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  ngOnInit(): void {
    this.applyFilters();
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  ngOnChanges(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = [...this.data];

    // Apply search filter
    if (this.searchTerm) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(row => 
        Object.values(row).some(value => 
          String(value).toLowerCase().includes(searchLower)
        )
      );
    }

    // Apply column filters
    Object.entries(this.columnFilters).forEach(([key, filter]) => {
      if (filter) {
        const filterLower = filter.toLowerCase();
        filtered = filtered.filter(row =>
          String(row[key] || '').toLowerCase().includes(filterLower)
        );
      }
    });

    // Apply sorting
    if (this.sortOption.column) {
      filtered.sort((a, b) => {
        const aVal = a[this.sortOption.column];
        const bVal = b[this.sortOption.column];
        
        if (aVal < bVal) return this.sortOption.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return this.sortOption.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    this.filteredData = filtered;
    this.applyPagination();
  }

  applyPagination(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedData = this.filteredData.slice(start, end);
  }

  onSearch(): void {
    this.currentPage = 1;
    this.applyFilters();
    this.searchChange.emit(this.searchTerm);
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.onSearch();
  }

  onColumnFilter(columnKey: string, event: Event): void {
    const target = event.target as HTMLInputElement;
    this.columnFilters[columnKey] = target.value;
    this.currentPage = 1;
    this.applyFilters();
  }

  onColumnClick(column: TableColumn): void {
    if (!column.sortable) return;

    if (this.sortOption.column === column.key) {
      // Toggle direction
      this.sortOption.direction = this.sortOption.direction === 'asc' ? 'desc' : 'asc';
    } else {
      // New column, default to ascending
      this.sortOption.column = column.key;
      this.sortOption.direction = 'asc';
    }

    this.applyFilters();
    this.sortChange.emit(this.sortOption);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    
    this.currentPage = page;
    this.applyPagination();
    this.pageChange.emit(page);
  }

  changePageSize(newSize: number): void {
    this.pageSize = newSize;
    this.currentPage = 1;
    this.applyFilters();
    this.pageSizeChange.emit(newSize);
  }

  getColumnClass(column: TableColumn): string {
    return column.width ? `col-width-${column.key}` : '';
  }

  getSortIcon(columnKey: string): string {
    if (this.sortOption.column !== columnKey) {
      return 'fas fa-sort text-muted';
    }
    return this.sortOption.direction === 'asc' 
      ? 'fas fa-sort-up text-primary' 
      : 'fas fa-sort-down text-primary';
  }

  getCellValue(row: any, key: string): any {
    return row[key];
  }

  formatNumber(value: any): string {
    const num = parseFloat(value);
    return isNaN(num) ? value : num.toLocaleString();
  }

  formatDate(value: any, format?: string): string {
    if (!value) return '';
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;
    return format ? date.toLocaleDateString(format) : date.toLocaleDateString();
  }

  formatCurrency(value: any): string {
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD' 
    }).format(num);
  }

  getBooleanIcon(value: any): string {
    return value 
      ? 'fas fa-check text-success' 
      : 'fas fa-times text-danger';
  }

  trackByFn(index: number, item: any): any {
    return item.id || index;
  }

  onRowClick(row: any): void {
    this.rowClick.emit(row);
  }
}