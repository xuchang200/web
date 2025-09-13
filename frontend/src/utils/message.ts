import { ElMessage } from 'element-plus'
import type { MessageHandler } from 'element-plus'

// 消息键用于防止同一时间段重复提示
interface PendingMessage { key: string; timer: number }
const pending = new Map<string, PendingMessage>()

interface ShowOptions {
  type?: 'success' | 'warning' | 'info' | 'error'
  message: string
  duration?: number
  key?: string // 相同 key 在冷却时间内不重复展示
  cooldown?: number // 毫秒，默认 1500
  showClose?: boolean
}

function show(opts: ShowOptions) {
  const { key, cooldown = 1500 } = opts
  if (key) {
    const exists = pending.get(key)
    if (exists) return exists // 冷却中直接忽略
    const handler = ElMessage({
      message: opts.message,
      type: opts.type || 'info',
      showClose: opts.showClose ?? false,
      duration: opts.duration ?? 2000
    }) as MessageHandler & { key?: string }
    const timer = window.setTimeout(() => {
      pending.delete(key)
    }, cooldown)
    pending.set(key, { key, timer })
    return handler
  }
  return ElMessage({
    message: opts.message,
    type: opts.type || 'info',
    showClose: opts.showClose ?? false,
    duration: opts.duration ?? 2000
  })
}

export const msg = {
  success(message: string, key?: string) { return show({ type: 'success', message, key }) },
  error(message: string, key?: string) { return show({ type: 'error', message, key }) },
  warn(message: string, key?: string) { return show({ type: 'warning', message, key }) },
  info(message: string, key?: string) { return show({ type: 'info', message, key }) },
  // 通用验证失败
  validation(message: string, key?: string) { return show({ type: 'warning', message, key, duration: 2500 }) }
}

// 预定义常用文案，统一出口（后续可做 i18n）
export const Text = {
  emailRequired: '请输入邮箱地址',
  emailInvalid: '请输入有效的邮箱地址',
  usernameRequired: '请输入用户名',
  codeRequired: '请输入验证码',
  passwordRequired: '请输入密码',
  newPasswordRequired: '请输入新密码',
  passwordTooShort: (min: number) => `密码长度不能少于${min}`,
  passwordTooLong: (max: number) => `密码长度不能超过${max}`,
  passwordNeedLower: '需包含小写字母',
  passwordNeedUpper: '需包含大写字母',
  passwordNeedNumber: '需包含数字',
  passwordNeedSymbol: '需包含符号',
  passwordResetSuccess: '密码重置成功！',
  registerSuccess: '注册成功！',
  sendCodeSuccess: '验证码已发送到您的邮箱',
  sendCodeFail: '发送验证码失败，请稍后重试',
  registerFail: '注册失败，请检查信息并重试',
  resetFail: '密码重置失败，请检查验证码是否正确',
  passwordNotMatch: '两次输入的密码不一致'
} as const

// 扩展登录 / 账户 / 游戏 / 通用操作文案
export const TextEx = {
  loginAccountRequired: '请输入用户名和密码',
  loginSuccess: '登录成功！',
  logoutSuccess: '已退出登录',
  logoutSuccessStrong: '已成功退出登录',
  needLogin: '请先登录',
  needLoginToPlay: '请先登录后再游玩游戏',
  noAccessGame: '您还没有激活该游戏，请先激活后再游玩',
  noPermissionGame: '您没有访问该游戏的权限，请先激活游戏',
  gameNotExist: '游戏不存在',
  checkGameAccessFail: '检查游戏权限失败，请稍后重试',
  launchGameFail: '启动游戏失败，请稍后重试',
  loadUserFail: '获取用户信息失败',
  loadGamesFail: '获取游戏列表失败',
  loadMyGamesFail: '获取我的游戏列表失败',
  activateCodeRequired: '请输入激活码',
  activateGameSuccess: '游戏激活成功！',
  activateGameFail: '激活失败，请稍后重试',
  pwdChangeSuccess: '密码修改成功',
  pwdChangeFail: '密码修改失败，请稍后重试',
  accountDeletionConfirm: (coolingDays:number, irreversible:boolean) => `确认要注销账号？${coolingDays>0 ? `账号将在${coolingDays}天冷静期后彻底删除。` : irreversible ? '该操作不可恢复。' : ''}`,
  accountDeletionSubmitSuccess: '已提交注销申请',
  actionCanceled: '已取消操作',
  actionCanceledLogout: '取消退出',
  genericFail: '操作失败',
  restoreDefaultConfirm: '确定要将该分组恢复默认值吗？此操作不可撤销。',
  restoreDefaultSuccess: '已恢复默认',
  restoreDefaultFail: '重置失败',
  deleteConfirmUser: (u:string)=>`确定要删除用户 "${u}" 吗？`,
  deleteConfirmCode: (c:string,statusText:string)=>`确定要删除激活码 "${c}" 吗？${statusText}删除后将无法恢复！`,
  deleteSuccess: '删除成功',
  deleteFail: '删除失败',
  batchDeleteSuccess: '批量删除成功',
  batchDeleteFail: '批量删除失败',
  clearSuccess: '清空成功',
  clearFail: '清空失败',
  exportSuccess: '导出成功',
  exportFail: '导出失败',
  logStatsFail: '获取统计数据失败',
  imageFormatInvalid: '封面图片只支持 JPG、PNG 格式',
  imageSizeInvalid: '封面图片大小不能超过 5MB',
  gameFolderNeedIndex: '游戏文件夹必须包含 index.html 文件',
  gameFolderSizeTooLarge: '游戏文件夹总大小不能超过 100MB',
  gameFilesOversize: (names:string[])=>`以下文件超过 10MB：${names.join(', ')}`,
  coverUploadSuccess: '封面上传成功',
  coverUploadFail: '封面上传失败',
  gameFilesUploadSuccess: '游戏文件上传成功',
  gameFilesUploadFail: '游戏文件上传失败',
  gameUpdateSuccess: '游戏更新成功',
  gameCreateSuccess: '游戏创建成功',
  submittingWait: '正在提交，请稍候',
  uploadingWait: '文件正在上传，请稍候',
  needSelectGames: '请先选择要删除的游戏',
  testEmailRequired: '请输入测试邮箱地址',
  smtpTestSuccess: 'SMTP连接测试成功',
  smtpTestFail: 'SMTP连接测试失败',
  smtpMailSendSuccess: '测试邮件发送成功',
  smtpMailSendFail: '测试邮件发送失败',
  loadSettingsGroupAll: '已尝试加载全部分组（后端未实现的分组将使用默认值）'
} as const

