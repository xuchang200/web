import { Request, Response, NextFunction } from 'express'
import { getSettings } from '../services/settings/settingsService'

export async function dynamicCorsConfig(req: Request, res: Response, next: NextFunction) {
  try {
    const security = await getSettings<any>('security.risk')
    const origins: string[] = security?.cors?.allowedOrigins || ['*']
    const origin = req.headers.origin
    if (!origin || origins.includes('*') || origins.includes(origin)) {
      if (origin) res.header('Access-Control-Allow-Origin', origin)
      else if (origins.includes('*')) res.header('Access-Control-Allow-Origin', '*')
      res.header('Vary', 'Origin')
      res.header('Access-Control-Allow-Credentials', 'true')
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
      res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
      if (req.method === 'OPTIONS') return res.sendStatus(204)
    }
  } catch (e) {
    // ignore fallback to default cors
  }
  next()
}
