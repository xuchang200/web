import request from './request'
import type { LogQuery, LogResponse } from '@/types/log'

// 获取日志列表
export const getLogs = (params: LogQuery = {}) => {
  return request<LogResponse>({
    url: '/logs',
    method: 'get',
    params
  })
}

// 根据ID获取日志详情
export const getLogById = (id: string) => {
  return request({
    url: `/logs/${id}`,
    method: 'get'
  })
}

// 删除日志
export const deleteLog = (id: string) => {
  return request({
    url: `/logs/${id}`,
    method: 'delete'
  })
}

// 批量删除日志
export const deleteLogs = (ids: string[]) => {
  return request({
    url: '/logs',
    method: 'delete',
    data: { ids }
  })
}

// 清空日志
export const clearLogs = () => {
  return request({
    url: '/logs/clear',
    method: 'delete'
  })
}

// 导出日志
export const exportLogs = (params: LogQuery = {}) => {
  return request({
    url: '/logs/export',
    method: 'get',
    params,
    responseType: 'blob'
  })
}