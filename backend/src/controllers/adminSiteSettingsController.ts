import { Request, Response } from 'express'
import { getSettings, updateSettings } from '../services/settings/settingsService'

export async function getAdminSiteSettings(req: Request, res: Response) {
  try {
    const data = await getSettings('site.basic')
    res.json({ success: true, data })
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message || '获取站点设置失败' })
  }
}

export async function updateAdminSiteSettings(req: Request, res: Response) {
  try {
    const updated = await updateSettings('site.basic', req.body, req.user?.id)
    res.json({ success: true, message: '更新成功', data: updated })
  } catch (e: any) {
    res.status(400).json({ success: false, message: e.message || '更新失败' })
  }
}
