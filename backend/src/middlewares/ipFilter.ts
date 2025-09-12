import { Request, Response, NextFunction } from 'express'
import { getSettings } from '../services/settings/settingsService'

export async function ipFilter(req: Request, res: Response, next: NextFunction) {
  try {
    const security = await getSettings<any>('security.risk')
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || ''
    const blacklist: string[] = security?.ip?.blacklist || []
    const whitelist: string[] = security?.ip?.whitelist || []
    if (whitelist.includes(ip)) return next()
    if (blacklist.includes(ip)) return res.status(403).json({ success: false, message: '访问被拒绝' })
  } catch (e) {
    // ignore errors -> allow
  }
  next()
}
