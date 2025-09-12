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