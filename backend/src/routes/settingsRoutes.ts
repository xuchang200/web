import express from 'express';
import { getAdminSiteSettings, updateAdminSiteSettings } from '../controllers/adminSiteSettingsController';
import { getAccountPolicy, updateAccountPolicy } from '../controllers/accountPolicyController';
import { getSecurityRisk, updateSecurityRisk } from '../controllers/securityRiskController';
import { getGamePolicy, updateGamePolicy, resetGamePolicy } from '../controllers/gamePolicyController';
import { getContentPagesSettings, updateContentPagesSettings } from '../controllers/contentPagesController';
import { authenticateToken, requireAdmin } from '../middlewares/authMiddleware';

const router = express.Router();

// 所有设置接口都需要管理员权限
router.use(authenticateToken);
router.use(requireAdmin);

// 新的 site.basic 设置兼容路径
router.get('/site', getAdminSiteSettings); // 兼容旧前端
router.put('/site', updateAdminSiteSettings);
router.get('/site.basic', getAdminSiteSettings);
router.patch('/site.basic', updateAdminSiteSettings);
router.put('/site.basic', updateAdminSiteSettings);

// 账号策略
router.get('/account.policy', getAccountPolicy)
router.patch('/account.policy', updateAccountPolicy)
router.put('/account.policy', updateAccountPolicy)

// 安全与风控
router.get('/security.risk', getSecurityRisk)
router.patch('/security.risk', updateSecurityRisk)
router.put('/security.risk', updateSecurityRisk)

// 游戏与内容策略
router.get('/game.policy', getGamePolicy)
router.patch('/game.policy', updateGamePolicy)
router.put('/game.policy', updateGamePolicy)
router.post('/game.policy/reset', resetGamePolicy)

// 内容页面设置 - 使用专门控制器
router.get('/content.pages', getContentPagesSettings);
router.patch('/content.pages', updateContentPagesSettings);
router.put('/content.pages', updateContentPagesSettings);

// 已移除 SMTP 与邮件模板相关路由

export default router;
