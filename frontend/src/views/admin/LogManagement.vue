<template>
  <div class="log-management">
    <!-- 搜索和筛选区域 -->
    <el-card class="search-card" shadow="never">
      <el-form :model="searchForm" :inline="true" class="search-form">
        <el-form-item label="日志类型">
          <el-select 
            v-model="searchForm.type" 
            placeholder="选择日志类型" 
            clearable
            filterable
            style="width: 280px"
          >
            <el-option-group
              v-for="group in logTypeGroups"
              :key="group.label"
              :label="group.label"
            >
              <el-option
                v-for="option in group.options"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-option-group>
          </el-select>
        </el-form-item>
        
        <el-form-item label="用户">
          <el-input 
            v-model="searchForm.search" 
            placeholder="搜索用户名或邮箱"
            style="width: 200px"
            clearable
          />
        </el-form-item>
        
        <el-form-item label="游戏">
          <el-select 
            v-model="searchForm.gameId" 
            placeholder="选择游戏" 
            clearable
            filterable
            style="width: 200px"
          >
            <el-option 
              v-for="game in gameOptions" 
              :key="game.id"
              :label="game.name" 
              :value="game.id" 
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="dateRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 300px"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 操作按钮区域 -->
    <el-card class="action-card" shadow="never">
      <div class="action-buttons">
        <el-button 
          type="danger" 
          @click="handleBatchDelete"
          :disabled="selectedLogs.length === 0"
        >
          <el-icon><Delete /></el-icon>
          批量删除
        </el-button>
        <el-button type="warning" @click="handleClearLogs">
          <el-icon><CircleClose /></el-icon>
          清空日志
        </el-button>
        <el-button type="success" @click="handleExport">
          <el-icon><Download /></el-icon>
          导出日志
        </el-button>
      </div>
      
      <div class="stats-info">
        <span>共 {{ total }} 条记录</span>
        <span v-if="selectedLogs.length > 0">，已选择 {{ selectedLogs.length }} 条</span>
        <span v-if="searchForm.type">，{{ getLogTypeText(searchForm.type) }}</span>
      </div>
    </el-card>

    <!-- 统计信息面板 -->
    <el-card class="stats-card" shadow="never" v-if="!searchForm.type && !searchForm.search && !dateRange">
      <template #header>
        <div class="card-header">
          <span>日志统计概览</span>
          <el-button type="text" @click="refreshStats">刷新</el-button>
        </div>
      </template>
      
      <el-row :gutter="16" class="stats-row">
        <el-col :span="6">
          <div class="stat-item success">
            <div class="stat-value">{{ stats.userOperations }}</div>
            <div class="stat-label">用户操作</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item info">
            <div class="stat-value">{{ stats.gameOperations }}</div>
            <div class="stat-label">游戏操作</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item warning">
            <div class="stat-value">{{ stats.adminOperations }}</div>
            <div class="stat-label">管理操作</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item danger">
            <div class="stat-value">{{ stats.securityEvents }}</div>
            <div class="stat-label">安全事件</div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 日志表格 -->
    <el-card class="table-card" shadow="never">
      <el-table
        v-loading="loading"
        :data="logList"
        @selection-change="handleSelectionChange"
        stripe
        style="width: 100%"
        :row-class-name="getRowClassName"
      >
        <el-table-column type="selection" width="55" />
        
        <el-table-column label="时间" width="160" sortable>
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>
        
        <el-table-column label="类型" width="140" sortable>
          <template #default="{ row }">
            <el-tag :type="getLogTypeTagType(row.type)" size="small">
              {{ getLogTypeText(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="用户" width="140">
          <template #default="{ row }">
            <div v-if="row.user" class="user-info">
              <div class="username">{{ row.user.username }}</div>
              <div class="email">{{ row.user.email }}</div>
            </div>
            <span v-else class="no-data">-</span>
          </template>
        </el-table-column>
        
        <el-table-column label="目标用户" width="140">
          <template #default="{ row }">
            <div v-if="row.targetUser" class="user-info">
              <div class="username">{{ row.targetUser.username }}</div>
              <div class="email">{{ row.targetUser.email }}</div>
            </div>
            <span v-else class="no-data">-</span>
          </template>
        </el-table-column>
        
        <el-table-column label="游戏" width="120">
          <template #default="{ row }">
            <span v-if="row.game" class="game-name">{{ row.game.name }}</span>
            <span v-else class="no-data">-</span>
          </template>
        </el-table-column>
        
        <el-table-column label="激活码" width="100">
          <template #default="{ row }">
            <span v-if="row.activationCode" class="activation-code">
              {{ row.activationCode.code }}
            </span>
            <span v-else class="no-data">-</span>
          </template>
        </el-table-column>
        
        <el-table-column label="IP地址" width="120">
          <template #default="{ row }">
            <span v-if="row.ip" class="ip-address">{{ row.ip }}</span>
            <span v-else class="no-data">-</span>
          </template>
        </el-table-column>
        
        <el-table-column label="详细信息" min-width="200">
          <template #default="{ row }">
            <div class="log-details">
              <div class="message-content">{{ row.message }}</div>
              <div class="metadata-info">
                <el-button type="primary" size="small" link @click="showLogDetail(row)">
                  查看详情
                </el-button>
              </div>
            </div>
          </template>
        </el-table-column>
      
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button 
              type="danger" 
              size="small" 
              @click="handleDelete(row)"
              link
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 日志详情对话框 -->
    <LogDetailDialog v-model="showDetailDialog" :log="selectedLogForDetail" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { msg, AdminText } from '@/utils/message'
import { confirmAction } from '@/utils/confirm'
import {
  Search,
  Refresh,
  Delete,
  CircleClose,
  Download
} from '@element-plus/icons-vue'
import { getLogs, deleteLog, deleteLogs, clearLogs, exportLogs } from '@/api/log'
import { getLogStats } from '@/api/logStats'
import type { Log, LogQuery } from '@/types/log'
import { getLogTypeText, getLogTypeTagType, getLogTypeGroups } from '@/utils/logTypeHelper'
import LogDetailDialog from '@/components/LogDetailDialog.vue'

// 日志详情对话框
const showDetailDialog = ref(false)
const selectedLogForDetail = ref<Log | null>(null)

// 日志类型选项组
const logTypeGroups = getLogTypeGroups()

// 搜索表单
const searchForm = reactive<LogQuery>({
  type: undefined,
  search: '',
  gameId: undefined
})

// 日期范围
const dateRange = ref<[string, string] | null>(null)

// 游戏选项（模拟数据，实际应该从API获取）
const gameOptions = ref([
  { id: '1', name: '示例游戏1' },
  { id: '2', name: '示例游戏2' },
  { id: '3', name: '示例游戏3' }
])

// 日志列表
const logList = ref<Log[]>([])
const selectedLogs = ref<Log[]>([])
const loading = ref(false)
const total = ref(0)

// 统计数据
const stats = ref({
  userOperations: 0,
  gameOperations: 0,
  adminOperations: 0,
  securityEvents: 0
})

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 20
})

// 获取日志列表
const fetchLogs = async () => {
  loading.value = true
  try {
    const params: LogQuery = {
      ...searchForm,
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    
    // 处理日期范围
    if (dateRange.value) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }
    
    const response = await getLogs(params)
    logList.value = response.data
    total.value = response.total
  } catch (error) {
  msg.error(AdminText.loadLogsFail)
    console.error('Failed to fetch logs:', error)
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  fetchLogs()
}

// 重置
const handleReset = () => {
  Object.assign(searchForm, {
    type: undefined,
    search: '',
    gameId: undefined
  })
  dateRange.value = null
  pagination.page = 1
  fetchLogs()
}

// 选择变化
const handleSelectionChange = (selection: Log[]) => {
  selectedLogs.value = selection
}

// 删除单个日志
const handleDelete = async (log: Log) => {
  await confirmAction({
    message: AdminText.deleteLogConfirm,
    title: '删除日志',
    confirmText: '确定删除',
    successMessage: AdminText.deleteLogSuccess,
    errorMessage: AdminText.deleteLogFail,
    onConfirm: async () => {
      await deleteLog(log.id)
      fetchLogs()
    }
  })
}

// 批量删除
const handleBatchDelete = async () => {
  await confirmAction({
    message: AdminText.batchDeleteLogsConfirm(selectedLogs.value.length),
    title: '批量删除',
    confirmText: '确定删除',
    successMessage: AdminText.batchDeleteLogsSuccess,
    errorMessage: AdminText.batchDeleteLogsFail,
    onConfirm: async () => {
      const ids = selectedLogs.value.map(log => log.id)
      await deleteLogs(ids)
      fetchLogs()
    }
  })
}

// 清空日志
const handleClearLogs = async () => {
  await confirmAction({
    message: AdminText.clearLogsConfirm,
    title: '清空日志',
    confirmText: '确定清空',
    type: 'error',
    successMessage: AdminText.clearLogsSuccess,
    errorMessage: AdminText.clearLogsFail,
    onConfirm: async () => {
      await clearLogs()
      fetchLogs()
    }
  })
}

// 导出日志
const handleExport = async () => {
  try {
    const params: LogQuery = {
      ...searchForm
    }
    
    if (dateRange.value) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }
    
    const response = await exportLogs(params)
    
    // 创建下载链接
    const blob = new Blob([response.data])
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `logs_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.csv`
    link.click()
    window.URL.revokeObjectURL(url)
    
    msg.success(AdminText.exportLogsSuccess)
  } catch (error) {
    msg.error(AdminText.exportLogsFail)
  }
}

// 分页大小变化
const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.page = 1
  fetchLogs()
}

