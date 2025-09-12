import request from './request'

export interface PublicSiteBasicSettings {
  siteName: string
  siteDescription: string
  copyright: string
  announcement: { enabled: boolean; content: string; startAt: string|null; endAt: string|null }
  maintenance: { enabled: boolean; message: string; whitelistIPs: string[] }
}

export function fetchPublicSiteBasic() {
  return request<{ success: boolean; data: PublicSiteBasicSettings }>({ url: '/public/settings/site-basic', method: 'GET' })
}
