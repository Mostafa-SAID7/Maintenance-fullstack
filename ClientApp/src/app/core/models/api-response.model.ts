export interface ApiResponse<T> {
  Success: boolean;
  Data?: T | null;
  Message?: string;
  Errors?: string[];
  Timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

export interface BaseEntity {
  id: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface AuditEntity extends BaseEntity {
  isDeleted: boolean;
  deletedAt?: string;
  deletedBy?: string;
}