// 当前页变化
const handleCurrentChange = (page: number) => {
  pagination.page = page
  fetchLogs()
}

// 格式化日期时间
const formatDateTime = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 获取行样式类名
const getRowClassName = ({ row }: { row: Log }) => {
  if (row.type.includes('ERROR') || row.type.includes('FAILED')) {
    return 'error-row'
  }
  if (row.type.includes('SECURITY_')) {
    return 'security-row'
  }
  if (row.type.includes('ADMIN_')) {
    return 'admin-row'
  }
  return ''
}

// 显示日志详情
const showLogDetail = (log: Log) => {
  selectedLogForDetail.value = log
  showDetailDialog.value = true
}

// 刷新统计数据
const refreshStats = async () => {
  try {
    const response = await getLogStats()
    stats.value = {
      userOperations: response.data.userOperations,
      gameOperations: response.data.gameOperations,
      adminOperations: response.data.adminOperations,
      securityEvents: response.data.securityEvents
    }
  } catch (error) {
    console.error('Failed to fetch stats:', error)
    msg.error(AdminText.logStatsFail)
  }
}

// 监听分页变化
watch([() => pagination.page, () => pagination.pageSize], () => {
  fetchLogs()
})

onMounted(() => {
  fetchLogs()
  refreshStats()
})
</script>

