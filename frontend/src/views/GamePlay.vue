<template>
  <div class="game-play">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <h3>{{ loadingMessage }}</h3>
        <p>请稍候，正在为您准备游戏...</p>
      </div>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-container">
      <div class="error-content">
        <div class="error-icon">❌</div>
        <h3>无法加载游戏</h3>
        <p>{{ error }}</p>
        <div class="error-actions">
          <el-button @click="goBack">返回首页</el-button>
          <el-button v-if="!hasAccess" type="primary" @click="goProfile">
            激活游戏
          </el-button>
          <el-button v-else type="primary" @click="retry">重试</el-button>
        </div>
      </div>
    </div>

    <!-- 游戏内容 -->
    <div v-else-if="gameData" class="game-container">
      <iframe
        ref="gameFrame"
        :src="gameUrl"
        class="game-iframe"
        frameborder="0"
        allowfullscreen
        @load="onGameLoaded"
      ></iframe>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { checkGameAccess, incrementPlayCount } from '@/api/game'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// 响应式数据
const loading = ref(true)
const error = ref('')
const loadingMessage = ref('正在检查访问权限...')
const gameData = ref<any>(null)
const gameFrame = ref<HTMLIFrameElement>()
const hasAccess = ref(false)

// 计算游戏URL
const gameUrl = ref('')

// 游戏时间跟踪相关
const isTestMode = ref(false)
const gameStartTime = ref<number | null>(null)
const playCountCounted = ref(false)
const playTimeTimer = ref<number | null>(null)
const isPageVisible = ref(true)
const accumulatedPlayTime = ref(0) // 累计游戏时间（排除页面不可见的时间）
const lastVisibilityTime = ref<number | null>(null)

// 检查是否为测试模式
const checkTestMode = () => {
  const testParam = route.query.test
  isTestMode.value = testParam === '1' || testParam === 'true'
  return isTestMode.value
}

// 处理页面可见性变化
const handleVisibilityChange = () => {
  if (isTestMode.value || !gameStartTime.value) return

  const now = Date.now()
  
  if (document.hidden) {
    // 页面不可见，暂停计时
    if (lastVisibilityTime.value) {
      accumulatedPlayTime.value += now - lastVisibilityTime.value
    }
    isPageVisible.value = false
    console.log('页面不可见，暂停游戏时间计算')
  } else {
    // 页面可见，恢复计时
    lastVisibilityTime.value = now
    isPageVisible.value = true
    console.log('页面可见，恢复游戏时间计算')
    
    // 检查累计时间是否已满足1分钟
    checkPlayTimeAndUpdate()
  }
}

// 检查游戏时间并更新播放次数
const checkPlayTimeAndUpdate = async () => {
  if (isTestMode.value || playCountCounted.value || !gameStartTime.value) return

  const now = Date.now()
  let totalPlayTime = accumulatedPlayTime.value
  
  // 如果页面当前可见，加上当前可见时段的时间
  if (!document.hidden && lastVisibilityTime.value) {
    totalPlayTime += now - lastVisibilityTime.value
  }

  const totalSeconds = Math.floor(totalPlayTime / 1000)
  console.log(`累计游戏时间: ${totalSeconds}秒`)

  if (totalSeconds >= 60 && !playCountCounted.value) {
    console.log('满足1分钟条件，准备调用API')
    // 立即设置标志，防止重复调用
    playCountCounted.value = true
    
    try {
      const gameId = route.params.id as string
      console.log('调用 incrementPlayCount API，游戏ID:', gameId, '游玩时长:', totalSeconds)
      const response = await incrementPlayCount(gameId, {
        isTest: false,
        playDuration: totalSeconds
      })
      
      console.log('API响应:', response)
      
      if (response.data.playCount !== undefined) {
        console.log('播放次数已更新:', response.data.playCount)
        // 清理定时器
        if (playTimeTimer.value) {
          clearInterval(playTimeTimer.value)
          playTimeTimer.value = null
        }
      } else {
        console.log('播放次数未更新:', response.message)
        // 如果更新失败，重置标志以便重试
        playCountCounted.value = false
      }
    } catch (error) {
      console.error('更新播放次数失败:', error)
      // 如果请求失败，重置标志以便重试
      playCountCounted.value = false
    }
  }
}

// 开始游戏时间跟踪
const startGameTimer = () => {
  if (isTestMode.value) {
    console.log('测试模式，不启动时间跟踪')
    return
  }

  const now = Date.now()
  gameStartTime.value = now
  lastVisibilityTime.value = now
  accumulatedPlayTime.value = 0
  isPageVisible.value = !document.hidden
  
  console.log('开始游戏时间跟踪')

  // 每秒检查一次游戏时间
  playTimeTimer.value = setInterval(() => {
    checkPlayTimeAndUpdate()
  }, 1000) as any

  // 监听页面可见性变化
  document.addEventListener('visibilitychange', handleVisibilityChange)
}

