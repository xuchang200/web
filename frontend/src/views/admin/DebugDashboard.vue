<template>
  <div class="enhanced-dashboard">
    <h2>商业分析仪表盘 - 调试版</h2>
    
    <el-button @click="testAPI" type="primary" :loading="loading">测试 API</el-button>
    
    <div v-if="apiResults.length > 0" style="margin-top: 20px;">
      <h3>API 测试结果:</h3>
      <ul>
        <li v-for="result in apiResults" :key="result.name">
          <strong>{{ result.name }}:</strong> 
          <span style="color: green" v-if="result.success">成功</span>
          <span style="color: red" v-else>失败 - {{ result.error }}</span>
        </li>
      </ul>
    </div>

    <div v-if="revenueData" style="margin-top: 20px;">
      <h3>收入数据:</h3>
      <pre>{{ JSON.stringify(revenueData, null, 2) }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
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

const loading = ref(false)
const apiResults = ref<any[]>([])
const revenueData = ref<any>(null)

const testAPI = async () => {
  loading.value = true
  apiResults.value = []
  
  const apis = [
    { name: '收入分析', fn: getRevenueAnalysis },
    { name: '用户行为分析', fn: getUserBehaviorAnalysis },
    { name: '游戏性能分析', fn: getGamePerformanceAnalysis },
    { name: '激活趋势', fn: () => getActivationTrend(30) },
    { name: '用户地理分布', fn: getUserGeographicDistribution },
    { name: '用户活动热力图', fn: getUserActivityHeatmap },
    { name: '安全统计', fn: getSecurityStats },
    { name: '游戏使用模式', fn: getGameUsagePatterns },
    { name: '最近活动', fn: () => getRecentActivities(10) }
  ]

  for (const api of apis) {
    try {
      console.log(`测试 ${api.name}...`)
      const response = await api.fn()
      console.log(`${api.name} 成功:`, response)
      
      if (api.name === '收入分析') {
        revenueData.value = response.data
      }
      
      apiResults.value.push({
        name: api.name,
        success: true,
        data: response.data
      })
    } catch (error: any) {
      console.error(`${api.name} 失败:`, error)
      apiResults.value.push({
        name: api.name,
        success: false,
        error: error.message || error.toString()
      })
    }
  }
  
  loading.value = false
}
</script>

<style scoped>
.enhanced-dashboard {
  padding: 20px;
}

pre {
  background-color: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
}
</style>
