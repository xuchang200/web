import { Request, Response } from 'express'
import { getSettings, updateSettings } from '../services/settings/settingsService'
import { validateGamePolicySettings } from '../services/settings/schemas'
import { DEFAULT_GAME_POLICY, mergeWithDefaultGamePolicy, type GamePolicySettings } from '../services/settings/defaults'
import { logAction } from '../services/logService'

/**
 * 获取游戏与内容策略设置
 */
export async function getGamePolicy(req: Request, res: Response) {
  try {
    const settings = await getSettings('game.policy')
    const mergedSettings = mergeWithDefaultGamePolicy(settings)
    
    res.json({ 
      success: true, 
      data: mergedSettings 
    })
  } catch (error: any) {
    console.error('获取游戏策略设置失败:', error)
    res.status(500).json({ 
      success: false, 
      message: error.message || '获取游戏策略设置失败' 
    })
  }
}

/**
 * 更新游戏与内容策略设置
 */
export async function updateGamePolicy(req: Request, res: Response) {
  try {
    // 获取当前设置
    const currentSettings = await getSettings('game.policy')
    const current = mergeWithDefaultGamePolicy(currentSettings)
    
    // 合并新设置
    const newSettings = mergeWithDefaultGamePolicy({
      ...current,
      ...req.body
    })
    
    // 验证设置格式
    const validation = validateGamePolicySettings(newSettings)
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: '设置格式验证失败',
        errors: validation.errors
      })
    }
    
    // 业务逻辑验证
    const businessValidation = validateGamePolicyBusinessRules(newSettings)
    if (!businessValidation.success) {
      return res.status(400).json({
        success: false,
        message: businessValidation.message
      })
    }
    
    // 保存设置
    await updateSettings('game.policy', newSettings)
    
    // 记录操作日志
    try {
      await logAction({
        userId: (req as any).user?.userId,
        username: (req as any).user?.username,
        action: 'UPDATE_GAME_POLICY',
        resource: 'game.policy',
        details: {
          changes: calculateGamePolicyChanges(current, newSettings),
          newSettings: newSettings
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      })
    } catch (logError) {
      console.warn('记录游戏策略更新日志失败:', logError)
      // 不影响主要操作，继续执行
    }
    
    res.json({ 
      success: true, 
      message: '游戏策略设置更新成功',
      data: newSettings
    })
  } catch (error: any) {
    console.error('更新游戏策略设置失败:', error)
    res.status(500).json({ 
      success: false, 
      message: error.message || '更新游戏策略设置失败' 
    })
  }
}

/**
 * 重置游戏与内容策略设置为默认值
 */
export async function resetGamePolicy(req: Request, res: Response) {
  try {
    // 获取当前设置用于日志记录
    const currentSettings = await getSettings('game.policy')
    const current = mergeWithDefaultGamePolicy(currentSettings)
    
    // 重置为默认值
    await updateSettings('game.policy', DEFAULT_GAME_POLICY)
    
    // 记录操作日志
    try {
      await logAction({
        userId: (req as any).user?.userId,
        username: (req as any).user?.username,
        action: 'RESET_GAME_POLICY',
        resource: 'game.policy',
        details: {
          previousSettings: current,
          resetToDefault: DEFAULT_GAME_POLICY
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      })
    } catch (logError) {
      console.warn('记录游戏策略重置日志失败:', logError)
    }
    
    res.json({ 
      success: true, 
      message: '游戏策略设置已重置为默认值',
      data: DEFAULT_GAME_POLICY
    })
  } catch (error: any) {
    console.error('重置游戏策略设置失败:', error)
    res.status(500).json({ 
      success: false, 
      message: error.message || '重置游戏策略设置失败' 
    })
  }
}

/**
 * 验证游戏策略业务规则
 */
function validateGamePolicyBusinessRules(settings: GamePolicySettings): { success: boolean; message?: string } {
  // 验证封面大小限制
  if (settings.cover.maxSizeMB < 1 || settings.cover.maxSizeMB > 20) {
    return { success: false, message: '封面大小限制必须在1-20MB之间' }
  }
  
  // 验证游戏包大小限制
  if (settings.package.maxSizeMB < 10 || settings.package.maxSizeMB > 1000) {
    return { success: false, message: '游戏包大小限制必须在10-1000MB之间' }
  }
  
  // 验证播放时长限制
  if (settings.playCount.minDurationSeconds < 5 || settings.playCount.minDurationSeconds > 3600) {
    return { success: false, message: '有效播放时长必须在5-3600秒之间' }
  }
  
  // 验证入口文件名
  if (!settings.package.requiredEntry || settings.package.requiredEntry.trim() === '') {
    return { success: false, message: '入口文件名不能为空' }
  }
  
  // 验证MIME类型
  if (!Array.isArray(settings.cover.allowedMime) || settings.cover.allowedMime.length === 0) {
    return { success: false, message: '必须至少允许一种封面图片格式' }
  }
  
  // 验证标签数量限制
  if (settings.content.maxTagsPerGame < 1 || settings.content.maxTagsPerGame > 50) {
    return { success: false, message: '每个游戏标签数量限制必须在1-50之间' }
  }
  
  // 验证自动审核天数
  if (settings.review.autoApproveAfterDays < 1 || settings.review.autoApproveAfterDays > 30) {
    return { success: false, message: '自动审核天数必须在1-30天之间' }
  }
  
  return { success: true }
}

/**
 * 计算游戏策略设置的变更
 */
function calculateGamePolicyChanges(oldSettings: GamePolicySettings, newSettings: GamePolicySettings): Record<string, { old: any; new: any }> {
  const changes: Record<string, { old: any; new: any }> = {}
  
  // 检查顶级字段
  const topLevelFields = ['publishFlow', 'listDefaultSort']
  topLevelFields.forEach(field => {
    if (oldSettings[field as keyof GamePolicySettings] !== newSettings[field as keyof GamePolicySettings]) {
      changes[field] = {
        old: oldSettings[field as keyof GamePolicySettings],
        new: newSettings[field as keyof GamePolicySettings]
      }
    }
  })
  
  // 检查嵌套对象字段
  const nestedFields = ['cover', 'package', 'playCount', 'activation', 'review', 'content']
  nestedFields.forEach(field => {
    const oldValue = oldSettings[field as keyof GamePolicySettings]
    const newValue = newSettings[field as keyof GamePolicySettings]
    
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changes[field] = { old: oldValue, new: newValue }
    }
  })
  
  return changes
}
