import request from './request';

// 获取当前用户信息
export const getUserProfile = () => {
  return request({
    url: '/user/profile',
    method: 'get'
  });
};

// 更新用户信息
export const updateUserProfile = (data: { username?: string; email?: string }) => {
  return request({
    url: '/user/profile',
    method: 'put',
    data
  });
};

// 修改密码
export const changePassword = (data: { currentPassword: string; newPassword: string }) => {
  return request({
    url: '/user/password',
    method: 'put',
    data
  });
};

// 申请账号注销
export const requestAccountDeletion = () => {
  return request<{ success: boolean; message: string; data?: { deletionEffectiveAt: string } }>({
    url: '/user/deletion/request',
    method: 'post'
  });
};

// 取消账号注销
export const cancelAccountDeletion = () => {
  return request<{ success: boolean; message: string }>({
    url: '/user/deletion/cancel',
    method: 'post'
  });
};

// 更新用户信息 (管理员权限)
  // 更新用户信息 (管理员权限)
  export const updateUser = (id: string, data: { username: string; email: string; role: string }) => {
    return request({
      url: `/user/${id}`,
      method: 'put',
      data
    });
  };
  
  // 删除用户 (管理员权限)
  export const deleteUser = (id: string) => {
    return request({
      url: `/user/${id}`,
      method: 'delete'
    });
  };
  
  // 新增用户 (管理员权限)
  export const createUser = (data: any) => {
    return request({
      url: '/user',
      method: 'post',
      data
    });
  };

// 获取用户列表 (管理员权限)
export const getUserList = () => {
  return request({
    url: '/user/list',
    method: 'get'
  });
};

// 获取我的游戏（当前登录用户）
export const getMyGames = () => {
  return request<{
    success: boolean;
    message: string;
    data: Array<{
      id: string;
      title: string;
      description: string;
      coverImage: string | null;
      activatedAt: string;
    }>;
  }>({
    url: '/user/my-games',
    method: 'get'
  });
};

// 使用激活码激活
export const activateByCode = (code: string) => {
  return request<{
    success: boolean;
    message: string;
    data: { code: string; game: { id: string; name: string } };
  }>({
    url: '/user/activate',
    method: 'post',
    data: { code }
  });
};

// 获取用户已激活的游戏列表 (管理员权限)
export const getUserActivatedGames = (userId: string) => {
  return request<{
    success: boolean;
    message: string;
    data: Array<{
      id: string;
      gameId: string;
      gameName: string;
      activatedAt: string;
    }>;
  }>({
    url: `/user/${userId}/activated-games`,
    method: 'get'
  });
};

// 为用户激活游戏 (管理员权限)
export const activateGameForUser = (userId: string, gameId: string) => {
  return request<{
    success: boolean;
    message: string;
  }>({
    url: `/user/${userId}/activate-game`,
    method: 'post',
    data: { gameId }
  });
};

// 为用户取消游戏激活 (管理员权限)
export const deactivateGameForUser = (userId: string, gameId: string) => {
  return request<{
    success: boolean;
    message: string;
  }>({
    url: `/user/${userId}/deactivate-game`,
    method: 'delete',
    data: { gameId }
  });
};