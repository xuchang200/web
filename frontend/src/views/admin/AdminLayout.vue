<template>
  <div class="admin-layout">
    <el-container>
      <!-- 侧边栏 -->
      <el-aside width="200px" class="admin-sidebar">
        <div class="logo-container">
          <h2 class="logo">{{ siteInfo.siteName }}</h2>
          <p class="subtitle">管理后台</p>
        </div>
        
        <el-menu
          :default-active="$route.path"
          router
          class="admin-menu"
          background-color="#304156"
          text-color="#bfcbd9"
          active-text-color="#409EFF"
        >
          <el-menu-item index="/admin/analytics">
            <el-icon><TrendCharts /></el-icon>
            <span>数据分析</span>
          </el-menu-item>
          
          <el-menu-item index="/admin/users">
            <el-icon><User /></el-icon>
            <span>用户管理</span>
          </el-menu-item>
          
          <el-menu-item index="/admin/games">
            <el-icon><VideoPlay /></el-icon>
            <span>游戏管理</span>
          </el-menu-item>
          
          <el-menu-item index="/admin/codes">
            <el-icon><Key /></el-icon>
            <span>激活码管理</span>
          </el-menu-item>
          
          <el-menu-item index="/admin/logs">
            <el-icon><Document /></el-icon>
            <span>日志管理</span>
          </el-menu-item>
          
          <el-menu-item index="/admin/settings">
            <el-icon><Setting /></el-icon>
            <span>系统设置</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <!-- 主要内容区 -->
      <el-container>
        <!-- 顶部导航栏 -->
        <el-header class="admin-header">
          <div class="header-content">
            <h1 class="page-title">{{ pageTitle }}</h1>
            <div class="user-info">
              <el-dropdown>
                <span class="el-dropdown-link">
                  <el-avatar :size="30" src="https://via.placeholder.com/30" />
                  <span style="margin-left: 8px">{{ authStore.user?.username || '管理员' }}</span>
                  <el-icon class="el-icon--right"><arrow-down /></el-icon>
                </span>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="logout">退出登录</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
        </el-header>

        <!-- 主要内容 -->
        <el-main class="admin-main">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import {
  User,
  VideoPlay,
  Key,
  Document,
  Setting,
  ArrowDown,
  TrendCharts
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// 根据路由计算页面标题
const pageTitle = computed(() => {
  const titleMap: Record<string, string> = {
    '/admin/analytics': '数据分析仪表盘',
    '/admin/users': '用户管理',
    '/admin/games': '游戏管理',
    '/admin/codes': '激活码管理',
    '/admin/logs': '日志管理',
    '/admin/settings': '系统设置'
  }
  return titleMap[route.path] || '管理后台'
})

// 退出登录
const logout = () => {
  // TODO: 清除登录状态
  router.push('/login')
}
import { useSiteInfoStore } from '@/store/siteInfo'
const siteInfo = useSiteInfoStore()
</script>

<style lang="scss" scoped>
.admin-layout {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  
  .el-container {
    height: 100%;
    width: 100%;
  }
}

.admin-sidebar {
  background-color: #304156;
  overflow: hidden;
  flex: 0 0 200px !important;
  width: 200px !important;
  min-width: 200px !important;
  max-width: 200px !important;
  
  .logo-container {
    padding: 20px;
    text-align: center;
    border-bottom: 1px solid #434a50;
    
    .logo {
      color: #fff;
      font-size: 18px;
      font-weight: bold;
      margin: 0 0 5px 0;
      background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .subtitle {
      color: #bfcbd9;
      font-size: 12px;
      margin: 0;
    }
  }
  
  .admin-menu {
    border: none;
    width: 100%;
    
    :deep(.el-menu-item) {
      height: 50px;
      line-height: 50px;
      
      .el-icon {
        width: 16px !important;
        height: 16px !important;
        margin-right: 8px !important;
        font-size: 16px !important;
        flex-shrink: 0;
      }
      
      span {
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      &:hover {
        background-color: #263445 !important;
      }
      
      &.is-active {
        background-color: #409EFF !important;
      }
    }
  }
}

.admin-header {
  background-color: #fff;
  border-bottom: 1px solid #e4e7ed;
  padding: 0 20px;
  flex: 0 0 60px !important;
  height: 60px !important;
  
  .header-content {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    
    .page-title {
      color: #303133;
      font-size: 20px;
      font-weight: 500;
      margin: 0;
    }
    
    .user-info {
      .el-dropdown-link {
        cursor: pointer;
        color: #409EFF;
        display: flex;
        align-items: center;
        
        .el-icon {
          margin-left: 4px;
          font-size: 12px;
        }
        
        &:hover {
          color: #66b1ff;
        }
      }
    }
  }
}

.admin-main {
  background-color: #f0f2f5;
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}
</style>