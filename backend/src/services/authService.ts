import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/AppError';
import { createLog, logUserLogin } from './logService';
import type { Request } from 'express';
import { extractClientContext } from '../utils/requestContext';
import { getSettings } from './settings/settingsService';
import { verifyVerificationCode, consumeVerificationCode } from './verificationCodeService';
import prisma from '../lib/prisma';

export const register = async (userData: any, req?: Request) => {
  const { username, email, password, verificationCode } = userData;

  // 检查注册开关
  let policy: any
  let emailSettings: any
  try {
    policy = await getSettings<any>('account.policy')
    emailSettings = await getSettings<any>('email.smtp')
    
    if (policy?.registration && policy.registration.enabled === false) {
      throw new AppError('当前禁止新用户注册', 403)
    }
    
    // 如果启用了邮件验证码，则验证验证码
    if (emailSettings?.enabled && emailSettings?.verification?.register?.enabled) {
      if (!verificationCode) {
        throw new AppError('请提供邮箱验证码', 400)
      }
      
      const isValidCode = await verifyVerificationCode(email, 'REGISTER', verificationCode)
      if (!isValidCode) {
        throw new AppError('验证码无效或已过期', 400)
      }
    }
    
    // 校验密码策略
    if (policy?.password) {
      validatePasswordWithPolicy(password, policy.password)
    }
  } catch (e) {
    if (e instanceof AppError) throw e
    // 设置获取失败则继续（采用默认）
  }

  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });

  if (existingUser) {
    throw new AppError('User with this email or username already exists', 409);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      username,
      email,
      password: hashedPassword,
    },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // 记录注册日志
  try {
    // 写入密码历史（注册）
    try {
      const historyKeep = policy?.password?.historyKeep || 10
      await prisma.passwordHistory.create({ data: { userId: user.id, password: hashedPassword } })
      const count = await prisma.passwordHistory.count({ where: { userId: user.id } })
      if (count > historyKeep) {
        const overflow = count - historyKeep
        const old = await prisma.passwordHistory.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: 'asc' },
          take: overflow
        })
        await prisma.passwordHistory.deleteMany({ where: { id: { in: old.map((o: any) => o.id) } } })
      }
    } catch {}
    
    // 消费验证码（如果启用了邮件验证）
    if (emailSettings?.enabled && emailSettings?.verification?.register?.enabled && verificationCode) {
      try {
        await consumeVerificationCode(email, 'REGISTER')
      } catch (e) {
        // 忽略验证码消费失败
      }
    }
    
    await createLog({
      type: 'USER_REGISTER',
      message: `用户 ${user.username} 注册成功`,
      userId: user.id,
      context: req ? extractClientContext(req) : undefined
    })
  } catch (e) {
    // 忽略日志失败
  }

  return user;
};

export const login = async (loginData: any, req?: Request) => {
  const { account, password } = loginData;

  // 支持用户名或邮箱登录
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: account },
        { username: account }
      ]
    },
  });

  if (!user) {
    // 记录登录失败日志
    try {
      await logUserLogin('', account, false, req ? extractClientContext(req) : undefined, '用户不存在')
    } catch (e) {
      // 忽略日志失败
    }
    throw new AppError('请检查用户名/邮箱和密码是否正确', 401);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    // 记录登录失败日志
    try {
      await logUserLogin(user.id, user.username, false, req ? extractClientContext(req) : undefined, '密码错误')
    } catch (e) {
      // 忽略日志失败
    }
    throw new AppError('请检查用户名/邮箱和密码是否正确', 401);
  }

  // 维护模式：普通用户禁止登录
  try {
    const siteBasic = await getSettings<any>('site.basic')
    if (siteBasic?.maintenance?.enabled && user.role !== 'ADMIN') {
      // 记录登录失败日志
      try {
        await logUserLogin(user.id, user.username, false, req ? extractClientContext(req) : undefined, '系统维护中')
      } catch (e) {
        // 忽略日志失败
      }
      throw new AppError(siteBasic.maintenance.message || '系统维护中，暂不可登录', 403)
    }
  } catch (e) {
    if (e instanceof AppError) throw e
    // 忽略设置加载错误，继续登录
  }

  // 更新最后登录时间（用于单点登录）
  const currentLoginTime = new Date();
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: currentLoginTime }
  });

  // 记录登录成功日志
  try {
    const logType = user.role === 'ADMIN' ? 'ADMIN_LOGIN' : 'USER_LOGIN'
    await createLog({
      type: logType,
      message: `${user.role === 'ADMIN' ? '管理员' : '用户'} ${user.username} 登录成功`,
      userId: user.id,
      context: req ? extractClientContext(req) : undefined,
      metadata: {
        username: user.username,
        role: user.role,
        loginTime: currentLoginTime.toISOString()
      }
    })
  } catch (e) {
    // 忽略日志失败
  }

  // 在JWT中包含登录时间戳用于单点登录验证
  const token = jwt.sign(
    {
      id: user.id,
      role: user.role,
      lastLoginAt: currentLoginTime.getTime()
    },
    process.env.JWT_SECRET || 'your_jwt_secret',
    { expiresIn: '24h' }
  );

  const userResponse = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    lastLoginAt: currentLoginTime
  };

  return { token, user: userResponse };
};

function validatePasswordWithPolicy(pw: string, policy: any) {
  if (!pw || typeof pw !== 'string') throw new AppError('密码不能为空', 400)
  if (pw.length < policy.minLength) throw new AppError(`密码长度不能少于${policy.minLength}个字符`, 400)
  if (pw.length > policy.maxLength) throw new AppError(`密码长度不能超过${policy.maxLength}个字符`, 400)
  if (policy.requireLowercase && !/[a-z]/.test(pw)) throw new AppError('密码需包含小写字母', 400)
  if (policy.requireUppercase && !/[A-Z]/.test(pw)) throw new AppError('密码需包含大写字母', 400)
  if (policy.requireNumber && !/[0-9]/.test(pw)) throw new AppError('密码需包含数字', 400)
  if (policy.requireSymbol && !/[~!@#$%^&*()_+\-={}\[\]:";'<>?,./]/.test(pw)) throw new AppError('密码需包含符号', 400)
}