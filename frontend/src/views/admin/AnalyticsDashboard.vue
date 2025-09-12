<template>
  <div class="analytics-dashboard">
    <!-- 页面标题 -->
    <div class="dashboard-header">
      <h1>数据分析仪表盘</h1>
      <p>基于真实数据的网站运营分析</p>
      <el-button
        type="primary"
        @click="refreshAllData"
        :loading="loading"
        icon="Refresh"
      >
        刷新数据
      </el-button>
    </div>

    <!-- 核心指标卡片 -->
    <div class="metrics-section">
      <el-row :gutter="20">
        <el-col :span="6">
          <MetricCard
            title="用户总数"
            :value="metrics?.totalUsers || 0"
            :growth="metrics?.userGrowthRate || 0"
            icon="User"
            color="#409EFF"
          />
        </el-col>
        <el-col :span="6">
          <MetricCard
            title="游戏总数"
            :value="metrics?.totalGames || 0"
            icon="VideoPlay"
            color="#67C23A"
          />
        </el-col>
        <el-col :span="6">
          <MetricCard
            title="激活总数"
            :value="metrics?.totalActivations || 0"
            icon="Key"
            color="#E6A23C"
          />
        </el-col>
        <el-col :span="6">
          <MetricCard
            title="激活率"
            :value="`${(metrics?.activationRate || 0).toFixed(1)}%`"
            icon="TrendCharts"
            color="#F56C6C"
          />
        </el-col>
      </el-row>
    </div>

    <!-- 今日数据 -->
    <div class="today-stats">
      <el-card>
        <template #header>
          <span>今日实时数据</span>
        </template>
        <el-row :gutter="20">
          <el-col :span="8">
            <div class="today-stat">
              <span class="label">新增用户</span>
              <span class="value">{{ realTimeMetrics?.todayStats.newUsers || 0 }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="today-stat">
              <span class="label">新增激活</span>
              <span class="value">{{ realTimeMetrics?.todayStats.activations || 0 }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="today-stat">
              <span class="label">用户登录</span>
              <span class="value">{{ realTimeMetrics?.todayStats.logins || 0 }}</span>
            </div>
          </el-col>
        </el-row>
      </el-card>
    </div>

    <!-- 图表分析区域 -->
    <div class="charts-section">
      <el-row :gutter="20">
        <!-- 用户注册趋势 -->
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>用户注册趋势（最近30天）</span>
            </template>
            <div ref="registrationTrendChart" class="chart-container"></div>
          </el-card>
        </el-col>

        <!-- 游戏激活趋势 -->
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>游戏激活趋势（最近30天）</span>
            </template>
            <div ref="activationTrendChart" class="chart-container"></div>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" style="margin-top: 20px;">
        <!-- 游戏状态分布 -->
        <el-col :span="8">
          <el-card>
            <template #header>
              <span>游戏状态分布</span>
            </template>
            <div ref="gameStatusChart" class="chart-container-small"></div>
          </el-card>
        </el-col>

        <!-- 用户角色分布 -->
        <el-col :span="8">
          <el-card>
            <template #header>
              <span>用户角色分布</span>
            </template>
            <div ref="userRoleChart" class="chart-container-small"></div>
          </el-card>
        </el-col>

        <!-- 激活码状态分布 -->
        <el-col :span="8">
          <el-card>
            <template #header>
              <span>激活码状态分布</span>
            </template>
            <div ref="codeStatusChart" class="chart-container-small"></div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 数据表格区域 -->
    <div class="tables-section">
      <el-row :gutter="20">
        <!-- 热门游戏 -->
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>热门游戏排行</span>
            </template>
            <el-table :data="gameAnalytics?.popularGames || []" style="width: 100%">
              <el-table-column prop="gameName" label="游戏名称" />
              <el-table-column prop="activationCount" label="激活数" sortable />
              <el-table-column prop="playCount" label="播放数" sortable />
              <el-table-column label="激活游玩比" sortable>
                <template #default="scope">
                  <el-tag :type="getPlayRatioTagType(scope.row.playActivationRatio)">
                    {{ scope.row.playActivationRatio }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="创建时间">
                <template #default="scope">
                  {{ formatDate(scope.row.createdAt) }}
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>

        <!-- 最近注册用户 -->
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>最近注册用户</span>
            </template>
            <el-table :data="userAnalytics?.recentRegistrations || []" style="width: 100%">
              <el-table-column prop="username" label="用户名" />
              <el-table-column prop="email" label="邮箱" />
              <el-table-column label="注册时间">
                <template #default="scope">
                  {{ formatDate(scope.row.createdAt) }}
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 系统活动 -->
    <div class="system-section">
      <el-row :gutter="20">
        <!-- 日志类型统计 -->
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>系统日志类型统计</span>
            </template>
            <div ref="logTypeChart" class="chart-container"></div>
          </el-card>
        </el-col>

        <!-- 最近活动 -->
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>最近系统活动</span>
            </template>
            <div class="recent-activities">
              <div
                v-for="activity in recentActivities"
                :key="activity.timestamp"
                class="activity-item"
              >
                <span class="activity-type">{{ getLogTypeDisplayName(activity.type) }}</span>
                <span class="activity-message">{{ activity.message }}</span>
                <span class="activity-time">{{ formatTime(activity.timestamp) }}</span>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, computed } from 'vue';
import { msg, AdminText } from '@/utils/message';
import * as echarts from 'echarts';
import { dashboardAnalyticsApi } from '@/api/dashboardAnalytics';
import MetricCard from '@/components/MetricCard.vue';

// 响应式数据
const loading = ref(false);
const metrics = ref<any>();
const userAnalytics = ref<any>();
const gameAnalytics = ref<any>();
const activationAnalytics = ref<any>();
const systemAnalytics = ref<any>();
const realTimeMetrics = ref<any>();

// Chart refs
const registrationTrendChart = ref<HTMLElement>();
const activationTrendChart = ref<HTMLElement>();
const gameStatusChart = ref<HTMLElement>();
const userRoleChart = ref<HTMLElement>();
const codeStatusChart = ref<HTMLElement>();
const logTypeChart = ref<HTMLElement>();

// 计算属性
const recentActivities = computed(() => {
  return realTimeMetrics.value?.recentActivities?.slice(0, 10) || [];
});

// 加载所有数据
const loadDashboardData = async () => {
  try {
    loading.value = true;
    const response = await dashboardAnalyticsApi.getComprehensiveDashboard();
    const data = response.data;
    
    metrics.value = data.metrics;
    userAnalytics.value = data.userAnalytics;
    gameAnalytics.value = data.gameAnalytics;
    activationAnalytics.value = data.activationAnalytics;
    systemAnalytics.value = data.systemAnalytics;
    realTimeMetrics.value = data.realTimeMetrics;

    // 渲染图表
    await nextTick();
    renderCharts();
  } catch (error) {
    console.error('加载仪表盘数据失败:', error);
    // 使用统一消息封装
    msg.error(AdminText.loadFailGeneric)
  } finally {
    loading.value = false;
  }
};

// 渲染所有图表
const renderCharts = () => {
  renderRegistrationTrendChart();
  renderActivationTrendChart();
  renderGameStatusChart();
  renderUserRoleChart();
  renderCodeStatusChart();
  renderLogTypeChart();
};

// 用户注册趋势图
const renderRegistrationTrendChart = () => {
  if (!registrationTrendChart.value || !userAnalytics.value?.registrationTrend) return;
  
  const chart = echarts.init(registrationTrendChart.value);
  const data = userAnalytics.value.registrationTrend;
  
  const option = {
    title: {
      text: '用户注册趋势',
      left: 'center',
      textStyle: {
        fontSize: 14,
        color: '#303133'
      }
    },
    tooltip: {
      trigger: 'axis',
      formatter: '{b}<br/>注册用户数: {c}'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: data.map((item: any) => item.date),
      axisLabel: {
        formatter: (value: string) => {
          return value.split('-')[2]; // 只显示日期
        }
      }
    },
    yAxis: {
      type: 'value',
      name: '用户数',
      nameTextStyle: {
        color: '#666'
      }
    },
    series: [{
      name: '注册用户数',
      type: 'line',
      data: data.map((item: any) => item.count),
      smooth: true,
      areaStyle: {
        opacity: 0.3,
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: '#409EFF' },
            { offset: 1, color: '#ffffff' }
          ]
        }
      },
      lineStyle: {
        color: '#409EFF'
      },
      itemStyle: {
        color: '#409EFF'
      }
    }]
  };
  
  chart.setOption(option);
};

