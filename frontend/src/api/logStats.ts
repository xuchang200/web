import request from './request'

export interface LogStats {
  userOperations: number
  gameOperations: number
  adminOperations: number
  securityEvents: number
  systemOperations: number
  totalLogs: number
  todayLogs: number
  weeklyLogs: number
  monthlyLogs: number
}

export interface LogTypeStats {
  type: string
  count: number
  percentage: number
}

export interface DailyStats {
  date: string
  count: number
}

export interface PopularOperation {
  type: string
  count: number
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message: string
}

// 获取日志统计概览
export const getLogStats = () => {
  return request<ApiResponse<LogStats>>({
    url: '/logs/stats/overview',
    method: 'get'
  })
}

// 获取日志类型分布统计
export const getLogTypeStats = (days = 30) => {
  return request<ApiResponse<LogTypeStats[]>>({
    url: '/logs/stats/types',
    method: 'get',
    params: { days }
  })
}

// 获取每日日志统计
export const getDailyLogStats = (days = 7) => {
  return request<ApiResponse<DailyStats[]>>({
    url: '/logs/stats/daily',
    method: 'get',
    params: { days }
  })
}

// 获取热门操作统计
export const getPopularOperations = (limit = 10, days = 7) => {
  return request<ApiResponse<PopularOperation[]>>({
    url: '/logs/stats/popular',
    method: 'get',
    params: { limit, days }
  })
}
