export interface PaginationParams {
  page: number;
  size: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export const defaultPaginationParams: PaginationParams = {
  page: 1,
  size: 10
};

export const pageSizeOptions = [10, 25, 50, 100];