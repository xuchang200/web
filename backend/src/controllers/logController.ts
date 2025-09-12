import { Request, Response, NextFunction } from 'express'
import * as logService from '../services/logService'
import { extractClientContext } from '../utils/requestContext'

export const listLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await logService.queryLogs({
      page: req.query.page ? Number(req.query.page) : undefined,
      pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
      type: req.query.type as any,
      userId: req.query.userId as string | undefined,
      gameId: req.query.gameId as string | undefined,
      targetUserId: req.query.targetUserId as string | undefined,
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
      search: req.query.search as string | undefined,
    })
    res.json({ success: true, message: '获取日志成功', data: result.items, total: result.total, page: result.page, pageSize: result.pageSize })
  } catch (error) {
    next(error)
  }
}

export const getLogDetail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const log = await logService.getLogById(req.params.id)
    res.json({ success: true, data: log })
  } catch (error) {
    next(error)
  }
}

export const removeLog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await logService.deleteLog(req.params.id)
    res.json({ success: true, message: '删除成功' })
  } catch (error) {
    next(error)
  }
}

export const removeLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ids } = req.body as { ids: string[] }
    await logService.deleteLogs(ids || [])
    res.json({ success: true, message: '批量删除成功' })
  } catch (error) {
    next(error)
  }
}

export const removeAllLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await logService.clearLogs()
    res.json({ success: true, message: '已清空所有日志' })
  } catch (error) {
    next(error)
  }
}

export const exportLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await logService.queryLogs({
      page: 1,
      pageSize: 10000,
      type: req.query.type as any,
      userId: req.query.userId as string | undefined,
      gameId: req.query.gameId as string | undefined,
      targetUserId: req.query.targetUserId as string | undefined,
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
      search: req.query.search as string | undefined,
    })
    const header = ['时间','类型','用户','游戏','激活码','消息']
    const lines = [header.join(',')]
    for (const l of result.items as any[]) {
      const row = [
        new Date(l.createdAt).toISOString(),
        l.type,
        l.user ? `${l.user.username}(${l.user.email})` : '',
        l.game ? `${l.game.name}` : '',
        l.activationCode ? l.activationCode.code : '',
        '"' + (l.message || '').replace(/"/g,'""') + '"'
      ]
      lines.push(row.join(','))
    }
    const csv = lines.join('\n')
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="logs.csv"')
    res.send('\ufeff' + csv)
  } catch (error) {
    next(error)
  }
}


