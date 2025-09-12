<template>
  <div class="home-page">
    <!-- 顶部导航�?-->
    <header class="home-header">
      <div class="header-content">
        <!-- Logo -->
        <div class="logo" @click="$router.push('/')">
          <span class="logo-text">{{ siteInfo.siteName }}</span>
        </div>
        
        <!-- 搜索�?-->
        <div class="search-container">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索你喜欢的游戏..."
            class="search-input"
            @input="handleSearch"
          />
          <div v-if="searchQuery && filteredGames.length === 0" class="no-results">
            没有找到相关游戏
          </div>
        </div>
        
        <!-- 用户操作�?-->
        <div class="user-actions">
          <!-- 未登录状�?-->
          <div v-if="!authStore.isAuthenticated" class="auth-buttons">
            <router-link to="/login" class="login-btn">登录</router-link>
            <router-link to="/register" class="register-btn">注册</router-link>
          </div>
          
          <!-- 已登录状�?-->
          <div v-else class="user-profile" @click="toggleUserMenu">
            <div class="user-avatar">{{ userAvatarText }}</div>
            <div v-if="showUserMenu" class="user-dropdown">
              <router-link to="/profile" class="dropdown-item">
                <span>个人中心</span>
              </router-link>
              <div class="dropdown-item" @click="handleLogout">
                <span>退出登录</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- 主内容区 -->
    <main class="main-content">
      <div class="content-container">
        <!-- 欢迎标题 -->
        <div class="welcome-section">
          <p v-if="authStore.isAuthenticated" class="welcome-subtitle">
            欢迎回来，{{ authStore.user?.username }}！发现更多和ta的美好故事吧（´v｀）
          </p>
          <p v-else class="welcome-subtitle">发现更多和ta的美好故事吧（´v｀）</p>
        </div>

        <!-- 游戏网格 -->
        <div class="games-grid">
          <GameCard
            v-for="game in displayedGames"
            :key="game.id"
            :game="game"
            @play="playGame"
          />
        </div>

        <!-- 空状态 -->
        <div v-if="displayedGames.length === 0 && !loading" class="empty-state">
          <div class="empty-content">
            <div class="empty-icon">🎮</div>
            <h3>这里空空如也呢。。。</h3>
            <p>暂时没有可用的游戏</p>
          </div>
        </div>
        
        <!-- 加载状态 -->
        <div v-if="loading" class="empty-state">
          <div class="empty-content">
            <div class="empty-icon">⏳</div>
            <h3>正在加载游戏...</h3>
            <p>请稍候</p>
          </div>
        </div>
      </div>
    </main>
    <SiteFooter />
    <AnnouncementDialog />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { msg, TextEx } from '@/utils/message'
import GameCard from '@/components/GameCard.vue'
import { getUserProfile } from '@/api/user'
import { getPublishedGameList, checkGameAccess } from '@/api/game'
import type { Game } from '@/types/game'

const router = useRouter()
const authStore = useAuthStore()

// 响应式数�?
const userProfile = ref(null)
const games = ref<Game[]>([])
const loading = ref(false)

// 计算头像显示内容（用户名第一个字符）
const userAvatarText = computed(() => {
  const username = authStore.user?.username
  return username ? username.charAt(0).toUpperCase() : 'U'
})

// 获取用户详细信息
const fetchUserProfile = async () => {
  if (!authStore.isAuthenticated) return
  
  try {
    const response = await getUserProfile()
    userProfile.value = response.data
  } catch (error) {
    console.error('获取用户信息失败:', error)
    // 如果获取用户信息失败，可能是token过期
  msg.error(TextEx.loadUserFail + '，请重新登录', 'home-load-user-fail')
  }
}
const searchQuery = ref('')
const showGamesList = ref(false)
const showUserMenu = ref(false)

// 获取游戏列表
const fetchGames = async () => {
  loading.value = true
  try {
    const response = await getPublishedGameList()
    // 将数据库字段映射到前端期望的字段
    games.value = response.data.games.map((game: any) => ({
      id: game.id,
      title: game.name, // 数据库中�?name，前端用 title
      description: game.description || '暂无描述',
      coverImage: game.coverImage || `https://via.placeholder.com/300x200/ff80ab/ffffff?text=${encodeURIComponent(game.name)}`,
      playCount: game.playCount,
      rating: 4.5, // 暂时使用默认评分，因为数据库没有这个字段
      path: game.path,
      activationCount: game.activationCount
    }))
  } catch (error) {
    console.error('获取游戏列表失败:', error)
  msg.error(TextEx.loadGamesFail, 'home-load-games-fail')
  } finally {
    loading.value = false
  }
}

// 计算属�?
const featuredGames = computed(() => games.value.slice(0, 3))

