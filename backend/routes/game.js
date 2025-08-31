const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const unzipper = require('unzipper');
const { protect, admin } = require('../middleware/authMiddleware');
const Game = require('../models/Game');
const ActivationCode = require('../models/ActivationCode');
const Permission = require('../models/Permission');

const router = express.Router();

// --- Multer Setup for File Uploads ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../../uploads/temp');
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/zip' || file.originalname.endsWith('.zip')) {
    cb(null, true);
  } else {
    cb(new Error('只允许上传ZIP格式的游戏文件'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

// Helper function to get file size
const getDirectorySize = (dirPath) => {
  let totalSize = 0;
  const files = fs.readdirSync(dirPath, { withFileTypes: true });
  
  for (const file of files) {
    const filePath = path.join(dirPath, file.name);
    if (file.isDirectory()) {
      totalSize += getDirectorySize(filePath);
    } else {
      totalSize += fs.statSync(filePath).size;
    }
  }
  return totalSize;
};

// --- Public Routes ---

// GET /api/games - Get all published games
router.get('/', async (req, res) => {
  try {
    const games = await Game.findAll({ 
      where: { status: 'published' },
      attributes: ['id', 'title', 'description', 'coverImageUrl', 'downloadCount', 'version', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });
    res.json(games);
  } catch (error) {
    console.error('获取游戏列表失败:', error);
    res.status(500).json({ message: '获取游戏列表失败' });
  }
});

// GET /api/games/:id - Get specific game details
router.get('/:id', async (req, res) => {
  try {
    const game = await Game.findByPk(req.params.id, {
      where: { status: 'published' },
      attributes: ['id', 'title', 'description', 'coverImageUrl', 'downloadCount', 'version', 'createdAt']
    });
    
    if (!game) {
      return res.status(404).json({ message: '游戏不存在' });
    }
    
    res.json(game);
  } catch (error) {
    console.error('获取游戏详情失败:', error);
    res.status(500).json({ message: '获取游戏详情失败' });
  }
});

// --- Admin Routes ---

// GET /api/games/admin/all - Get all games (admin only)
router.get('/admin/all', protect, admin, async (req, res) => {
  try {
    const games = await Game.findAll({
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: ActivationCode,
          as: 'activationCodes',
          attributes: ['id', 'code', 'isUsed', 'batchId'],
          required: false
        }
      ]
    });
    res.json(games);
  } catch (error) {
    console.error('获取所有游戏失败:', error);
    res.status(500).json({ message: '获取所有游戏失败' });
  }
});

// POST /api/games/admin/upload - Upload and create a new game (admin only)
router.post('/admin/upload', protect, admin, upload.single('gameZip'), async (req, res) => {
  const { title, description, version } = req.body;
  const gameZipFile = req.file;

  if (!title || !gameZipFile) {
    return res.status(400).json({ message: '游戏标题和ZIP文件为必填项' });
  }

  const gameId = `game-${Date.now()}`;
  const gameFilesPath = path.join(__dirname, `../../public/games/${gameId}`);
  const gameEntryPath = `/games/${gameId}/index.html`;

  try {
    // Create game directory
    fs.mkdirSync(gameFilesPath, { recursive: true });

    // Unzip the game file
    await fs.createReadStream(gameZipFile.path)
      .pipe(unzipper.Extract({ path: gameFilesPath }))
      .promise();
    
    // Clean up the temp zip file
    fs.unlinkSync(gameZipFile.path);

    // Check if index.html exists
    const indexPath = path.join(gameFilesPath, 'index.html');
    if (!fs.existsSync(indexPath)) {
      // Clean up the extracted folder if no index.html
      fs.rmSync(gameFilesPath, { recursive: true, force: true });
      return res.status(400).json({ message: 'ZIP文件必须在根目录包含index.html文件' });
    }

    // Calculate file size
    const fileSize = getDirectorySize(gameFilesPath);

    // Create game record in the database
    const newGame = await Game.create({
      title: title.trim(),
      description: description ? description.trim() : null,
      gameEntryPath,
      version: version || '1.0.0',
      fileSize,
      status: 'draft'
    });

    res.status(201).json({
      ...newGame.toJSON(),
      message: '游戏上传成功'
    });

  } catch (error) {
    console.error('游戏上传失败:', error);
    
    // Clean up on error
    if (fs.existsSync(gameFilesPath)) {
      fs.rmSync(gameFilesPath, { recursive: true, force: true });
    }
    if (gameZipFile && fs.existsSync(gameZipFile.path)) {
      fs.unlinkSync(gameZipFile.path);
    }
    
    res.status(500).json({ message: '游戏上传失败，请重试' });
  }
});

// PUT /api/games/admin/:id - Update game (admin only)
router.put('/admin/:id', protect, admin, async (req, res) => {
  const { title, description, status, version } = req.body;
  
  try {
    const game = await Game.findByPk(req.params.id);
    if (!game) {
      return res.status(404).json({ message: '游戏不存在' });
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description ? description.trim() : null;
    if (status !== undefined) updateData.status = status;
    if (version !== undefined) updateData.version = version;

    await game.update(updateData);
    
    res.json({
      ...game.toJSON(),
      message: '游戏更新成功'
    });
  } catch (error) {
    console.error('游戏更新失败:', error);
    res.status(500).json({ message: '游戏更新失败' });
  }
});

// DELETE /api/games/admin/:id - Delete game (admin only)
router.delete('/admin/:id', protect, admin, async (req, res) => {
  try {
    const game = await Game.findByPk(req.params.id);
    if (!game) {
      return res.status(404).json({ message: '游戏不存在' });
    }

    // Check if there are any activation codes for this game
    const codesCount = await ActivationCode.count({ where: { gameId: game.id } });
    if (codesCount > 0) {
      return res.status(400).json({ 
        message: `无法删除游戏：存在${codesCount}个相关的激活码，请先处理这些激活码` 
      });
    }

    // Check if there are any user permissions for this game
    const permissionsCount = await Permission.count({ where: { gameId: game.id } });
    if (permissionsCount > 0) {
      return res.status(400).json({ 
        message: `无法删除游戏：已有${permissionsCount}个用户拥有此游戏权限` 
      });
    }

    // Delete game files
    const gameFilesPath = path.join(__dirname, `../../public${game.gameEntryPath}`).replace('/index.html', '');
    if (fs.existsSync(gameFilesPath)) {
      fs.rmSync(gameFilesPath, { recursive: true, force: true });
    }

    // Delete game record
    await game.destroy();
    
    res.json({ message: '游戏删除成功' });
  } catch (error) {
    console.error('游戏删除失败:', error);
    res.status(500).json({ message: '游戏删除失败' });
  }
});

// GET /api/games/admin/:id/stats - Get game statistics (admin only)
router.get('/admin/:id/stats', protect, admin, async (req, res) => {
  try {
    const game = await Game.findByPk(req.params.id);
    if (!game) {
      return res.status(404).json({ message: '游戏不存在' });
    }

    const totalCodes = await ActivationCode.count({ where: { gameId: game.id } });
    const usedCodes = await ActivationCode.count({ where: { gameId: game.id, isUsed: true } });
    const activeUsers = await Permission.count({ where: { gameId: game.id } });

    res.json({
      gameId: game.id,
      gameTitle: game.title,
      downloadCount: game.downloadCount,
      totalActivationCodes: totalCodes,
      usedActivationCodes: usedCodes,
      availableActivationCodes: totalCodes - usedCodes,
      activeUsers: activeUsers,
      fileSize: game.fileSize,
      status: game.status
    });
  } catch (error) {
    console.error('获取游戏统计失败:', error);
    res.status(500).json({ message: '获取游戏统计失败' });
  }
});

// POST /api/games/:id/play - Access game (protected route for users)
router.post('/:id/play', protect, async (req, res) => {
  try {
    const game = await Game.findByPk(req.params.id);
    if (!game) {
      return res.status(404).json({ message: '游戏不存在' });
    }

    if (game.status !== 'published') {
      return res.status(403).json({ message: '游戏暂未发布' });
    }

    // Check if user has permission to play this game
    const permission = await Permission.findOne({
      where: { userId: req.user.id, gameId: game.id }
    });

    if (!permission && req.user.role !== 'admin') {
      return res.status(403).json({ message: '您没有权限游玩此游戏，请先激活' });
    }

    // Increment download count
    await game.increment('downloadCount');

    res.json({
      gameEntryPath: game.gameEntryPath,
      title: game.title,
      description: game.description,
      message: '游戏访问授权成功'
    });
  } catch (error) {
    console.error('游戏访问失败:', error);
    res.status(500).json({ message: '游戏访问失败' });
  }
});

module.exports = router;