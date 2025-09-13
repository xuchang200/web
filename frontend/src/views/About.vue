<template>
  <div class="about-page" :class="{ 'markdown-background': isMarkdownContent }">
    <!-- 电脑端简化顶栏 -->
    <header class="simple-header desktop-only">
      <div class="header-content">
        <div class="logo" @click="$router.push('/')">
          <span class="logo-text">{{ siteInfo.siteName }}</span>
        </div>
        <nav class="navigation">
          <router-link to="/">首页</router-link>
          <router-link to="/profile">个人中心</router-link>
        </nav>
      </div>
    </header>
    
    <!-- 移动端导航 -->
    <MobileNav
      :site-info="siteInfo"
      class="mobile-only"
    />

    <div class="about-content">
      <div class="container">
        <!-- 加载状态 -->
        <div v-if="loading" class="loading-container">
          <el-skeleton :rows="8" animated />
        </div>
        
        <!-- 内容显示 -->
        <div v-else-if="aboutContent && aboutContent.enabled">
          <!-- HTML内容 - 保持原有样式 -->
          <div v-if="aboutContent.contentType === 'html'" class="html-content-wrapper">
            <h1 class="page-title">{{ aboutContent.title }}</h1>
            <div class="html-content" v-html="aboutContent.content"></div>
          </div>
          
          <!-- Markdown内容 - 使用毛玻璃卡片样式 -->
          <div v-else class="markdown-content-wrapper">
            <div class="markdown-card">
              <h1 class="page-title">{{ aboutContent.title }}</h1>
              <div class="markdown-content" v-html="markdownToHtml"></div>
            </div>
          </div>
        </div>
        
        <!-- 页面未启用提示 -->
        <div v-else-if="aboutContent && !aboutContent.enabled" class="disabled-notice">
          <el-empty description="关于页面暂未开放" />
        </div>
        
        <!-- 错误状态 -->
        <div v-else class="error-container">
          <el-result
            icon="error"
            title="加载失败"
            sub-title="无法加载页面内容，请稍后重试"
          >
            <template #extra>
              <el-button type="primary" @click="loadAboutContent">重新加载</el-button>
            </template>
          </el-result>
        </div>
      </div>
    </div>
    
    <!-- 版权信息 -->
    <SiteFooter />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { fetchAboutContent } from '@/api/publicSettings'
import { useSiteInfoStore } from '@/store/siteInfo'
import type { AboutContentSettings } from '@/api/publicSettings'
import MobileNav from '@/components/MobileNav.vue'
import SiteFooter from '@/components/SiteFooter.vue'

// 简单的markdown转HTML函数
function parseMarkdown(markdown: string): string {
  return markdown
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^\*\*(.*)\*\*/gm, '<strong>$1</strong>')
    .replace(/^\*(.*)\*/gm, '<em>$1</em>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^(.*)$/gm, '<p>$1</p>')
    .replace(/<p><\/p>/g, '')
    .replace(/<p><h/g, '<h')
    .replace(/<\/h([1-6])><\/p>/g, '</h$1>')
}

const siteInfo = useSiteInfoStore()
const loading = ref(true)
const aboutContent = ref<AboutContentSettings | null>(null)

// 计算属性判断是否为markdown内容
const isMarkdownContent = computed(() => {
  const result = aboutContent.value && aboutContent.value.enabled && aboutContent.value.contentType === 'markdown'
  console.log('isMarkdownContent:', result, {
    hasContent: !!aboutContent.value,
    enabled: aboutContent.value?.enabled,
    contentType: aboutContent.value?.contentType
  })
  return result
})

// 将markdown转换为HTML
const markdownToHtml = computed(() => {
  if (!aboutContent.value?.content || aboutContent.value.contentType !== 'markdown') {
    return ''
  }
  return parseMarkdown(aboutContent.value.content)
})

// 加载关于页面内容
const loadAboutContent = async () => {
  try {
    loading.value = true
    const response = await fetchAboutContent()
    
    if (response.success && response.data) {
      aboutContent.value = response.data
      
      // 设置页面标题
      if (aboutContent.value.title) {
        document.title = `${aboutContent.value.title} - ${siteInfo.siteName}`
      }
      
      // 设置SEO描述
      if (aboutContent.value.seoDescription) {
        const metaDescription = document.querySelector('meta[name="description"]')
        if (metaDescription) {
          metaDescription.setAttribute('content', aboutContent.value.seoDescription)
        } else {
          const meta = document.createElement('meta')
          meta.name = 'description'
          meta.content = aboutContent.value.seoDescription
          document.head.appendChild(meta)
        }
      }
    }
  } catch (error) {
    console.error('加载关于页面内容失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadAboutContent()
})
</script>

<style lang="scss" scoped>
@font-face {
    font-family: "ZSFT-dd";
    src: url("https://fontsapi.zeoseven.com/dd/main.woff2") format("woff2"),
        url("https://fontsapi-storage.zeoseven.com/dd/main.woff2") format("woff2");
    font-display: swap;
}

.about-page {
  min-height: 100vh;
  
  // Markdown内容时使用全屏背景
  &.markdown-background {
    background: url('@/assets/images/login-background.jpg') no-repeat center center !important;
    background-size: cover !important;
    background-attachment: fixed !important;
  }
}

// 简化顶栏样式（复制自Profile.vue）
.simple-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 128, 171, 0.2);
  box-shadow: 0 2px 20px rgba(255, 128, 171, 0.1);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 40px;
  height: 70px;
  max-width: 1200px;
  margin: 0 auto;
}

