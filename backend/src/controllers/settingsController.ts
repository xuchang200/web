import { Request, Response } from 'express';
import { getSettings, updateSettings, SettingsGroupKey } from '../services/settings/settingsService';
import { AppError } from '../utils/AppError';

/**
 * 获取设置分组数据
 */
export const getSettingsGroup = async (req: Request, res: Response) => {
  try {
    const { group } = req.params
    
    if (!group || !['site.basic', 'account.policy', 'security.risk', 'game.policy', 'email.smtp', 'content.pages'].includes(group)) {
      throw new AppError('无效的设置分组', 400)
    }
    
    const data = await getSettings(group as SettingsGroupKey)
    res.json({ success: true, data })
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || '获取设置失败'
    })
  }
}

/**
 * 更新设置分组数据
 */
export const updateSettingsGroup = async (req: Request, res: Response) => {
  try {
    const { group } = req.params
    const userId = req.user?.id
    
    if (!group || !['site.basic', 'account.policy', 'security.risk', 'game.policy', 'email.smtp', 'content.pages'].includes(group)) {
      throw new AppError('无效的设置分组', 400)
    }
    
    if (!req.body || typeof req.body !== 'object') {
      throw new AppError('请求体不能为空', 400)
    }
    
    const data = await updateSettings(group as SettingsGroupKey, req.body, userId)
    res.json({ success: true, data, message: '设置保存成功' })
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || '保存设置失败'
    })
  }
}

// 获取网站设置
export const getSiteSettingsController = async (req: Request, res: Response) => {
  try {
    const settings = await getSettings('site.basic');
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Failed to get site settings:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: '获取网站设置失败'
      });
    }
  }
};

// 更新网站设置
export const updateSiteSettingsController = async (req: Request, res: Response) => {
  try {
    const settings = req.body;
    
    // 基本验证
    if (!settings.siteName || !settings.adminEmail) {
      throw new AppError('网站名称和管理员邮箱不能为空', 400);
    }

    await updateSettings('site.basic', settings);
    
    res.json({
      success: true,
      message: '网站设置更新成功'
    });
  } catch (error) {
    console.error('Failed to update site settings:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: '更新网站设置失败'
      });
    }
  }
};

// 已移除所有邮件 / SMTP / 模板相关控制器，只保留站点基础设置接口。
