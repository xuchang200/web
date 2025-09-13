<template>
  <div class="profile-page">
    <!-- 电脑端简化顶栏 -->
    <header class="simple-header desktop-only">
      <div class="header-content">
        <div class="logo" @click="$router.push('/')">
          <span class="logo-text">{{ siteInfo.siteName }}</span>
        </div>
        <nav class="navigation">
          <router-link to="/">首页</router-link>
          <router-link to="/about">关于我们</router-link>
        </nav>
      </div>
    </header>
    
    <!-- 移动端导航 -->
    <MobileNav
      :site-info="{ siteName: 'withU' }"
      class="mobile-only"
    />

    <!-- 主要内容区域 -->
    <div class="profile-content">
      <el-row :gutter="24">
        <!-- 左侧用户信息卡片 -->
        <el-col :xs="24" :sm="24" :md="8" :lg="8" :xl="8">
          <el-card class="user-info-card">
            <template #header>
              <div class="card-header">
                <el-icon class="header-icon"><User /></el-icon>
                <span>账户信息</span>
              </div>
            </template>
            
            <div class="user-info">
              <div class="user-avatar">
                <el-avatar :size="80" :src="userInfo.avatar">
                  <el-icon><UserFilled /></el-icon>
                </el-avatar>
              </div>
              
              <div class="user-details">
                <h3 class="username">{{ userInfo.username }}</h3>
                <p class="user-email">{{ userInfo.email }}</p>
                <p class="join-date">注册时间：{{ formatDate(userInfo.createdAt) }}</p>
                <p class="game-count">拥有游戏：{{ userInfo.activatedGamesCount }}款</p>
                
                <!-- 冷静期状态显示 -->
                <div v-if="userInfo.deletionRequestedAt" class="deletion-status">
                  <el-alert
                    type="warning"
                    :closable="false"
                    :title="`账号注销冷静期：还剩 ${remainingDeletionDays} 天`"
                    :description="`您在 ${userInfo.deletionRequestedAt ? formatDate(userInfo.deletionRequestedAt) : '未知时间'} 申请了账号注销，将于 ${userInfo.deletionEffectiveAt ? formatDate(userInfo.deletionEffectiveAt) : '未知时间'} 正式删除。在此期间可随时取消注销。`"
                    show-icon
                    class="deletion-warning"
                  />
                </div>
              </div>

              <div class="user-actions">
                <el-button type="primary" size="small" @click="showChangePasswordDialog">
                  <el-icon><Lock /></el-icon>
                  修改密码
                </el-button>
                <!-- 根据冷静期状态显示不同按钮 -->
                <template v-if="accountPolicy.accountDeletion.enabled">
                  <el-button
                    v-if="userInfo.deletionRequestedAt"
                    type="success"
                    size="small"
                    @click="handleCancelAccountDeletion"
                  >
                    <el-icon><CircleCheck /></el-icon>
                    取消注销
                  </el-button>
                  <el-button
                    v-else
                    type="warning"
                    size="small"
                    @click="confirmAccountDeletion"
                  >
                    <el-icon><SwitchButton /></el-icon>
                    注销账号
                  </el-button>
                </template>
                <el-button type="danger" size="small" @click="handleLogout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-button>
              </div>
            </div>
          </el-card>

          <!-- 激活游戏卡片 -->
          <el-card class="activation-card">
            <template #header>
              <div class="card-header">
                <el-icon class="header-icon"><Key /></el-icon>
                <span>激活游戏</span>
              </div>
            </template>
            
            <div class="activation-form">
              <el-input
                v-model="activationCode"
                placeholder="请输入激活码"
                size="large"
                clearable
                @keyup.enter="handleActivateGame"
              >
                <template #prefix>
                  <el-icon><Key /></el-icon>
                </template>
              </el-input>
              
              <el-button 
                type="primary" 
                size="large" 
                :loading="activating"
                @click="handleActivateGame"
                class="activation-btn"
              >
                <el-icon v-if="!activating"><CircleCheck /></el-icon>
                激活游戏
              </el-button>
              
              <div class="activation-tips">
                <el-icon><InfoFilled /></el-icon>
                <span>请输入有效的激活码来解锁新游戏</span>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 右侧我的游戏列表 -->
        <el-col :xs="24" :sm="24" :md="16" :lg="16" :xl="16">
          <el-card class="games-card">
            <template #header>
              <div class="card-header">
                <el-icon class="header-icon"><VideoPlay /></el-icon>
                <span>我的游戏 ({{ myGames.length }})</span>
              </div>
            </template>

            <div v-if="myGames.length === 0" class="empty-games">
              <el-empty description="您还没有激活任何游戏">
                <el-button type="primary" @click="focusActivationInput">
                  立即激活游戏
                </el-button>
              </el-empty>
            </div>

            <div v-else class="games-grid">
              <div 
                v-for="game in myGames" 
                :key="game.id"
                class="game-item"
                @click="playGame(game)"
              >
                <div class="game-cover">
                  <el-image
                    :src="game.coverImage"
                    fit="cover"
                    class="cover-image"
                    :alt="game.title"
                  >
                    <template #error>
                      <div class="image-error">
                        <el-icon><Picture /></el-icon>
                      </div>
                    </template>
                  </el-image>
                  
                  <div class="game-overlay">
                    <el-button type="primary" size="large" circle>
                      <el-icon><VideoPlay /></el-icon>
                    </el-button>
                  </div>
                </div>
                
                <div class="game-info">
                  <h4 class="game-title">{{ game.title }}</h4>
                  <p class="game-description">{{ game.description }}</p>
                  <div class="game-meta">
                    <span class="activation-date">
                      <el-icon><Calendar /></el-icon>
                      激活于 {{ formatDate(game.activatedAt) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
    
    <!-- 版权信息 -->
    <SiteFooter />

    <!-- 修改密码对话框 -->
    <el-dialog
      v-model="passwordDialogVisible"
      title="修改密码"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="passwordFormRef"
        :model="passwordForm"
        :rules="passwordFormRules"
        label-width="100px"
        size="large"
      >
        <el-form-item label="当前密码" prop="currentPassword">
          <el-input
            v-model="passwordForm.currentPassword"
            type="password"
            placeholder="请输入当前密码"
            show-password
          />
        </el-form-item>
        
        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="passwordForm.newPassword"
            type="password"
            placeholder="请输入新密码"
            show-password
          />
          <div class="pwd-policy-hint" v-if="passwordPolicyDesc">
            {{ passwordPolicyDesc }}
          </div>
        </el-form-item>
        
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="passwordForm.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            show-password
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="passwordDialogVisible = false">取消</el-button>
          <el-button 
            type="primary" 
            :loading="changingPassword"
            @click="submitPasswordChange"
          >
            确认修改
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { msg, TextEx } from '@/utils/message'
import { confirmAction } from '@/utils/confirm'
import MobileNav from '@/components/MobileNav.vue'
import {
  User, UserFilled, Lock, SwitchButton, Key, CircleCheck, 
  InfoFilled, VideoPlay, Picture, Calendar
} from '@element-plus/icons-vue'

const router = useRouter()

// 用户信息（从后端获取）
const userInfo = reactive({
  id: '',
  username: '',
  email: '',
  avatar: '',
  createdAt: '',
  activatedGamesCount: 0,
  deletionRequestedAt: null as string | null,
  deletionEffectiveAt: null as string | null
})

// 激活码相关
const activationCode = ref('')
const activating = ref(false)
// const loading = ref(false) // 未使用

// 我的游戏列表（从后端加载）
const myGames = ref<Array<{ id: string; title: string; description: string; coverImage: string | null; activatedAt: string }>>([])

import { getMyGames, activateByCode, getUserProfile, changePassword, requestAccountDeletion, cancelAccountDeletion as cancelAccountDeletionAPI } from '@/api/user'
import { getPublicAccountPolicy } from '@/api/settings'
import { useAuthStore } from '@/store/auth'
import { useSiteInfoStore } from '@/store/siteInfo'
import SiteFooter from '@/components/SiteFooter.vue'

const authStore = useAuthStore()
const siteInfo = useSiteInfoStore()

// 修改密码相关
const passwordDialogVisible = ref(false)
const changingPassword = ref(false)
const passwordFormRef = ref()

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const passwordFormRules = {
  currentPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' }
  ],
  newPassword: [
  { required: true, message: '请输入新密码', trigger: 'blur' },
  { validator: validateNewPassword, trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
  validator: (_rule: any, value: string, callback: Function) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 方法定义
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

const handleActivateGame = async () => {
  if (!activationCode.value.trim()) {
  msg.validation(TextEx.activateCodeRequired, 'profile-activate-required')
    return
  }

  activating.value = true
  
  try {
    await activateByCode(activationCode.value.trim())
  msg.success(TextEx.activateGameSuccess, 'profile-activate-success')
    activationCode.value = ''
    // 重新加载用户信息和游戏列表
    await Promise.all([loadUserProfile(), loadMyGames()])
  } catch (error: any) {
  const message = error.response?.data?.message || TextEx.activateGameFail
  msg.error(message, 'profile-activate-fail')
  } finally {
    activating.value = false
  }
}

// 加载用户信息
const loadUserProfile = async () => {
  try {
    const response = await getUserProfile()
    let userData;
    
    // 处理不同的响应格式
    if (response.success && response.data) {
      userData = response.data
    } else if (response.data) {
      userData = response.data
    } else {
      throw new Error('无效的响应格式')
    }
    
    // 更新用户信息
    Object.assign(userInfo, {
      id: userData.id,
      name: userData.username,
      username: userData.username,
      email: userData.email,
      avatar: userData.avatar || '',
      createdAt: userData.createdAt,
      activatedGamesCount: userData.activatedGamesCount || 0,
      deletionRequestedAt: userData.deletionRequestedAt || null,
      deletionEffectiveAt: userData.deletionEffectiveAt || null
    })
    
    // 同时更新store中的用户信息
    if (authStore.user) {
      authStore.user.activatedGamesCount = userData.activatedGamesCount || 0
    }
    
    console.log('用户信息加载成功:', userInfo)
  } catch (error) {
    console.error('获取用户信息失败:', error)
  msg.error(TextEx.loadUserFail, 'profile-load-user-fail')
  }
}


const playGame = (game: any) => {
  msg.info(`正在启动游戏：${game.title}`, 'profile-launching-game')
  // 跳转到游戏页面，因为从个人中心点击说明用户已经激活了该游戏
  const gameUrl = `/game/${game.id}`
  window.open(gameUrl, '_blank')
}

const focusActivationInput = () => {
  // 滚动到激活码输入框并聚焦
  document.querySelector('.activation-card input')?.scrollIntoView({ behavior: 'smooth' })
}

const showChangePasswordDialog = () => {
  passwordDialogVisible.value = true
}

// 账号策略（仅取密码策略与注销设置）
const accountPolicy = reactive({
  password: { minLength: 8, maxLength: 64, requireUppercase: false, requireLowercase: true, requireNumber: true, requireSymbol: false },
  accountDeletion: { enabled: false, coolingDays: 7 }
})

const passwordPolicyDesc = computed(() => {
  const p = accountPolicy.password
  const parts: string[] = [`长度 ${p.minLength}-${p.maxLength}`]
  if (p.requireLowercase) parts.push('小写字母')
  if (p.requireUppercase) parts.push('大写字母')
  if (p.requireNumber) parts.push('数字')
  if (p.requireSymbol) parts.push('符号')
  return '密码需包含：' + parts.join('、')
})

// 计算冷静期剩余天数
const remainingDeletionDays = computed(() => {
  if (!userInfo.deletionEffectiveAt) return 0
  const now = new Date()
  const effectiveDate = new Date(userInfo.deletionEffectiveAt)
  const diff = effectiveDate.getTime() - now.getTime()
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
  return Math.max(0, days)
})

function validateNewPassword(_rule: any, value: string, callback: Function) {
  const p = accountPolicy.password
  if (!value) return callback(new Error('请输入新密码'))
  if (value.length < p.minLength) return callback(new Error(`长度不能少于${p.minLength}`))
  if (value.length > p.maxLength) return callback(new Error(`长度不能超过${p.maxLength}`))
  if (p.requireLowercase && !/[a-z]/.test(value)) return callback(new Error('需包含小写字母'))
  if (p.requireUppercase && !/[A-Z]/.test(value)) return callback(new Error('需包含大写字母'))
  if (p.requireNumber && !/\d/.test(value)) return callback(new Error('需包含数字'))
  if (p.requireSymbol && !/[~!@#$%^&*()_+\-={}\[\]:";'<>?,./]/.test(value)) return callback(new Error('需包含符号'))
  callback()
}

async function loadAccountPolicy() {
  try {
    const res = await getPublicAccountPolicy()
    if (res.success) {
      Object.assign(accountPolicy, res.data)
    }
  } catch {}
}

async function confirmAccountDeletion() {
  if (!accountPolicy.accountDeletion.enabled) return
  try {
    const confirmed = await confirmAction({
      message: TextEx.accountDeletionConfirm(accountPolicy.accountDeletion.coolingDays, true),
      title: '确认注销',
      confirmText: '确认注销',
      cancelText: '取消',
      successMessage: TextEx.accountDeletionSubmitSuccess,
      cancelMessage: TextEx.actionCanceled,
      onConfirm: async () => {
        await requestAccountDeletion()
        await loadUserProfile() // 重新加载用户信息以更新冷静期状态
      }
    })
    return confirmed
  } catch {}
}

// 取消账号注销
async function handleCancelAccountDeletion() {
  try {
    const confirmed = await confirmAction({
      message: '确认取消账号注销吗？取消后您的账号将恢复正常状态。',
      title: '确认取消注销',
      confirmText: '确认取消',
      cancelText: '再想想',
      type: 'info',
      successMessage: '已取消账号注销申请',
      cancelMessage: '已保持注销申请状态',
      onConfirm: async () => {
        await cancelAccountDeletionAPI()
        await loadUserProfile() // 重新加载用户信息以更新状态
      }
    })
    return confirmed
  } catch {}
}


const submitPasswordChange = async () => {
  if (!passwordFormRef.value) return
  
  const valid = await passwordFormRef.value.validate()
  if (!valid) return

  changingPassword.value = true
  
  try {
    // 调用修改密码API
    await changePassword({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword
    })
    
  msg.success(TextEx.pwdChangeSuccess, 'profile-password-change-success')
    passwordDialogVisible.value = false
    
    // 重置表单
    Object.assign(passwordForm, {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
  } catch (error: any) {
  const message = error.response?.data?.message || TextEx.pwdChangeFail
  msg.error(message, 'profile-password-change-fail')
  } finally {
    changingPassword.value = false
  }
}

const handleLogout = () => {
  confirmAction({
    message: '确定要退出登录吗？',
    title: '确认退出',
    type: 'warning',
    confirmText: '确定',
    cancelText: '取消',
    successMessage: TextEx.logoutSuccess,
    cancelMessage: TextEx.actionCanceledLogout,
    onConfirm: ()=>{ authStore.logout(); router.push('/login') }
  })
}

const loadMyGames = async () => {
  try {
    const response = await getMyGames()
    // 处理不同的响应格式
    if (response.success && response.data) {
      myGames.value = response.data
    } else if (Array.isArray(response.data)) {
      myGames.value = response.data
    } else {
      myGames.value = []
    }
  } catch (error) {
    console.error('获取我的游戏列表失败:', error)
  msg.error(TextEx.loadMyGamesFail, 'profile-load-my-games-fail')
  }
}

onMounted(async () => {
  await Promise.all([loadUserProfile(), loadMyGames(), loadAccountPolicy()])
})
</script>

<style lang="scss" scoped>
@font-face {
    font-family: "ZSFT-dd";
    src: url("https://fontsapi.zeoseven.com/dd/main.woff2") format("woff2"),
        url("https://fontsapi-storage.zeoseven.com/dd/main.woff2") format("woff2");
    font-display: swap;
}

// 简化顶栏样式
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

// 响应式显示控制
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
}

.profile-page {
  min-height: 100vh;
  background: url('@/assets/images/login-background.jpg') no-repeat center center;
  background-size: cover;
  background-attachment: fixed;
  padding: 100px 20px 20px;

  .profile-content {
    max-width: 1200px;
    margin: 0 auto;
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    color: #ff4081;
    
    .header-icon {
      font-size: 18px;
      color: #ff4081;
    }
  }

  .user-info-card, .activation-card, .games-card {
    margin-bottom: 24px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border: 2px solid #ff80ab;
    border-radius: 20px;
    box-shadow: 0 8px 30px rgba(255, 128, 171, 0.2);
  }

  .user-info-card {
    .user-info {
      text-align: center;
      
      .user-avatar {
        margin-bottom: 20px;
        
        :deep(.el-avatar) {
          border: 3px solid #ff4081;
          background: linear-gradient(135deg, #ff4081 0%, #ff80ab 100%);
          color: white;
          font-weight: 700;
          font-size: 2rem;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
        }
      }
      
      .user-details {
        margin-bottom: 25px;
        
        .username {
          font-family: 'ZSFT-dd', cursive;
          font-size: 1.5rem;
          font-weight: 700;
          color: #ff4081;
          margin: 0 0 10px 0;
          text-shadow: 1px 1px 2px rgba(255, 64, 129, 0.2);
        }
        
        .user-email {
          color: #666;
          font-size: 1rem;
          margin: 5px 0;
        }
        
        .join-date, .game-count {
          color: #999;
          font-size: 0.9rem;
          margin: 3px 0;
        }
      }
      
      .user-actions {
        display: flex;
        flex-direction: row;
        gap: 10px;
        justify-content: space-between;
        
        :deep(.el-button) {
          flex: 1;
          border-radius: 20px;
          font-weight: 600;
          
          &.el-button--primary {
            background: linear-gradient(135deg, #ff4081 0%, #ff80ab 100%);
            border-color: #ff4081;
            border-bottom: 3px solid #e91e63;
            
            &:hover {
              background: linear-gradient(135deg, #f50057 0%, #ff4081 100%);
              transform: translateY(-2px);
              box-shadow: 0 6px 20px rgba(255, 64, 129, 0.4);
            }
          }
          
          &.el-button--danger {
            background: transparent;
            color: #ff4081;
            border-color: #ff4081;
            
            &:hover {
              background: #ff4081;
              color: white;
              box-shadow: 0 4px 15px rgba(255, 64, 129, 0.3);
            }
          }
        }
      }
    }
  }

  .activation-card {
    .activation-form {
      :deep(.el-input) {
        margin-bottom: 15px;
        
        .el-input__wrapper {
          border: 2px solid #ff80ab;
          border-radius: 25px;
          background: rgba(255, 255, 255, 0.9);
          
          &:focus-within {
            border-color: #ff4081;
            background: white;
            box-shadow: 0 0 20px rgba(255, 64, 129, 0.2);
          }
        }
      }
      
      .activation-btn {
        width: 100%;
        height: 50px;
        font-size: 1.1rem;
        margin-bottom: 15px;
        border-radius: 25px;
        
        :deep(&.el-button--primary) {
          background: linear-gradient(135deg, #ff4081 0%, #ff80ab 100%);
          border-color: #ff4081;
          border-bottom: 3px solid #e91e63;
          
          &:hover {
            background: linear-gradient(135deg, #f50057 0%, #ff4081 100%);
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(255, 64, 129, 0.4);
          }
        }
      }
      
      .activation-tips {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #999;
        font-size: 0.9rem;
        
        .el-icon {
          color: #ff4081;
        }
      }
    }
  }

  .games-card {
    .empty-games {
      padding: 40px 0;
    }
    
    .games-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
      
      .game-item {
        cursor: pointer;
        transition: all 0.3s ease;
        border-radius: 12px;
        overflow: hidden;
        background: white;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        
        &:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
          
          .game-overlay {
            opacity: 1;
          }
        }
        
        .game-cover {
          position: relative;
          height: 160px;
          overflow: hidden;
          
          .cover-image {
            width: 100%;
            height: 100%;
          }
          
          .image-error {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
            background: #f5f7fa;
            color: #c0c4cc;
            font-size: 24px;
          }
          
          .game-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.3s ease;
            
            .el-button {
              width: 60px;
              height: 60px;
              font-size: 24px;
            }
          }
        }
        
        .game-info {
          padding: 15px;
          
          .game-title {
            font-size: 1.1rem;
            font-weight: 600;
            color: #2c3e50;
            margin: 0 0 8px 0;
            line-height: 1.3;
          }
          
          .game-description {
            color: #7f8c8d;
            font-size: 0.9rem;
            line-height: 1.4;
            margin: 0 0 12px 0;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          
          .game-meta {
            .activation-date {
              display: flex;
              align-items: center;
              gap: 5px;
              color: #95a5a6;
              font-size: 0.8rem;
            }
          }
        }
      }
    }
  }
}

// 响应式设计
@media (max-width: 992px) {
  .profile-page {
    .profile-content {
      .el-row {
        .el-col {
          &:first-child {
            margin-bottom: 24px;
          }
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .profile-page {
    padding: 15px;
    
    .page-header {
      .page-title {
        font-size: 2rem;
      }
    }
    
    .games-grid {
      grid-template-columns: 1fr !important;
    }
  }
}
</style>
<style scoped>
.pwd-policy-hint {
  margin-top: 4px;
  font-size: 12px;
  color: #ff4081;
}
</style>