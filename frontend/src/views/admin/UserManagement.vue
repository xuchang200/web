<template>
  <div class="user-management">
    <!-- 搜索和操作区域 -->
    <el-card class="search-card" shadow="never">
      <el-row :gutter="20">
        <el-col :span="16">
          <el-form :model="searchForm" inline>
            <el-form-item label="搜索用户:">
              <el-input
                v-model="searchForm.keyword"
                placeholder="输入用户名或邮箱"
                clearable
                style="width: 200px"
                @clear="handleSearch"
                @keyup.enter="handleSearch"
              />
            </el-form-item>
            <el-form-item label="角色:">
              <el-select v-model="searchForm.role" placeholder="选择角色" clearable style="width: 120px">
                <el-option label="全部" value="" />
                <el-option label="普通用户" value="user" />
                <el-option label="管理员" value="admin" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSearch">
                <el-icon><Search /></el-icon>
                搜索
              </el-button>
            </el-form-item>
          </el-form>
        </el-col>
        <el-col :span="8" style="text-align: right">
          <el-button type="success" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增用户
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 用户列表 -->
    <el-card class="table-card" shadow="never">
      <el-table
        :data="tableData"
        v-loading="loading"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" />
        <el-table-column prop="email" label="邮箱" />
        <el-table-column prop="role" label="角色" width="100">
          <template #default="{ row }">
            <el-tag :type="row.role === 'ADMIN' ? 'danger' : 'primary'">
              {{ row.role === 'ADMIN' ? '管理员' : '普通用户' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="注册时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column prop="gamesCount" label="激活游戏数" width="120" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="warning" size="small" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button type="danger" size="small" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 新增/编辑用户对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      :width="isEdit ? '800px' : '500px'"
      @close="resetForm"
    >
      <el-form
        ref="userFormRef"
        :model="userForm"
        :rules="userFormRules"
        label-width="80px"
      >
        <el-row :gutter="20">
          <el-col :span="isEdit ? 12 : 24">
            <el-form-item label="用户名" prop="username">
              <el-input v-model="userForm.username" placeholder="请输入用户名" />
            </el-form-item>
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="userForm.email" placeholder="请输入邮箱" />
            </el-form-item>
            <el-form-item label="密码" prop="password" v-if="!isEdit">
              <el-input v-model="userForm.password" type="text" placeholder="请输入密码" />
            </el-form-item>
            <el-form-item label="角色" prop="role">
              <el-select v-model="userForm.role" placeholder="请选择角色">
                <el-option label="普通用户" value="USER" />
                <el-option label="管理员" value="ADMIN" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="isEdit">
            <div class="game-management">
              <h4>游戏管理</h4>
              <div class="game-section">
                <div class="section-header">
                  <span>已激活游戏 ({{ userActivatedGames.length }})</span>
                  <el-button 
                    type="success" 
                    size="small" 
                    @click="showAvailableGames = true"
                    :disabled="availableGames.length === 0"
                  >
                    添加游戏
                  </el-button>
                </div>
                <div class="game-list">
                  <div 
                    v-for="game in userActivatedGames" 
                    :key="game.gameId" 
                    class="game-item"
                  >
                    <span class="game-name">{{ game.gameName }}</span>
                    <span class="game-date">{{ formatDate(game.activatedAt) }}</span>
                    <el-button 
                      type="danger" 
                      size="small" 
                      @click="removeGameFromUser(game.gameId)"
                    >
                      移除
                    </el-button>
                  </div>
                  <div v-if="userActivatedGames.length === 0" class="no-games">
                    暂无已激活游戏
                  </div>
                </div>
              </div>
            </div>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">确认</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 可用游戏选择对话框 -->
    <el-dialog
      v-model="showAvailableGames"
      title="添加游戏"
      width="600px"
    >
      <div class="available-games">
        <div v-if="availableGames.length === 0" class="no-available-games">
          所有游戏都已激活
        </div>
        <div v-else>
          <div 
            v-for="game in availableGames" 
            :key="game.id" 
            class="available-game-item"
          >
            <div class="game-info">
              <span class="game-name">{{ game.name }}</span>
              <span class="game-desc">{{ game.description || '暂无描述' }}</span>
            </div>
            <el-button 
              type="primary" 
              size="small" 
              @click="addGameToUser(game.id)"
            >
              添加
            </el-button>
          </div>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showAvailableGames = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { msg, AdminText } from '@/utils/message'
import { confirmAction } from '@/utils/confirm'
import { Search, Plus } from '@element-plus/icons-vue'
import { getUserList, updateUser, deleteUser, createUser, getUserActivatedGames, activateGameForUser, deactivateGameForUser } from '@/api/user'
import { getAdminGameList } from '@/api/game'
import type { User } from '@/types/admin'
import type { Game } from '@/api/game'

// 搜索表单
const searchForm = reactive({
  keyword: '',
  role: ''
})

// 表格数据
const tableData = ref<User[]>([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 对话框控制
const dialogVisible = ref(false)
const isEdit = ref(false)

// 用户表单
const userFormRef = ref()
const userForm = reactive({
  id: null,
  username: '',
  email: '',
  password: '',
  role: 'USER'
})

const userFormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: ['blur', 'change'] }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ]
}

// 游戏管理相关
const userActivatedGames = ref<Array<{
  id: string;
  gameId: string;
  gameName: string;
  activatedAt: string;
}>>([])
const allGames = ref<Game[]>([])
const showAvailableGames = ref(false)

// 计算可用游戏列表（排除用户已激活的游戏）
const availableGames = computed(() => {
  const activatedGameIds = userActivatedGames.value.map(g => g.gameId)
  return allGames.value.filter(game => !activatedGameIds.includes(game.id))
})

// 计算属性
const dialogTitle = ref('')


// 方法
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

const loadUsers = async () => {
  loading.value = true
  
  try {
    const response = (await getUserList()) as any;
    if (response.success) {
      let allUsers: User[] = response.data.map((user: any) => ({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        gamesCount: user.activatedGamesCount || 0,
        games: [], // 后端暂时不返回游戏列表详情
      }));

      // 搜索过滤
      if (searchForm.keyword) {
        allUsers = allUsers.filter(
          (user) =>
            user.username.includes(searchForm.keyword) ||
            user.email.includes(searchForm.keyword)
        );
      }

      if (searchForm.role) {
        allUsers = allUsers.filter(
          (user) => user.role.toLowerCase() === searchForm.role.toLowerCase()
        );
      }

      total.value = allUsers.length;

      // 分页
      const start = (currentPage.value - 1) * pageSize.value;
      const end = start + pageSize.value;
      tableData.value = allUsers.slice(start, end);
    } else {
  msg.error(AdminText.loadUsersFail)
      tableData.value = [];
      total.value = 0;
    }
  } catch (error: any) {
    console.error('获取用户列表失败:', error);
  msg.error(AdminText.loadUsersFail)
    tableData.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
}

const handleSearch = () => {
  currentPage.value = 1
  loadUsers()
}

const handleAdd = () => {
  isEdit.value = false
  dialogTitle.value = '新增用户'
  resetForm()
  dialogVisible.value = true
}

const handleEdit = async (row: any) => {
  isEdit.value = true
  dialogTitle.value = '编辑用户'
  Object.assign(userForm, { ...row, password: '', role: row.role.toUpperCase() })
  
  // 加载用户已激活的游戏和所有游戏列表
  await Promise.all([
    loadUserActivatedGames(row.id),
    loadAllGames()
  ])
  
  dialogVisible.value = true
}

const handleDelete = async (row: any) => {
  await confirmAction({
    message: AdminText.userDeleteConfirm(row.username),
    title: '删除用户',
    confirmText: '确定删除',
    successMessage: AdminText.userDeleteSuccess,
    errorMessage: AdminText.userDeleteFail,
    onConfirm: async () => {
      await deleteUser(row.id)
      loadUsers()
    }
  })
}

const handleSizeChange = (val: number) => {
  pageSize.value = val
  loadUsers()
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  loadUsers()
}

const resetForm = () => {
  Object.assign(userForm, {
    id: null,
    username: '',
    email: '',
    password: '',
    role: 'USER'
  })
  
  // 清理游戏管理相关数据
  userActivatedGames.value = []
  allGames.value = []
  showAvailableGames.value = false
  
  if (userFormRef.value) {
    userFormRef.value.clearValidate()
  }
}

const submitForm = async () => {
  if (!userFormRef.value) return;
  await userFormRef.value.validate();

  try {
    if (isEdit.value) {
      await updateUser(userForm.id!, {
        username: userForm.username,
        email: userForm.email,
        role: userForm.role.toUpperCase(),
      });
  msg.success(AdminText.userEditSuccess)
    } else {
      await createUser({
        username: userForm.username,
        email: userForm.email,
        password: userForm.password,
        role: userForm.role.toUpperCase(),
      });
  msg.success(AdminText.userCreateSuccess)
    }
    dialogVisible.value = false;
    loadUsers();
  } catch (error) {
    // 错误提示已由 axios 拦截器统一处理
  }
}

// 游戏管理相关方法
const loadUserActivatedGames = async (userId: string) => {
  try {
    const response = await getUserActivatedGames(userId)
    userActivatedGames.value = response.data
  } catch (error: any) {
    console.error('获取用户已激活游戏失败:', error)
  msg.error(AdminText.userGamesLoadFail)
    userActivatedGames.value = []
  }
}

const loadAllGames = async () => {
  try {
    const response = await getAdminGameList({ pageSize: 1000 }) // 获取所有游戏
    allGames.value = response.data.games
  } catch (error: any) {
    console.error('获取游戏列表失败:', error)
  msg.error(AdminText.allGamesLoadFail)
    allGames.value = []
  }
}

const addGameToUser = async (gameId: string) => {
  try {
    await activateGameForUser(userForm.id!, gameId)
  msg.success(AdminText.userAddGameSuccess)
    await loadUserActivatedGames(userForm.id!)
    showAvailableGames.value = false
    // 重新加载用户列表以更新激活游戏数量
    loadUsers()
  } catch (error: any) {
  msg.error(error.response?.data?.message || AdminText.userAddGameFail)
  }
}

const removeGameFromUser = async (gameId: string) => {
  await confirmAction({
    message: AdminText.userRemoveGameConfirm,
    title: '移除游戏',
    confirmText: '确定移除',
    successMessage: AdminText.userRemoveGameSuccess,
    errorMessage: AdminText.userRemoveGameFail,
    onConfirm: async () => {
      await deactivateGameForUser(userForm.id!, gameId)
      await loadUserActivatedGames(userForm.id!)
      loadUsers()
    }
  })
}

onMounted(() => {
  loadUsers()
})
</script>

<style lang="scss" scoped>
.user-management {
  .search-card {
    margin-bottom: 20px;
  }
  
  .table-card {
    .pagination-container {
      margin-top: 20px;
      text-align: right;
    }
  }
  
  .user-detail {
    .user-games {
      margin-top: 20px;
      
      h4 {
        margin-bottom: 10px;
        color: #303133;
      }
    }
  }
  
  // 游戏管理样式
  .game-management {
    padding: 0 10px;
    
    h4 {
      margin: 0 0 15px 0;
      color: #303133;
      font-size: 16px;
    }
    
    .game-section {
      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
        padding-bottom: 8px;
        border-bottom: 1px solid #ebeef5;
        
        span {
          font-weight: 500;
          color: #606266;
        }
      }
      
      .game-list {
        max-height: 300px;
        overflow-y: auto;
        
        .game-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #f5f7fa;
          
          &:last-child {
            border-bottom: none;
          }
          
          .game-name {
            flex: 1;
            font-weight: 500;
            color: #303133;
          }
          
          .game-date {
            font-size: 12px;
            color: #909399;
            margin-right: 10px;
          }
        }
        
        .no-games {
          text-align: center;
          color: #909399;
          padding: 20px 0;
          font-size: 14px;
        }
      }
    }
  }
  
  // 可用游戏对话框样式
  .available-games {
    .no-available-games {
      text-align: center;
      color: #909399;
      padding: 40px 0;
      font-size: 14px;
    }
    
    .available-game-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid #f5f7fa;
      
      &:last-child {
        border-bottom: none;
      }
      
      .game-info {
        flex: 1;
        
        .game-name {
          display: block;
          font-weight: 500;
          color: #303133;
          margin-bottom: 4px;
        }
        
        .game-desc {
          font-size: 12px;
          color: #909399;
        }
      }
    }
  }
}
</style>