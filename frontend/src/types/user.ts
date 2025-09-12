// 用户相关类型定义

export interface UserInfo {
  id: number
  username: string
  email: string
  name: string
  avatar?: string
  createdAt: string
  activatedGamesCount: number
}

// 兼容历史代码中使用的 User 类型名（auth store 等）。
// 若后续需要拓展，可直接在这里修改结构。
export type User = UserInfo;

export interface UserGame {
  id: number
  title: string
  description: string
  coverImage: string
  activatedAt: string
}

export interface PasswordChangeForm {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export interface ActivationCodeResponse {
  success: boolean
  message: string
  game?: UserGame
}