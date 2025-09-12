import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import bcrypt from 'bcryptjs';
import { getFileAccessUrl } from '../config/storage';
import { createLog } from '../services/logService';
import { extractClientContext } from '../utils/requestContext';
import prisma from '../lib/prisma';

export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        lastLoginAt: true,
        activatedGamesCount: true,
      },
    });
    res.json({
      success: true,
      message: '获取用户列表成功',
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { username, email, role } = req.body;

    if (role && !['ADMIN', 'USER'].includes(role.toUpperCase())) {
      return next(new AppError('无效的角色', 400));
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        username,
        email,
        role: role ? role.toUpperCase() : undefined,
      },
    });

    if (req.user) {
      try {
        await createLog({
          type: 'ADMIN_USER_UPDATE',
          message: `管理员 ${req.user.id} 更新了用户 ${user.username} (${id})`,
          userId: req.user.id,
          targetUserId: id,
          context: extractClientContext(req),
          metadata: {
            updatedFields: { username, email, role },
            targetUser: { id, username: user.username, email: user.email }
          }
        })
      } catch {}
    }

    res.json({
      success: true,
      message: '更新用户信息成功',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password || !role) {
      return next(new AppError('请提供所有必要信息', 400));
    }

    if (role && !['ADMIN', 'USER'].includes(role.toUpperCase())) {
      return next(new AppError('无效的角色', 400));
    }

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
    });

    if (existingUser) {
      if (existingUser.username === username) {
        return next(new AppError('用户名已存在', 409));
      }
      if (existingUser.email === email) {
        return next(new AppError('邮箱已被注册', 409));
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        role: role.toUpperCase(),
      },
    });

    if (req.user) {
      try {
        await createLog({
          type: 'ADMIN_USER_CREATE',
          message: `管理员 ${req.user.id} 创建了用户 ${user.username} (${user.id})`,
          userId: req.user.id,
          targetUserId: user.id,
          context: extractClientContext(req),
          metadata: {
            createdUser: {
              id: user.id,
              username: user.username,
              email: user.email,
              role: user.role
            }
          }
        })
      } catch {}
    }

    res.status(201).json({
      success: true,
      message: '用户创建成功',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    // 在删除前获取用户信息用于日志记录
    const userToDelete = await prisma.user.findUnique({
      where: { id },
      select: { id: true, username: true, email: true, role: true }
    });

    if (!userToDelete) {
      return next(new AppError('用户不存在', 404));
    }

    await prisma.user.delete({
      where: { id },
    });

    if (req.user) {
      try {
        await createLog({
          type: 'ADMIN_USER_DELETE',
          message: `管理员 ${req.user.id} 删除了用户 ${userToDelete.username} (${id})`,
          userId: req.user.id,
          targetUserId: id,
          context: extractClientContext(req),
          metadata: {
            deletedUser: {
              id: userToDelete.id,
              username: userToDelete.username,
              email: userToDelete.email,
              role: userToDelete.role
            }
          }
        })
      } catch {}
    }

    res.json({
      success: true,
      message: '删除用户成功',
    });
  } catch (error) {
    next(error);
  }
};

// 获取当前用户的已激活游戏列表
export const getMyGames = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) return next(new AppError('未认证', 401));

    // 根据激活码记录查询用户激活过的游戏
    const codes = await prisma.activationCode.findMany({
      where: { userId },
      include: {
        game: true
      },
      orderBy: { activatedAt: 'desc' }
    });

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const games = codes.map(c => ({
      id: c.game.id,
      title: c.game.name,
      description: c.game.description || '',
      coverImage: c.game.coverImage ? getFileAccessUrl(c.game.coverImage, baseUrl) : null,
      activatedAt: c.activatedAt ? c.activatedAt.toISOString() : ''
    }));

    res.json({
      success: true,
      message: '获取我的游戏成功',
      data: games
    });
  } catch (error) {
    next(error);
  }
};

// 获取用户已激活的游戏列表 (管理员权限)
export const getUserActivatedGames = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: userId } = req.params;

    const userGameActivations = await prisma.userGameActivation.findMany({
      where: { userId },
      include: {
        game: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { activatedAt: 'desc' }
    });

    const games = userGameActivations.map(activation => ({
      id: activation.id,
      gameId: activation.gameId,
      gameName: activation.game.name,
      activatedAt: activation.activatedAt.toISOString()
    }));

    res.json({
      success: true,
      message: '获取用户已激活游戏成功',
      data: games
    });
  } catch (error) {
    next(error);
  }
};

