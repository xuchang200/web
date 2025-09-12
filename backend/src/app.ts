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

app.get('/', (req: Request, res: Response) => {
  res.send('Hello from backend!');
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

// Error handling middleware
app.use(errorHandler);

export default app;