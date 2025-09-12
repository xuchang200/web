<template>
  <div class="enhanced-dashboard">
    <!-- 页面头部 -->
    <div class="dashboard-header">
      <h1>商业分析仪表盘</h1>
      <div class="header-actions">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          @change="onDateRangeChange"
        />
        <el-button type="primary" @click="refreshData" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
      </div>
    </div>

    <!-- 核心指标卡片 -->
    <el-row :gutter="20" class="metrics-row">
      <el-col :span="6">
        <el-card class="metric-card revenue">
          <div class="metric-content">
            <div class="metric-icon">
              <el-icon size="32"><Money /></el-icon>
            </div>
            <div class="metric-data">
              <h3>{{ revenueData.totalActivations }}</h3>
              <p>总激活数</p>
              <div class="metric-trend">
                <span class="trend-label">本月: {{ revenueData.activationsThisMonth }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="metric-card users">
          <div class="metric-content">
            <div class="metric-icon">
              <el-icon size="32"><User /></el-icon>
            </div>
            <div class="metric-data">
              <h3>{{ userBehavior.payingUsers }}</h3>
              <p>付费用户</p>
              <div class="metric-trend">
                <span class="trend-label">转化率: {{ userBehavior.conversionRate }}%</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="metric-card conversion">
          <div class="metric-content">
            <div class="metric-icon">
              <el-icon size="32"><TrendCharts /></el-icon>
            </div>
            <div class="metric-data">
              <h3>{{ userBehavior.averageActivationsPerUser }}</h3>
              <p>人均激活数</p>
              <div class="metric-trend">
                <span class="trend-label">留存率: {{ userBehavior.userRetentionRate }}%</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="metric-card security">
          <div class="metric-content">
            <div class="metric-icon">
              <el-icon size="32"><Warning /></el-icon>
            </div>
            <div class="metric-data">
              <h3>{{ securityStats.loginFailures }}</h3>
              <p>登录失败次数</p>
              <div class="metric-trend">
                <span class="trend-label">安全事件: {{ securityStats.securityIncidents }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="charts-section">
      <!-- 激活趋势图 -->
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <div class="chart-header">
              <span>激活趋势分析</span>
              <el-select v-model="trendDays" @change="loadActivationTrend" size="small">
                <el-option label="7天" :value="7" />
                <el-option label="30天" :value="30" />
                <el-option label="90天" :value="90" />
              </el-select>
            </div>
          </template>
          <div ref="activationTrendChart" class="chart-container"></div>
        </el-card>
      </el-col>
      
      <!-- 用户活动热力图 -->
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <span>用户活动热力图（24小时）</span>
          </template>
          <div ref="activityHeatmapChart" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 游戏性能分析 -->
    <el-row :gutter="20" class="performance-section">
      <el-col :span="16">
        <el-card class="performance-card">
          <template #header>
            <span>游戏性能排行榜</span>
          </template>
          <el-table :data="gamePerformanceData" stripe height="400">
            <el-table-column type="index" label="排名" width="60" />
            <el-table-column prop="name" label="游戏名称" min-width="150" />
            <el-table-column prop="activationCount" label="激活数" width="100" align="center">
              <template #default="{ row }">
                <el-tag type="success">{{ row.activationCount }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="uniqueActivatedUsers" label="独立用户" width="100" align="center">
              <template #default="{ row }">
                <el-tag type="info">{{ row.uniqueActivatedUsers }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="marketShare" label="市场份额" width="100" align="center">
              <template #default="{ row }">
                <span>{{ row.marketShare }}%</span>
              </template>
            </el-table-column>
            <el-table-column prop="playToActivationRatio" label="游玩比率" width="100" align="center">
              <template #default="{ row }">
                <span>{{ row.playToActivationRatio }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.status === 'PUBLISHED' ? 'success' : 'warning'">
                  {{ row.status === 'PUBLISHED' ? '已发布' : '草稿' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      
      <!-- 游戏使用模式 -->
      <el-col :span="8">
        <el-card class="usage-card">
          <template #header>
            <span>游戏使用模式</span>
          </template>
          <div class="usage-patterns">
            <div 
              v-for="pattern in gameUsagePatterns.slice(0, 5)" 
              :key="pattern.gameId"
              class="pattern-item"
            >
              <div class="pattern-name">{{ pattern.gameName }}</div>
              <div class="pattern-stats">
                <div class="stat-item">
                  <span class="stat-label">启动次数:</span>
                  <span class="stat-value">{{ pattern.playStartCount }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">完成率:</span>
                  <span class="stat-value">{{ pattern.completionRate }}%</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">独立玩家:</span>
                  <span class="stat-value">{{ pattern.uniquePlayers }}</span>
                </div>
              </div>
              <div class="pattern-progress">
                <el-progress 
                  :percentage="parseFloat(String(pattern.completionRate))" 
                  :stroke-width="6"
                  :show-text="false"
                />
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 地理分布和安全监控 -->
    <el-row :gutter="20" class="monitoring-section">
      <el-col :span="12">
        <el-card class="geo-card">
          <template #header>
            <span>用户地理分布</span>
          </template>
          <div class="geo-distribution">
            <div 
              v-for="location in geoDistribution" 
              :key="location.ip"
              class="geo-item"
            >
              <div class="geo-info">
                <span class="geo-region">{{ location.region }}</span>
                <span class="geo-ip">IP: {{ location.ip }}</span>
              </div>
              <div class="geo-count">
                <el-tag>{{ location.loginCount }} 次登录</el-tag>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="12">
        <el-card class="security-card">
          <template #header>
            <span>安全监控面板</span>
          </template>
          <div class="security-stats">
            <div class="security-item">
              <div class="security-icon failed-login">
                <el-icon><Warning /></el-icon>
              </div>
              <div class="security-info">
                <h4>{{ securityStats.loginFailures }}</h4>
                <p>登录失败</p>
              </div>
            </div>
            <div class="security-item">
              <div class="security-icon activation-failed">
                <el-icon><CircleClose /></el-icon>
              </div>
              <div class="security-info">
                <h4>{{ securityStats.activationFailures }}</h4>
                <p>激活失败</p>
              </div>
            </div>
            <div class="security-item">
              <div class="security-icon security-incident">
                <el-icon><CircleClose /></el-icon>
              </div>
              <div class="security-info">
                <h4>{{ securityStats.securityIncidents }}</h4>
                <p>安全事件</p>
              </div>
            </div>
            <div class="security-item">
              <div class="security-icon system-error">
                <el-icon><Tools /></el-icon>
              </div>
              <div class="security-info">
                <h4>{{ securityStats.systemErrors }}</h4>
                <p>系统错误</p>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 最近活动流 -->
    <el-row class="activity-section">
      <el-col :span="24">
        <el-card class="activity-card">
          <template #header>
            <div class="activity-header">
              <span>最近活动流</span>
              <el-button size="small" @click="loadRecentActivities">刷新</el-button>
            </div>
          </template>
          <div class="activity-timeline">
            <el-timeline>
              <el-timeline-item
                v-for="activity in recentActivities"
                :key="activity.id"
                :timestamp="formatTime(activity.createdAt)"
                placement="top"
              >
                <div class="activity-item">
                  <el-tag :type="getActivityTagType(activity.type)" size="small">
                    {{ getActivityTypeText(activity.type) }}
                  </el-tag>
                  <span class="activity-message">{{ activity.message }}</span>
                  <div class="activity-details">
                    <span v-if="activity.username" class="detail-item">用户: {{ activity.username }}</span>
                    <span v-if="activity.gameName" class="detail-item">游戏: {{ activity.gameName }}</span>
                    <span v-if="activity.ip" class="detail-item">IP: {{ activity.ip }}</span>
                  </div>
                </div>
              </el-timeline-item>
            </el-timeline>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import { 
  Money, User, TrendCharts, Refresh, Warning, 
  CircleClose, Tools 
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { 
  getRevenueAnalysis,
  getUserBehaviorAnalysis,
  getGamePerformanceAnalysis,
  getActivationTrend,
  getUserGeographicDistribution,
  getUserActivityHeatmap,
  getSecurityStats,
  getGameUsagePatterns,
  getRecentActivities
} from '@/api/dashboard'

// 响应式数据
const loading = ref(false)
const dateRange = ref([])
const trendDays = ref(30)

// 业务数据
const revenueData = reactive({
  totalActivations: 0,
  activationsThisMonth: 0,
  activationsThisWeek: 0,
  activationsToday: 0,
  totalUsers: 0
})

const userBehavior = reactive({
  totalUsers: 0,
  payingUsers: 0,
  conversionRate: '0',
  averageActivationsPerUser: '0',
  userRetentionRate: '0'
})

const securityStats = reactive({
  loginFailures: 0,
  activationFailures: 0,
  securityIncidents: 0,
  systemErrors: 0
})

interface GamePerformanceRow { id: string; name: string; activationCount: number; uniqueActivatedUsers: number; marketShare: string | number; playToActivationRatio: string | number; status: string }
interface GameUsagePattern { gameId: string; gameName: string; playStartCount: number; completionRate: string | number; uniquePlayers: number }
interface GeoDistributionItem { ip: string; region: string; loginCount: number }
interface RecentActivityItem { id: string; createdAt: string; type: string; message: string; username?: string; gameName?: string; ip?: string }
interface ActivityHeatmapPoint { hour: number; loginCount: number; activationCount: number; playCount: number }
const gamePerformanceData = ref<GamePerformanceRow[]>([])
const gameUsagePatterns = ref<GameUsagePattern[]>([])
const geoDistribution = ref<GeoDistributionItem[]>([])
const recentActivities = ref<RecentActivityItem[]>([])
const activityHeatmapData = ref<ActivityHeatmapPoint[]>([])

// 图表引用
const activationTrendChart = ref()
const activityHeatmapChart = ref()

// 初始化激活趋势图
const initActivationTrendChart = (data: any) => {
  const chart = echarts.init(activationTrendChart.value)
  
  const option = {
    title: {
      text: '激活趋势',
      textStyle: {
        fontSize: 14,
        color: '#606266'
      }
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const data = params[0]
        return `${data.name}<br/>激活数: ${data.value}`
      }
    },
    xAxis: {
      type: 'category',
      data: data.map((item: any) => item.date),
      axisLine: {
        lineStyle: {
          color: '#e4e7ed'
        }
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        lineStyle: {
          color: '#e4e7ed'
        }
      }
    },
    series: [{
      data: data.map((item: any) => item.activations),
      type: 'line',
      smooth: true,
      lineStyle: {
        width: 3,
        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: '#667eea' },
          { offset: 1, color: '#764ba2' }
        ])
      },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(102, 126, 234, 0.3)' },
          { offset: 1, color: 'rgba(118, 75, 162, 0.1)' }
        ])
      }
    }]
  }
  
  chart.setOption(option)
  
  window.addEventListener('resize', () => {
    chart.resize()
  })
}

// 初始化活动热力图
const initActivityHeatmapChart = (data: any) => {
  const chart = echarts.init(activityHeatmapChart.value)
  
  const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`)
  // removed unused maxValue to avoid TS6133
  
  const option = {
    title: {
      text: '用户活动热力图',
      textStyle: {
        fontSize: 14,
        color: '#606266'
      }
    },
    tooltip: {
      formatter: (params: any) => {
        const data = params.data
        return `时间: ${data.hour}:00<br/>
                登录: ${data.loginCount}<br/>
                激活: ${data.activationCount}<br/>
                游玩: ${data.playCount}`
      }
    },
    xAxis: {
      type: 'category',
      data: hours,
      axisLine: {
        lineStyle: {
          color: '#e4e7ed'
        }
      }
    },
    yAxis: {
      type: 'value',
      name: '活动次数',
      axisLine: {
        lineStyle: {
          color: '#e4e7ed'
        }
      }
    },
    series: [
      {
        name: '登录',
        type: 'bar',
        stack: 'activity',
        data: data.map((item: any) => item.loginCount),
        itemStyle: {
          color: '#67c23a'
        }
      },
      {
        name: '激活',
        type: 'bar',
        stack: 'activity',
        data: data.map((item: any) => item.activationCount),
        itemStyle: {
          color: '#409eff'
        }
      },
      {
        name: '游玩',
        type: 'bar',
        stack: 'activity',
        data: data.map((item: any) => item.playCount),
        itemStyle: {
          color: '#e6a23c'
        }
      }
    ]
  }
  
  chart.setOption(option)
  
  window.addEventListener('resize', () => {
    chart.resize()
  })
}

// 加载数据函数
const loadRevenueAnalysis = async () => {
  try {
    const response = await getRevenueAnalysis()
    Object.assign(revenueData, response.data)
  } catch (error) {
    console.error('Failed to load revenue analysis:', error)
  }
}

const loadUserBehaviorAnalysis = async () => {
  try {
    const response = await getUserBehaviorAnalysis()
    Object.assign(userBehavior, response.data)
  } catch (error) {
    console.error('Failed to load user behavior analysis:', error)
  }
}

const loadGamePerformanceAnalysis = async () => {
  try {
    const response = await getGamePerformanceAnalysis()
    gamePerformanceData.value = response.data
  } catch (error) {
    console.error('Failed to load game performance analysis:', error)
  }
}

const loadActivationTrend = async () => {
  try {
    const response = await getActivationTrend(trendDays.value)
    await nextTick()
    if (activationTrendChart.value) {
      initActivationTrendChart(response.data)
    }
  } catch (error) {
    console.error('Failed to load activation trend:', error)
  }
}

const loadUserActivityHeatmap = async () => {
  try {
    const response = await getUserActivityHeatmap()
    activityHeatmapData.value = response.data
    await nextTick()
    if (activityHeatmapChart.value) {
      initActivityHeatmapChart(response.data)
    }
  } catch (error) {
    console.error('Failed to load user activity heatmap:', error)
  }
}

const loadSecurityStats = async () => {
  try {
    const response = await getSecurityStats()
    Object.assign(securityStats, response.data)
  } catch (error) {
    console.error('Failed to load security stats:', error)
  }
}

const loadGameUsagePatterns = async () => {
  try {
    const response = await getGameUsagePatterns()
    gameUsagePatterns.value = response.data
  } catch (error) {
    console.error('Failed to load game usage patterns:', error)
  }
}

const loadUserGeographicDistribution = async () => {
  try {
    const response = await getUserGeographicDistribution()
    geoDistribution.value = response.data
  } catch (error) {
    console.error('Failed to load geographic distribution:', error)
  }
}

const loadRecentActivities = async () => {
  try {
    const response = await getRecentActivities(20)
    recentActivities.value = response.data
  } catch (error) {
    console.error('Failed to load recent activities:', error)
  }
}

// 辅助函数
const formatTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

const getActivityTagType = (type: string) => {
  const typeMap: { [key: string]: string } = {
    'USER_LOGIN': 'success',
    'USER_REGISTER': 'primary',
    'GAME_ACTIVATION': 'warning',
    'GAME_PLAY_START': 'info',
    'USER_LOGIN_FAILED': 'danger',
    'GAME_ACTIVATION_FAILED': 'danger',
    'ADMIN_LOGIN': 'success'
  }
  return typeMap[type] || 'info'
}

const getActivityTypeText = (type: string) => {
  const typeMap: { [key: string]: string } = {
    'USER_LOGIN': '用户登录',
    'USER_REGISTER': '用户注册',
    'GAME_ACTIVATION': '游戏激活',
    'GAME_PLAY_START': '开始游戏',
    'USER_LOGIN_FAILED': '登录失败',
    'GAME_ACTIVATION_FAILED': '激活失败',
    'ADMIN_LOGIN': '管理员登录'
  }
  return typeMap[type] || type
}

const onDateRangeChange = (dates: any) => {
  // 这里可以根据日期范围重新加载数据
  console.log('Date range changed:', dates)
}

const refreshData = async () => {
  loading.value = true
  try {
    await Promise.all([
      loadRevenueAnalysis(),
      loadUserBehaviorAnalysis(),
      loadGamePerformanceAnalysis(),
      loadActivationTrend(),
      loadUserActivityHeatmap(),
      loadSecurityStats(),
      loadGameUsagePatterns(),
      loadUserGeographicDistribution(),
      loadRecentActivities()
    ])
  } finally {
    loading.value = false
  }
}

// 初始化
onMounted(async () => {
  await refreshData()
})
</script>

<style scoped>
.enhanced-dashboard {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 60px);
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.dashboard-header h1 {
  margin: 0;
  color: #303133;
  font-size: 24px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.metrics-row {
  margin-bottom: 20px;
}

.metric-card {
  height: 120px;
  overflow: hidden;
}

.metric-card.revenue {
  border-left: 4px solid #67c23a;
}

.metric-card.users {
  border-left: 4px solid #409eff;
}

.metric-card.conversion {
  border-left: 4px solid #e6a23c;
}

.metric-card.security {
  border-left: 4px solid #f56c6c;
}

.metric-content {
  display: flex;
  align-items: center;
  height: 100%;
}

.metric-icon {
  margin-right: 16px;
  padding: 12px;
  border-radius: 8px;
  background-color: #f0f9ff;
}

.metric-data h3 {
  margin: 0 0 4px 0;
  font-size: 28px;
  font-weight: bold;
  color: #303133;
}

.metric-data p {
  margin: 0 0 8px 0;
  color: #909399;
  font-size: 14px;
}

.metric-trend {
  font-size: 12px;
}

.trend-label {
  color: #67c23a;
  font-weight: 500;
}

.charts-section {
  margin-bottom: 20px;
}

.chart-card {
  height: 400px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-container {
  height: 320px;
  width: 100%;
}

.performance-section {
  margin-bottom: 20px;
}

.performance-card {
  height: 460px;
}

.usage-card {
  height: 460px;
}

.usage-patterns {
  max-height: 400px;
  overflow-y: auto;
}

.pattern-item {
  margin-bottom: 16px;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 6px;
}

.pattern-name {
  font-weight: 600;
  margin-bottom: 8px;
  color: #303133;
}

.pattern-stats {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.stat-label {
  color: #909399;
}

.stat-value {
  font-weight: 500;
  color: #303133;
}

.pattern-progress {
  margin-top: 8px;
}

.monitoring-section {
  margin-bottom: 20px;
}

.geo-card, .security-card {
  height: 300px;
}

.geo-distribution {
  max-height: 240px;
  overflow-y: auto;
}

.geo-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.geo-info {
  display: flex;
  flex-direction: column;
}

.geo-region {
  font-weight: 500;
  color: #303133;
}

.geo-ip {
  font-size: 12px;
  color: #909399;
}

.security-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  height: 240px;
}

.security-item {
  display: flex;
  align-items: center;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.security-icon {
  margin-right: 12px;
  padding: 8px;
  border-radius: 50%;
}

.security-icon.failed-login {
  background-color: #fef0f0;
  color: #f56c6c;
}

.security-icon.activation-failed {
  background-color: #fef0f0;
  color: #f56c6c;
}

.security-icon.security-incident {
  background-color: #fff7e6;
  color: #e6a23c;
}

.security-icon.system-error {
  background-color: #f0f9ff;
  color: #409eff;
}

.security-info h4 {
  margin: 0 0 4px 0;
  font-size: 20px;
  font-weight: bold;
}

.security-info p {
  margin: 0;
  font-size: 12px;
  color: #909399;
}

.activity-section {
  margin-bottom: 20px;
}

.activity-card {
  min-height: 400px;
}

.activity-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.activity-timeline {
  max-height: 350px;
  overflow-y: auto;
  padding: 0 20px;
}

.activity-item {
  margin-bottom: 8px;
}

.activity-message {
  margin-left: 8px;
  color: #303133;
}

.activity-details {
  margin-top: 4px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.detail-item {
  font-size: 12px;
  color: #909399;
  background-color: #f5f7fa;
  padding: 2px 6px;
  border-radius: 4px;
}

@media (max-width: 768px) {
  .enhanced-dashboard {
    padding: 10px;
  }
  
  .dashboard-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .header-actions {
    justify-content: center;
  }
  
  .metrics-row .el-col {
    margin-bottom: 12px;
  }
  
  .charts-section .el-col,
  .performance-section .el-col,
  .monitoring-section .el-col {
    margin-bottom: 12px;
  }
}
</style>
