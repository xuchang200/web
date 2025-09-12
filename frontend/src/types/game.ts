export interface Game {
  id: string;
  title: string;
  name?: string;
  description: string;
  coverImage: string;
  playCount: number;
  rating: number; // 改为必需字段
  path?: string;
  activationCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface GameResponse {
  id: string;
  name: string;
  description: string | null;
  path: string;
  coverImage: string | null;
  playCount: number;
  activationCount: number;
  createdAt: string;
  updatedAt: string;
}