<style lang="scss" scoped>
.log-management {
  .search-card {
    margin-bottom: 20px;
    
    .search-form {
      :deep(.el-form-item) {
        margin-bottom: 10px;
      }
    }
  }
  
  .action-card {
    margin-bottom: 20px;
    
    :deep(.el-card__body) {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .action-buttons {
      display: flex;
      gap: 10px;
    }
    
    .stats-info {
      color: #606266;
      font-size: 14px;
    }
  }
  
  .stats-card {
    margin-bottom: 20px;
    
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .stats-row {
      margin: 0;
    }
    
    .stat-item {
      text-align: center;
      padding: 20px;
      border-radius: 8px;
      color: white;
      
      .stat-value {
        font-size: 24px;
        font-weight: bold;
        margin-bottom: 8px;
      }
      
      .stat-label {
        font-size: 14px;
        opacity: 0.9;
      }
      
      &.success {
        background: linear-gradient(135deg, #67c23a, #85ce61);
      }
      
      &.info {
        background: linear-gradient(135deg, #409eff, #66b1ff);
      }
      
      &.warning {
        background: linear-gradient(135deg, #e6a23c, #ebb563);
      }
      
      &.danger {
        background: linear-gradient(135deg, #f56c6c, #f78989);
      }
    }
  }
  
  .table-card {
    // 行样式
    :deep(.error-row) {
      background-color: #fef0f0;
    }
    
    :deep(.security-row) {
      background-color: #fff7e6;
    }
    
    :deep(.admin-row) {
      background-color: #f0f9ff;
    }
    
    .user-info {
      .username {
        font-weight: 500;
        color: #303133;
        font-size: 13px;
      }
      
      .email {
        font-size: 11px;
        color: #909399;
        margin-top: 2px;
      }
    }
    
    .game-name {
      font-weight: 500;
      color: #409eff;
      font-size: 13px;
    }
    
    .activation-code {
      font-family: 'Courier New', monospace;
      background-color: #f5f7fa;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 11px;
      font-weight: 600;
    }
    
    .ip-address {
      font-family: 'Courier New', monospace;
      color: #606266;
      font-size: 12px;
    }
    
    .log-details {
      .message-content {
        max-width: 300px;
        word-break: break-word;
        line-height: 1.4;
        font-size: 13px;
        margin-bottom: 4px;
      }
      
      .metadata-info {
        font-size: 12px;
      }
    }
    
    .no-data {
      color: #c0c4cc;
      font-style: italic;
    }
    
    .pagination-container {
      margin-top: 20px;
      display: flex;
      justify-content: center;
    }
  }
}

// 全局样式
:deep(.metadata-dialog) {
  .el-message-box__content {
    white-space: pre-wrap;
    font-family: 'Courier New', monospace;
    font-size: 12px;
    max-height: 400px;
    overflow-y: auto;
  }
}
</style>