// 游戏激活趋势图
const renderActivationTrendChart = () => {
  if (!activationTrendChart.value || !activationAnalytics.value?.activationTrend) return;
  
  const chart = echarts.init(activationTrendChart.value);
  const data = activationAnalytics.value.activationTrend;
  
  const option = {
    title: {
      text: '游戏激活趋势',
      left: 'center',
      textStyle: {
        fontSize: 14,
        color: '#303133'
      }
    },
    tooltip: {
      trigger: 'axis',
      formatter: '{b}<br/>激活数量: {c}'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: data.map((item: any) => item.date),
      axisLabel: {
        formatter: (value: string) => {
          return value.split('-')[2]; // 只显示日期
        }
      }
    },
    yAxis: {
      type: 'value',
      name: '激活数',
      nameTextStyle: {
        color: '#666'
      }
    },
    series: [{
      name: '激活数',
      type: 'bar',
      data: data.map((item: any) => item.count),
      itemStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: '#67C23A' },
            { offset: 1, color: '#95d475' }
          ]
        }
      }
    }]
  };
  
  chart.setOption(option);
};

// 游戏状态分布饼图
const renderGameStatusChart = () => {
  if (!gameStatusChart.value || !gameAnalytics.value?.gamesByStatus) return;
  
  const chart = echarts.init(gameStatusChart.value);
  const data = gameAnalytics.value.gamesByStatus;
  
  const statusMap: Record<string, string> = {
    'DRAFT': '草稿',
    'PUBLISHED': '已发布'
  };
  
  const option = {
    title: {
      text: '游戏状态分布',
      left: 'center',
      textStyle: {
        fontSize: 12,
        color: '#303133'
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a}<br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'center',
      formatter: (name: string) => statusMap[name] || name
    },
    series: [{
      name: '游戏状态',
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['60%', '50%'],
      data: data.map((item: any) => ({
        name: item.status,
        value: item.count,
        itemStyle: {
          color: item.status === 'PUBLISHED' ? '#67C23A' : '#E6A23C'
        }
      })),
      label: {
        formatter: (params: any) => {
          const statusName = statusMap[params.name] || params.name;
          return `${statusName}\n${params.value}`;
        }
      }
    }]
  };
  
  chart.setOption(option);
};

