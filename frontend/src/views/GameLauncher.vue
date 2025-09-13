<template>
  <div class="game-launcher">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <div class="loading-content">
        <div class="spinner"></div>
        <h2>正在加载游戏...</h2>
        <p>{{ loadingMessage }}</p>
      </div>
    </div>
    
    <!-- 错误状态 -->
    <div v-else-if="error" class="error-container">
      <div class="error-content">
        <div class="error-icon">❌</div>
        <h2>游戏加载失败</h2>
        <p>{{ error }}</p>
        <div class="error-actions">
          <el-button @click="goHome">返回首页</el-button>
          <el-button v-if="!hasAccess" type="primary" @click="goProfile">
            激活游戏
          </el-button>
          <el-button v-else type="primary" @click="retryLoad">
            重试
          </el-button>
        </div>
      </div>
    </div>
    
    <!-- 游戏iframe -->
    <iframe
      v-else-if="gameUrl"
      :src="gameUrl"
      class="game-frame"
      frameborder="0"
      allowfullscreen
      @load="onGameLoad"
    ></iframe>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElButton } from 'element-plus'
import { useAuthStore } from '@/store/auth'
import { checkGameAccess } from '@/api/game'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const loading = ref(true)
const error = ref('')
const loadingMessage = ref('正在检查访问权限...')
const gameUrl = ref('')
const hasAccess = ref(false)

const gameId = route.params.id as string

const checkAccess = async () => {
  try {
    loadingMessage.value = '正在检查访问权限...'
    const response = await checkGameAccess(gameId)
    
    if (response.data.hasAccess) {
      hasAccess.value = true
      loadingMessage.value = '正在加载游戏资源...'
      
      // 构建游戏URL，带上认证token - 使用新的API路径避免路由冲突
      const token = authStore.token
      gameUrl.value = `/api/game-content/${gameId}?token=${token}`
      
      // 延迟一秒让用户看到加载状态
      setTimeout(() => {
        loading.value = false
      }, 1000)
    } else {
      hasAccess.value = false
      throw new Error('您没有访问该游戏的权限，请先激活游戏')
    }
  } catch (err: any) {
    console.error('检查游戏访问权限失败:', err)
    
    if (err.response?.status === 401) {
      error.value = '请先登录后再游玩游戏'
    } else if (err.response?.status === 403) {
      error.value = '您没有访问该游戏的权限，请先激活游戏'
      hasAccess.value = false
    } else if (err.response?.status === 404) {
      error.value = '游戏不存在'
    } else {
      error.value = err.message || '加载游戏时出现错误'
    }
    
    loading.value = false
  }
}

const onGameLoad = () => {
  console.log('游戏加载完成')
}

const goHome = () => {
  router.push('/')
}

const goProfile = () => {
  router.push('/profile')
}

const retryLoad = () => {
  loading.value = true
  error.value = ''
  gameUrl.value = ''
  checkAccess()
}

onMounted(() => {
  if (!authStore.isAuthenticated) {
    error.value = '请先登录后再游玩游戏'
    loading.value = false
    return
  }
  
  checkAccess()
})
</script>

<style scoped lang="scss">
.game-launcher {
  width: 100vw;
  height: 100vh;
  background: #000;
  position: relative;
  overflow: hidden;
}

.loading-container,
.error-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.loading-content,
.error-content {
  text-align: center;
  color: white;
  padding: 40px;
}

.spinner {
  width: 60px;
  height: 60px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-left: 4px solid #fff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 20px;
}

.error-actions {
  margin-top: 30px;
  display: flex;
  gap: 15px;
  justify-content: center;
}

.game-frame {
  width: 100%;
  height: 100%;
  border: none;
}

h2 {
  font-size: 1.8rem;
  margin: 0 0 10px 0;
  font-weight: 600;
}

p {
  font-size: 1.1rem;
  margin: 0;
  opacity: 0.9;
}
</style>