// 停止游戏时间跟踪
const stopGameTimer = () => {
  if (playTimeTimer.value) {
    clearInterval(playTimeTimer.value)
    playTimeTimer.value = null
  }
  
  // 移除页面可见性监听
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  
  gameStartTime.value = null
  lastVisibilityTime.value = null
  accumulatedPlayTime.value = 0
}

// 检查游戏访问权限
const checkAccess = async () => {
  try {
    loading.value = true
    error.value = ''
    loadingMessage.value = '正在检查访问权限...'

    const gameId = route.params.id as string
    if (!gameId) {
      throw new Error('游戏ID无效')
    }

    // 检查是否为测试模式
    const testMode = checkTestMode()
    if (testMode) {
      console.log('管理员测试模式')
    }

    // 检查用户是否登录
    if (!authStore.isAuthenticated) {
      throw new Error('请先登录后再游玩游戏')
    }

    // 验证游戏访问权限
    const response = await checkGameAccess(gameId)
    gameData.value = response.data
    hasAccess.value = response.data.hasAccess

    if (hasAccess.value) {
      loadingMessage.value = '正在加载游戏资源...'

      // 构建游戏URL
      const apiBase = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined
      let baseUrl = ''
      
      if (apiBase && /^https?:\/\//i.test(apiBase)) {
        try {
          const url = new URL(apiBase)
          let pathname = url.pathname.replace(/\/$/, '')
          if (pathname.endsWith('/api')) {
            pathname = pathname.slice(0, -4)
          }
          baseUrl = url.origin + (pathname === '/' ? '' : pathname)
        } catch {
          baseUrl = window.location.origin
        }
      } else {
        baseUrl = window.location.origin
      }

      // 构建游戏访问URL，带上认证token
      const token = authStore.token
      const queryParams = new URLSearchParams()
      if (token) queryParams.set('token', token)
      if (testMode) queryParams.set('test', '1')
      
      gameUrl.value = `${baseUrl}/game/${gameId}?${queryParams.toString()}`

      // 如果是测试模式，发送测试请求但不计入播放次数
      if (testMode) {
        try {
          await incrementPlayCount(gameId, { isTest: true })
          console.log('测试模式请求已发送')
        } catch (error) {
          console.error('测试模式请求失败:', error)
        }
      }
      
      // 延迟一秒让用户看到加载状态
      setTimeout(() => {
        loading.value = false
        // 只有在非测试模式下才开始时间跟踪
        if (!testMode) {
          startGameTimer()
        }
      }, 1000)
    } else {
      throw new Error('您没有访问该游戏的权限，请先激活游戏')
    }
    
  } catch (err: any) {
    console.error('加载游戏失败:', err)
    
    if (err.response?.status === 401) {
      error.value = '请先登录后再游玩游戏'
    } else if (err.response?.status === 403) {
      error.value = '您没有访问该游戏的权限，请先激活游戏'
      hasAccess.value = false
    } else if (err.response?.status === 404) {
      error.value = '游戏不存在'
    } else {
      error.value = err.message || '加载游戏失败'
    }
    
    loading.value = false
  }
}

// 游戏加载完成
const onGameLoaded = () => {
  console.log('游戏加载完成')
}

// 返回首页
const goBack = () => {
  router.push('/')
}

// 跳转到个人中心
const goProfile = () => {
  router.push('/profile')
}

// 重试
const retry = () => {
  checkAccess()
}

// 处理键盘事件（ESC键退出全屏）
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    goBack()
  }
}

onMounted(() => {
  checkAccess()
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  // 清理定时器
  stopGameTimer()
})
</script>

<style scoped>
.game-play {
  height: 100vh;
  width: 100vw;
  position: fixed;
  top: 0;
  left: 0;
  background: #000;
  z-index: 9999;
}

.loading-container,
.error-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: white;
}

.loading-content,
.error-content {
  text-align: center;
  max-width: 400px;
  padding: 2rem;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 3px solid #ffffff33;
  border-top: 3px solid #fff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.error-actions {
  margin-top: 2rem;
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.game-container {
  height: 100%;
  width: 100%;
}

.game-iframe {
  width: 100%;
  height: 100%;
  border: none;
  background: #000;
}

h3 {
  margin: 1rem 0 0.5rem;
  font-size: 1.5rem;
}

p {
  margin: 0;
  opacity: 0.8;
  line-height: 1.5;
}
</style>
