// site.basic 精简版 schema（zod）
import { z } from 'zod'

export const SiteBasicSchema = z.object({
  siteName: z.string().min(1).max(60),
  siteDescription: z.string().max(300),
  copyright: z.string().max(100),
  announcement: z.object({
    enabled: z.boolean(),
    content: z.string().max(1000),
    startAt: z.string().datetime().nullable(),
    endAt: z.string().datetime().nullable()
  }),
  maintenance: z.object({
    enabled: z.boolean(),
    message: z.string().max(300),
    whitelistIPs: z.array(z.string().ip())
  })
})

export type SiteBasicSettings = z.infer<typeof SiteBasicSchema>

export const DEFAULT_SITE_BASIC: SiteBasicSettings = {
  siteName: 'withU',
  siteDescription: '一个专注于文字冒险游戏的个人平台',
  copyright: '© 2025 withU',
  announcement: { enabled: false, content: '', startAt: null, endAt: null },
  maintenance: { enabled: false, message: '系统维护中，请稍后访问', whitelistIPs: [] }
}
