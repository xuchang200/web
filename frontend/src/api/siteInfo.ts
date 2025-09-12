import request from './request'

export interface SiteInfo {
  siteName: string
  siteDescription: string
  copyright: string
  announcement: { enabled: boolean; content: string }
  maintenance: { enabled: boolean; message: string }
  allowRegistration: boolean
}

export const fetchSiteInfo = () => {
  return request<{ success: boolean; data: any }>({ url: '/admin/settings/site', method: 'GET' })
}
