import { createClient } from 'redis';

const redis = createClient({
  url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}`,
  password: process.env.REDIS_PASSWORD,
  database: parseInt(process.env.REDIS_DB || '0'),
});

redis.on('connect', () => {
  console.log('Redis connected successfully');
});

redis.on('error', (error) => {
  console.error('Redis connection error:', error);
});

// 连接Redis
redis.connect().catch(console.error);

export default redis;

// Redis键名常量
export const REDIS_KEYS = {
  USER_LOGIN: (userId: string) => `user_login:${userId}`,
  // 验证码相关键名
  EMAIL_VERIFICATION_CODE: (email: string, type: string) => `email_code:${email}:${type}`,
  EMAIL_SEND_LIMIT: (email: string, type: string) => `email_limit:${email}:${type}`,
  EMAIL_GLOBAL_LIMIT: (minute: string) => `email_global:${minute}`,
};
