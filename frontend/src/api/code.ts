import request from './request';

export interface ActivationCodeItem {
  id: string;
  code: string;
  gameId: string;
  gameTitle: string;
  status: 'UNUSED' | 'USED';
  userId?: string;
  username?: string;
  createdAt: string;
  activatedAt?: string;
}

export interface CodeListParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  gameId?: string;
  status?: 'UNUSED' | 'USED';
}

export interface CodeListResponse {
  items: ActivationCodeItem[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export const getCodeList = (params: CodeListParams = {}) => {
  return request<{
    success: boolean;
    message: string;
    data: CodeListResponse;
  }>({
    url: '/admin/codes',
    method: 'get',
    params
  });
};

export const generateCodes = (data: { gameIds: string[]; count: number; pattern?: 'RANDOM' | 'PREFIX'; prefix?: string; }) => {
  return request<{
    success: boolean;
    message: string;
    data: { codes: string[] };
  }>({
    url: '/admin/codes/generate',
    method: 'post',
    data
  });
};

export const deleteCode = (id: string) => {
  return request<{
    success: boolean;
    message: string;
  }>({
    url: `/admin/codes/${id}`,
    method: 'delete'
  });
};

export const batchDeleteCodes = (ids: string[]) => {
  return request<{
    success: boolean;
    message: string;
    data: { requested: number; deleted: number; usedCount: number; unusedCount: number };
  }>({
    url: '/admin/codes/batch-delete',
    method: 'post',
    data: { ids }
  });
};

export const activateByCode = (code: string) => {
  return request<{
    success: boolean;
    message: string;
    data: {
      code: string;
      game: { id: string; name: string };
    };
  }>({
    url: '/user/activate',
    method: 'post',
    data: { code }
  });
};


