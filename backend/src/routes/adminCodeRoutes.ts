import express from 'express';
import { authenticateToken, requireAdmin } from '../middlewares/authMiddleware';
import { listActivationCodes, generateActivationCodes, revokeActivationCode, batchDeleteActivationCodes } from '../controllers/codeController';

const router = express.Router();

router.use(authenticateToken);
router.use(requireAdmin);

// 获取激活码列表
router.get('/', listActivationCodes);

// 批量生成激活码
router.post('/generate', generateActivationCodes);

// 作废（删除）单个激活码（仅未使用）
router.delete('/:id', revokeActivationCode);

// 批量删除激活码（仅未使用）
router.post('/batch-delete', batchDeleteActivationCodes);

export default router;


