<template>
  <div class="game-management">

    <!-- 搜索和操作区 -->
    <el-card class="search-card" shadow="never">
      <el-form :model="searchForm" inline>
        <el-form-item label="游戏名称">
          <el-input
            v-model="searchForm.keyword"
            placeholder="搜索游戏名称或描述"
            clearable
            @clear="handleSearch"
            @keyup.enter="handleSearch"
            style="width: 200px"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        
        <el-form-item label="状态">
          <el-select 
            v-model="searchForm.status" 
            placeholder="全部状态" 
            clearable
            @change="handleSearch"
            style="width: 120px"
          >
            <el-option label="已发布" value="PUBLISHED" />
            <el-option label="草稿" value="DRAFT" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="排序">
          <el-select 
            v-model="searchForm.sortBy" 
            @change="handleSearch"
            style="width: 140px"
          >
            <el-option label="创建时间" value="createdAt" />
            <el-option label="更新时间" value="updatedAt" />
            <el-option label="播放次数" value="playCount" />
            <el-option label="激活次数" value="activationCount" />
          </el-select>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            搜索
          </el-button>
          <el-button @click="handleReset">
            重置
          </el-button>
        </el-form-item>
        
        <el-form-item style="margin-left: auto">
          <el-button type="success" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            上传新游戏
          </el-button>
          <el-button 
            type="danger" 
            @click="handleBatchDelete"
            :disabled="selectedGames.length === 0"
          >
            <el-icon><Delete /></el-icon>
            批量删除 ({{ selectedGames.length }})
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 游戏列表 -->
    <el-card class="table-card" shadow="never">
      <el-table
        ref="tableRef"
        :data="gameList"
        v-loading="loading"
        @selection-change="handleSelectionChange"
        style="width: 100%"
        row-key="id"
      >
        <el-table-column type="selection" width="55" />
        
        <el-table-column label="游戏信息" min-width="250">
          <template #default="{ row }">
            <div class="game-info">
              <div class="game-cover">
                <img 
                  v-if="row.coverImage" 
                  :src="row.coverImage" 
                  alt="游戏封面"
                  @error="handleImageError"
                />
                <div v-else class="no-cover">
                  <el-icon size="24"><Picture /></el-icon>
                </div>
              </div>
              <div class="game-details">
                <div class="game-name">{{ row.name }}</div>
                <div class="game-meta">
                  <span class="meta-item">ID: {{ row.id.substring(0, 8) }}...</span>
                  <el-tag 
                    :type="row.status === 'PUBLISHED' ? 'success' : 'warning'"
                    size="small"
                  >
                    {{ row.status === 'PUBLISHED' ? '已发布' : '草稿' }}
                  </el-tag>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="description" label="描述" min-width="200">
          <template #default="{ row }">
            <el-tooltip 
              v-if="row.description && row.description.length > 50"
              :content="row.description"
              placement="top"
            >
              <span>{{ row.description.substring(0, 50) }}...</span>
            </el-tooltip>
            <span v-else>{{ row.description || '-' }}</span>
          </template>
        </el-table-column>
        
        <el-table-column label="统计数据" width="150" align="center">
          <template #default="{ row }">
            <div class="stats-info">
              <div class="stat-item">
                <el-icon><VideoPlay /></el-icon>
                <span>{{ row.playCount || 0 }} 次播放</span>
              </div>
              <div class="stat-item">
                <el-icon><Key /></el-icon>
                <span>{{ row.activationCount || 0 }} 次激活</span>
              </div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="创建时间" width="160" align="center">
          <template #default="{ row }">
            <div class="time-info">
              <div>{{ formatDate(row.createdAt) }}</div>
              <div class="time-ago">{{ getTimeAgo(row.createdAt) }}</div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="360" align="center" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button 
                type="success" 
                size="small" 
                @click="handleTest(row)"
              >
                <el-icon><VideoPlay /></el-icon>
                测试
              </el-button>
              <el-button 
                type="primary" 
                size="small" 
                @click="handleEdit(row)"
              >
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
              
              <el-button 
                :type="row.status === 'PUBLISHED' ? 'warning' : 'success'" 
                size="small" 
                @click="handleToggleStatus(row)"
              >
                <el-icon>
                  <component :is="row.status === 'PUBLISHED' ? 'SoldOut' : 'Sell'" />
                </el-icon>
                {{ row.status === 'PUBLISHED' ? '下架' : '发布' }}
              </el-button>
              
              <el-button 
                type="danger" 
                size="small" 
                @click="handleDelete(row)"
              >
                <el-icon><Delete /></el-icon>
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 新增/编辑游戏对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑游戏' : '上传新游戏'"
      width="800px"
      :close-on-click-modal="false"
      :before-close="handleDialogClose"
      destroy-on-close
    >
      <el-form
        ref="gameFormRef"
        :model="gameForm"
        :rules="gameFormRules"
        label-width="100px"
      >
        <el-form-item label="游戏名称" prop="name">
          <el-input 
            v-model="gameForm.name" 
            placeholder="请输入游戏名称"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item label="游戏描述" prop="description">
          <el-input
            v-model="gameForm.description"
            type="textarea"
            :rows="4"
            placeholder="请输入游戏描述（可选）"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item label="游戏封面" prop="coverImage">
          <div class="cover-upload-container">
            <el-upload
              class="cover-uploader"
              :show-file-list="false"
              :before-upload="beforeCoverUpload"
              :http-request="handleCoverUpload"
              accept="image/jpeg,image/jpg,image/png"
              :disabled="uploadStatus.cover"
            >
              <div v-if="uploadStatus.cover" class="upload-loading">
                <el-icon class="is-loading" size="32"><Loading /></el-icon>
                <div>上传中 {{ uploadProgress.cover }}%</div>
              </div>
              <img 
                v-else-if="gameForm.coverImage" 
                :src="gameForm.coverImage" 
                class="cover-image"
                @error="handleImageError"
              />
              <div v-else class="upload-trigger">
                <el-icon size="32"><Plus /></el-icon>
                <div>上传封面</div>
              </div>
            </el-upload>
            
            <div class="cover-tips">
              <h4>封面要求：</h4>
              <ul>
                <li>格式：JPG、PNG</li>
                <li>大小：不超过 5MB</li>
                <li>建议尺寸：512x512 像素</li>
              </ul>
              <el-button 
                v-if="gameForm.coverImage" 
                type="danger" 
                size="small"
                @click="removeCover"
              >
                移除封面
              </el-button>
            </div>
          </div>
        </el-form-item>
        
        <el-form-item label="游戏文件" prop="gameFiles" v-if="!isEdit">
          <div class="game-upload-container">
            <div 
              class="folder-dropzone"
              :class="{ 'is-dragover': isDragover }"
              @dragover.prevent="isDragover = true"
              @dragleave.prevent="isDragover = false"
              @drop.prevent="handleFileDrop"
            >
              <input
                ref="folderInput"
                type="file"
                webkitdirectory
                directory
                multiple
                style="display: none"
                @change="handleFolderSelect"
              />
              
              <div v-if="uploadStatus.game" class="upload-loading">
                <el-icon class="is-loading" size="48"><Loading /></el-icon>
                <div class="upload-text">上传中 {{ uploadProgress.game }}%</div>
                <el-progress :percentage="uploadProgress.game" />
              </div>
              
              <div v-else-if="gameForm.gameFiles.length > 0" class="files-preview">
                <el-icon size="48" color="#67c23a"><FolderChecked /></el-icon>
                <div class="preview-info">
                  <div class="preview-title">已选择游戏文件夹</div>
                  <div class="preview-stats">
                    共 {{ gameForm.gameFiles.length }} 个文件，
                    总大小 {{ formatFileSize(getTotalFileSize()) }}
                  </div>
                  <div class="file-list">
                    <div 
                      v-for="(file, index) in gameForm.gameFiles.slice(0, 5)" 
                      :key="index"
                      class="file-item"
                    >
                      <el-icon><Document /></el-icon>
                      {{ getFileName(file) }}
                    </div>
                    <div v-if="gameForm.gameFiles.length > 5" class="more-files">
                      ... 还有 {{ gameForm.gameFiles.length - 5 }} 个文件
                    </div>
                  </div>
                  <el-button type="danger" size="small" @click="removeGameFiles">
                    重新选择
                  </el-button>
                </div>
              </div>
              
              <div v-else class="upload-placeholder" @click="selectFolder">
                <el-icon size="48"><FolderOpened /></el-icon>
                <div class="placeholder-text">
                  <div>将游戏文件夹拖拽到此处</div>
                  <div>或 <span class="link-text">点击选择文件夹</span></div>
                </div>
              </div>
            </div>
            
            <div class="game-tips">
              <h4>文件夹要求：</h4>
              <ul>
                <li>必须包含 index.html 作为入口文件</li>
                <li>支持 HTML、CSS、JS、图片等网页文件</li>
                <li>单个文件不超过 10MB</li>
                <li>总大小不超过 100MB</li>
              </ul>
            </div>
          </div>
        </el-form-item>
        
        <el-form-item label="更新文件" v-if="isEdit">
          <div class="game-upload-container">
            <div class="upload-area" :class="{ 'dragover': isDragover }">
              <input
                ref="folderInputEdit"
                type="file"
                webkitdirectory
                directory
                multiple
                style="display: none"
                @change="handleFolderSelectEdit"
              />
              
              <div v-if="uploadStatus.game" class="upload-loading">
                <el-icon class="is-loading" size="48"><Loading /></el-icon>
                <div class="upload-text">上传中 {{ uploadProgress.game }}%</div>
                <el-progress :percentage="uploadProgress.game" />
              </div>
              
              <div v-else-if="gameForm.gameFiles.length > 0" class="files-preview">
                <el-icon size="48" color="#67c23a"><FolderChecked /></el-icon>
                <div class="preview-info">
                  <div class="preview-title">已选择新的游戏文件夹</div>
                  <div class="preview-stats">
                    共 {{ gameForm.gameFiles.length }} 个文件，
                    总大小 {{ formatFileSize(getTotalFileSize()) }}
                  </div>
                  <div class="file-list">
                    <div 
                      v-for="(file, index) in gameForm.gameFiles.slice(0, 5)" 
                      :key="index"
                      class="file-item"
                    >
                      <el-icon><Document /></el-icon>
                      {{ getFileName(file) }}
                    </div>
                    <div v-if="gameForm.gameFiles.length > 5" class="more-files">
                      ... 还有 {{ gameForm.gameFiles.length - 5 }} 个文件
                    </div>
                  </div>
                  <el-button type="danger" size="small" @click="removeGameFiles">
                    重新选择
                  </el-button>
                </div>
              </div>
              
              <div v-else class="upload-placeholder" @click="selectFolderEdit">
                <el-icon size="48"><FolderOpened /></el-icon>
                <div class="placeholder-text">
                  <div>上传新的游戏文件夹以更新现有文件</div>
                  <div>或 <span class="link-text">点击选择文件夹</span></div>
                </div>
              </div>
            </div>
            
            <div class="game-tips">
              <h4>更新说明：</h4>
              <ul>
                <li>上传新文件夹将完全替换现有游戏文件</li>
                <li>必须包含 index.html 作为入口文件</li>
                <li>支持 HTML、CSS、JS、图片等网页文件</li>
                <li>单个文件不超过 10MB</li>
                <li>总大小不超过 100MB</li>
              </ul>
            </div>
          </div>
        </el-form-item>
        
        <el-form-item label="发布状态" prop="status">
          <el-radio-group v-model="gameForm.status">
            <el-radio-button value="DRAFT">
              <el-icon><Document /></el-icon>
              保存为草稿
            </el-radio-button>
            <el-radio-button value="PUBLISHED">
              <el-icon><CircleCheck /></el-icon>
              立即发布
            </el-radio-button>
          </el-radio-group>
          <div class="status-tip">
            {{ gameForm.status === 'PUBLISHED' ? '游戏将立即对所有用户可见' : '游戏将保存为草稿，仅管理员可见' }}
          </div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="handleDialogClose" :disabled="isSubmitting">
          取消
        </el-button>
        <el-button 
          type="primary" 
          @click="handleSubmit" 
          :loading="isSubmitting"
          :disabled="uploadStatus.cover || uploadStatus.game"
        >
          {{ isEdit ? '保存修改' : '创建游戏' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
// 替换直接使用 Element 消息为统一封装
import { msg, AdminText } from '@/utils/message'
import { confirmAction } from '@/utils/confirm'
import type { FormInstance, FormRules } from 'element-plus'
import {
  Search,
  Plus,
  Delete,
  Edit,
  Picture,
  VideoPlay,
  Key,
  Loading,
  FolderOpened,
  FolderChecked,
  Document,
  CircleCheck
} from '@element-plus/icons-vue'
import {
  type Game,
  type GameListParams,
  type UpdateGameData,
  getAdminGameList,
  createGame,
  updateGame,
  deleteGame,
  deleteGames,
  toggleGameStatus,
  uploadCoverImage,
  uploadGameFolder,
  checkUploadHealth
} from '@/api/game'
import { useAuthStore } from '@/store/auth'

// ========== 数据定义 ==========

// 搜索表单
const searchForm = reactive<GameListParams>({
  keyword: '',
  status: '',
  sortBy: 'createdAt',
  sortOrder: 'desc'
})

// 分页信息
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
  totalPages: 0
})

