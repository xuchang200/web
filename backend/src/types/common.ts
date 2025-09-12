export interface ApiResponse<T> {
  success: boolean
  data: T
  message: string
  total?: number
  page?: number
  pageSize?: number
}

export interface PaginationParams {
  page?: number
  pageSize?: number
}

export interface BaseQuery extends PaginationParams {
  search?: string
  startDate?: string
  endDate?: string
}
