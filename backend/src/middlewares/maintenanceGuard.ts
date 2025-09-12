import { Request, Response, NextFunction } from 'express'
import { getSettings } from '../services/settings/settingsService'

export async function maintenanceGuard(req: Request, res: Response, next: NextFunction) {
  try {
    // 管理端和认证接口放行
    if (req.path.startsWith('/api/admin') || req.path.startsWith('/api/auth')) return next()
    const siteBasic = await getSettings<any>('site.basic')
    if (!siteBasic?.maintenance?.enabled) return next()
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || ''
    const whitelist: string[] = siteBasic.maintenance?.whitelistIPs || []
    const userRole = (req as any).user?.role
    if (userRole === 'ADMIN' || whitelist.includes(ip)) return next()
    return res.status(503).json({ success: false, message: siteBasic.maintenance?.message || '系统维护中' })
  } catch (e) {
    return next()
  }
}