// 游戏列表
const gameList = ref<Game[]>([])
const selectedGames = ref<Game[]>([])
const loading = ref(false)


// 对话框
const dialogVisible = ref(false)
const isEdit = ref(false)
const isSubmitting = ref(false)

// 表单
const gameFormRef = ref<FormInstance>()
const gameForm = reactive({
  id: '',
  name: '',
  description: '',
  coverImage: '',
  coverImagePath: '',
  gameFiles: [] as File[],
  gameFileTempPath: '',
  status: 'DRAFT' as 'DRAFT' | 'PUBLISHED'
})

// 上传状态
const uploadStatus = reactive({
  cover: false,
  game: false
})

const uploadProgress = reactive({
  cover: 0,
  game: 0
})
// 测试运行游戏
const handleTest = (row: Game) => {
  if (!row.id) {
    msg.validation(AdminText.invalidGameId)
    return
  }
  
  // 直接访问后端游戏路由，避免与前端路由冲突
  const authStore = useAuthStore();
  const token = (authStore as any).token as string | undefined;
  
  // 构建查询参数
  const params = new URLSearchParams();
  if (token) params.set('token', token);
  params.set('test', '1');
  
  // 直接访问后端游戏路由
  const gameUrl = `/game/${row.id}?${params.toString()}`;
  window.open(gameUrl, '_blank');
}


