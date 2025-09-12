import request from './request'

// ===========================
// 类型定义
// ===========================

export interface Game {
  id: string;
  name: string;
  description: string;
  path: string;
  coverImage: string | null;
  status: 'PUBLISHED' | 'DRAFT';
  activationCount: number;
  playCount: number;
  createdAt: string;
  updatedAt: string;
  activationCodeCount?: number;
}

export interface GameListParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface GameListResponse {
  games: Game[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export interface CreateGameData {
  name: string;
  description?: string;
  coverImage?: string;
  gameFileTempPath?: string;
  status?: 'PUBLISHED' | 'DRAFT';
}

export interface UpdateGameData {
  name?: string;
  description?: string;
  coverImage?: string;
  gameFileTempPath?: string;
  status?: 'PUBLISHED' | 'DRAFT';
}

// ===========================
// 管理员 API
// ===========================

/**
 * 获取游戏列表（管理员）
 */
export const getAdminGameList = (params: GameListParams = {}) => {
  return request<{
    success: boolean;
    message: string;
    data: GameListResponse;
  }>({
    url: '/admin/games',
    method: 'get',
    params
  });
};

/**
 * 获取游戏详情（管理员）
 */
export const getGameDetail = (id: string) => {
  return request<{
    success: boolean;
    message: string;
    data: Game & {
      statistics: {
        activationCodeCount: number;
        logCount: number;
      };
    };
  }>({
    url: `/admin/games/${id}`,
    method: 'get'
  });
};

/**
 * 创建游戏
 */
export const createGame = (data: CreateGameData) => {
  return request<{
    success: boolean;
    message: string;
    data: Game;
  }>({
    url: '/admin/games',
    method: 'post',
    data
  });
};

/**
 * 更新游戏
 */
export const updateGame = (id: string, data: UpdateGameData) => {
  return request<{
    success: boolean;
    message: string;
    data: Game;
  }>({
    url: `/admin/games/${id}`,
    method: 'put',
    data
  });
};

/**
 * 删除游戏
 */
export const deleteGame = (id: string) => {
  return request<{
    success: boolean;
    message: string;
  }>({
    url: `/admin/games/${id}`,
    method: 'delete'
  });
};

/**
 * 批量删除游戏
 */
export const deleteGames = (ids: string[]) => {
  return request<{
    success: boolean;
    message: string;
  }>({
    url: '/admin/games/batch-delete',
    method: 'post',
    data: { ids }
  });
};

/**
 * 切换游戏状态（发布/下架）
 */
export const toggleGameStatus = (id: string) => {
  return request<{
    success: boolean;
    message: string;
    data: {
      id: string;
      name: string;
      status: 'PUBLISHED' | 'DRAFT';
    };
  }>({
    url: `/admin/games/${id}/toggle-status`,
    method: 'patch'
  });
};

// ===========================
// 文件上传 API
// ===========================

/**
 * 上传封面图片
 */
export const uploadCoverImage = (file: File, onProgress?: (percent: number) => void) => {
  const formData = new FormData();
  formData.append('coverImage', file);
  
  return request<{
    success: boolean;
    message: string;
    data: {
      fileName: string;
      originalName: string;
      url: string;
      path: string;
      size: number;
    };
  }>({
    url: '/upload/cover',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    timeout: 30000, // 30秒超时
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percent);
      }
    }
  });
};

/**
 * 上传游戏文件夹
 */
export const uploadGameFolder = (files: FileList, onProgress?: (percent: number) => void) => {
  const formData = new FormData();
  
  // 添加所有文件到FormData
  Array.from(files).forEach((file) => {
    // 保留文件的相对路径信息
    const relativePath = (file as any).webkitRelativePath || file.name;
    formData.append('gameFiles', file, relativePath);
  });
  
  return request<{
    success: boolean;
    message: string;
    data: {
      tempPath: string;
      fileCount: number;
      totalSize: number;
      hasIndexHtml: boolean;
    };
  }>({
    url: '/upload/game-folder',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    timeout: 120000, // 2分钟超时
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percent);
      }
    }
  });
};

/**
 * 同时上传封面和游戏文件夹
 */
export const uploadGameWithCover = (
  coverFile?: File,
  gameFiles?: FileList,
  onProgress?: (percent: number) => void
) => {
  const formData = new FormData();
  
  // 添加封面
  if (coverFile) {
    formData.append('coverImage', coverFile);
  }
  
  // 添加游戏文件
  if (gameFiles) {
    Array.from(gameFiles).forEach((file) => {
      const relativePath = (file as any).webkitRelativePath || file.name;
      formData.append('gameFiles', file, relativePath);
    });
  }
  
  return request<{
    success: boolean;
    message: string;
    data: {
      coverUrl?: string;
      coverPath?: string;
      gameTempPath?: string;
      fileCount?: number;
    };
  }>({
    url: '/upload/combined',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    timeout: 120000, // 2分钟超时
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percent);
      }
    }
  });
};

/**
 * 删除上传的文件
 */
export const deleteUploadedFile = (filePath: string) => {
  return request<{
    success: boolean;
    message: string;
  }>({
    url: '/upload/file',
    method: 'delete',
    data: { filePath }
  });
};

/**
 * 检查上传服务健康状态
 */
export const checkUploadHealth = () => {
  return request<{
    success: boolean;
    message: string;
    data: {
      status: string;
      uploadPath: string;
    };
  }>({
    url: '/upload/health',
    method: 'get'
  });
};

// ===========================
// 公共 API
// ===========================

/**
 * 获取已发布游戏列表（公开）
 */
export const getPublishedGameList = (params: {
  page?: number;
  pageSize?: number;
  keyword?: string;
} = {}) => {
  return request<{
    success: boolean;
    message: string;
    data: GameListResponse;
  }>({
    url: '/game/list',
    method: 'get',
    params
  });
};

/**
 * 增加游戏播放次数
 */
export const incrementPlayCount = (id: string, options?: { isTest?: boolean; playDuration?: number }) => {
  return request<{
    success: boolean;
    message: string;
    data: {
      id: string;
      playCount: number;
      isTest?: boolean;
      insufficientDuration?: boolean;
    };
  }>({
    url: `/game/${id}/play`,
    method: 'post',
    data: {
      isTest: options?.isTest || false,
      playDuration: options?.playDuration || 0
    }
  });
};

/**
 * 验证用户游戏访问权限
 */
export const checkGameAccess = (id: string) => {
  return request<{
    success: boolean;
    message: string;
    data: {
      gameId: string;
      gameName: string;
      gamePath: string;
      hasAccess: boolean;
    };
  }>({
    url: `/game/${id}/access`,
    method: 'get'
  });
};