const filteredGames = computed(() => {
  if (!searchQuery.value) return games.value
  
  return games.value.filter(game => 
    game.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    game.description.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

const displayedGames = computed(() => filteredGames.value)

// 方法
const toggleGamesList = () => {
  showGamesList.value = !showGamesList.value
  showUserMenu.value = false
}

const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value
  showGamesList.value = false
}

const handleSearch = () => {
  // 搜索逻辑已通过计算属性实�?
}

const playGame = async (gameId: string) => {
  try {
    // 如果用户未登录，提示需要登录
    if (!authStore.isAuthenticated) {
  msg.validation(TextEx.needLoginToPlay, 'home-need-login-play')
      router.push('/login')
      return
    }

    // 检查用户是否有游戏访问权限
    try {
      const accessResponse = await checkGameAccess(gameId)
      
      if (accessResponse.data.hasAccess) {
        // 有权限，直接跳转到游戏页面
        console.log('启动游戏:', gameId)
        
        // 跳转到游戏页面
        const gameUrl = `/game/${gameId}`
        // 打开新窗口/标签页来显示游戏
        window.open(gameUrl, '_blank')
      } else {
        // 没有权限，提示用户需要激活游戏
  msg.error(TextEx.noAccessGame, 'home-no-access-game')
        router.push('/profile')
      }
    } catch (accessError: any) {
      // 权限检查失败的处理
      if (accessError.response?.status === 403) {
  msg.error(TextEx.noPermissionGame, 'home-no-permission-game')
        router.push('/profile')
      } else if (accessError.response?.status === 404) {
  msg.error(TextEx.gameNotExist, 'home-game-not-exist')
      } else {
        console.error('检查游戏访问权限失败:', accessError)
  msg.error(TextEx.checkGameAccessFail, 'home-check-access-fail')
      }
    }
  } catch (error) {
    console.error('启动游戏失败:', error)
  msg.error(TextEx.launchGameFail, 'home-launch-fail')
  }
}

const handleLogout = () => {
  authStore.logout()
  showUserMenu.value = false
  msg.success(TextEx.logoutSuccessStrong, 'home-logout-success')
  router.push('/login')
}

// 点击外部关闭下拉菜单
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement
  if (!target.closest('.games-nav') && !target.closest('.user-profile')) {
    showGamesList.value = false
    showUserMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  // 如果用户已登录，获取用户详细信息
  fetchUserProfile()
  // 获取游戏列表
  fetchGames()
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
import { useSiteInfoStore } from '@/store/siteInfo'
import SiteFooter from '@/components/SiteFooter.vue'
import AnnouncementDialog from '@/components/AnnouncementDialog.vue'
const siteInfo = useSiteInfoStore()
</script>

<style scoped lang="scss">
@font-face {
    font-family: "ZSFT-dd";
    src: url("https://fontsapi.zeoseven.com/dd/main.woff2") format("woff2"),
        url("https://fontsapi-storage.zeoseven.com/dd/main.woff2") format("woff2");
    font-display: swap;
}

.home-page {
  min-height: 100vh;
  background: url('@/assets/images/login-background.jpg') no-repeat center center;
  background-size: cover;
  background-attachment: fixed;
}

.home-header {
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
  transform: translate(-5px, 2px); /* 向左下方微调 */
  
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


.search-container {
  position: relative;
  flex: 1;
  max-width: 300px;
  margin-right: 30px;
}

.search-input {
  width: 100%;
  padding: 12px 20px;
  border: 2px solid #ff80ab;
  border-radius: 25px;
  background: rgba(255, 255, 255, 0.9);
  color: #333;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  outline: none;
  
  &:focus {
    border-color: #ff4081;
    background: white;
    box-shadow: 0 0 20px rgba(255, 64, 129, 0.2);
  }
  
  &::placeholder {
    color: #999;
  }
}

.no-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 2px solid #ff80ab;
  border-top: none;
  border-radius: 0 0 15px 15px;
  padding: 10px 20px;
  color: #666;
  font-size: 0.9rem;
  text-align: center;
}

.user-actions {
  display: flex;
  align-items: center;
}

.auth-buttons {
  display: flex;
  gap: 10px;
  
  a {
    padding: 10px 20px;
    border-radius: 20px;
    text-decoration: none;
    font-weight: 600;
    font-size: 0.9rem;
    transition: all 0.3s ease;
    border: 2px solid transparent;
    
    &.login-btn {
      color: #ff4081;
      border-color: #ff4081;
      background: transparent;
      
      &:hover {
        background: #ff4081;
        color: white;
        box-shadow: 0 4px 15px rgba(255, 64, 129, 0.3);
      }
    }
    
    &.register-btn {
      background: linear-gradient(135deg, #ff4081 0%, #ff80ab 100%);
      color: white;
      border-bottom: 3px solid #e91e63;
      
      &:hover {
        background: linear-gradient(135deg, #f50057 0%, #ff4081 100%);
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(255, 64, 129, 0.4);
      }
    }
  }
}

.user-profile {
  position: relative;
  cursor: pointer;
  
  .user-avatar {
    width: 45px;
    height: 45px;
    border-radius: 50%;
    border: 3px solid #ff4081;
    transition: all 0.3s ease;
    object-fit: cover; /* 确保图片内容充满圆形而不变形 */
    display: block; /* 移除图片底部的额外空�?*/
    background-color: #ffcdd2; /* 为文字头像添加背景色 */
    
    &:hover {
      border-color: #f50057;
      box-shadow: 0 0 15px rgba(255, 64, 129, 0.3);
    }
  }
}

.user-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border-radius: 15px;
  border: 2px solid #ff80ab;
  box-shadow: 0 8px 30px rgba(255, 128, 171, 0.2);
  padding: 10px 0;
  min-width: 150px;
  z-index: 1001;
  animation: fadeInDown 0.3s ease;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  color: #333;
  text-decoration: none;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  cursor: pointer;
  
  &:hover {
    background: rgba(255, 128, 171, 0.1);
    color: #ff4081;
  }
  
  .item-icon {
    font-size: 1.1rem;
  }
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.main-content {
  padding-top: 100px; // 为固定顶栏留空间
  min-height: 100vh;
}

.content-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}

.welcome-section {
  text-align: center;
  margin-bottom: 50px;
  height: 80px; /* 增加一些高度以保持布局稳定 */
  display: flex;
  align-items: center;
  justify-content: center;
}

.welcome-subtitle {
  font-size: 1.5rem; /* 调整为小�?*/
  color: rgba(255, 255, 255, 0.95);
  margin: 0;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.6);
  font-weight: 600;
}

@keyframes glow {
  from {
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 64, 129, 0.5);
  }
  to {
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5), 0 0 30px rgba(255, 64, 129, 0.8);
  }
}

.games-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 30px;
  margin-bottom: 50px;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.empty-content {
  text-align: center;
  background: rgba(255, 255, 255, 0.9);
  padding: 50px;
  border-radius: 20px;
  border: 3px solid #ff80ab;
  max-width: 400px;
  
  .empty-icon {
    font-size: 4rem;
    margin-bottom: 20px;
  }
  
  h3 {
    font-family: 'ZSFT-dd', cursive;
    color: #ff4081;
    margin: 0 0 15px 0;
    font-size: 1.5rem;
  }
  
  p {
    color: #666;
    margin: 0;
    font-size: 1rem;
  }
}

// 响应式设�?
@media (max-width: 1024px) {
  .header-content {
    padding: 0 20px;
  }
  
  
  .search-container {
    max-width: 200px;
    margin: 0 20px;
  }
  
  .welcome-title {
    font-size: 2.5rem;
  }
  
  .games-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
  }
}

