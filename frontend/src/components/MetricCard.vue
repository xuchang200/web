<template>
  <el-card class="metric-card" :body-style="{ padding: '20px' }">
    <div class="metric-content">
      <div class="metric-icon" :style="{ backgroundColor: color }">
        <el-icon :size="24">
          <component :is="icon" />
        </el-icon>
      </div>
      <div class="metric-info">
        <div class="metric-title">{{ title }}</div>
        <div class="metric-value">{{ formatValue(value) }}</div>
        <div v-if="growth !== undefined" class="metric-growth" :class="growthClass">
          <el-icon>
            <ArrowUp v-if="growth > 0" />
            <ArrowDown v-if="growth < 0" />
            <Minus v-if="growth === 0" />
          </el-icon>
          {{ Math.abs(growth).toFixed(1) }}%
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ArrowUp, ArrowDown, Minus } from '@element-plus/icons-vue';

interface Props {
  title: string;
  value: string | number;
  growth?: number;
  icon: string;
  color: string;
}

const props = defineProps<Props>();

const growthClass = computed(() => {
  if (props.growth === undefined) return '';
  if (props.growth > 0) return 'positive';
  if (props.growth < 0) return 'negative';
  return 'neutral';
});

const formatValue = (value: string | number) => {
  if (typeof value === 'number') {
    return value.toLocaleString();
  }
  return value;
};
</script>

<style scoped>
.metric-card {
  height: 120px;
}

.metric-content {
  display: flex;
  align-items: center;
  height: 100%;
}

.metric-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  color: white;
}

.metric-info {
  flex: 1;
}

.metric-title {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.metric-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 4px;
}

.metric-growth {
  display: flex;
  align-items: center;
  font-size: 12px;
  font-weight: 500;
}

.metric-growth.positive {
  color: #67C23A;
}

.metric-growth.negative {
  color: #F56C6C;
}

.metric-growth.neutral {
  color: #909399;
}

.metric-growth .el-icon {
  margin-right: 4px;
}
</style>