// 用户角色分布饼图
const renderUserRoleChart = () => {
  if (!userRoleChart.value || !userAnalytics.value?.userRoleDistribution) return;
  
  const chart = echarts.init(userRoleChart.value);
  const data = userAnalytics.value.userRoleDistribution;
  
  const roleMap: Record<string, string> = {
    'ADMIN': '管理员',
    'USER': '普通用户'
  };
  
  const option = {
    title: {
      text: '用户角色分布',
      left: 'center',
      textStyle: {
        fontSize: 12,
        color: '#303133'
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a}<br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'center',
      formatter: (name: string) => roleMap[name] || name
    },
    series: [{
      name: '用户角色',
      type: 'pie',
      radius: '60%',
      center: ['60%', '50%'],
      data: data.map((item: any) => ({
        name: item.role,
        value: item.count,
        itemStyle: {
          color: item.role === 'ADMIN' ? '#F56C6C' : '#409EFF'
        }
      })),
      label: {
        formatter: (params: any) => {
          const roleName = roleMap[params.name] || params.name;
          return `${roleName}\n${params.value}`;
        }
      }
    }]
  };
  
  chart.setOption(option);
};

// 激活码状态分布饼图
const renderCodeStatusChart = () => {
  if (!codeStatusChart.value || !activationAnalytics.value?.codeStatusDistribution) return;
  
  const chart = echarts.init(codeStatusChart.value);
  const data = activationAnalytics.value.codeStatusDistribution;
  
  const statusMap: Record<string, string> = {
    'UNUSED': '未使用',
    'ACTIVATED': '已激活'
  };
  
  const option = {
    title: {
      text: '激活码状态分布',
      left: 'center',
      textStyle: {
        fontSize: 12,
        color: '#303133'
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a}<br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'center',
      formatter: (name: string) => statusMap[name] || name
    },
    series: [{
      name: '激活码状态',
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['60%', '50%'],
      data: data.map((item: any) => ({
        name: item.status,
        value: item.count,
        itemStyle: {
          color: item.status === 'ACTIVATED' ? '#67C23A' : '#909399'
        }
      })),
      label: {
        formatter: (params: any) => {
          const statusName = statusMap[params.name] || params.name;
          return `${statusName}\n${params.value}`;
        }
      }
    }]
  };
  
  chart.setOption(option);
};

