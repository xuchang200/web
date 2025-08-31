const express = require('express');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { protect, admin } = require('../middleware/authMiddleware');
const ActivationCode = require('../models/ActivationCode');
const Game = require('../models/Game');
const Permission = require('../models/Permission');
const User = require('../models/User');

const router = express.Router();

// Helper function to generate activation code
const generateActivationCode = (length = 12) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// --- Admin Routes ---

// POST /api/activation/generate - Generate activation codes (admin only)
router.post('/generate', protect, admin, async (req, res) => {
  const { gameId, quantity = 1, expiresInDays } = req.body;

  if (!gameId) {
    return res.status(400).json({ message: '请选择游戏' });
  }

  if (quantity < 1 || quantity > 100) {
    return res.status(400).json({ message: '生成数量必须在1-100之间' });
  }

  try {
    // Verify game exists
    const game = await Game.findByPk(gameId);
    if (!game) {
      return res.status(404).json({ message: '游戏不存在' });
    }

    const batchId = crypto.randomUUID();
    const codes = [];
    const expiresAt = expiresInDays ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000) : null;

    // Generate unique codes
    for (let i = 0; i < quantity; i++) {
      let code;
      let isUnique = false;
      let attempts = 0;

      // Ensure code uniqueness
      while (!isUnique && attempts < 10) {
        code = generateActivationCode();
        const existingCode = await ActivationCode.findOne({ where: { code } });
        if (!existingCode) {
          isUnique = true;
        }
        attempts++;
      }

      if (!isUnique) {
        throw new Error('生成唯一激活码失败，请重试');
      }

      codes.push({
        code,
        gameId,
        batchId,
        expiresAt
      });
    }

    // Bulk create activation codes
    const createdCodes = await ActivationCode.bulkCreate(codes);

    res.status(201).json({
      message: `成功生成${quantity}个激活码`,
      batchId,
      gameTitle: game.title,
      codes: createdCodes.map(c => ({
        id: c.id,
        code: c.code,
        expiresAt: c.expiresAt
      }))
    });

  } catch (error) {
    console.error('生成激活码失败:', error);
    res.status(500).json({ message: error.message || '生成激活码失败' });
  }
});

// GET /api/activation/codes - Get activation codes with filters (admin only)
router.get('/codes', protect, admin, async (req, res) => {
  const { gameId, isUsed, batchId, page = 1, limit = 20 } = req.query;

  try {
    const where = {};
    if (gameId) where.gameId = gameId;
    if (isUsed !== undefined) where.isUsed = isUsed === 'true';
    if (batchId) where.batchId = batchId;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await ActivationCode.findAndCountAll({
      where,
      include: [
        {
          model: Game,
          as: 'game',
          attributes: ['id', 'title']
        },
        {
          model: User,
          as: 'usedByUser',
          attributes: ['id', 'username'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      codes: rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / parseInt(limit)),
        totalCodes: count,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('获取激活码列表失败:', error);
    res.status(500).json({ message: '获取激活码列表失败' });
  }
});

// DELETE /api/activation/codes/:id - Delete activation code (admin only)
router.delete('/codes/:id', protect, admin, async (req, res) => {
  try {
    const code = await ActivationCode.findByPk(req.params.id);
    if (!code) {
      return res.status(404).json({ message: '激活码不存在' });
    }

    if (code.isUsed) {
      return res.status(400).json({ message: '已使用的激活码无法删除' });
    }

    await code.destroy();
    res.json({ message: '激活码删除成功' });

  } catch (error) {
    console.error('删除激活码失败:', error);
    res.status(500).json({ message: '删除激活码失败' });
  }
});

// DELETE /api/activation/batch/:batchId - Delete batch of activation codes (admin only)
router.delete('/batch/:batchId', protect, admin, async (req, res) => {
  try {
    const usedCount = await ActivationCode.count({
      where: { batchId: req.params.batchId, isUsed: true }
    });

    if (usedCount > 0) {
      return res.status(400).json({ 
        message: `批次中有${usedCount}个已使用的激活码，无法删除整个批次` 
      });
    }

    const deletedCount = await ActivationCode.destroy({
      where: { batchId: req.params.batchId, isUsed: false }
    });

    res.json({ 
      message: `成功删除${deletedCount}个未使用的激活码`,
      deletedCount
    });

  } catch (error) {
    console.error('删除批次激活码失败:', error);
    res.status(500).json({ message: '删除批次激活码失败' });
  }
});

// --- User Routes ---

// POST /api/activation/activate - Activate game with code (protected)
router.post('/activate', protect, async (req, res) => {
  const { code } = req.body;

  if (!code || !code.trim()) {
    return res.status(400).json({ message: '请输入激活码' });
  }

  try {
    const activationCode = await ActivationCode.findOne({
      where: { code: code.trim().toUpperCase() },
      include: [
        {
          model: Game,
          as: 'game',
          attributes: ['id', 'title', 'status']
        }
      ]
    });

    if (!activationCode) {
      return res.status(400).json({ message: '激活码不存在' });
    }

    if (activationCode.isUsed) {
      return res.status(400).json({ message: '激活码已被使用' });
    }

    if (activationCode.expiresAt && new Date() > activationCode.expiresAt) {
      return res.status(400).json({ message: '激活码已过期' });
    }

    const game = activationCode.game;
    if (!game) {
      return res.status(400).json({ message: '关联的游戏不存在' });
    }

    // Check if user already has permission for this game
    const existingPermission = await Permission.findOne({
      where: { userId: req.user.id, gameId: game.id }
    });

    if (existingPermission) {
      return res.status(400).json({ message: '您已经拥有此游戏的权限' });
    }

    // Create permission and mark code as used
    await Permission.create({
      userId: req.user.id,
      gameId: game.id
    });

    await activationCode.update({
      isUsed: true,
      usedByUserId: req.user.id,
      usedAt: new Date()
    });

    res.status(200).json({
      message: `成功激活游戏：${game.title}`,
      game: {
        id: game.id,
        title: game.title
      }
    });

  } catch (error) {
    console.error('激活游戏失败:', error);
    res.status(500).json({ message: '激活游戏失败，请重试' });
  }
});

// GET /api/activation/my-games - Get user's activated games (protected)
router.get('/my-games', protect, async (req, res) => {
  try {
    const permissions = await Permission.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: Game,
          as: 'game',
          attributes: ['id', 'title', 'description', 'coverImageUrl', 'status', 'version']
        }
      ],
      order: [['grantedAt', 'DESC']]
    });

    const games = permissions.map(p => ({
      ...p.game.toJSON(),
      grantedAt: p.grantedAt
    }));

    res.json(games);

  } catch (error) {
    console.error('获取用户游戏失败:', error);
    res.status(500).json({ message: '获取用户游戏失败' });
  }
});

module.exports = router;