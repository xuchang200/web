import { Request, Response, NextFunction } from 'express';
import { GameStatus } from '@prisma/client';
import { AppError } from '../utils/AppError';
import path from 'path';
import fs from 'fs/promises';
import fsSync from 'fs';
import { getFileAccessUrl, STORAGE_CONFIG, ensureDirectoryExists } from '../config/storage';
import { createLog, logValidGamePlay, logFileOperation } from '../services/logService';
import { extractClientContext } from '../utils/requestContext';
import prisma from '../lib/prisma';

// ==================== 辅助函数 ====================

/**
 * 处理游戏文件从临时目录移动到正式目录
 */
const moveGameFiles = async (tempPath: string, gameId: string): Promise<string> => {
  try {
    const finalPath = path.join(STORAGE_CONFIG.GAMES_PATH, `game_${gameId}`);
    
    // 确保目标目录存在
    ensureDirectoryExists(STORAGE_CONFIG.GAMES_PATH);
    
    // 如果目标目录已存在，先删除
    if (fsSync.existsSync(finalPath)) {
      await fs.rm(finalPath, { recursive: true, force: true });
    }
    
    // 移动文件夹
    await fs.rename(tempPath, finalPath);
    
    return `game_${gameId}`;
  } catch (error) {
    console.error('移动游戏文件失败:', error);
    throw new AppError('游戏文件处理失败', 500);
  }
};

/**
 * 删除游戏文件夹
 */
const deleteGameFiles = async (gamePath: string): Promise<void> => {
  try {
    const fullPath = path.join(STORAGE_CONFIG.GAMES_PATH, gamePath);
    if (fsSync.existsSync(fullPath)) {
      await fs.rm(fullPath, { recursive: true, force: true });
      console.log(`已删除游戏文件夹: ${fullPath}`);
    }
  } catch (error) {
    console.error('删除游戏文件夹失败:', error);
    // 不抛出错误，因为这是清理操作
  }
};

/**
 * 验证游戏文件夹是否包含 index.html
 */
const validateGameFolder = async (folderPath: string): Promise<boolean> => {
  try {
    const indexPath = path.join(folderPath, 'index.html');
    const stats = await fs.stat(indexPath);
    return stats.isFile();
  } catch {
    return false;
  }
};

/**
 * 格式化游戏数据
 */
const formatGameData = (game: any, baseUrl: string) => {
  return {
    id: game.id,
    name: game.name,
    description: game.description || '',
    path: game.path,
    coverImage: game.coverImage ? getFileAccessUrl(game.coverImage, baseUrl) : null,
    status: game.status,
    activationCount: game.activationCount,
    playCount: game.playCount,
    createdAt: game.createdAt.toISOString(),
    updatedAt: game.updatedAt.toISOString()
  };
};

// ==================== 管理员功能 ====================

/**
 * 获取游戏列表（管理员）
 * 支持分页、搜索、状态筛选
 */
export const getGamesForAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      page = '1',
      pageSize = '10',
      keyword = '',
      status = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const size = parseInt(pageSize as string, 10);
    const skip = (pageNum - 1) * size;

    // 构建查询条件
    const where: any = {};
    
    // 关键词搜索
    if (keyword) {
      where.OR = [
        { name: { contains: keyword as string } },
        { description: { contains: keyword as string } }
      ];
    }
    
    // 状态筛选
    if (status && Object.values(GameStatus).includes(status as GameStatus)) {
      where.status = status as GameStatus;
    }

    // 获取数据
    const [games, total] = await Promise.all([
      prisma.game.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          path: true,
          coverImage: true,
          status: true,
          activationCount: true,
          playCount: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              activationCodes: true
            }
          }
        },
        orderBy: {
          [sortBy as string]: sortOrder
        },
        skip,
        take: size
      }),
      prisma.game.count({ where })
    ]);

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const formattedGames = games.map(game => ({
      ...formatGameData(game, baseUrl),
      activationCodeCount: game._count.activationCodes
    }));

    res.json({
      success: true,
      message: '获取游戏列表成功',
      data: {
        games: formattedGames,
        pagination: {
          total,
          page: pageNum,
          pageSize: size,
          totalPages: Math.ceil(total / size)
        }
      }
    });
  } catch (error) {
    console.error('获取游戏列表失败:', error);
    next(new AppError('获取游戏列表失败', 500));
  }
};