.logo {
  cursor: pointer;
  transform: translate(-5px, 2px);
  
  .logo-text {
    font-family: 'ZSFT-dd', cursive;
    font-size: 2rem;
    font-weight: 700;
    color: #ff4081;
    text-shadow: 2px 2px 0px #ff80ab, 4px 4px 8px rgba(255, 64, 129, 0.3);
    transition: all 0.3s ease;
    
    &:hover {
      transform: scale(1.05);
      color: #f50057;
    }
  }
}

.navigation {
  display: flex;
  gap: 30px;
  
  a {
    color: #666;
    text-decoration: none;
    font-weight: 500;
    font-size: 1rem;
    transition: all 0.3s ease;
    
    &:hover {
      color: #ff4081;
    }
    
    &.router-link-active {
      color: #ff4081;
      font-weight: 600;
    }
  }
}

.about-content {
  padding-top: 100px;
  min-height: 100vh;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}

// HTML内容样式 - 保持原有样式
.html-content-wrapper {
  background: white;
  border-radius: 8px;
  padding: 32px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  max-width: 800px;
  margin: 0 auto;

  .page-title {
    font-size: 32px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin-bottom: 24px;
    text-align: center;
  }

  .html-content {
    line-height: 1.8;
    color: var(--el-text-color-regular);

    :deep(h1) {
      font-size: 28px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      margin: 24px 0 16px 0;
    }

    :deep(h2) {
      font-size: 24px;
      font-weight: 500;
      color: var(--el-text-color-primary);
      margin: 20px 0 12px 0;
    }

    :deep(h3) {
      font-size: 20px;
      font-weight: 500;
      color: var(--el-text-color-primary);
      margin: 16px 0 8px 0;
    }

    :deep(p) {
      margin-bottom: 16px;
    }

    :deep(strong) {
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
  }
}

// Markdown内容样式 - 使用毛玻璃卡片，背景由父元素提供
.markdown-content-wrapper {
  min-height: calc(100vh - 100px);
  padding: 40px 20px;

  .markdown-card {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border: 2px solid #ff80ab;
    border-radius: 20px;
    box-shadow: 0 8px 30px rgba(255, 128, 171, 0.2);
    padding: 32px;
    max-width: 800px;
    margin: 0 auto;

    .page-title {
      font-family: 'ZSFT-dd', cursive;
      font-size: 2rem;
      font-weight: 700;
      color: #ff4081;
      margin-bottom: 24px;
      text-align: center;
      text-shadow: 1px 1px 2px rgba(255, 64, 129, 0.2);
    }

    .markdown-content {
      line-height: 1.8;
      color: var(--el-text-color-regular);

      :deep(h1) {
        font-size: 28px;
        font-weight: 600;
        color: #ff4081;
        margin: 24px 0 16px 0;
      }

      :deep(h2) {
        font-size: 24px;
        font-weight: 500;
        color: #ff4081;
        margin: 20px 0 12px 0;
      }

      :deep(h3) {
        font-size: 20px;
        font-weight: 500;
        color: #ff4081;
        margin: 16px 0 8px 0;
      }

      :deep(p) {
        margin-bottom: 16px;
      }

      :deep(strong) {
        font-weight: 600;
        color: #ff4081;
      }
    }
  }
}

.loading-container,
.disabled-notice,
.error-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  padding-top: 100px;
}

// 响应式设计
.desktop-only {
  display: block;
}

.mobile-only {
  display: none;
}

@media (max-width: 768px) {
  .desktop-only {
    display: none;
  }
  
  .mobile-only {
    display: block;
  }

  .about-content {
    padding-top: 80px; /* 为移动端导航预留60px + 20px */
  }
  
  .container {
    padding: 20px 15px;
  }
  
  .html-content-wrapper {
    padding: 20px;
    
    .page-title {
      font-size: 24px;
    }
  }

  .markdown-content-wrapper {
    padding: 20px 15px;
    
    .markdown-card {
      padding: 20px;
      
      .page-title {
        font-size: 1.5rem;
      }
    }
  }

  .header-content {
    padding: 0 20px;
  }
}

@media (max-width: 480px) {
  .header-content {
    padding: 0 15px;
  }
  
  .logo .logo-text {
    font-size: 1.5rem;
  }
  
  .navigation {
    gap: 15px;
    
    .nav-link {
      font-size: 0.9rem;
    }
  }
}
</style>