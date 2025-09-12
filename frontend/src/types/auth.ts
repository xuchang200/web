export interface LoginData {
  account: string; // 可以是用户名或邮箱
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  verificationCode: string;
}