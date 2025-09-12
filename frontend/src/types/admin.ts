// 管理后台相关类型定义

export interface User {
  id: number
  username: string
  email: string
  role: 'user' | 'admin'
  createdAt: string
  gamesCount: number
  games?: UserGame[]
}

export interface UserGame {
  title: string
  activatedAt: string
}

export interface Game {
  id: string
  title: string
  description: string
  coverImage: string
  status: 'PUBLISHED' | 'DRAFT'
  createdAt: string
  updatedAt?: string
  activationCount: number
  playCount?: number
}

export interface ActivationCode {
  id: string
  code: string
  gameId: string
  gameTitle: string
  status: 'UNUSED' | 'USED'
  userId?: string
  username?: string
  createdAt: string
  activatedAt?: string
}

export interface AdminStats {
  totalUsers: number
  totalGames: number
  totalCodes: number
  usedCodes: number
}