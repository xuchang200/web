import { LogType } from '@/types/log'

// 日志类型映射到中文显示文本
export const getLogTypeText = (type: string): string => {
  const typeTextMap: Record<string, string> = {
    // 用户相关操作
    [LogType.USER_REGISTER]: '用户注册',
    [LogType.USER_LOGIN]: '用户登录',
    [LogType.USER_LOGIN_FAILED]: '登录失败',
    [LogType.USER_LOGOUT]: '用户登出',
    [LogType.USER_PASSWORD_CHANGE]: '密码修改',
    [LogType.USER_PROFILE_UPDATE]: '资料更新',
    [LogType.USER_ACCOUNT_DELETE_REQUEST]: '注销申请',
    [LogType.USER_ACCOUNT_DELETE_CANCEL]: '取消注销',
    [LogType.USER_ACCOUNT_DELETED]: '账号已删除',
    
    // 游戏相关操作
    [LogType.GAME_ACTIVATION]: '游戏激活',
    [LogType.GAME_ACTIVATION_FAILED]: '激活失败',
    [LogType.GAME_PLAY_VALID]: '有效游玩',
    
    // 激活码相关操作
    [LogType.CODE_ACTIVATION_SUCCESS]: '激活码使用成功',
    [LogType.CODE_ACTIVATION_FAILED]: '激活码使用失败',
    [LogType.CODE_ALREADY_USED]: '激活码已使用',
    [LogType.CODE_NOT_FOUND]: '激活码不存在',
    [LogType.CODE_EXPIRED]: '激活码已过期',
    
    // 文件操作
    [LogType.FILE_UPLOAD]: '文件上传',
    [LogType.FILE_UPLOAD_FAILED]: '上传失败',
    [LogType.FILE_DELETE]: '文件删除',
    
    // 管理员操作
    [LogType.ADMIN_USER_CREATE]: '管理员-新增用户',
    [LogType.ADMIN_USER_UPDATE]: '管理员-更新用户',
    [LogType.ADMIN_USER_DELETE]: '管理员-删除用户',
    [LogType.ADMIN_GAME_CREATE]: '管理员-新增游戏',
    [LogType.ADMIN_GAME_UPDATE]: '管理员-更新游戏',
    [LogType.ADMIN_GAME_DELETE]: '管理员-删除游戏',
    [LogType.ADMIN_CODE_CREATE]: '管理员-新增激活码',
    [LogType.ADMIN_CODE_UPDATE]: '管理员-更新激活码',
    [LogType.ADMIN_CODE_DELETE]: '管理员-删除激活码',
    [LogType.ADMIN_SETTINGS_UPDATE]: '管理员-系统设置',
    [LogType.ADMIN_LOGIN]: '管理员登录',
    [LogType.ADMIN_LOGOUT]: '管理员登出',
    
    // 系统操作
    [LogType.SYSTEM_ERROR]: '系统错误',
    [LogType.SYSTEM_WARNING]: '系统警告',
    [LogType.SYSTEM_MAINTENANCE_START]: '维护开始',
    [LogType.SYSTEM_MAINTENANCE_END]: '维护结束',
    
    // 安全相关操作
    [LogType.SECURITY_UNAUTHORIZED_ACCESS]: '未授权访问',
    [LogType.SECURITY_RATE_LIMIT_EXCEEDED]: '频率限制',
    [LogType.SECURITY_SUSPICIOUS_ACTIVITY]: '可疑活动',
    [LogType.SECURITY_IP_BLOCKED]: 'IP被阻止'
  }
  
  return typeTextMap[type] || '未知操作'
}

// 日志类型映射到标签样式
export const getLogTypeTagType = (type: string): string => {
  // 成功操作 - 绿色
  const successTypes = [
    LogType.USER_REGISTER,
    LogType.USER_LOGIN,
    LogType.GAME_ACTIVATION,
    LogType.CODE_ACTIVATION_SUCCESS,
    LogType.FILE_UPLOAD,
    LogType.ADMIN_LOGIN
  ]
  
  // 警告操作 - 橙色
  const warningTypes = [
    LogType.USER_PASSWORD_CHANGE,
    LogType.USER_PROFILE_UPDATE,
    LogType.USER_ACCOUNT_DELETE_REQUEST,
    LogType.ADMIN_USER_CREATE,
    LogType.ADMIN_USER_UPDATE,
    LogType.ADMIN_SETTINGS_UPDATE,
    LogType.SYSTEM_WARNING,
    LogType.SYSTEM_MAINTENANCE_START,
    LogType.SYSTEM_MAINTENANCE_END
  ]
  
  // 危险操作 - 红色
  const dangerTypes = [
    LogType.USER_LOGIN_FAILED,
    LogType.USER_ACCOUNT_DELETED,
    LogType.GAME_ACTIVATION_FAILED,
    LogType.CODE_ACTIVATION_FAILED,
    LogType.CODE_ALREADY_USED,
    LogType.CODE_NOT_FOUND,
    LogType.CODE_EXPIRED,
    LogType.FILE_UPLOAD_FAILED,
    LogType.ADMIN_USER_DELETE,
    LogType.ADMIN_GAME_DELETE,
    LogType.ADMIN_CODE_DELETE,
    LogType.SYSTEM_ERROR,
    LogType.SECURITY_UNAUTHORIZED_ACCESS,
    LogType.SECURITY_RATE_LIMIT_EXCEEDED,
    LogType.SECURITY_SUSPICIOUS_ACTIVITY,
    LogType.SECURITY_IP_BLOCKED
  ]
  
  // 信息操作 - 蓝色
  const infoTypes = [
    LogType.USER_LOGOUT,
    LogType.USER_ACCOUNT_DELETE_CANCEL,
    LogType.GAME_PLAY_VALID,
    LogType.FILE_DELETE,
    LogType.ADMIN_GAME_CREATE,
    LogType.ADMIN_GAME_UPDATE,
    LogType.ADMIN_CODE_CREATE,
    LogType.ADMIN_CODE_UPDATE,
    LogType.ADMIN_LOGOUT
  ]
  
  if (successTypes.includes(type as any)) return 'success'
  if (warningTypes.includes(type as any)) return 'warning'
  if (dangerTypes.includes(type as any)) return 'danger'
  if (infoTypes.includes(type as any)) return 'info'
  
  return ''
}

