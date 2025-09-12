import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import errorHandler from './middlewares/errorHandler';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import gameRoutes from './routes/gameRoutes';
import adminGameRoutes from './routes/adminGameRoutes';
import adminCodeRoutes from './routes/adminCodeRoutes';
import uploadRoutes from './routes/uploadRoutes';
import logRoutes from './routes/logRoutes';
import logStatsRoutes from './routes/logStatsRoutes';
import settingsRoutes from './routes/settingsRoutes';
import emailSmtpRoutes from './routes/emailSmtpRoutes';
import verificationRoutes from './routes/verificationRoutes';
import publicSettingsRoutes from './routes/publicSettingsRoutes';
import dashboardAnalyticsRoutes from './routes/analytics/dashboardAnalyticsRoutes';
import { initializeStorageDirectories } from './config/storage';

dotenv.config();

const app = express();

// 初始化存储目录
initializeStorageDirectories();

// 动态 CORS (security.risk.cors.allowedOrigins) -> 若失败回退默认
import { dynamicCorsConfig } from './middlewares/dynamicCors';
import { rateLimitGuard } from './middlewares/rateLimit';
app.use(dynamicCorsConfig);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 维护模式守卫（在业务路由前）
import { maintenanceGuard } from './middlewares/maintenanceGuard';
app.use(rateLimitGuard);
app.use(maintenanceGuard);
import { ipFilter } from './middlewares/ipFilter';
app.use(ipFilter);

// 静态文件服务 - 仅提供封面图片访问（游戏文件通过受控路由访问）
app.use('/uploads/covers', express.static(path.join(process.cwd(), 'uploads', 'covers')));

// 受控游戏内容访问
import gameContentRoutes from './routes/gameContentRoutes';
app.use('/game', gameContentRoutes);

// 环境变量关键值校验（生产环境防止默认值）
const requiredEnv = ['JWT_SECRET', 'DATABASE_URL'];
requiredEnv.forEach((k) => {
  if (!process.env[k]) {
    console.warn(`[startup][warn] Missing env ${k}`);
  }
});

// 提供前端静态资源 (dist)
// 注意：运行时工作目录在 /app/backend，因此不能使用 process.cwd() 拼 frontend 相对路径
const frontendDist = path.resolve(__dirname, '../../frontend/dist');
app.use(express.static(frontendDist));

// 健康检查 (返回基本状态，可扩展 DB/Redis 探测)
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', time: new Date().toISOString() });
});

// 原根路径欢迎信息可以保留或移除，这里保留 API 提示
app.get('/api', (_req: Request, res: Response) => {
  res.json({ message: 'API root' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/admin/games', adminGameRoutes);
app.use('/api/admin/codes', adminCodeRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/logs/stats', logStatsRoutes);
app.use('/api/admin/analytics', dashboardAnalyticsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin/settings', settingsRoutes);
app.use('/api/admin/email-smtp', emailSmtpRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/public/settings', publicSettingsRoutes);

// SPA fallback (在所有 API 路由之后, 错误处理中间件之前)
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/uploads') && !req.path.startsWith('/game')) {
    return res.sendFile(path.join(frontendDist, 'index.html'));
  }
  next();
});

// Error handling middleware
app.use(errorHandler);

export default app;