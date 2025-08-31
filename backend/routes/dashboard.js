
const express = require('express');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { protect, admin } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Game = require('../models/Game');
const ActivationCode = require('../models/ActivationCode');
const Permission = require('../models/Permission');

const router = express.Router();

// GET /api/dashboard/stats - Get dashboard statistics (admin only)
router.get('/stats', protect, admin, async (req, res) => {
  try {
    // Basic counts
    const totalUsers = await User.count({ where: { status: 'active' } });
    const totalGames = await Game.count();
    const publishedGames = await Game.count({ where: { status: 'published' } });
    const totalActivationCodes = await ActivationCode.count();
    const usedActivationCodes = await ActivationCode.count({ where: { isUsed: true } });

    // Recent registrations (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentRegistrations = await User.count({
      where: {
        createdAt: { [Op.gte]: sevenDaysAgo },
        status: 'active'
      }
    });

    // Active users (logged in within last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const activeUsers = await User.count({
      where: {
        lastLoginAt: { [Op.gte]: thirtyDaysAgo },
        status: 'active'
      }
    });

    // Most popular games (by download count)
    const popularGames = await Game.findAll({
      where: { status: 'published' },
      attributes: ['id', 'title', 'downloadCount'],
      order: [['downloadCount', 'DESC']],
      limit: 5
    });

    // Recent game activations (last 7 days)
    const recentActivations = await ActivationCode.count({
      where: {
        isUsed: true,
        usedAt: { [Op.gte]: sevenDaysAgo }
      }
    });

    // User registrations by day (last 7 days)
    const registrationsByDay = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
      
      const count = await User.count({
        where: {
          createdAt: {
            [Op.gte]: startOfDay,
            [Op.lt]: endOfDay
          },
          status: 'active'
        }
      });

      registrationsByDay.push({
        date: startOfDay.toISOString().split('T')[0],
        count
      });
    }

    // Game activations by day (last 7 days)
    const activationsByDay = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
      
      const count = await ActivationCode.count({
        where: {
          usedAt: {
            [Op.gte]: startOfDay,
            [Op.lt]: endOfDay
          },
          isUsed: true
        }
      });

      activationsByDay.push({
        date: startOfDay.toISOString().split('T')[0],
        count
      });
    }

    res.json({
      overview: {
        totalUsers,
        totalGames,
        publishedGames,
        totalActivationCodes,
        usedActivationCodes,
        availableActivationCodes: totalActivationCodes - usedActivationCodes,
        recentRegistrations,
        activeUsers,
        recentActivations
      },
      charts: {
        registrationsByDay,
        activationsByDay,
        popularGames
      }
    });

  } catch (error) {
    console.error('获取仪表盘统计失败:', error);
    res.status(500).json({ message: '获取仪表盘统计失败' });
  }
});

// GET /api/dashboard/system-info - Get system information (admin only)
router.get('/system-info', protect, admin, async (req, res) => {
  try {
    const dbSize = await sequelize.query(
      "SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size();",
      { type: sequelize.QueryTypes.SELECT }
    );

    res.json({
      database: {
        type: 'SQLite',
        size: dbSize[0]?.size || 0,
        location: './dev.sqlite'
      },
      server: {
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version,
        uptime: process.uptime()
      }
    });

  } catch (error) {
    console.error('获取系统信息失败:', error);
    res.status(500).json({ message: '获取系统信息失败' });
  }
});

module.exports = router;