// 日志类型统计条形图
const renderLogTypeChart = () => {
  if (!logTypeChart.value || !systemAnalytics.value?.logTypeDistribution) return;
  
  const chart = echarts.init(logTypeChart.value);
  const data = systemAnalytics.value.logTypeDistribution.slice(0, 10); // 只显示前10个
  
  // 日志类型中文映射
  const logTypeMap: Record<string, string> = {
    'USER_REGISTER': '用户注册',
    'USER_LOGIN': '用户登录',
    'USER_LOGIN_FAILED': '登录失败',
    'USER_LOGOUT': '用户退出',
    'GAME_ACTIVATION': '游戏激活',
    'GAME_PLAY_VALID': '有效游玩',
    'CODE_ACTIVATION_SUCCESS': '激活码使用成功',
    'CODE_ACTIVATION_FAILED': '激活码使用失败',
    'ADMIN_LOGIN': '管理员登录',
    'ADMIN_GAME_CREATE': '创建游戏',
    'ADMIN_GAME_UPDATE': '更新游戏',
    'ADMIN_CODE_CREATE': '创建激活码',
    'SYSTEM_ERROR': '系统错误',
    'SECURITY_UNAUTHORIZED_ACCESS': '未授权访问'
  };
  
  const option = {
    title: {
      text: '系统日志类型统计',
      left: 'center',
      textStyle: {
        fontSize: 14,
        color: '#303133'
      }
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const logType = params[0].name;
        const logTypeName = logTypeMap[logType] || logType;
        return `${logTypeName}<br/>数量: ${params[0].value}`;
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      name: '数量',
      nameTextStyle: {
        color: '#666'
      }
    },
    yAxis: {
      type: 'category',
      data: data.map((item: any) => logTypeMap[item.type] || item.type),
      axisLabel: {
        interval: 0,
        formatter: (value: string) => {
          return value.length > 6 ? value.substring(0, 6) + '...' : value;
        }
      }
    },
    series: [{
      name: '日志数量',
      type: 'bar',
      data: data.map((item: any) => item.count),
      itemStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 1,
          y2: 0,
          colorStops: [
            { offset: 0, color: '#E6A23C' },
            { offset: 1, color: '#f0c78a' }
          ]
        }
      }
    }]
  };
  
  chart.setOption(option);
};

// 格式化日期
const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString('zh-CN');
};

// 格式化时间
const formatTime = (date: string | Date) => {
  return new Date(date).toLocaleString('zh-CN');
};

// 获取日志类型显示名称
const getLogTypeDisplayName = (type: string) => {
  const logTypeMap: Record<string, string> = {
    'USER_REGISTER': '用户注册',
    'USER_LOGIN': '用户登录',
    'USER_LOGIN_FAILED': '登录失败',
    'USER_LOGOUT': '用户退出',
    'GAME_ACTIVATION': '游戏激活',
    'GAME_PLAY_VALID': '有效游玩',
    'CODE_ACTIVATION_SUCCESS': '激活码使用成功',
    'CODE_ACTIVATION_FAILED': '激活码使用失败',
    'ADMIN_LOGIN': '管理员登录',
    'ADMIN_GAME_CREATE': '创建游戏',
    'ADMIN_GAME_UPDATE': '更新游戏',
    'ADMIN_CODE_CREATE': '创建激活码',
    'SYSTEM_ERROR': '系统错误',
    'SECURITY_UNAUTHORIZED_ACCESS': '未授权访问'
  };
  return logTypeMap[type] || type;
};

// 获取激活游玩比标签类型
const getPlayRatioTagType = (ratio: number) => {
  if (ratio >= 1.5) return 'success';  // 绿色：游玩比≥1.5，说明游戏质量很好
  if (ratio >= 1.0) return '';         // 蓝色：游玩比≥1.0，说明游戏质量正常
  if (ratio >= 0.5) return 'warning';  // 橙色：游玩比≥0.5，说明游戏质量一般
  return 'danger';                     // 红色：游玩比<0.5，说明游戏质量较差
};

// 刷新所有数据
const refreshAllData = () => {
  loadDashboardData();
};

// 组件挂载时加载数据
onMounted(() => {
  loadDashboardData();
});
</script>

<style scoped>
.analytics-dashboard {
  padding: 20px;
}

.dashboard-header {
  margin-bottom: 30px;
  text-align: center;
}

.dashboard-header h1 {
  margin: 0 0 10px 0;
  color: #303133;
}

.dashboard-header p {
  margin: 0 0 20px 0;
  color: #909399;
}

.metrics-section {
  margin-bottom: 30px;
}

.today-stats {
  margin-bottom: 30px;
}

.today-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

.today-stat .label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 10px;
}

.today-stat .value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.charts-section {
  margin-bottom: 30px;
}

.chart-container {
  height: 300px;
  width: 100%;
}

.chart-container-small {
  height: 200px;
  width: 100%;
}

.tables-section {
  margin-bottom: 30px;
}

.system-section {
  margin-bottom: 30px;
}

.recent-activities {
  max-height: 300px;
  overflow-y: auto;
}

.activity-item {
  display: flex;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #ebeef5;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-type {
  min-width: 120px;
  font-size: 12px;
  color: #409EFF;
  background: #ecf5ff;
  padding: 2px 6px;
  border-radius: 3px;
  margin-right: 10px;
}

.activity-message {
  flex: 1;
  font-size: 14px;
  color: #303133;
  margin-right: 10px;
}

.activity-time {
  font-size: 12px;
  color: #909399;
  min-width: 120px;
  text-align: right;
}
</style>
