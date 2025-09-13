import request from './request'

export interface PublicSiteBasicSettings {
  siteName: string
  siteDescription: string
  copyright: string
  announcement: { enabled: boolean; content: string; startAt: string|null; endAt: string|null }
  maintenance: { enabled: boolean; message: string; whitelistIPs: string[] }
}

export interface AboutContentSettings {
  enabled: boolean
  title: string
  contentType: 'markdown' | 'html'
  content: string
  seoDescription: string
}

export function fetchPublicSiteBasic() {
  return request<{ success: boolean; data: PublicSiteBasicSettings }>({ url: '/public/settings/site-basic', method: 'GET' })
}

// 获取About页面内容（公开接口）
export function fetchAboutContent() {
  return request<{ success: boolean; data: AboutContentSettings }>({ url: '/public/settings/about-content', method: 'GET' })
}
