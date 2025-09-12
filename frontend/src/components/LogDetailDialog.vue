<template>
  <el-dialog
    v-model="visible"
    title="日志详情"
    width="800px"
    append-to-body
    :before-close="handleClose"
  >
    <div v-if="log" class="log-detail">
      <!-- 基本信息 -->
      <el-descriptions :column="2" border>
        <el-descriptions-item label="日志ID">
          <code>{{ log.id }}</code>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">
          {{ formatDateTime(log.createdAt) }}
        </el-descriptions-item>
        <el-descriptions-item label="日志类型">
          <el-tag :type="getLogTypeTagType(log.type)" size="small">
            {{ getLogTypeText(log.type) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="IP地址">
          <code v-if="log.ip">{{ log.ip }}</code>
          <span v-else class="no-data">-</span>
        </el-descriptions-item>
        <el-descriptions-item label="操作用户" :span="2">
          <div v-if="log.user" class="user-detail">
            <div><strong>用户名：</strong>{{ log.user.username }}</div>
            <div><strong>邮箱：</strong>{{ log.user.email }}</div>
            <div><strong>用户ID：</strong><code>{{ log.user.id }}</code></div>
          </div>
          <span v-else class="no-data">-</span>
        </el-descriptions-item>
        <el-descriptions-item label="目标用户" :span="2" v-if="log.targetUser">
          <div class="user-detail">
            <div><strong>用户名：</strong>{{ log.targetUser.username }}</div>
            <div><strong>邮箱：</strong>{{ log.targetUser.email }}</div>
            <div><strong>用户ID：</strong><code>{{ log.targetUser.id }}</code></div>
          </div>
        </el-descriptions-item>
        <el-descriptions-item label="相关游戏" :span="2" v-if="log.game">
          <div class="game-detail">
            <div><strong>游戏名称：</strong>{{ log.game.name }}</div>
            <div><strong>游戏ID：</strong><code>{{ log.game.id }}</code></div>
          </div>
        </el-descriptions-item>
        <el-descriptions-item label="激活码" :span="2" v-if="log.activationCode">
          <div class="code-detail">
            <div><strong>激活码：</strong><code class="activation-code">{{ log.activationCode.code }}</code></div>
            <div><strong>激活码ID：</strong><code>{{ log.activationCode.id }}</code></div>
          </div>
        </el-descriptions-item>
        <el-descriptions-item label="操作描述" :span="2">
          <div class="message-content">{{ log.message }}</div>
        </el-descriptions-item>
      </el-descriptions>

      <!-- User-Agent 信息 -->
      <div v-if="log.userAgent" class="user-agent-section">
        <h4>用户代理信息</h4>
        <el-input
          v-model="log.userAgent"
          type="textarea"
          :rows="3"
          readonly
          class="user-agent-input"
        />
      </div>

      <!-- 元数据信息 -->
      <div v-if="log.metadata" class="metadata-section">
        <h4>详细元数据</h4>
        <el-input
          v-model="formattedMetadata"
          type="textarea"
          :rows="10"
          readonly
          class="metadata-input"
        />
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
        <el-button type="primary" @click="copyLogInfo">复制日志信息</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { msg, AdminText } from '@/utils/message'
import type { Log } from '@/types/log'
import { getLogTypeText, getLogTypeTagType } from '@/utils/logTypeHelper'

interface Props {
  modelValue: boolean
  log: Log | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 格式化元数据
const formattedMetadata = computed(() => {
  if (!props.log?.metadata) return ''
  return JSON.stringify(props.log.metadata, null, 2)
})

// 格式化日期时间
const formatDateTime = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    weekday: 'long'
  })
}

// 关闭对话框
const handleClose = () => {
  visible.value = false
}

// 复制日志信息
const copyLogInfo = async () => {
  if (!props.log) return
  
  const logInfo = {
    id: props.log.id,
    type: props.log.type,
    typeText: getLogTypeText(props.log.type),
    createdAt: props.log.createdAt,
    message: props.log.message,
    user: props.log.user,
    targetUser: props.log.targetUser,
    game: props.log.game,
    activationCode: props.log.activationCode,
    ip: props.log.ip,
    userAgent: props.log.userAgent,
    metadata: props.log.metadata
  }
  
  try {
    await navigator.clipboard.writeText(JSON.stringify(logInfo, null, 2))
    msg.success(AdminText.copySuccess)
  } catch (error) {
    msg.error(AdminText.copyFail)
  }
}
</script>

<style lang="scss" scoped>
.log-detail {
  .user-detail,
  .game-detail,
  .code-detail {
    div {
      margin-bottom: 4px;
      
      strong {
        color: #303133;
      }
      
      code {
        background-color: #f5f7fa;
        padding: 2px 6px;
        border-radius: 3px;
        font-family: 'Courier New', monospace;
        font-size: 12px;
      }
    }
  }
  
  .activation-code {
    background-color: #f0f9ff;
    color: #1d4ed8;
    font-weight: 600;
  }
  
  .message-content {
    line-height: 1.6;
    word-break: break-word;
  }
  
  .no-data {
    color: #c0c4cc;
    font-style: italic;
  }
  
  .user-agent-section,
  .metadata-section {
    margin-top: 20px;
    
    h4 {
      margin: 0 0 10px 0;
      color: #303133;
      font-size: 14px;
    }
    
    .user-agent-input,
    .metadata-input {
      :deep(.el-textarea__inner) {
        font-family: 'Courier New', monospace;
        font-size: 12px;
        background-color: #fafafa;
      }
    }
  }
}

.dialog-footer {
  text-align: right;
  
  .el-button + .el-button {
    margin-left: 10px;
  }
}
</style>