// 后台管理追加文案（按领域分组，保持扁平 key，语义清晰）
export const AdminText = {
  // 通用
  invalidGameId: '游戏ID无效',
  loadFailGeneric: '加载失败，请稍后重试',
  needSelectFirst: '请先选择需要操作的记录',
  actionInProgress: '操作进行中，请稍候',
  // 游戏管理 - 列表 & 状态
  loadGamesFail: '加载游戏列表失败',
  deleteGameConfirm: (name:string)=>`确定要删除游戏「${name}」吗？此操作不可恢复。`,
  batchDeleteGameConfirm: (count:number)=>`确定要删除选中的 ${count} 个游戏吗？此操作不可恢复。`,
  toggleGameConfirm: (action:string,name:string)=>`确定要${action}游戏「${name}」吗？`,
  deleteSuccess: '删除成功',
  deleteFail: '删除失败',
  batchDeleteSuccess: '批量删除成功',
  batchDeleteFail: '批量删除失败',
  toggleSuccess: '状态更新成功',
  toggleFail: '状态更新失败',
  // 游戏管理 - 上传校验
  coverFormatInvalid: '封面图片只支持 JPG、PNG 格式',
  coverSizeInvalid: '封面图片大小不能超过 5MB',
  gameNeedIndex: '游戏文件夹必须包含 index.html 文件',
  gameFolderTooLarge: '游戏文件夹总大小不能超过 100MB',
  gameOversizeFiles: (names:string[])=>`以下文件超过 10MB：${names.join(', ')}`,
  gameCoverUploadSuccess: '封面上传成功',
  gameCoverUploadFail: '封面上传失败',
  gameFilesUploadSuccess: '游戏文件上传成功',
  gameFilesUploadFail: '游戏文件上传失败',
  gameUpdateSuccess: '游戏更新成功',
  gameCreateSuccess: '游戏创建成功',
  submittingWait: '正在提交，请稍候',
  uploadingWait: '文件正在上传，请稍候',
  needSelectGames: '请先选择要删除的游戏',
  // 用户管理
  loadUsersFail: '获取用户列表失败',
  userDeleteConfirm: (username:string)=>`确定要删除用户 "${username}" 吗？`,
  userDeleteSuccess: '删除成功',
  userDeleteFail: '删除失败',
  userEditSuccess: '编辑成功',
  userCreateSuccess: '新增成功',
  userGamesLoadFail: '获取用户已激活游戏失败',
  allGamesLoadFail: '获取游戏列表失败',
  userAddGameSuccess: '游戏添加成功',
  userAddGameFail: '添加游戏失败',
  userRemoveGameConfirm: '确定要移除该游戏吗？',
  userRemoveGameSuccess: '游戏移除成功',
  userRemoveGameFail: '移除游戏失败',
  // 设置
  loadSettingsAll: '已尝试加载全部分组（后端未实现的分组将使用默认值）',
  saveSuccess: '保存成功',
  saveFail: '保存失败',
  resetGroupConfirm: '确定要将该分组恢复默认值吗？此操作不可撤销。',
  resetGroupSuccess: '已恢复默认',
  resetGroupFail: '重置失败',
  smtpPort465Adjust: '端口465通常需要启用SSL，已自动调整',
  smtpPort587Adjust: '端口587通常需要禁用SSL，已自动调整',
  smtpTestSuccess: 'SMTP连接测试成功',
  smtpTestFail: 'SMTP连接测试失败',
  smtpNeedTestEmail: '请输入测试邮箱地址',
  smtpMailSendSuccess: '测试邮件发送成功',
  smtpMailSendFail: '测试邮件发送失败',
  // 日志管理
  loadLogsFail: '获取日志列表失败',
  deleteLogConfirm: '确定要删除这条日志吗？',
  deleteLogSuccess: '删除成功',
  deleteLogFail: '删除失败',
  batchDeleteLogsConfirm: (count:number)=>`确定要删除选中的 ${count} 条日志吗？`,
  batchDeleteLogsSuccess: '批量删除成功',
  batchDeleteLogsFail: '批量删除失败',
  clearLogsConfirm: '确定要清空所有日志吗？此操作不可恢复！',
  clearLogsSuccess: '清空成功',
  clearLogsFail: '清空失败',
  exportLogsSuccess: '导出成功',
  exportLogsFail: '导出失败',
  logStatsFail: '获取统计数据失败',
  // 复制
  copySuccess: '日志信息已复制到剪贴板',
  copyFail: '复制失败，请手动复制',
  // 权限/路由
  needLogin: '请先登录',
  noPermission: '您没有权限访问此页面',
  authExpired: '登录已过期，请重新登录',
  genericFail: '操作失败，请稍后重试'
} as const
