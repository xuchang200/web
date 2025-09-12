import { Request, Response, NextFunction } from 'express'
import { getSettings } from '../services/settings/settingsService'
import { logRateLimitExceeded } from './securityLogger'

interface Counter { count: number; resetAt: number }
const ipBucket = new Map<string, Counter>()
const userBucket = new Map<string, Counter>()

function getCounter(map: Map<string, Counter>, key: string): Counter {
  const now = Date.now()
  let c = map.get(key)
  if (!c || now >= c.resetAt) {
    c = { count: 0, resetAt: now + 60_000 }
    map.set(key, c)
  }
  return c
}

export async function rateLimitGuard(req: Request, res: Response, next: NextFunction) {
  try {
    const security = await getSettings<any>('security.risk')
    const cfg = security?.rateLimit
    if (!cfg?.enabled) return next()
    const userId = (req as any).user?.id
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown'
    
    if (userId) {
      const c = getCounter(userBucket, userId)
      c.count++
      if (c.count > cfg.perUserPerMinute) {
        // 记录用户频率限制日志
        await logRateLimitExceeded(req, cfg.perUserPerMinute, 60000)
        return res.status(429).json({ success: false, message: '请求过于频繁，请稍后再试' })
      }
    } else {
      const c = getCounter(ipBucket, ip)
      c.count++
      if (c.count > cfg.perIpPerMinute) {
        // 记录IP频率限制日志
        await logRateLimitExceeded(req, cfg.perIpPerMinute, 60000)
        return res.status(429).json({ success: false, message: '请求过于频繁，请稍后再试' })
      }
    }
  } catch (e) {
    // ignore
  }
  next()
}
