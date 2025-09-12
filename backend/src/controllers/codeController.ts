import { Request, Response, NextFunction } from 'express';
import { CodeStatus, LogType } from '@prisma/client';
import { AppError } from '../utils/AppError';
import { createLog, logCodeActivation } from '../services/logService';
import { extractClientContext } from '../utils/requestContext';
import prisma from '../lib/prisma';

// 列表查询（支持关键词、状态、按游戏筛选、分页）
export const listActivationCodes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      page = '1',
      pageSize = '10',
      keyword = '',
      gameId = '',
      status = ''
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const size = parseInt(pageSize as string, 10);
    const skip = (pageNum - 1) * size;

    const where: any = {};

    if (keyword && typeof keyword === 'string') {
      where.code = { contains: keyword.toUpperCase() };
    }

    if (gameId && typeof gameId === 'string') {
      where.gameId = gameId;
    }

    if (status && typeof status === 'string') {
      if (status === 'UNUSED') where.status = CodeStatus.UNUSED;
      if (status === 'USED' || status === 'ACTIVATED') where.status = CodeStatus.ACTIVATED;
    }

    const [codes, total] = await Promise.all([
      prisma.activationCode.findMany({
        where,
        include: {
          game: { select: { id: true, name: true } },
          user: { select: { id: true, username: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: size,
      }),
      prisma.activationCode.count({ where })
    ]);

    const data = codes.map((c) => ({
      id: c.id,
      code: c.code,
      gameId: c.gameId,
      gameTitle: c.game?.name || '',
      status: c.status === CodeStatus.UNUSED ? 'UNUSED' : 'USED',
      userId: c.userId || undefined,
      username: c.user?.username || undefined,
      createdAt: c.createdAt.toISOString(),
      activatedAt: c.activatedAt ? c.activatedAt.toISOString() : undefined,
    }));

    res.json({
      success: true,
      message: '获取激活码列表成功',
      data: {
        items: data,
        pagination: {
          total,
          page: pageNum,
          pageSize: size,
          totalPages: Math.ceil(total / size)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// 批量生成激活码
export const generateActivationCodes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { gameIds, count, pattern = 'RANDOM', prefix = '' } = req.body as {
      gameIds: string[];
      count: number;
      pattern?: 'RANDOM' | 'PREFIX';
      prefix?: string;
    };

    if (!Array.isArray(gameIds) || gameIds.length === 0) {
      return next(new AppError('请选择至少一个游戏', 400));
    }
    if (!count || typeof count !== 'number' || count <= 0 || count > 1000) {
      return next(new AppError('生成数量不合法（1-1000）', 400));
    }

    // 校验游戏是否存在
    const existGames = await prisma.game.findMany({ where: { id: { in: gameIds } }, select: { id: true } });
    const existIds = new Set(existGames.map(g => g.id));
    for (const gid of gameIds) {
      if (!existIds.has(gid)) {
        return next(new AppError(`游戏不存在: ${gid}`, 400));
      }
    }

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const genOne = (): string => {
      if (pattern === 'PREFIX' && prefix) {
        let result = prefix.toUpperCase() + '-';
        for (let i = 0; i < 3; i++) {
          if (i > 0) result += '-';
          for (let j = 0; j < 4; j++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
          }
        }
        return result;
      }
      let result = '';
      for (let i = 0; i < 4; i++) {
        if (i > 0) result += '-';
        for (let j = 0; j < 4; j++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
      }
      return result;
    };

    // 为每个游戏分别生成 count 个激活码
    const toCreate: { code: string; gameId: string; status: CodeStatus }[] = [];
    for (const gid of gameIds) {
      for (let i = 0; i < count; i++) {
        toCreate.push({ code: genOne(), gameId: gid, status: CodeStatus.UNUSED });
      }
    }

    // 处理唯一约束冲突：重试生成
    const createdCodes: { code: string; gameId: string }[] = [];
    for (const item of toCreate) {
      let attempts = 0;
      while (attempts < 5) {
        try {
          const created = await prisma.activationCode.create({ data: item });
          createdCodes.push({ code: created.code, gameId: item.gameId });
          break;
        } catch (e: any) {
          // 若唯一键冲突，重新生成一次后再试
          if (e && typeof e.code === 'string') {
            item.code = genOne();
            attempts += 1;
            continue;
          }
          throw e;
        }
      }
    }

    // 日志：管理员生成激活码 - 为每个游戏记录
    if (req.user) {
      try {
        // 获取游戏信息用于日志记录
        const games = await prisma.game.findMany({
          where: { id: { in: gameIds } },
          select: { id: true, name: true }
        });
        
        for (const gameId of gameIds) {
          const codesForThisGame = createdCodes.filter(item => item.gameId === gameId);
          const gameName = games.find(g => g.id === gameId)?.name || 'Unknown';
          
          await createLog({
            type: LogType.ADMIN_CODE_CREATE,
            message: `管理员 ${req.user.id} 为游戏 "${gameName}" (${gameId}) 生成了 ${codesForThisGame.length} 个激活码`,
            userId: req.user.id,
            gameId: gameId,
            context: extractClientContext(req),
            metadata: { 
              gameId,
              gameName,
              requestedCount: count, 
              actualGenerated: codesForThisGame.length,
              pattern,
              prefix: pattern === 'PREFIX' ? prefix : undefined,
              generatedCodes: codesForThisGame.map(item => item.code)
            }
          });
        }
      } catch (error) {
        console.error('Failed to log activation code generation:', error);
      }
    }

    res.status(201).json({
      success: true,
      message: '激活码生成成功',
      data: { codes: createdCodes.map(item => item.code) }
    });
  } catch (error) {
    next(error);
  }
};

// 作废（删除）激活码，现在允许删除已使用的激活码
export const revokeActivationCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const code = await prisma.activationCode.findUnique({ 
      where: { id },
      include: {
        game: { select: { id: true, name: true } },
        user: { select: { id: true, username: true } }
      }
    });
    if (!code) return next(new AppError('激活码不存在', 404));

    // 使用事务确保数据一致性
    await prisma.$transaction(async (tx: any) => {
      // 1. 先记录日志（在删除之前）
      if (req.user) {
        const statusText = code.status === CodeStatus.ACTIVATED ? '已使用' : '未使用';
        const userInfo = code.user ? ` (曾被用户 ${code.user.username} 使用)` : '';
        
        await tx.log.create({
          data: {
            type: 'ADMIN_CODE_DELETE',
            message: `管理员 ${req.user.id} 删除了游戏 "${code.game?.name || '未知'}" (${code.gameId}) 的${statusText}激活码 "${code.code}"${userInfo}`,
            userId: req.user.id,
            activationCodeId: id,
            gameId: code.gameId,
            ip: extractClientContext(req).ip,
            userAgent: extractClientContext(req).userAgent,
            metadata: { 
              deletedCode: {
                id: code.id,
                code: code.code,
                status: code.status,
                createdAt: code.createdAt.toISOString(),
                activatedAt: code.activatedAt ? code.activatedAt.toISOString() : undefined,
                userId: code.userId,
                username: code.user?.username
              },
              game: {
                id: code.gameId,
                name: code.game?.name || 'Unknown'
              }
            }
          }
        });
      }

      // 2. 删除激活码
      await tx.activationCode.delete({ where: { id } });
    });

    res.json({ success: true, message: '激活码已删除' });
  } catch (error) {
    next(error);
  }
};

// 批量删除激活码（现在可以删除已使用的激活码）
export const batchDeleteActivationCodes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ids } = req.body as { ids: string[] };
    if (!Array.isArray(ids) || ids.length === 0) {
      return next(new AppError('请提供要删除的激活码ID列表', 400));
    }

    const codes = await prisma.activationCode.findMany({
      where: { id: { in: ids } },
      include: {
        game: { select: { id: true, name: true } },
        user: { select: { id: true, username: true } }
      }
    });

    // 现在删除所有找到的激活码，不再过滤状态
    const deletableIds = codes.map((c: any) => c.id);
    const usedCodes = codes.filter((c: any) => c.status === CodeStatus.ACTIVATED);
    const unusedCodes = codes.filter((c: any) => c.status === CodeStatus.UNUSED);

    // 使用事务确保数据一致性
    await prisma.$transaction(async (tx: any) => {
      // 1. 先记录日志（在删除之前）
      if (req.user) {
        await tx.log.create({
          data: {
            type: 'ADMIN_CODE_DELETE',
            message: `管理员 ${req.user.id} 批量删除了 ${deletableIds.length} 个激活码 (${usedCodes.length} 个已使用, ${unusedCodes.length} 个未使用)`,
            userId: req.user.id,
            ip: extractClientContext(req).ip,
            userAgent: extractClientContext(req).userAgent,
            metadata: { 
              requested: ids.length, 
              deleted: deletableIds.length, 
              usedCount: usedCodes.length,
              unusedCount: unusedCodes.length,
              deletedCodes: codes.map((c: any) => ({
                id: c.id,
                code: c.code,
                gameId: c.gameId,
                gameName: c.game?.name || 'Unknown',
                status: c.status,
                createdAt: c.createdAt.toISOString(),
                activatedAt: c.activatedAt ? c.activatedAt.toISOString() : undefined,
                userId: c.userId,
                username: c.user?.username
              })),
              requestedIds: ids
            }
          }
        });
      }

      // 2. 删除激活码
      await tx.activationCode.deleteMany({
        where: { id: { in: deletableIds } }
      });
    });

    res.json({
      success: true,
      message: `已删除 ${deletableIds.length} 个激活码 (其中 ${usedCodes.length} 个已使用，${unusedCodes.length} 个未使用)`,
      data: {
        requested: ids.length,
        deleted: deletableIds.length,
        usedCount: usedCodes.length,
        unusedCount: unusedCodes.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// 用户使用激活码
export const activateByUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.body as { code: string };
    const user = req.user;
    if (!user) return next(new AppError('未认证', 401));
    if (!code || !code.trim()) return next(new AppError('激活码不能为空', 400));

    // 获取完整的用户信息
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, username: true, email: true }
    });

    if (!fullUser) return next(new AppError('用户不存在', 401));

    const found = await prisma.activationCode.findUnique({
      where: { code: code.trim().toUpperCase() },
      include: { game: true }
    });

    if (!found) {
      // 记录激活码不存在的日志
      await logCodeActivation(
        fullUser.id,
        fullUser.username,
        code.trim().toUpperCase(),
        '',
        '',
        '',
        'NOT_FOUND',
        extractClientContext(req)
      );
      return next(new AppError('激活码不存在', 400));
    }

    if (found.status !== CodeStatus.UNUSED) {
      // 记录激活码已被使用的日志
      await logCodeActivation(
        fullUser.id,
        fullUser.username,
        code.trim().toUpperCase(),
        found.gameId,
        found.game?.name || 'Unknown',
        found.id,
        'ALREADY_USED',
        extractClientContext(req)
      );
      return next(new AppError('激活码已被使用', 400));
    }

    const updated = await prisma.$transaction(async (tx) => {
      // 检查用户是否已经激活过此游戏
      const existingActivation = await tx.userGameActivation.findUnique({
        where: {
          userId_gameId: {
            userId: fullUser.id,
            gameId: found.gameId
          }
        }
      });

      // 如果已经激活过，不允许重复激活
      if (existingActivation) {
        throw new AppError('您已经激活过此游戏', 400);
      }

      // 更新激活码状态
      const used = await tx.activationCode.update({
        where: { id: found.id },
        data: {
          status: CodeStatus.ACTIVATED,
          userId: fullUser.id,
          activatedAt: new Date(),
        }
      });

      // 创建用户游戏激活记录
      await tx.userGameActivation.create({
        data: {
          userId: fullUser.id,
          gameId: found.gameId,
          activationCodeId: found.id,
          activatedAt: new Date()
        }
      });

      // 更新游戏激活次数
      await tx.game.update({
        where: { id: found.gameId },
        data: { activationCount: { increment: 1 } }
      });

      // 更新用户激活游戏数量
      await tx.user.update({
        where: { id: fullUser.id },
        data: { activatedGamesCount: { increment: 1 } }
      });

      return used;
    });

    // 在事务外记录成功激活日志，包含更详细的信息
    await logCodeActivation(
      fullUser.id,
      fullUser.username,
      code.trim().toUpperCase(),
      found.gameId,
      found.game?.name || 'Unknown',
      found.id,
      'SUCCESS',
      extractClientContext(req)
    );

    res.json({
      success: true,
      message: '游戏激活成功',
      data: {
        code: updated.code,
        game: {
          id: found.game.id,
          name: found.game.name
        }
      }
    });
  } catch (error) {
    next(error);
  }
};


