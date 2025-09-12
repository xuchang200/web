import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { authenticateToken, requireAdmin } from '../middlewares/authMiddleware';
import { activateByUser } from '../controllers/codeController';
import { AppError } from '../utils/AppError';
import { getAllUsers, updateUser, deleteUser, createUser, getMyGames, getUserActivatedGames, activateGameForUser, deactivateGameForUser, updateProfile, changePassword } from '../controllers/userController';
import { getSettings } from '../services/settings/settingsService';
import { Prisma } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// 获取当前用户信息 - 需要认证
router.get('/profile', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return next(new AppError('用户ID不存在', 400));
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        activatedGamesCount: true
      }
    });

    if (!user) {
      return next(new AppError('用户不存在', 404));
    }

    res.json({
      success: true,
      message: '获取用户信息成功',
      data: user
    });
  } catch (error) {
    next(error);
  }
});

// 更新用户信息 - 需要认证
router.put('/profile', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { username, email } = req.body;
    
    if (!userId) {
      return next(new AppError('用户ID不存在', 400));
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { username, email },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      message: '更新用户信息成功',
      data: user
    });
  } catch (error) {
    next(error);
  }
});

// 修改密码 - 需要认证
router.put('/password', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { currentPassword, newPassword } = req.body;
    
    if (!userId) {
      return next(new AppError('用户ID不存在', 400));
    }

    if (!currentPassword || !newPassword) {
      return next(new AppError('当前密码和新密码不能为空', 400));
    }

    // 根据策略校验新密码
    try {
      const policy = await getSettings<any>('account.policy')
      if (policy?.password) {
        validatePasswordWithPolicy(newPassword, policy.password)
      } else {
        if (newPassword.length < 6 || newPassword.length > 64) {
          return next(new AppError('新密码长度必须在6-64个字符之间', 400));
        }
      }
    } catch (e:any) {
      if (e instanceof AppError) return next(e)
    }

    // 获取用户当前信息
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true }
    });

    if (!user) {
      return next(new AppError('用户不存在', 404));
    }

    // 验证当前密码
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return next(new AppError('当前密码不正确', 400));
    }

    // 校验历史密码重复（策略）
    let disallowReuse = 0
    let historyKeep = 0
    try {
      const policy = await getSettings<any>('account.policy')
      disallowReuse = policy?.password?.disallowReuse || 0
      historyKeep = policy?.password?.historyKeep || Math.max(disallowReuse, 10)
      if (disallowReuse > 0) {
        const recent = await prisma.passwordHistory.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: disallowReuse
        })
        for (const h of recent) {
          if (await bcrypt.compare(newPassword, h.password)) {
            return next(new AppError(`新密码不能与最近${disallowReuse}次使用的密码相同`, 400))
          }
        }
      }
    } catch {}

    const hashedNewPassword = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({ where: { id: userId }, data: { password: hashedNewPassword } })
    // 写入历史并裁剪
    try {
      await prisma.passwordHistory.create({ data: { userId, password: hashedNewPassword } })
      const count = await prisma.passwordHistory.count({ where: { userId } })
      const limit = historyKeep || 10
      if (count > limit) {
        const overflow = count - limit
        const old = await prisma.passwordHistory.findMany({ where: { userId }, orderBy: { createdAt: 'asc' }, take: overflow })
        await prisma.passwordHistory.deleteMany({ where: { id: { in: old.map((o: any) => o.id) } } })
      }
    } catch {}

    res.json({
      success: true,
      message: '密码修改成功'
    });
  } catch (error) {
    next(error);
  }
});

// 申请账号注销（进入冷静期）
router.post('/deletion/request', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user?.id
    if (!userId) return next(new AppError('未认证', 401))
    const policy = await getSettings<any>('account.policy')
    if (!policy?.accountDeletion?.enabled) return next(new AppError('当前不支持账号注销', 400))
    const coolingDays = policy.accountDeletion.coolingDays ?? 7
    const now = new Date()
    const effective = new Date(now.getTime() + coolingDays * 24 * 60 * 60 * 1000)
    await prisma.user.update({
      where: { id: userId },
      data: { deletionRequestedAt: now, deletionEffectiveAt: effective } as any
    })
    res.json({ success: true, message: `账号将在冷静期(${coolingDays}天)结束后删除`, data: { deletionEffectiveAt: effective } })
  } catch (e) {
    next(e)
  }
})

// 取消账号注销申请
router.post('/deletion/cancel', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user?.id
    if (!userId) return next(new AppError('未认证', 401))
    await prisma.user.update({
      where: { id: userId },
      data: { deletionRequestedAt: null, deletionEffectiveAt: null } as any
    })
    res.json({ success: true, message: '已取消账号注销申请' })
  } catch (e) { next(e) }
})

// 立即删除（若已过冷静期）
router.post('/deletion/execute', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user?.id
    if (!userId) return next(new AppError('未认证', 401))
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user?.deletionEffectiveAt) return next(new AppError('未处于注销流程', 400))
    const now = new Date()
    if (new Date(user.deletionEffectiveAt).getTime() > now.getTime()) {
      return next(new AppError('冷静期未结束，暂不可执行删除', 400))
    }
    await prisma.user.delete({ where: { id: userId } })
    res.json({ success: true, message: '账号已删除' })
  } catch (e) { next(e) }
})

function validatePasswordWithPolicy(pw: string, policy: any) {
  if (!pw || typeof pw !== 'string') throw new AppError('密码不能为空', 400)
  if (pw.length < policy.minLength) throw new AppError(`密码长度不能少于${policy.minLength}个字符`, 400)
  if (pw.length > policy.maxLength) throw new AppError(`密码长度不能超过${policy.maxLength}个字符`, 400)
  if (policy.requireLowercase && !/[a-z]/.test(pw)) throw new AppError('密码需包含小写字母', 400)
  if (policy.requireUppercase && !/[A-Z]/.test(pw)) throw new AppError('密码需包含大写字母', 400)
  if (policy.requireNumber && !/[0-9]/.test(pw)) throw new AppError('密码需包含数字', 400)
  if (policy.requireSymbol && !/[~!@#$%^&*()_+\-={}\[\]:";'<>?,./]/.test(pw)) throw new AppError('密码需包含符号', 400)
}

// 获取所有用户 - 需要管理员权限
router.get('/list', authenticateToken, requireAdmin, getAllUsers);

// 更新用户信息 - 需要管理员权限
router.put('/:id', authenticateToken, requireAdmin, updateUser);

// 删除用户 - 需要管理员权限
router.delete('/:id', authenticateToken, requireAdmin, deleteUser);

// 新增用户 - 需要管理员权限
router.post('/', authenticateToken, requireAdmin, createUser);

// 使用激活码激活游戏（普通用户）
router.post('/activate', authenticateToken, activateByUser);

// 获取我的游戏（普通用户）
router.get('/my-games', authenticateToken, getMyGames);

// 获取用户已激活的游戏列表 - 需要管理员权限
router.get('/:id/activated-games', authenticateToken, requireAdmin, getUserActivatedGames);

// 为用户激活游戏 - 需要管理员权限
router.post('/:id/activate-game', authenticateToken, requireAdmin, activateGameForUser);

// 为用户取消游戏激活 - 需要管理员权限
router.delete('/:id/deactivate-game', authenticateToken, requireAdmin, deactivateGameForUser);

// 用户更新个人资料 - 需要认证
router.put('/profile', authenticateToken, updateProfile);

// 用户更改密码 - 需要认证
router.put('/password', authenticateToken, changePassword);

export default router;