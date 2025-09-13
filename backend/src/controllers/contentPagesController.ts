import { Request, Response } from 'express'
import { getSettings, updateSettings } from '../services/settings/settingsService'

// 获取页面内容设置
export const getContentPagesSettings = async (req: Request, res: Response) => {
  try {
    const settings = await getSettings('content.pages')
    res.json({ success: true, data: settings })
  } catch (error) {
    console.error('获取页面内容设置失败:', error)
    res.status(500).json({ success: false, message: '获取页面内容设置失败' })
  }
}

// 更新页面内容设置
export const updateContentPagesSettings = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id

    // 基本数据验证
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({
        success: false,
        message: '请求数据不能为空'
      })
    }

    // 验证about页面设置
    if (req.body.about) {
      const about = req.body.about
      if (about.title && (typeof about.title !== 'string' || about.title.length === 0 || about.title.length > 100)) {
        return res.status(400).json({
          success: false,
          message: '页面标题不合法（长度需在1-100字符之间）'
        })
      }
      if (about.contentType && !['markdown', 'html'].includes(about.contentType)) {
        return res.status(400).json({
          success: false,
          message: '内容格式必须为markdown或html'
        })
      }
      if (about.content && (typeof about.content !== 'string' || about.content.length > 50000)) {
        return res.status(400).json({
          success: false,
          message: '页面内容过长（最大50000字符）'
        })
      }
      if (about.seoDescription && (typeof about.seoDescription !== 'string' || about.seoDescription.length > 200)) {
        return res.status(400).json({
          success: false,
          message: 'SEO描述过长（最大200字符）'
        })
      }
    }

    const updatedSettings = await updateSettings('content.pages', req.body, userId)
    res.json({ 
      success: true, 
      data: updatedSettings, 
      message: '页面内容设置更新成功' 
    })
  } catch (error: any) {
    console.error('更新页面内容设置失败:', error)
    res.status(500).json({ 
      success: false, 
      message: error.message || '更新页面内容设置失败' 
    })
  }
}

// 获取About页面内容（公开接口）
export const getAboutPageContent = async (req: Request, res: Response) => {
  try {
    const settings = await getSettings('content.pages')
    
    // 如果没有about配置或者明确设置为disabled，才返回404
    // 这样即使enabled字段缺失，只要有内容就可以显示
    if (!settings.about || (settings.about.enabled === false)) {
      return res.status(404).json({
        success: false,
        message: 'About页面未启用'
      })
    }

    res.json({
      success: true,
      data: {
        enabled: settings.about.enabled !== false, // 默认为true，除非明确设置为false
        title: settings.about.title || 'About',
        contentType: settings.about.contentType || 'markdown',
        content: settings.about.content || '',
        seoDescription: settings.about.seoDescription || ''
      }
    })
  } catch (error) {
    console.error('获取About页面内容失败:', error)
    res.status(500).json({
      success: false,
      message: '获取About页面内容失败'
    })
  }
}