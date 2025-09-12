import { Request } from 'express'

export interface ClientContextInfo {
  ip?: string
  userAgent?: string
}

export function extractClientContext(req: Request): ClientContextInfo {
  const xfwd = (req.headers['x-forwarded-for'] || '') as string
  const ip = (xfwd.split(',')[0] || '').trim() || (req.ip || req.socket.remoteAddress || undefined) || undefined
  const userAgent = (req.headers['user-agent'] as string) || undefined
  return { ip, userAgent }
}


