import { Request, Response } from 'express'
import { getSettings, updateSettings } from '../services/settings/settingsService'

export async function getSecurityRisk(req: Request, res: Response) {
  try {
    const data = await getSettings('security.risk')
    res.json({ success: true, data })
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message || '获取安全与风控设置失败' })
  }
}

export async function updateSecurityRisk(req: Request, res: Response) {
  try {
    const updated = await updateSettings('security.risk', req.body, req.user?.id)
    res.json({ success: true, message: '更新成功', data: updated })
  } catch (e: any) {
    res.status(400).json({ success: false, message: e.message || '更新失败' })
  }
}