/**
 * 获取单个游戏详情（管理员）
 */
export const getGameDetail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const game = await prisma.game.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            activationCodes: true,
            logs: true
          }
        }
      }
    });

    if (!game) {
      return next(new AppError('游戏不存在', 404));
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    res.json({
      success: true,
      message: '获取游戏详情成功',
      data: {
        ...formatGameData(game, baseUrl),
        statistics: {
          activationCodeCount: game._count.activationCodes,
          logCount: game._count.logs
        }
      }
    });
  } catch (error) {
    console.error('获取游戏详情失败:', error);
    next(new AppError('获取游戏详情失败', 500));
  }
};

/**
 * 创建新游戏
 */
export const createGame = async (req: Request, res: Response, next: NextFunction) => {
  let tempPath: string | null = null;
  let createdGameId: string | null = null;

  try {
    const { 
      name, 
      description, 
      coverImage,
      gameFileTempPath,
      status = 'DRAFT' 
    } = req.body;

    // 验证必填字段
    if (!name || !name.trim()) {
      return next(new AppError('游戏名称不能为空', 400));
    }

    // 检查游戏名称是否已存在
    const existingGame = await prisma.game.findUnique({
      where: { name: name.trim() }
    });

    if (existingGame) {
      return next(new AppError('游戏名称已存在', 400));
    }

    // 如果提供了临时游戏文件路径，验证文件夹
    if (gameFileTempPath) {
      tempPath = gameFileTempPath;
      const isValid = await validateGameFolder(gameFileTempPath);
      if (!isValid) {
        return next(new AppError('游戏文件夹必须包含 index.html 文件', 400));
      }
    }

    // 生成初始路径
    const initialPath = `game_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // 创建游戏记录
    const game = await prisma.game.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        path: initialPath,
        coverImage: coverImage || null,
        status: status as GameStatus,
        activationCount: 0,
        playCount: 0
      }
    });

    createdGameId = game.id;

    // 如果有游戏文件，移动到正式目录
    if (tempPath) {
      const finalPath = await moveGameFiles(tempPath, game.id);
      
      // 更新游戏路径
      await prisma.game.update({
        where: { id: game.id },
        data: { path: finalPath }
      });

      game.path = finalPath;
    }

    // 日志：管理员创建游戏
    if (req.user) {
      try {
        await createLog({
          type: 'ADMIN_GAME_CREATE',
          message: `管理员 ${req.user.id} 创建了游戏 "${game.name}" (${game.id})`,
          userId: req.user.id,
          gameId: game.id,
          context: extractClientContext(req),
          metadata: {
            gameName: game.name,
            gameDescription: game.description,
            gameStatus: game.status,
            gamePath: game.path,
            coverImage: game.coverImage,
            tempPath: tempPath
          }
        })
      } catch {}
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;

    res.status(201).json({
      success: true,
      message: '游戏创建成功',
      data: formatGameData(game, baseUrl)
    });
  } catch (error) {
    console.error('创建游戏失败:', error);
    
    // 清理已创建的数据
    if (createdGameId) {
      try {
        await prisma.game.delete({ where: { id: createdGameId } });
      } catch (deleteError) {
        console.error('清理游戏记录失败:', deleteError);
      }
    }

    // 清理临时文件
    if (tempPath && fsSync.existsSync(tempPath)) {
      try {
        await fs.rm(tempPath, { recursive: true, force: true });
      } catch (cleanupError) {
        console.error('清理临时文件失败:', cleanupError);
      }
    }

    next(error instanceof AppError ? error : new AppError('创建游戏失败', 500));
  }
};

/**
 * 更新游戏信息
 */
export const updateGame = async (req: Request, res: Response, next: NextFunction) => {
  let tempPath: string | null = null;
  let oldGamePath: string | null = null;

  try {
    const { id } = req.params;
    const { 
      name, 
      description, 
      coverImage,
      gameFileTempPath,
      status 
    } = req.body;

    // 查找游戏
    const existingGame = await prisma.game.findUnique({
      where: { id }
    });

    if (!existingGame) {
      return next(new AppError('游戏不存在', 404));
    }

    // 构建更新数据
    const updateData: any = {};

    // 更新游戏名称
    if (name && name.trim() !== existingGame.name) {
      // 检查新名称是否已存在
      const duplicateGame = await prisma.game.findUnique({
        where: { name: name.trim() }
      });

      if (duplicateGame && duplicateGame.id !== id) {
        return next(new AppError('游戏名称已存在', 400));
      }

      updateData.name = name.trim();
    }

    // 更新描述
    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    // 更新封面
    if (coverImage !== undefined) {
      updateData.coverImage = coverImage || null;
    }

    // 更新状态
    if (status && Object.values(GameStatus).includes(status)) {
      updateData.status = status;
    }

    // 如果提供了新的游戏文件
    if (gameFileTempPath) {
      tempPath = gameFileTempPath;
      
      // 验证新文件夹
      const isValid = await validateGameFolder(gameFileTempPath);
      if (!isValid) {
        return next(new AppError('游戏文件夹必须包含 index.html 文件', 400));
      }

      // 保存旧路径用于清理
      oldGamePath = existingGame.path;

      // 移动新文件到正式目录
      const newPath = await moveGameFiles(gameFileTempPath, id);
      updateData.path = newPath;

      // 删除旧的游戏文件
      if (oldGamePath && oldGamePath !== newPath) {
        await deleteGameFiles(oldGamePath);
      }
    }

    // 更新游戏
    const updatedGame = await prisma.game.update({
      where: { id },
      data: updateData
    });

    // 日志：管理员更新游戏
    if (req.user) {
      try {
        await createLog({
          type: 'ADMIN_GAME_UPDATE',
          message: `管理员 ${req.user.id} 更新了游戏 "${updatedGame.name}" (${id})`,
          userId: req.user.id,
          gameId: id,
          context: extractClientContext(req),
          metadata: {
            updatedFields: updateData,
            previousData: {
              name: existingGame.name,
              description: existingGame.description,
              status: existingGame.status,
              path: existingGame.path,
              coverImage: existingGame.coverImage
            },
            newData: {
              name: updatedGame.name,
              description: updatedGame.description,
              status: updatedGame.status,
              path: updatedGame.path,
              coverImage: updatedGame.coverImage
            },
            filesChanged: !!gameFileTempPath,
            oldGamePath
          }
        })
      } catch {}
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;

    res.json({
      success: true,
      message: '游戏更新成功',
      data: formatGameData(updatedGame, baseUrl)
    });
  } catch (error) {
    console.error('更新游戏失败:', error);

    // 清理临时文件
    if (tempPath && fsSync.existsSync(tempPath)) {
      try {
        await fs.rm(tempPath, { recursive: true, force: true });
      } catch (cleanupError) {
        console.error('清理临时文件失败:', cleanupError);
      }
    }

    next(error instanceof AppError ? error : new AppError('更新游戏失败', 500));
  }
};

/**
 * 删除游戏
 */
export const deleteGame = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // 查找游戏
    const game = await prisma.game.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            activationCodes: true
          }
        }
      }
    });

    if (!game) {
      return next(new AppError('游戏不存在', 404));
    }

    // 检查是否有关联的激活码
    if (game._count.activationCodes > 0) {
      return next(new AppError(`无法删除游戏，存在 ${game._count.activationCodes} 个相关的激活码`, 400));
    }

    // 使用事务确保数据一致性
    await prisma.$transaction(async (tx) => {
      // 1. 先记录日志（在删除之前）
      if (req.user) {
        await tx.log.create({
          data: {
            type: 'ADMIN_GAME_DELETE',
            message: `管理员 ${req.user.id} 删除了游戏 "${game.name}" (${id})`,
            userId: req.user.id,
            gameId: id,
            ip: extractClientContext(req).ip,
            userAgent: extractClientContext(req).userAgent,
            metadata: {
              deletedGame: {
                id: game.id,
                name: game.name,
                description: game.description,
                path: game.path,
                coverImage: game.coverImage,
                status: game.status,
                activationCount: game.activationCount,
                playCount: game.playCount,
                createdAt: game.createdAt.toISOString()
              },
              activationCodesCount: game._count.activationCodes
            }
          }
        });
      }

      // 2. 删除游戏记录
      await tx.game.delete({
        where: { id }
      });
    });

    // 3. 删除文件（在事务外进行，避免文件操作影响数据库事务）
    try {
      if (game.path) {
        await deleteGameFiles(game.path);
      }

      if (game.coverImage) {
        const coverPath = path.join(STORAGE_CONFIG.COVERS_PATH, game.coverImage);
        if (fsSync.existsSync(coverPath)) {
          await fs.unlink(coverPath);
        }
      }
    } catch (fileError) {
      console.error('删除游戏文件失败:', fileError);
      // 文件删除失败不影响整体操作，但要记录错误
    }

    res.json({
      success: true,
      message: '游戏删除成功'
    });
  } catch (error) {
    console.error('删除游戏失败:', error);
    next(new AppError('删除游戏失败', 500));
  }
};

/**
 * 批量删除游戏
 */
export const deleteGames = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return next(new AppError('请提供要删除的游戏ID列表', 400));
    }

    // 查找所有要删除的游戏
    const games = await prisma.game.findMany({
      where: {
        id: { in: ids }
      },
      include: {
        _count: {
          select: {
            activationCodes: true
          }
        }
      }
    });

    // 检查是否有游戏存在激活码
    const gamesWithCodes = games.filter(game => game._count.activationCodes > 0);
    if (gamesWithCodes.length > 0) {
      const names = gamesWithCodes.map(g => g.name).join(', ');
      return next(new AppError(`以下游戏存在激活码，无法删除: ${names}`, 400));
    }

    // 批量删除游戏记录
    const deleteResult = await prisma.game.deleteMany({
      where: {
        id: { in: ids }
      }
    });

    // 异步删除游戏文件和封面（不等待完成）
    Promise.all(games.map(async (game) => {
      // 删除游戏文件夹
      if (game.path) {
        await deleteGameFiles(game.path);
      }
      
      // 删除封面图片
      if (game.coverImage) {
        try {
          const coverPath = path.join(STORAGE_CONFIG.COVERS_PATH, game.coverImage);
          if (fsSync.existsSync(coverPath)) {
            await fs.unlink(coverPath);
          }
        } catch (error) {
          console.error(`删除封面图片失败 ${game.coverImage}:`, error);
        }
      }
    })).catch(error => {
      console.error('清理游戏文件时出错:', error);
    });

    // 日志：管理员批量删除游戏
    if (req.user) {
      try {
        await createLog({
          type: 'ADMIN_GAME_DELETE',
          message: `管理员 ${req.user.id} 批量删除了 ${deleteResult.count} 个游戏: ${games.map((g: any) => g.name).join(', ')}`,
          userId: req.user.id,
          context: extractClientContext(req),
          metadata: { 
            requestedIds: ids,
            deletedGames: games.map(g => ({
              id: g.id,
              name: g.name,
              path: g.path,
              activationCount: g.activationCount
            })),
            deletedCount: deleteResult.count
          }
        })
      } catch {}
    }

    res.json({
      success: true,
      message: `成功删除 ${deleteResult.count} 个游戏`
    });
  } catch (error) {
    console.error('批量删除游戏失败:', error);
    next(new AppError('批量删除游戏失败', 500));
  }
};

/**
 * 切换游戏状态（发布/下架）
 */
export const toggleGameStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const game = await prisma.game.findUnique({
      where: { id }
    });

    if (!game) {
      return next(new AppError('游戏不存在', 404));
    }

    const newStatus = game.status === GameStatus.PUBLISHED ? GameStatus.DRAFT : GameStatus.PUBLISHED;

    const updatedGame = await prisma.game.update({
      where: { id },
      data: { status: newStatus }
    });

    if (req.user) {
      try {
        await createLog({
          type: 'ADMIN_GAME_UPDATE',
          message: `管理员 ${req.user.id} 将游戏 "${game.name}" 状态从 ${game.status} 变更为 ${newStatus}`,
          userId: req.user.id,
          gameId: id,
          context: extractClientContext(req),
          metadata: {
            gameName: game.name,
            previousStatus: game.status,
            newStatus: newStatus,
            action: 'status_toggle'
          }
        })
      } catch {}
    }

    res.json({
      success: true,
      message: `游戏已${newStatus === GameStatus.PUBLISHED ? '发布' : '下架'}`,
      data: {
        id: updatedGame.id,
        name: updatedGame.name,
        status: updatedGame.status
      }
    });
  } catch (error) {
    console.error('切换游戏状态失败:', error);
    next(new AppError('切换游戏状态失败', 500));
  }
};

// ==================== 公共功能 ====================

/**
 * 获取已发布游戏列表（普通用户）
 */
export const getPublishedGames = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      page = '1',
      pageSize = '12',
      keyword = ''
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const size = parseInt(pageSize as string, 10);
    const skip = (pageNum - 1) * size;

    // 构建查询条件 - 只显示已发布的游戏
    const where: any = {
      status: GameStatus.PUBLISHED
    };
    
    if (keyword) {
      where.OR = [
        { name: { contains: keyword as string } },
        { description: { contains: keyword as string } }
      ];
    }

    const [games, total] = await Promise.all([
      prisma.game.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          path: true,
          coverImage: true,
          playCount: true,
          createdAt: true
        },
        orderBy: {
          playCount: 'desc' // 按播放次数排序
        },
        skip,
        take: size
      }),
      prisma.game.count({ where })
    ]);

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const formattedGames = games.map(game => ({
      id: game.id,
      name: game.name,
      description: game.description || '',
      coverImage: game.coverImage ? getFileAccessUrl(game.coverImage, baseUrl) : null,
      playCount: game.playCount,
      createdAt: game.createdAt.toISOString()
    }));

    res.json({
      success: true,
      message: '获取游戏列表成功',
      data: {
        games: formattedGames,
        pagination: {
          total,
          page: pageNum,
          pageSize: size,
          totalPages: Math.ceil(total / size)
        }
      }
    });
  } catch (error) {
    console.error('获取已发布游戏列表失败:', error);
    next(new AppError('获取游戏列表失败', 500));
  }
};

/**
 * 增加游戏播放次数
 */
export const incrementPlayCount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { isTest, playDuration } = req.body;
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;

    console.log(`incrementPlayCount 调用 - 游戏ID: ${id}, 用户ID: ${userId}, 游玩时长: ${playDuration}秒, 测试模式: ${isTest}`);

    const game = await prisma.game.findUnique({
      where: { id }
    });

    if (!game) {
      return next(new AppError('游戏不存在', 404));
    }

    // 管理员可以测试所有游戏，无论发布状态
    if (userRole === 'ADMIN') {
      // 管理员测试模式处理
      if (isTest) {
        console.log('管理员测试模式，不计入播放次数');
        return res.json({
          success: true,
          message: '管理员测试模式，不计入播放次数',
          data: {
            id: game.id,
            playCount: game.playCount,
            isTest: true
          }
        });
      }
      // 管理员正常游玩模式，继续执行后续逻辑
    } else {
      // 非管理员用户，必须是已发布的游戏
      if (game.status !== GameStatus.PUBLISHED) {
        return next(new AppError('游戏未发布', 403));
      }
    }

    // 检查是否为测试模式
    if (isTest) {
      // 只有管理员可以使用测试模式
      if (userRole !== 'ADMIN') {
        return next(new AppError('无权限进行测试', 403));
      }
      
      console.log('管理员测试模式，不计入播放次数');
      return res.json({
        success: true,
        message: '管理员测试模式，不计入播放次数',
        data: {
          id: game.id,
          playCount: game.playCount,
          isTest: true
        }
      });
    }

    // 检查游玩时长是否满足1分钟（60秒）
    if (!playDuration || playDuration < 60) {
      console.log(`游玩时长不足1分钟 (${playDuration}秒)，不计入播放次数`);
      return res.json({
        success: true,
        message: '游玩时长不足1分钟，不计入播放次数',
        data: {
          id: game.id,
          playCount: game.playCount,
          insufficientDuration: true
        }
      });
    }

    console.log('开始更新播放次数和记录日志');
    const updatedGame = await prisma.game.update({
      where: { id },
      data: {
        playCount: {
          increment: 1
        }
      }
    });

    // 记录有效游戏游玩日志
    try {
      const user = (req as any).user;
      await logValidGamePlay(
        user.id,
        user.username,
        game.id,
        game.name,
        playDuration,
        extractClientContext(req)
      );
      console.log('有效游戏游玩日志记录成功');
    } catch (logError) {
      console.error('记录游戏游玩日志失败:', logError);
    }

    res.json({
      success: true,
      message: '播放次数更新成功',
      data: {
        id: updatedGame.id,
        playCount: updatedGame.playCount
      }
    });
  } catch (error) {
    console.error('更新播放次数失败:', error);
    next(new AppError('更新播放次数失败', 500));
  }
};

/**
 * 验证用户是否有游戏访问权限
 */
export const checkGameAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;

    if (!userId) {
      return next(new AppError('用户未登录', 401));
    }

    // 获取完整的用户信息
    const fullUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true }
    });

    if (!fullUser) {
      return next(new AppError('用户不存在', 401));
    }

    const game = await prisma.game.findUnique({
      where: { id }
    });

    if (!game) {
      return next(new AppError('游戏不存在', 404));
    }

    // 管理员可以访问所有游戏，无论发布状态
    if (userRole === 'ADMIN') {
      console.log('管理员访问游戏，跳过发布状态和激活检查');
      return res.json({
        success: true,
        message: '管理员访问权限验证通过',
        data: {
          gameId: game.id,
          gameName: game.name,
          gamePath: game.path,
          hasAccess: true,
          isAdmin: true
        }
      });
    }

    if (game.status !== GameStatus.PUBLISHED) {
      return next(new AppError('游戏未发布', 403));
    }

    // 检查用户是否有激活该游戏的权限（这是商业化的核心逻辑）
    const userGameActivation = await prisma.userGameActivation.findUnique({
      where: {
        userId_gameId: {
          userId: userId,
          gameId: id
        }
      }
    });

    if (!userGameActivation) {
      return next(new AppError('您没有访问该游戏的权限，请先激活游戏', 403));
    }

    res.json({
      success: true,
      message: '访问权限验证通过',
      data: {
        gameId: game.id,
        gameName: game.name,
        gamePath: game.path,
        hasAccess: true
      }
    });
  } catch (error) {
    console.error('验证游戏访问权限失败:', error);
    next(new AppError('验证访问权限失败', 500));
  }
};