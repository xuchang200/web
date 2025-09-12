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
              <span class="menu-icon">👤</span>
              <span>登录</span>
            </router-link>
            <router-link to="/register" class="menu-item" @click="closeMenu">
              <span class="menu-icon">📝</span>
              <span>注册</span>
            </router-link>
          </template>
          
          <!-- 已登录状态 -->
          <template v-else>
            <div class="user-info">
              <div class="user-avatar">{{ userAvatarText }}</div>
              <span>{{ authStore.user?.username }}</span>
            </div>
            <router-link to="/profile" class="menu-item" @click="closeMenu">
              <span class="menu-icon">👤</span>
              <span>个人中心</span>
            </router-link>
            <div class="menu-item" @click="handleLogout">
              <span class="menu-icon">🚪</span>
              <span>退出登录</span>
            </div>
          </template>
          
          <!-- 其他导航项 -->
          <router-link to="/" class="menu-item" @click="closeMenu">
            <span class="menu-icon">🏠</span>
            <span>首页</span>
          </router-link>
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

const handleLogout = () => {
  emit('logout')
  closeMenu()
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