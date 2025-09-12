import { AppError } from '../utils/AppError';
import prisma from '../lib/prisma';

// 系统设置接口
export interface SiteSettings {
  siteName: string;
  siteDescription: string;
  adminEmail: string;
  allowRegistration: boolean;
}

// 获取网站设置
export const getSiteSettings = async (): Promise<SiteSettings> => {
  try {
    const settings = await prisma.systemSettings.findUnique({
      where: { key: 'site_settings' }
    });
    
    if (!settings) {
      // 返回默认设置
      return {
        siteName: 'LOVEisLOVE',
        siteDescription: '一个专注于文字冒险游戏的个人平台',
        adminEmail: 'admin@example.com',
        allowRegistration: true
      };
    }
    
  // 通过 unknown 再断言，确保绕过 Prisma JsonValue 联合类型限制
  return settings.value as unknown as SiteSettings;
  } catch (error) {
    console.error('Failed to get site settings:', error);
    throw new AppError('Failed to get site settings', 500);
  }
};

// 更新网站设置
export const updateSiteSettings = async (settings: SiteSettings): Promise<void> => {
  try {
    const plain: Record<string, any> = { ...settings };
    await prisma.systemSettings.upsert({
      where: { key: 'site_settings' },
      update: { value: plain },
      create: { key: 'site_settings', value: plain }
    });
  } catch (error) {
    console.error('Failed to update site settings:', error);
    throw new AppError('Failed to update site settings', 500);
  }
};

// 之前的 SMTP / 邮件模板 / 验证码相关逻辑已移除。
