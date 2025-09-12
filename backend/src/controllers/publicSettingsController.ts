import { Request, Response } from 'express'
import { getSettings } from '../services/settings/settingsService'

// 公共获取基础站点设置（无需登录，用于首页/登录/注册等）
export async function getPublicSiteSettings(req: Request, res: Response) {
  try {
    const data = await getSettings('site.basic')
    res.json({ success: true, data })
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message || '获取站点设置失败' })
  }
}

// 公共获取账号策略（仅公开注册开关+密码策略+注销是否启用+冷静期）
export async function getPublicAccountPolicy(req: Request, res: Response) {
  try {
    const policy: any = await getSettings('account.policy')
    const data = {
      registration: { enabled: policy.registration?.enabled ?? true },
      sso: { enabled: policy.sso?.enabled ?? true }, // 可用于前端提示
      password: {
        minLength: policy.password?.minLength ?? 8,
        maxLength: policy.password?.maxLength ?? 64,
        requireUppercase: !!policy.password?.requireUppercase,
        requireLowercase: policy.password?.requireLowercase !== false,
        requireNumber: !!policy.password?.requireNumber,
        requireSymbol: !!policy.password?.requireSymbol
      },
      accountDeletion: {
        enabled: !!policy.accountDeletion?.enabled,
        coolingDays: policy.accountDeletion?.coolingDays ?? 7
      }
    }
    res.json({ success: true, data })
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message || '获取账号策略失败' })
  }
}
