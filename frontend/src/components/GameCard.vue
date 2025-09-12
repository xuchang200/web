<template>
  <div 
    class="game-card"
    @mouseenter="startHoverTimer"
    @mouseleave="clearHoverTimer"
  >
    <div class="game-image">
      <img :src="game.coverImage" :alt="game.title" />
    </div>
    
    <!-- 游戏详情弹出层 -->
    <div v-if="showDetails" class="game-details-popup">
      <div class="details-content">
        <h4>{{ game.title }}</h4>
        <p class="game-description">{{ game.description }}</p>
        <button class="play-button" @click="playGame">
          立即游玩
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Game {
  id: string
  title: string
  coverImage: string
  description: string
  playCount: number
  rating: number
}

const props = defineProps<{
  game: Game
}>()

const emit = defineEmits<{
  play: [gameId: string]
}>()

const showDetails = ref(false)
let hoverTimer: number | null = null

const startHoverTimer = () => {
  hoverTimer = window.setTimeout(() => {
    showDetails.value = true
  }, 500) // 0.5秒后显示详情
}

const clearHoverTimer = () => {
  if (hoverTimer) {
    clearTimeout(hoverTimer)
    hoverTimer = null
  }
  showDetails.value = false
}

const playGame = () => {
  emit('play', props.game.id)
}
</script>

<style scoped lang="scss">
.game-card {
  position: relative;
  background: white;
  border-radius: 20px;
  border: 3px solid #A56A5A; /* 修改为粉棕色 */
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(255, 128, 171, 0.2);
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 25px rgba(165, 106, 90, 0.3); /* 阴影也调整为粉棕色调 */
    border-color: #8b574a;
  }
}

.game-image {
  width: 100%;
  aspect-ratio: 4/3; // 固定4:3比例
  overflow: hidden;
  background: linear-gradient(45deg, #ff80ab, #ffcdd2);
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }
}

.game-card:hover .game-image img {
  transform: scale(1.05);
}

.game-details-popup {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  border-radius: 20px;
  animation: fadeIn 0.3s ease;
  z-index: 10;
  overflow-y: auto; // 允许垂直滚动
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.details-content {
  position: relative;
  text-align: center;
  
  h4 {
    font-size: 1.4rem;
    color: #ff4081;
    margin: 0 0 10px 0;
    text-shadow: 1px 1px 2px rgba(255, 64, 129, 0.1);
  }
  
  .game-description {
    color: #666;
    font-size: 0.9rem;
    margin: 0 0 15px 0;
    line-height: 1.4;
  }
  
  .play-button {
    background: linear-gradient(135deg, #ff4081 0%, #ff80ab 100%);
    color: white;
    border: none;
    border-radius: 20px;
    padding: 10px 20px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    border-bottom: 3px solid #e91e63;
    
    &:hover {
      background: linear-gradient(135deg, #f50057 0%, #ff4081 100%);
      transform: translateY(-1px);
      box-shadow: 0 4px 15px rgba(255, 64, 129, 0.4);
    }
    
    &:active {
      transform: translateY(0);
      border-bottom-width: 1px;
    }
  }
  
  .close-button {
    position: absolute;
    top: -10px;
    right: -10px;
    width: 30px;
    height: 30px;
    border: none;
    background: #ff4081;
    color: white;
    border-radius: 50%;
    cursor: pointer;
    font-size: 1.2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    z-index: 11;
    
    &:hover {
      background: #f50057;
      transform: scale(1.1);
    }
    
    // 在桌面端隐藏关闭按钮
    @media (min-width: 769px) {
      display: none;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .game-card {
    border-width: 2px;
  }
  
  .game-image {
    aspect-ratio: 4/3; // 保持4:3比例
  }
  
  .game-title {
    font-size: 1rem;
  }
  
  // 在移动端将详情弹出层改为全屏模态框
  .game-details-popup {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.98);
    border-radius: 0;
    padding: 80px 30px 30px 30px;
    z-index: 9999;
    animation: slideInUp 0.3s ease;
  }
  
  .details-content {
    max-width: 400px;
    margin: 0 auto;
    text-align: center;
    
    h4 {
      font-size: 1.8rem;
      margin-bottom: 20px;
      color: #ff4081;
    }
    
    .game-description {
      font-size: 1rem;
      line-height: 1.6;
      margin-bottom: 30px;
      color: #555;
    }
    
    .game-meta {
      margin-bottom: 30px;
      
      span {
        font-size: 1rem;
        padding: 8px 16px;
      }
    }
    
    .play-button {
      padding: 15px 30px;
      font-size: 1.1rem;
      border-radius: 30px;
    }
  }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(100%);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 480px) {
  .game-card {
    // 为单列显示优化卡片尺寸
    &:active {
      transform: scale(0.98);
      box-shadow: 0 2px 10px rgba(165, 106, 90, 0.2);
    }
  }
  
  .game-image {
    aspect-ratio: 4/3; // 保持4:3比例，移除固定高度
  }
  
  .game-title {
    font-size: 1.1rem; // 稍微增大标题字体
    padding: 5px 0;
  }
  
  .game-info {
    padding: 15px;
  }
  
  // 在小屏幕上优化全屏详情的显示
  .game-details-popup {
    padding: 60px 20px 20px 20px; // 减少顶部边距
  }
  
  .details-content {
    h4 {
      font-size: 1.6rem; // 调整标题大小
      margin-bottom: 15px;
    }
    
    .game-description {
      font-size: 0.95rem;
      line-height: 1.5;
      margin-bottom: 25px;
      // 添加最大高度和滚动，防止描述过长
      max-height: 200px;
      overflow-y: auto;
    }
    
    .game-meta {
      margin-bottom: 25px;
      
      span {
        font-size: 0.9rem;
        padding: 6px 12px;
      }
    }
    
    .play-button {
      padding: 12px 25px;
      font-size: 1rem;
    }
  }
}
</style>