// 获取日志类型分组
export const getLogTypeGroups = () => {
  return [
    {
      label: '用户操作',
      options: [
        { label: '用户注册', value: LogType.USER_REGISTER },
        { label: '用户登录', value: LogType.USER_LOGIN },
        { label: '登录失败', value: LogType.USER_LOGIN_FAILED },
        { label: '用户登出', value: LogType.USER_LOGOUT },
        { label: '密码修改', value: LogType.USER_PASSWORD_CHANGE },
        { label: '资料更新', value: LogType.USER_PROFILE_UPDATE },
        { label: '注销申请', value: LogType.USER_ACCOUNT_DELETE_REQUEST },
        { label: '取消注销', value: LogType.USER_ACCOUNT_DELETE_CANCEL },
        { label: '账号已删除', value: LogType.USER_ACCOUNT_DELETED }
      ]
    },
    {
      label: '游戏操作',
      options: [
        { label: '游戏激活', value: LogType.GAME_ACTIVATION },
        { label: '激活失败', value: LogType.GAME_ACTIVATION_FAILED },
        { label: '有效游玩', value: LogType.GAME_PLAY_VALID }
      ]
    },
    {
      label: '激活码操作',
      options: [
        { label: '激活码使用成功', value: LogType.CODE_ACTIVATION_SUCCESS },
        { label: '激活码使用失败', value: LogType.CODE_ACTIVATION_FAILED },
        { label: '激活码已使用', value: LogType.CODE_ALREADY_USED },
        { label: '激活码不存在', value: LogType.CODE_NOT_FOUND },
        { label: '激活码已过期', value: LogType.CODE_EXPIRED }
      ]
    },
    {
      label: '文件操作',
      options: [
        { label: '文件上传', value: LogType.FILE_UPLOAD },
        { label: '上传失败', value: LogType.FILE_UPLOAD_FAILED },
        { label: '文件删除', value: LogType.FILE_DELETE }
      ]
    },
    {
      label: '管理员操作',
      options: [
        { label: '管理员登录', value: LogType.ADMIN_LOGIN },
        { label: '管理员登出', value: LogType.ADMIN_LOGOUT },
        { label: '新增用户', value: LogType.ADMIN_USER_CREATE },
        { label: '更新用户', value: LogType.ADMIN_USER_UPDATE },
        { label: '删除用户', value: LogType.ADMIN_USER_DELETE },
        { label: '新增游戏', value: LogType.ADMIN_GAME_CREATE },
        { label: '更新游戏', value: LogType.ADMIN_GAME_UPDATE },
        { label: '删除游戏', value: LogType.ADMIN_GAME_DELETE },
        { label: '新增激活码', value: LogType.ADMIN_CODE_CREATE },
        { label: '更新激活码', value: LogType.ADMIN_CODE_UPDATE },
        { label: '删除激活码', value: LogType.ADMIN_CODE_DELETE },
        { label: '系统设置', value: LogType.ADMIN_SETTINGS_UPDATE }
      ]
    },
    {
      label: '系统操作',
      options: [
        { label: '系统错误', value: LogType.SYSTEM_ERROR },
        { label: '系统警告', value: LogType.SYSTEM_WARNING },
        { label: '维护开始', value: LogType.SYSTEM_MAINTENANCE_START },
        { label: '维护结束', value: LogType.SYSTEM_MAINTENANCE_END }
      ]
    },
    {
      label: '安全事件',
      options: [
        { label: '未授权访问', value: LogType.SECURITY_UNAUTHORIZED_ACCESS },
        { label: '频率限制', value: LogType.SECURITY_RATE_LIMIT_EXCEEDED },
        { label: '可疑活动', value: LogType.SECURITY_SUSPICIOUS_ACTIVITY },
        { label: 'IP被阻止', value: LogType.SECURITY_IP_BLOCKED }
      ]
    }
  ]
}

// 判断日志类型是否为安全相关
export const isSecurityLog = (type: string): boolean => {
  const securityTypes = [
    LogType.USER_LOGIN_FAILED,
    LogType.SECURITY_UNAUTHORIZED_ACCESS,
    LogType.SECURITY_RATE_LIMIT_EXCEEDED,
    LogType.SECURITY_SUSPICIOUS_ACTIVITY,
    LogType.SECURITY_IP_BLOCKED
  ]
  return securityTypes.includes(type as any)
}

// 判断日志类型是否为错误相关
export const isErrorLog = (type: string): boolean => {
  const errorTypes = [
    LogType.USER_LOGIN_FAILED,
    LogType.GAME_ACTIVATION_FAILED,
    LogType.CODE_ACTIVATION_FAILED,
    LogType.FILE_UPLOAD_FAILED,
    LogType.SYSTEM_ERROR
  ]
  return errorTypes.includes(type as any)
}
