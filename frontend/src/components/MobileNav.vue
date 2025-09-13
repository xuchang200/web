<template>
  <div class="mobile-nav">
    <!-- 移动端导航栏 -->
    <nav class="nav-mobile">
      <div class="logo" @click="$router.push('/')">
        <span class="logo-text">{{ siteInfo.siteName || 'withU' }}</span>
      </div>
      
      <button 
        class="menu-toggle"
        @click="toggleMenu"
        :class="{ active: isMenuOpen }"
        aria-label="切换菜单"
      >
        <span class="hamburger-icon">
          <span></span>
          <span></span>
          <span></span>
        </span>
      </button>
    </nav>
    
    <!-- 移动端下拉菜单 -->
    <div class="nav-mobile-menu" :class="{ open: isMenuOpen }">
      <div class="menu-content">
        <!-- 搜索框 -->
        <div class="search-section">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索游戏..."
            class="search-input"
            @input="handleSearch"
          />
        </div>
        
        <!-- 菜单项 -->
        <div class="menu-items">
          <!-- 未登录状态 -->
          <template v-if="!authStore.isAuthenticated">
            <router-link to="/login" class="menu-item" @click="closeMenu">
              <span class="menu-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
              <span>登录</span>
            </router-link>
            <router-link to="/register" class="menu-item" @click="closeMenu">
              <span class="menu-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <polyline points="14,2 14,8 20,8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <polyline points="10,9 9,9 8,9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
              <span>注册</span>
            </router-link>
          </template>
          
          <!-- 已登录状态 -->
          <template v-else>
            <div class="user-info">
              <div class="user-avatar">{{ userAvatarText }}</div>
              <span>{{ authStore.user?.username }}</span>
            </div>
            <!-- 个人中心 -->
            <router-link to="/profile" class="menu-item" @click="closeMenu">
              <span class="menu-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M20.59 22C20.59 18.13 16.74 15 12 15C7.26 15 3.41 18.13 3.41 22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
              <span>个人中心</span>
            </router-link>
            <!-- 首页 -->
            <router-link to="/" class="menu-item" @click="closeMenu">
              <span class="menu-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <polyline points="9,22 9,12 15,12 15,22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
              <span>首页</span>
            </router-link>
            <!-- 关于我们 -->
            <router-link to="/about" class="menu-item" @click="closeMenu">
              <span class="menu-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M12 16v-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M12 8h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
              <span>关于我们</span>
            </router-link>
            <!-- 退出登录 -->
            <div class="menu-item" @click="handleLogout">
              <span class="menu-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <polyline points="16,17 21,12 16,7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
              <span>退出登录</span>
            </div>
          </template>
        </div>
      </div>
    </div>
    
    <!-- 遮罩层 -->
    <div 
      v-if="isMenuOpen" 
      class="menu-overlay" 
      @click="closeMenu"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'

interface Props {
  siteInfo?: {
    siteName: string
  }
  searchQuery?: string
}

interface Emits {
  (e: 'search', query: string): void
  (e: 'logout'): void
}

const props = withDefaults(defineProps<Props>(), {
  siteInfo: () => ({ siteName: 'withU' }),
  searchQuery: ''
})

const emit = defineEmits<Emits>()

const router = useRouter()
const authStore = useAuthStore()

// 响应式数据
const isMenuOpen = ref(false)
const searchQuery = ref(props.searchQuery)

// 计算属性
const userAvatarText = computed(() => {
  if (authStore.user?.username) {
    return authStore.user.username.charAt(0).toUpperCase()
  }
  return '?'
})

// 方法
const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
  if (isMenuOpen.value) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
}

const closeMenu = () => {
  isMenuOpen.value = false
  document.body.style.overflow = ''
}

const handleSearch = () => {
  emit('search', searchQuery.value)
}

const handleLogout = async () => {
  try {
    // 调用auth store的logout方法
    authStore.logout()
    
    // 关闭菜单
    closeMenu()
    
    // 导航到首页
    await router.push('/')
  } catch (error) {
    console.error('退出登录失败:', error)
  }
}

// 监听ESC键关闭菜单
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && isMenuOpen.value) {
    closeMenu()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  // 监听路由变化，关闭菜单
  router.afterEach(() => {
    closeMenu()
  })
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})
</script>

<style scoped lang="scss">
.mobile-nav {
  display: none;
  
  @media (max-width: 767px) {
    display: block;
  }
}