@media (max-width: 768px) {
  .header-content {
    flex-wrap: nowrap; // 改为不换�?
    height: auto;
    padding: 15px 20px;
    gap: 15px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .logo {
    order: 1; // Logo 第一�?
    flex: 0 0 auto;
  }
  
  .search-container {
    order: 2; // 搜索框第二个（中间）
    flex: 1;
    max-width: 180px; // 减小搜索框宽度适应手机
    margin: 0 15px; // 左右边距
  }
  
  .user-actions {
    order: 3; // 用户操作区第三个（最右边�?
    flex: 0 0 auto;
  }
  
  .main-content {
    padding-top: 120px;
  }
  
  .welcome-title {
    font-size: 2rem;
  }
  
  .games-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 15px;
  }
  
  .games-dropdown,
  .user-dropdown {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 90%;
    max-width: 300px;
  }
}

@media (max-width: 480px) {
  .logo .logo-text {
    font-size: 1.5rem;
  }
  
  
  .search-input {
    padding: 10px 15px;
    font-size: 0.8rem;
  }
  
  .auth-buttons a {
    padding: 8px 15px;
    font-size: 0.8rem;
  }
  
  .welcome-title {
    font-size: 1.8rem;
  }
  
  .welcome-subtitle {
    font-size: 1rem;
  }
  
  .games-grid {
    grid-template-columns: 1fr; /* 在小屏幕上每行显示一个卡�?*/
    gap: 20px;
    max-width: 400px; /* 限制最大宽度，居中显示 */
    margin: 0 auto; /* 居中对齐 */
  }
  
  .content-container {
    padding: 30px 15px;
  }
}
</style>