// 为用户激活游戏 (管理员权限)
export const activateGameForUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: userId } = req.params;
    const { gameId } = req.body;

    if (!gameId) {
      return next(new AppError('游戏ID不能为空', 400));
    }

    // 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return next(new AppError('用户不存在', 404));
    }

    // 检查游戏是否存在
    const game = await prisma.game.findUnique({
      where: { id: gameId }
    });

    if (!game) {
      return next(new AppError('游戏不存在', 404));
    }

    // 检查是否已经激活过
    const existingActivation = await prisma.userGameActivation.findUnique({
      where: {
        userId_gameId: {
          userId,
          gameId
        }
      }
    });

    if (existingActivation) {
      return next(new AppError('用户已经激活过此游戏', 400));
    }

    // 创建激活记录
    await prisma.$transaction(async (tx) => {
      await tx.userGameActivation.create({
        data: {
          userId,
          gameId,
          activatedAt: new Date()
        }
      });

      // 更新用户激活游戏数量
      await tx.user.update({
        where: { id: userId },
        data: { activatedGamesCount: { increment: 1 } }
      });

      // 更新游戏激活次数
      await tx.game.update({
        where: { id: gameId },
        data: { activationCount: { increment: 1 } }
      });

      // 创建日志
      if (req.user) {
        await tx.log.create({
          data: {
            type: 'ADMIN_USER_UPDATE',
            message: `管理员 ${req.user.id} 为用户 ${user.username} 激活了游戏 ${game.name}`,
            userId: req.user.id,
            targetUserId: userId,
            gameId: gameId,
            metadata: {
              action: 'activate_game',
              game: { id: game.id, name: game.name }
            }
          }
        });
      }
    });

    res.json({
      success: true,
      message: '游戏激活成功'
    });
  } catch (error) {
    next(error);
  }
};

// 为用户取消游戏激活 (管理员权限)
export const deactivateGameForUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: userId } = req.params;
    const { gameId } = req.body;

    if (!gameId) {
      return next(new AppError('游戏ID不能为空', 400));
    }

    // 检查激活记录是否存在
    const activation = await prisma.userGameActivation.findUnique({
      where: {
        userId_gameId: {
          userId,
          gameId
        }
      },
      include: {
        user: { select: { username: true } },
        game: { select: { name: true } }
      }
    });

    if (!activation) {
      return next(new AppError('用户没有激活此游戏', 400));
    }

    // 删除激活记录
    await prisma.$transaction(async (tx) => {
      await tx.userGameActivation.delete({
        where: {
          userId_gameId: {
            userId,
            gameId
          }
        }
      });

      // 更新用户激活游戏数量
      await tx.user.update({
        where: { id: userId },
        data: { activatedGamesCount: { decrement: 1 } }
      });

      // 更新游戏激活次数
      await tx.game.update({
        where: { id: gameId },
        data: { activationCount: { decrement: 1 } }
      });

      // 创建日志
      if (req.user) {
        await tx.log.create({
          data: {
            type: 'ADMIN_USER_UPDATE',
            message: `管理员 ${req.user.id} 为用户 ${activation.user.username} 取消了游戏 ${activation.game.name} 的激活`,
            userId: req.user.id,
            targetUserId: userId,
            gameId: gameId,
            metadata: {
              action: 'deactivate_game',
              game: { id: gameId, name: activation.game.name }
            }
          }
        });
      }
    });

    res.json({
      success: true,
      message: '游戏激活已取消'
    });
  } catch (error) {
    next(error);
  }
};

// 用户更新个人资料
export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return next(new AppError('用户未登录', 401));
    }

    const { username, email } = req.body;
    
    // 获取当前用户信息
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true, email: true }
    });
    
    if (!currentUser) {
      return next(new AppError('用户不存在', 404));
    }

    // 检查用户名和邮箱是否被其他用户使用
    if (username && username !== currentUser.username) {
      const existingUser = await prisma.user.findFirst({
        where: { username, id: { not: userId } }
      });
      if (existingUser) {
        return next(new AppError('用户名已存在', 400));
      }
    }

    if (email && email !== currentUser.email) {
      const existingUser = await prisma.user.findFirst({
        where: { email, id: { not: userId } }
      });
      if (existingUser) {
        return next(new AppError('邮箱已存在', 400));
      }
    }

    // 更新用户信息
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        username: username || currentUser.username,
        email: email || currentUser.email
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true
      }
    });

    // 记录日志
    try {
      const changes: string[] = [];
      if (username && username !== currentUser.username) {
        changes.push(`用户名: ${currentUser.username} -> ${username}`);
      }
      if (email && email !== currentUser.email) {
        changes.push(`邮箱: ${currentUser.email} -> ${email}`);
      }

      if (changes.length > 0) {
        await createLog({
          type: 'USER_PROFILE_UPDATE',
          message: `用户 ${updatedUser.username} 更新了个人资料: ${changes.join(', ')}`,
          userId: userId,
          context: extractClientContext(req),
          metadata: {
            changes: {
              username: { from: currentUser.username, to: username },
              email: { from: currentUser.email, to: email }
            },
            updatedFields: { username, email }
          }
        });
      }
    } catch (error) {
      console.error('Failed to log profile update:', error);
    }

    res.json({
      success: true,
      message: '个人资料更新成功',
      data: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

// 用户更改密码
export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return next(new AppError('用户未登录', 401));
    }

    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return next(new AppError('请提供当前密码和新密码', 400));
    }

    if (newPassword.length < 6) {
      return next(new AppError('新密码长度至少为6位', 400));
    }

    // 获取当前用户
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      return next(new AppError('用户不存在', 404));
    }

    // 验证当前密码
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return next(new AppError('当前密码错误', 400));
    }

    // 加密新密码
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // 更新密码
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword }
    });

    // 记录日志
    try {
      await createLog({
        type: 'USER_PASSWORD_CHANGE',
        message: `用户 ${user.username} 更改了密码`,
        userId: userId,
        context: extractClientContext(req),
        metadata: {
          username: user.username,
          changeTime: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Failed to log password change:', error);
    }

    res.json({
      success: true,
      message: '密码更改成功'
    });
  } catch (error) {
    next(error);
  }
};