.nav-mobile {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--spacing-md);
  border-bottom: 1px solid rgba(255, 128, 171, 0.2);
  box-shadow: 0 2px 10px rgba(255, 128, 171, 0.1);
}

.logo {
  cursor: pointer;
  
  .logo-text {
    font-family: 'ZSFT-dd', cursive;
    font-size: 1.5rem;
    font-weight: 700;
    color: #ff4081;
    text-shadow: 1px 1px 0px #ff80ab, 2px 2px 4px rgba(255, 64, 129, 0.3);
    transition: all 0.3s ease;
    
    &:hover {
      transform: scale(1.05);
      color: #f50057;
    }
  }
}

.menu-toggle {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 128, 171, 0.1);
  }
  
  &.active .hamburger-icon span:nth-child(1) {
    transform: rotate(45deg) translate(5px, 5px);
  }
  
  &.active .hamburger-icon span:nth-child(2) {
    opacity: 0;
  }
  
  &.active .hamburger-icon span:nth-child(3) {
    transform: rotate(-45deg) translate(7px, -6px);
  }
}

.hamburger-icon {
  display: flex;
  flex-direction: column;
  width: 24px;
  height: 18px;
  
  span {
    display: block;
    height: 2px;
    width: 100%;
    background: #ff4081;
    margin: 2px 0;
    transition: all 0.3s ease;
    border-radius: 1px;
  }
}

.nav-mobile-menu {
  position: fixed;
  top: 60px;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(15px);
  border-bottom: 1px solid rgba(255, 128, 171, 0.2);
  transform: translateY(-100%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 999;
  max-height: calc(100vh - 60px);
  overflow-y: auto;
  
  &.open {
    transform: translateY(0);
  }
}

.menu-content {
  padding: var(--spacing-lg) 0;
}

.search-section {
  padding: 0 var(--spacing-lg) var(--spacing-lg);
  border-bottom: 1px solid rgba(255, 128, 171, 0.1);
  margin-bottom: var(--spacing-md);
}

.search-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #ff80ab;
  border-radius: 25px;
  background: rgba(255, 255, 255, 0.9);
  color: #333;
  font-size: 1rem;
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

.menu-items {
  display: flex;
  flex-direction: column;
}

.user-info {
  display: flex;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-lg);
  background: rgba(255, 128, 171, 0.05);
  border-bottom: 1px solid rgba(255, 128, 171, 0.1);
  margin-bottom: var(--spacing-sm);
  
  .user-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, #ff4081, #ff80ab);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    margin-right: var(--spacing-md);
    font-size: 1.2rem;
  }
  
  span {
    font-weight: 500;
    color: #333;
  }
}

.menu-item {
  display: flex;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-lg);
  text-decoration: none;
  color: #333;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.3s ease;
  border-bottom: 1px solid rgba(255, 128, 171, 0.05);
  min-height: 60px;
  cursor: pointer;
  
  .menu-icon {
    font-size: 1.2rem;
    margin-right: var(--spacing-md);
    width: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  &:hover {
    background: rgba(255, 128, 171, 0.1);
    color: #ff4081;
    transform: translateX(8px);
  }
  
  &:last-child {
    border-bottom: none;
  }
}

.menu-overlay {
  position: fixed;
  top: 60px;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 998;
  backdrop-filter: blur(2px);
}

/* 桌面端隐藏移动端导航 */
@media (min-width: 768px) {
  .mobile-nav {
    display: none !important;
  }
}

/* 为移动端菜单添加动画 */
.menu-items .menu-item {
  opacity: 0;
  transform: translateX(-20px);
  animation: slideInLeft 0.3s ease forwards;
}

.nav-mobile-menu.open .menu-item:nth-child(1) { animation-delay: 0.1s; }
.nav-mobile-menu.open .menu-item:nth-child(2) { animation-delay: 0.15s; }
.nav-mobile-menu.open .menu-item:nth-child(3) { animation-delay: 0.2s; }
.nav-mobile-menu.open .menu-item:nth-child(4) { animation-delay: 0.25s; }
.nav-mobile-menu.open .menu-item:nth-child(5) { animation-delay: 0.3s; }

@keyframes slideInLeft {
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* 处理安全区域（刘海屏） */
.nav-mobile {
  padding-left: max(var(--spacing-md), env(safe-area-inset-left));
  padding-right: max(var(--spacing-md), env(safe-area-inset-right));
}

.menu-content {
  padding-left: max(0, env(safe-area-inset-left));
  padding-right: max(0, env(safe-area-inset-right));
}
</style>