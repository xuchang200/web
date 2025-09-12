import express from 'express'
import { authenticateToken, requireAdmin } from '../middlewares/authMiddleware'
import { listLogs, getLogDetail, removeLog, removeLogs, removeAllLogs, exportLogs } from '../controllers/logController'

const router = express.Router()

router.use(authenticateToken)
router.use(requireAdmin)

router.get('/', listLogs)
router.get('/export', exportLogs)
router.get('/:id', getLogDetail)
router.delete('/clear', removeAllLogs)
router.delete('/', removeLogs)
router.delete('/:id', removeLog)

export default router
