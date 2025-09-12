import { Request, Response } from 'express';
import { getSiteSettings, updateSiteSettings, SiteSettings } from '../services/settingsService';
import { AppError } from '../utils/AppError';

// 获取网站设置
export const getSiteSettingsController = async (req: Request, res: Response) => {
  try {
    const settings = await getSiteSettings();
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
    const settings: SiteSettings = req.body;
    
    // 基本验证
    if (!settings.siteName || !settings.adminEmail) {
      throw new AppError('网站名称和管理员邮箱不能为空', 400);
    }

    await updateSiteSettings(settings);
    
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
