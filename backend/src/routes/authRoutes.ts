import express from 'express';
import * as authService from '../services/authService';
import { AppError } from '../utils/AppError';

const router = express.Router();

// 用户注册
router.post('/register', async (req, res, next) => {
  try {
    const user = await authService.register(req.body, req);
    res.status(201).json({
      success: true,
      message: '注册成功',
      data: user
    });
  } catch (error) {
    next(error);
  }
});

// 用户登录
router.post('/login', async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    res.json({
      success: true,
      message: '登录成功',
      token: result.token,
      user: result.user
    });
  } catch (error) {
    next(error);
  }
});

export default router;