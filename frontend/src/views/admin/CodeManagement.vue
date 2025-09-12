<template>
  <div class="code-management">
    <!-- 搜索和操作区域 -->
    <el-card class="search-card" shadow="never">
      <el-row :gutter="20">
        <el-col :span="16">
          <el-form :model="searchForm" inline>
            <el-form-item label="搜索激活码:">
              <el-input
                v-model="searchForm.keyword"
                placeholder="输入激活码"
                clearable
                style="width: 200px"
                @clear="handleSearch"
                @keyup.enter="handleSearch"
              />
            </el-form-item>
            <el-form-item label="绑定游戏:">
              <el-select v-model="searchForm.gameId" placeholder="选择游戏" clearable style="width: 150px">
                <el-option label="全部" value="" />
                <el-option
                  v-for="game in gameList"
                  :key="game.id"
                  :label="game.name"
                  :value="game.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="状态:">
              <el-select v-model="searchForm.status" placeholder="选择状态" clearable style="width: 120px">
                <el-option label="全部" value="" />
                <el-option label="未使用" value="UNUSED" />
                <el-option label="已使用" value="USED" />
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
          <el-button type="danger" :disabled="selectedIds.length === 0" style="margin-right: 10px" @click="handleBatchDelete">
            删除选中
          </el-button>
          <el-button type="success" @click="handleGenerate">
            <el-icon><Key /></el-icon>
            生成激活码
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 激活码列表 -->
    <el-card class="table-card" shadow="never">
      <el-table
        :data="tableData"
        v-loading="loading"
        stripe
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="code" label="激活码" min-width="160">
          <template #default="{ row }">
            <el-text class="code-text" copyable>{{ row.code }}</el-text>
          </template>
        </el-table-column>
        <el-table-column prop="gameTitle" label="绑定游戏" min-width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'UNUSED' ? 'success' : 'info'">
              {{ row.status === 'UNUSED' ? '未使用' : '已使用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="username" label="使用者" width="120">
          <template #default="{ row }">
            {{ row.username || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="生成时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column prop="activatedAt" label="激活时间" width="180">
          <template #default="{ row }">
            {{ row.activatedAt ? formatDate(row.activatedAt) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button 
              v-if="row.status === 'UNUSED'"
              type="danger" 
              size="small" 
              @click="handleDelete(row)"
            >
              删除
            </el-button>
            <span v-else class="disabled-text">已使用</span>
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

    <!-- 生成激活码对话框 -->
    <el-dialog
      v-model="generateDialogVisible"
      title="生成激活码"
      width="500px"
      @close="resetGenerateForm"
    >
      <el-form
        ref="generateFormRef"
        :model="generateForm"
        :rules="generateFormRules"
        label-width="100px"
      >
        <el-form-item label="绑定游戏" prop="gameIds">
          <el-select
            v-model="generateForm.gameIds"
            placeholder="请选择游戏（可多选）"
            multiple
            style="width: 100%"
          >
            <el-option
              v-for="game in gameList"
              :key="game.id"
              :label="game.name"
              :value="game.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="生成数量" prop="count">
          <el-input-number
            v-model="generateForm.count"
            :min="1"
            :max="1000"
            controls-position="right"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="码型模式" prop="pattern">
          <el-radio-group v-model="generateForm.pattern">
            <el-radio label="RANDOM">随机码（推荐）</el-radio>
            <el-radio label="PREFIX">带前缀码</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item 
          v-if="generateForm.pattern === 'PREFIX'" 
          label="自定义前缀" 
          prop="prefix"
        >
          <el-input 
            v-model="generateForm.prefix" 
            placeholder="如：LOVE2024"
            maxlength="10"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="generateDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitGenerate">生成</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 生成结果对话框 -->
    <el-dialog
      v-model="resultDialogVisible"
      title="生成完成"
      width="600px"
    >
      <div class="generate-result">
        <el-alert
          title="激活码生成成功！"
          type="success"
          :closable="false"
          show-icon
          style="margin-bottom: 20px"
        >
          <template #default>
            本次共生成 <strong>{{ generatedCodes.length }}</strong> 个激活码
          </template>
        </el-alert>
        
        <div class="codes-preview">
          <el-input
            v-model="codesText"
            type="textarea"
            :rows="8"
            readonly
            placeholder="生成的激活码将显示在这里"
          />
          <div class="preview-actions">
            <el-button @click="copyAllCodes">复制全部</el-button>
            <el-button @click="downloadCodes">下载为文件</el-button>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { msg, AdminText, TextEx } from '@/utils/message'
import { confirmAction } from '@/utils/confirm'
import { Search, Key } from '@element-plus/icons-vue'
import type { ActivationCode } from '@/types/admin'
import { getCodeList, generateCodes, deleteCode, batchDeleteCodes } from '@/api/code'
import { getAdminGameList } from '@/api/game'

// 搜索表单
const searchForm = reactive({
  keyword: '',
  gameId: '',
  status: ''
})

// 表格数据
const tableData = ref<ActivationCode[]>([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const selectedIds = ref<string[]>([])

// 对话框控制
const generateDialogVisible = ref(false)
const resultDialogVisible = ref(false)

// 生成激活码表单
const generateFormRef = ref()
const generateForm = reactive({
  gameIds: [] as string[],
  count: 10,
  pattern: 'RANDOM',
  prefix: ''
})

const generateFormRules = {
  gameIds: [
    { required: true, message: '请选择至少一个游戏', trigger: 'change' }
  ],
  count: [
    { required: true, message: '请输入生成数量', trigger: 'blur' }
  ],
  prefix: [
  { required: true, message: '请输入前缀', trigger: 'blur', validator: (_: any, value: string) => {
      if (generateForm.pattern === 'PREFIX' && !value) {
        return false
      }
      return true
    }}
  ]
}

// 游戏列表（用于下拉选择）
const gameList = ref<{ id: string; name: string }[]>([])

// 生成的激活码
const generatedCodes = ref<string[]>([])
const codesText = computed(() => generatedCodes.value.join('\n'))

// 真实数据加载

// 方法
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

const loadCodes = async () => {
  loading.value = true
  try {
    const res = await getCodeList({
      page: currentPage.value,
      pageSize: pageSize.value,
      keyword: searchForm.keyword || undefined,
      gameId: searchForm.gameId || undefined,
      status: (searchForm.status as 'UNUSED' | 'USED') || undefined,
    })
    tableData.value = res.data.items as ActivationCode[]
    total.value = res.data.pagination.total
  } catch (e) {
    // 错误提示由拦截器处理
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  loadCodes()
}

const handleGenerate = () => {
  resetGenerateForm()
  generateDialogVisible.value = true
}

const handleDelete = (row: ActivationCode) => {
  const statusText = row.status === 'USED' ? '（已使用，删除不会影响用户已激活的游戏）' : '（未使用）'
  confirmAction({
  message: TextEx.deleteConfirmCode(row.code, statusText),
    title: '删除激活码',
    confirmText: '确定删除',
    successMessage: AdminText.deleteSuccess,
  cancelMessage: TextEx.actionCanceled,
    errorMessage: AdminText.deleteFail,
    onConfirm: async () => {
      await deleteCode(row.id)
      loadCodes()
    }
  })
}

const handleSizeChange = (val: number) => {
  pageSize.value = val
  loadCodes()
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  loadCodes()
}

const handleSelectionChange = (rows: ActivationCode[]) => {
  selectedIds.value = rows.map(r => r.id)
}

const handleBatchDelete = () => {
  if (selectedIds.value.length === 0) return
  confirmAction({
    message: `确定要删除选中的 ${selectedIds.value.length} 个激活码吗？\n注意：删除已使用的激活码不会影响用户已激活的游戏。`,
    title: '批量删除激活码',
    confirmText: '确定删除',
    successMessage: AdminText.batchDeleteSuccess,
    errorMessage: AdminText.batchDeleteFail,
    onConfirm: async () => {
      const res = await batchDeleteCodes(selectedIds.value)
      msg.success(res.message || AdminText.batchDeleteSuccess)
      selectedIds.value = []
      loadCodes()
    }
  })
}

const resetGenerateForm = () => {
  Object.assign(generateForm, {
    gameIds: [],
    count: 10,
    pattern: 'RANDOM',
    prefix: ''
  })
  
  if (generateFormRef.value) {
    generateFormRef.value.clearValidate()
  }
}

// 由后端生成

const submitGenerate = () => {
  if (!generateFormRef.value) return
  generateFormRef.value.validate(async (valid: boolean) => {
    if (!valid) return
    try {
      const res = await generateCodes({
        gameIds: generateForm.gameIds,
        count: generateForm.count,
        pattern: generateForm.pattern as 'RANDOM' | 'PREFIX',
        prefix: generateForm.pattern === 'PREFIX' ? generateForm.prefix : undefined
      })
      generatedCodes.value = res.data.codes
      generateDialogVisible.value = false
      resultDialogVisible.value = true
  msg.success('激活码生成成功')
      loadCodes()
    } catch (e) {}
  })
}

const copyAllCodes = () => {
  navigator.clipboard.writeText(codesText.value).then(() => {
    msg.success(AdminText.copySuccess)
  }).catch(() => {
    msg.error(AdminText.copyFail)
  })
}

const downloadCodes = () => {
  const blob = new Blob([codesText.value], { type: 'text/plain' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `activation_codes_${new Date().getTime()}.txt`
  link.click()
  window.URL.revokeObjectURL(url)
  msg.success('文件下载成功')
}

const loadGameList = async () => {
  try {
    const res = await getAdminGameList({ page: 1, pageSize: 1000 })
    gameList.value = res.data.games.map(g => ({ id: g.id, name: g.name }))
  } catch (e) {}
}

onMounted(() => {
  loadCodes()
  loadGameList()
})
</script>

<style lang="scss" scoped>
.code-management {
  .search-card {
    margin-bottom: 20px;
  }
  
  .table-card {
    .pagination-container {
      margin-top: 20px;
      text-align: right;
    }
    
    .code-text {
      font-family: 'Courier New', monospace;
      font-weight: bold;
    }
    
    .disabled-text {
      color: #909399;
      font-size: 12px;
    }
  }
  
  .generate-result {
    .codes-preview {
      .preview-actions {
        margin-top: 10px;
        text-align: right;
        
        .el-button + .el-button {
          margin-left: 10px;
        }
      }
    }
  }
}
</style>