// 拖拽状态
const isDragover = ref(false)

// 表单验证规则
const gameFormRules: FormRules = {
  name: [
    { required: true, message: '请输入游戏名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  gameFiles: [
    {
      required: true,
      validator: (_rule, value, callback) => {
        if (isEdit.value) {
          callback()
        } else if (!value || value.length === 0) {
          if (!gameForm.gameFileTempPath) {
            callback(new Error('请上传游戏文件夹'))
          } else {
            callback()
          }
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ]
}

// 文件输入引用
const folderInput = ref<HTMLInputElement>()
const folderInputEdit = ref<HTMLInputElement>()

// ========== 工具函数 ==========

// 格式化日期
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 获取相对时间
const getTimeAgo = (dateStr: string) => {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 30) return `${Math.floor(days / 30)} 个月前`
  if (days > 0) return `${days} 天前`
  if (hours > 0) return `${hours} 小时前`
  if (minutes > 0) return `${minutes} 分钟前`
  return '刚刚'
}

// 格式化文件大小
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 获取总文件大小
const getTotalFileSize = () => {
  return gameForm.gameFiles.reduce((total, file) => total + file.size, 0)
}

// 获取文件名
const getFileName = (file: File) => {
  const path = (file as any).webkitRelativePath || file.name
  return path.split('/').pop() || file.name
}

// 处理图片加载错误
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23f0f0f0"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%23999" font-size="14"%3E暂无图片%3C/text%3E%3C/svg%3E'
}

// ========== 数据加载 ==========

// 加载游戏列表
const loadGameList = async () => {
  loading.value = true
  try {
    const res = await getAdminGameList({
      ...searchForm,
      page: pagination.page,
      pageSize: pagination.pageSize
    })
    
    if (res.success) {
      gameList.value = res.data.games
      pagination.total = res.data.pagination.total
      pagination.totalPages = res.data.pagination.totalPages
    }
  } catch (error) {
    console.error('加载游戏列表失败:', error)
  msg.error(AdminText.loadGamesFail, 'loadGamesFail')
  } finally {
    loading.value = false
  }
}

// ========== 搜索和筛选 ==========

// 搜索
const handleSearch = () => {
  pagination.page = 1
  loadGameList()
}

// 重置搜索
const handleReset = () => {
  searchForm.keyword = ''
  searchForm.status = ''
  searchForm.sortBy = 'createdAt'
  searchForm.sortOrder = 'desc'
  pagination.page = 1
  loadGameList()
}

// 分页大小改变
const handleSizeChange = (val: number) => {
  pagination.pageSize = val
  pagination.page = 1
  loadGameList()
}

// 页码改变
const handleCurrentChange = (val: number) => {
  pagination.page = val
  loadGameList()
}

// ========== 游戏操作 ==========

// 选择改变
const handleSelectionChange = (val: Game[]) => {
  selectedGames.value = val
}

// 新增游戏
const handleAdd = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

// 编辑游戏
const handleEdit = (row: Game) => {
  isEdit.value = true
  resetForm()
  
  gameForm.id = row.id
  gameForm.name = row.name
  gameForm.description = row.description || ''
  gameForm.coverImage = row.coverImage || ''
  gameForm.status = row.status
  
  dialogVisible.value = true
}

// 删除游戏
const handleDelete = async (row: Game) => {
  await confirmAction({
    message: AdminText.deleteGameConfirm(row.name),
    title: '删除确认',
    confirmText: '确定删除',
    successMessage: AdminText.deleteSuccess,
    onConfirm: async () => {
      const res = await deleteGame(row.id)
      if (res.success) loadGameList()
    },
    errorMessage: AdminText.deleteFail
  })
}

// 批量删除
const handleBatchDelete = async () => {
  if (selectedGames.value.length === 0) {
    msg.validation(AdminText.needSelectGames)
    return
  }
  await confirmAction({
    message: AdminText.batchDeleteGameConfirm(selectedGames.value.length),
    title: '批量删除确认',
    confirmText: '确定删除',
    successMessage: AdminText.batchDeleteSuccess,
    onConfirm: async () => {
      const ids = selectedGames.value.map(g => g.id)
      const res = await deleteGames(ids)
      if (res.success) loadGameList()
    },
    errorMessage: AdminText.batchDeleteFail
  })
}

// 切换状态
const handleToggleStatus = async (row: Game) => {
  const action = row.status === 'PUBLISHED' ? '下架' : '发布'
  await confirmAction({
    message: AdminText.toggleGameConfirm(action, row.name),
    title: `${action}确认`,
    confirmText: `确定${action}`,
    successMessage: AdminText.toggleSuccess,
    onConfirm: async () => {
      const res = await toggleGameStatus(row.id)
      if (res.success) loadGameList()
    },
    errorMessage: AdminText.toggleFail
  })
}

// ========== 文件上传 ==========

// 上传封面前验证
const beforeCoverUpload = (file: File) => {
  const isImage = ['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)
  const isLt5M = file.size / 1024 / 1024 < 5
  
  if (!isImage) {
    msg.error(AdminText.coverFormatInvalid)
    return false
  }
  
  if (!isLt5M) {
    msg.error(AdminText.coverSizeInvalid)
    return false
  }
  
  return true
}

// 处理封面上传
const handleCoverUpload = async (options: any) => {
  const file = options.file
  
  if (!beforeCoverUpload(file)) {
    return
  }
  
  uploadStatus.cover = true
  uploadProgress.cover = 0
  
  try {
    const res = await uploadCoverImage(file, (percent) => {
      uploadProgress.cover = percent
    })
    
    if (res.success) {
      gameForm.coverImage = res.data.url
      gameForm.coverImagePath = res.data.path
      msg.success(AdminText.gameCoverUploadSuccess)
    }
  } catch (error) {
    console.error('封面上传失败:', error)
    msg.error(AdminText.gameCoverUploadFail)
  } finally {
    uploadStatus.cover = false
  }
}

// 移除封面
const removeCover = () => {
  gameForm.coverImage = ''
  gameForm.coverImagePath = ''
}

// 选择文件夹
const selectFolder = () => {
  folderInput.value?.click()
}

// 编辑模式下选择文件夹
const selectFolderEdit = () => {
  folderInputEdit.value?.click()
}

// 处理文件夹选择
const handleFolderSelect = (event: Event) => {
  const input = event.target as HTMLInputElement
  const files = input.files
  
  if (files && files.length > 0) {
    processGameFiles(files)
  }
}

// 编辑模式下处理文件夹选择
const handleFolderSelectEdit = (event: Event) => {
  const input = event.target as HTMLInputElement
  const files = input.files
  
  if (files && files.length > 0) {
    processGameFiles(files)
  }
}

// 处理文件拖放
const handleFileDrop = (event: DragEvent) => {
  isDragover.value = false
  
  const items = event.dataTransfer?.items
  if (!items) return
  
  const files: File[] = []
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if (item.kind === 'file') {
      const file = item.getAsFile()
      if (file) files.push(file)
    }
  }
  
  if (files.length > 0) {
    processGameFiles(files as any)
  }
}

// 处理游戏文件
const processGameFiles = async (files: FileList) => {
  // 验证文件
  const fileArray = Array.from(files)
  
  // 检查是否包含 index.html
  const hasIndexHtml = fileArray.some(file => {
    const path = (file as any).webkitRelativePath || file.name
    return path.endsWith('index.html')
  })
  
  if (!hasIndexHtml) {
    msg.error(AdminText.gameNeedIndex)
    return
  }
  
  // 检查文件大小
  const totalSize = fileArray.reduce((sum, file) => sum + file.size, 0)
  if (totalSize > 100 * 1024 * 1024) {
    msg.error(AdminText.gameFolderTooLarge)
    return
  }
  
  // 检查单个文件大小
  const oversizedFiles = fileArray.filter(file => file.size > 10 * 1024 * 1024)
  if (oversizedFiles.length > 0) {
    msg.error(AdminText.gameOversizeFiles(oversizedFiles.map(f=>f.name)))
    return
  }
  
  gameForm.gameFiles = fileArray
  
  // 上传文件夹
  uploadStatus.game = true
  uploadProgress.game = 0
  
  try {
    const res = await uploadGameFolder(files, (percent) => {
      uploadProgress.game = percent
    })
    
    if (res.success) {
      gameForm.gameFileTempPath = res.data.tempPath
      msg.success(AdminText.gameFilesUploadSuccess)
    }
  } catch (error) {
    console.error('游戏文件上传失败:', error)
    msg.error(AdminText.gameFilesUploadFail)
    gameForm.gameFiles = []
    gameForm.gameFileTempPath = ''
  } finally {
    uploadStatus.game = false
  }
}

// 移除游戏文件
const removeGameFiles = () => {
  gameForm.gameFiles = []
  gameForm.gameFileTempPath = ''
  if (folderInput.value) {
    folderInput.value.value = ''
  }
}

// ========== 表单提交 ==========

// 提交表单
const handleSubmit = async () => {
  if (!gameFormRef.value) return
  
  try {
    await gameFormRef.value.validate()
    
    isSubmitting.value = true
    
    if (isEdit.value) {
      // 编辑游戏
      const updateData: UpdateGameData = {
        name: gameForm.name,
        description: gameForm.description,
        status: gameForm.status
      }
      
      // 如果有新的封面图片
      if (gameForm.coverImagePath) {
        updateData.coverImage = gameForm.coverImagePath
      }
      
      // 如果有新的游戏文件
      if (gameForm.gameFileTempPath) {
        updateData.gameFileTempPath = gameForm.gameFileTempPath
      }
      
      const res = await updateGame(gameForm.id, updateData)
      
      if (res.success) {
        msg.success(AdminText.gameUpdateSuccess)
        dialogVisible.value = false
        loadGameList()
      }
    } else {
      // 创建游戏
      const res = await createGame({
        name: gameForm.name,
        description: gameForm.description,
        coverImage: gameForm.coverImagePath ? gameForm.coverImagePath : undefined,
        gameFileTempPath: gameForm.gameFileTempPath,
        status: gameForm.status
      })
      
      if (res.success) {
        msg.success(AdminText.gameCreateSuccess)
        dialogVisible.value = false
        loadGameList()
      }
    }
  } catch (error: any) {
    console.error('提交失败:', error)
    if (error.response?.data?.message) {
      msg.error(error.response.data.message)
    } else if (error.fields) {
      // 表单验证错误
      console.log('表单验证错误:', error.fields)
    } else {
      msg.error(AdminText.genericFail)
    }
  } finally {
    isSubmitting.value = false
  }
}

// 关闭对话框
const handleDialogClose = () => {
  if (isSubmitting.value) {
    msg.validation(AdminText.submittingWait)
    return
  }
  
  if (uploadStatus.cover || uploadStatus.game) {
    msg.validation(AdminText.uploadingWait)
    return
  }
  
  dialogVisible.value = false
  resetForm()
}

// 重置表单
const resetForm = () => {
  gameForm.id = ''
  gameForm.name = ''
  gameForm.description = ''
  gameForm.coverImage = ''
  gameForm.coverImagePath = ''
  gameForm.gameFiles = []
  gameForm.gameFileTempPath = ''
  gameForm.status = 'DRAFT'
  
  uploadProgress.cover = 0
  uploadProgress.game = 0
  
  if (gameFormRef.value) {
    gameFormRef.value.clearValidate()
  }
  
  if (folderInput.value) {
    folderInput.value.value = ''
  }
  
  if (folderInputEdit.value) {
    folderInputEdit.value.value = ''
  }
}

// ========== 生命周期 ==========

onMounted(async () => {
  // 检查上传服务状态
  try {
    await checkUploadHealth()
  } catch (error) {
    console.warn('上传服务检查失败:', error)
  }
  
  // 加载游戏列表
  loadGameList()
})
</script>

<style scoped>
/* 页面布局 */
.game-management {
  padding: 20px;
  background: #ffffff;
  min-height: 100vh;
}

/* 搜索卡片 */
.search-card {
  margin-bottom: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.search-card :deep(.el-card__body) {
  padding: 20px;
}

/* 表格卡片 */
.table-card {
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.table-card :deep(.el-card__body) {
  padding: 0;
}

/* 游戏信息展示 */
.game-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.game-cover {
  width: 60px;
  height: 60px;
  flex-shrink: 0;
  border-radius: 8px;
  overflow: hidden;
  background: #f5f7fa;
  border: 1px solid #e4e7ed;
}

.game-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.game-cover .no-cover {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c0c4cc;
}

.game-details {
  flex: 1;
  min-width: 0;
}

.game-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.game-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #909399;
}

.meta-item {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 统计信息 */
.stats-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #606266;
}

.stat-item .el-icon {
  color: #909399;
}

/* 时间信息 */
.time-info {
  font-size: 12px;
  color: #606266;
}

.time-ago {
  font-size: 11px;
  color: #909399;
  margin-top: 2px;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
}

/* 分页 */
.pagination-wrapper {
  padding: 20px;
  display: flex;
  justify-content: center;
  background: white;
  border-top: 1px solid #ebeef5;
}

/* 对话框表单 */
.cover-upload-container {
  display: flex;
  gap: 20px;
}

.cover-uploader {
  flex-shrink: 0;
}

.cover-uploader :deep(.el-upload) {
  width: 150px;
  height: 150px;
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cover-uploader :deep(.el-upload:hover) {
  border-color: #409eff;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-trigger {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #8c939d;
}

.upload-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #409eff;
}

.cover-tips {
  flex: 1;
}

.cover-tips h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #606266;
}

.cover-tips ul {
  margin: 0;
  padding-left: 20px;
  font-size: 12px;
  color: #909399;
  line-height: 1.8;
}

/* 游戏文件上传 */
.game-upload-container {
  display: flex;
  gap: 20px;
}

.folder-dropzone {
  flex: 1;
  min-height: 200px;
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  background: #fafafa;
  transition: all 0.3s;
  padding: 20px;
  cursor: pointer;
}

.folder-dropzone:hover,
.folder-dropzone.is-dragover {
  border-color: #409eff;
  background: #f0f8ff;
}

.upload-placeholder {
  height: 160px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #8c939d;
}

.placeholder-text {
  margin-top: 12px;
  text-align: center;
  font-size: 14px;
}

.link-text {
  color: #409eff;
  cursor: pointer;
}

.files-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.preview-info {
  margin-top: 12px;
}

.preview-title {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 8px;
}

.preview-stats {
  font-size: 14px;
  color: #606266;
  margin-bottom: 12px;
}

.file-list {
  margin-top: 12px;
  text-align: left;
  max-width: 400px;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #606266;
  padding: 4px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.more-files {
  font-size: 12px;
  color: #909399;
  padding: 4px 0;
}

.game-tips {
  width: 200px;
  flex-shrink: 0;
}

.game-tips h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #606266;
}

.game-tips ul {
  margin: 0;
  padding-left: 20px;
  font-size: 12px;
  color: #909399;
  line-height: 1.8;
}

.status-tip {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .search-card .el-form-item {
    margin-bottom: 12px;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .cover-upload-container,
  .game-upload-container {
    flex-direction: column;
  }
  
  .game-tips,
  .cover-tips {
    width: 100%;
  }
}
</style>