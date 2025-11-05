export interface PaginationParams {
  pageIndex: number;
  pageSize: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  searchTerm?: string;
  filters?: Record<string, any>;
}

export interface PaginationOptions {
  pageIndex?: number;
  pageSize?: number;
  maxPageSize?: number;
  showSizeChanger?: boolean;
  showQuickJumper?: boolean;
  showTotal?: boolean;
  hideOnSinglePage?: boolean;
}

export interface PageEvent {
  length: number;
  pageIndex: number;
  pageSize: number;
  previousPageIndex?: number;
}

export interface SortEvent {
  active: string;
  direction: 'asc' | 'desc';
}