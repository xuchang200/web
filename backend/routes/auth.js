const express = require('express');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const User = require('../models/User');

const router = express.Router();

// 临时使用内存存储替代Redis进行测试
const memoryStore = new Map();

// 模拟Redis的基本功能
const mockRedis = {
  setEx: async (key, ttl, value) => {
    memoryStore.set(key, { value, expiry: Date.now() + ttl * 1000 });
    return 'OK';
  },
  get: async (key) => {
    const item = memoryStore.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      memoryStore.delete(key);
      return null;
    }
    return item.value;
  },
  del: async (key) => {
    return memoryStore.delete(key) ? 1 : 0;
  },
  keys: async (pattern) => {
    const keys = Array.from(memoryStore.keys()).filter(key => {
      if (pattern === '*') return true;
      const regex = new RegExp(pattern.replace('*', '.*'));
      return regex.test(key);
    });
    return keys;
  }
};

const redisClient = mockRedis;

// Email transporter setup
let transporter = null;

const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// POST /api/auth/send-code - 发送邮箱验证码
router.post('/send-code', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: '请提供邮箱地址' });
  }

  try {
    // 生成6位数字验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // 存储到Redis，10分钟过期
    await redisClient.setEx(`verification_code:${email}`, 600, code);

    // 创建邮件传输器
    if (!transporter) {
      transporter = createTransporter();
    }

    // 发送验证码邮件
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: '游戏网站 - 邮箱验证码',
      html: `
        <h2>邮箱验证码</h2>
        <p>您的验证码是：<strong>${code}</strong></p>
        <p>该验证码将在10分钟后过期，请及时使用。</p>
      `
    };

    await transporter.sendMail(mailOptions);
    
    res.status(200).json({ message: '验证码已发送到您的邮箱' });

  } catch (error) {
    console.error('Send code error:', error);
    res.status(500).json({ message: '发送验证码失败，请稍后重试' });
  }
});

// POST /api/auth/register - 用户注册
router.post('/register', async (req, res) => {
  const { username, email, code, password, confirmPassword } = req.body;

  if (!username || !email || !code || !password || !confirmPassword) {
    return res.status(400).json({ message: '请填写所有必填字段' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: '两次输入的密码不一致' });
  }

  try {
    // 验证邮箱验证码
    const storedCode = await redisClient.get(`verification_code:${email}`);
    if (!storedCode || storedCode !== code) {
      return res.status(400).json({ message: '验证码无效或已过期' });
    }

    // 检查用户是否已存在
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ username: username }, { email: email }]
      }
    });

    if (existingUser) {
      return res.status(400).json({ message: '用户名或邮箱已被使用' });
    }

    // 创建新用户（密码将通过模型的hook进行哈希加密）
    const newUser = await User.create({ username, email, password });

    // 清除验证码
    await redisClient.del(`verification_code:${email}`);

    // 生成JWT
    const token = jwt.sign(
      { id: newUser.id, username: newUser.username, role: newUser.role },
      process.env.JWT_SECRET || 'your_default_secret_key',
      { expiresIn: '1h' }
    );

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role
      },
      message: '注册成功'
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: '注册过程中发生错误' });
  }
});

// POST /api/auth/login - 用户登录
router.post('/login', async (req, res) => {
  const { account, password } = req.body;

  if (!account || !password) {
    return res.status(400).json({ message: '请提供用户名/邮箱和密码' });
  }

  try {
    // 通过用户名或邮箱查找用户
    const user = await User.findOne({
      where: {
        [Op.or]: [{ username: account }, { email: account }]
      }
    });

    if (!user) {
      return res.status(401).json({ message: '用户名/邮箱或密码错误' });
    }

    // 验证密码
    const isMatch = await user.validPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: '用户名/邮箱或密码错误' });
    }

    // 生成JWT
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'your_default_secret_key',
      { expiresIn: '24h' }
    );

    res.status(200).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      message: '登录成功'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: '登录过程中发生错误' });
  }
});

// POST /api/auth/forgot-password - 请求密码重置
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: '请提供邮箱地址' });
  }

  try {
    // 验证邮箱是否存在
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: '该邮箱地址未注册' });
    }

    // 生成重置令牌
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // 存储到Redis，1小时过期
    await redisClient.setEx(`reset_token:${email}`, 3600, resetToken);

    // 创建邮件传输器
    if (!transporter) {
      transporter = createTransporter();
    }

    // 发送密码重置邮件
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: '游戏网站 - 密码重置',
      html: `
        <h2>密码重置请求</h2>
        <p>您好，${user.username}！</p>
        <p>我们收到了您的密码重置请求。请点击下面的链接重置您的密码：</p>
        <p><a href="${resetUrl}" target="_blank">重置密码</a></p>
        <p>该链接将在1小时后过期。如果您没有请求密码重置，请忽略此邮件。</p>
      `
    };

    await transporter.sendMail(mailOptions);
    
    res.status(200).json({ message: '密码重置链接已发送到您的邮箱' });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: '请求密码重置失败，请稍后重试' });
  }
});

// POST /api/auth/reset-password - 重置密码
router.post('/reset-password', async (req, res) => {
  const { token, newPassword, confirmPassword } = req.body;

  if (!token || !newPassword || !confirmPassword) {
    return res.status(400).json({ message: '请填写所有必填字段' });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: '两次输入的密码不一致' });
  }

  try {
    // 查找所有的重置令牌，找到匹配的邮箱
    const keys = await redisClient.keys('reset_token:*');
    let email = null;
    
    for (const key of keys) {
      const storedToken = await redisClient.get(key);
      if (storedToken === token) {
        email = key.replace('reset_token:', '');
        break;
      }
    }

    if (!email) {
      return res.status(400).json({ message: '重置令牌无效或已过期' });
    }

    // 查找用户
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: '用户不存在' });
    }

    // 更新密码（通过模型的hook自动哈希加密）
    await user.update({ password: newPassword });

    // 删除重置令牌
    await redisClient.del(`reset_token:${email}`);

    res.status(200).json({ message: '密码重置成功，请使用新密码登录' });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: '密码重置失败，请稍后重试' });
  }
});

module.exports = router;