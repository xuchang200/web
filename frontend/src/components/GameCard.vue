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
  border: 3px solid #A56A5A;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(255, 128, 171, 0.2);
  width: 100%;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 25px rgba(165, 106, 90, 0.3);
    border-color: #8b574a;
  }
  
  /* 移动端点击效果 */
  @media (hover: none) and (pointer: coarse) {
    &:active {
      transform: scale(0.98);
      transition: transform 0.1s ease;
    }
  }
}

.game-image {
  width: 100%;
  aspect-ratio: 4/3;
  overflow: hidden;
  background: linear-gradient(45deg, #ff80ab, #ffcdd2);
  position: relative;
  
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
  overflow-y: auto;
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
  width: 100%;
  
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
    min-height: 44px; /* 适合触摸的最小高度 */
    
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
    
    /* 在桌面端隐藏关闭按钮 */
    @media (min-width: 769px) {
      display: none;
    }
  }
}

/* ========================================================================
   移动端响应式设计
   ======================================================================== */

@media (max-width: 767px) {
  .game-card {
    border-width: 2px;
    border-radius: 15px;
    margin: 0 auto;
    max-width: 400px; /* 限制最大宽度 */
  }
  
  .game-image {
    border-radius: 15px 15px 0 0;
  }
  
  /* 在移动端将详情弹出层改为全屏模态框 */
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
    backdrop-filter: blur(15px);
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
      max-height: 200px;
      overflow-y: auto;
    }
    
    .play-button {
      padding: 15px 30px;
      font-size: 1.1rem;
      border-radius: 30px;
      width: 100%;
      max-width: 200px;
    }
    
    .close-button {
      display: flex; /* 在移动端显示关闭按钮 */
      top: 20px;
      right: 20px;
      width: 40px;
      height: 40px;
      font-size: 1.5rem;
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

/* 超小屏设备优化 */
@media (max-width: 479px) {
  .game-card {
    border-radius: 12px;
    margin: 0 auto;
  }
  
  .game-image {
    border-radius: 12px 12px 0 0;
  }
  
  /* 优化小屏幕上的全屏详情显示 */
  .game-details-popup {
    padding: 70px 20px 20px 20px;
  }
  
  .details-content {
    h4 {
      font-size: 1.6rem;
      margin-bottom: 15px;
    }
    
    .game-description {
      font-size: 0.95rem;
      line-height: 1.5;
      margin-bottom: 25px;
      max-height: 150px;
    }
    
    .play-button {
      padding: 12px 25px;
      font-size: 1rem;
      width: 100%;
    }
    
    .close-button {
      top: 15px;
      right: 15px;
      width: 36px;
      height: 36px;
      font-size: 1.3rem;
    }
  }
}

/* 平板设备优化 */
@media (min-width: 768px) and (max-width: 1023px) {
  .game-card {
    border-radius: 18px;
  }
  
  .game-image {
    border-radius: 18px 18px 0 0;
  }
  
  .details-content {
    h4 {
      font-size: 1.5rem;
    }
    
    .game-description {
      font-size: 0.95rem;
    }
    
    .play-button {
      padding: 12px 25px;
      font-size: 1rem;
    }
  }
}

/* 大屏设备优化 */
@media (min-width: 1200px) {
  .game-card {
    border-radius: 25px;
    
    &:hover {
      transform: translateY(-8px);
    }
  }
  
  .game-image {
    border-radius: 25px 25px 0 0;
  }
  
  .details-content {
    padding: 25px;
    
    h4 {
      font-size: 1.6rem;
      margin-bottom: 15px;
    }
    
    .game-description {
      font-size: 1rem;
      margin-bottom: 20px;
    }
    
    .play-button {
      padding: 12px 25px;
      font-size: 1rem;
    }
  }
}

/* 触摸设备特殊优化 */
@media (hover: none) and (pointer: coarse) {
  .game-card {
    /* 移除hover效果，使用active状态 */
    &:hover {
      transform: none;
      box-shadow: 0 4px 15px rgba(255, 128, 171, 0.2);
      border-color: #A56A5A;
    }
    
    &:active {
      transform: scale(0.98);
      box-shadow: 0 2px 10px rgba(165, 106, 90, 0.2);
    }
  }
  
  .game-card:hover .game-image img {
    transform: none;
  }
  
  .details-content .play-button {
    &:hover {
      background: linear-gradient(135deg, #ff4081 0%, #ff80ab 100%);
      transform: none;
      box-shadow: none;
    }
    
    &:active {
      background: linear-gradient(135deg, #f50057 0%, #ff4081 100%);
      transform: scale(0.95);
    }
  }
}

/* 处理横屏模式 */
@media (max-height: 500px) and (orientation: landscape) {
  .game-details-popup {
    padding: 40px 20px 20px 20px;
    align-items: flex-start;
    overflow-y: auto;
  }
  
  .details-content {
    margin-top: 20px;
    
    h4 {
      font-size: 1.3rem;
      margin-bottom: 10px;
    }
    
    .game-description {
      font-size: 0.9rem;
      margin-bottom: 15px;
      max-height: 100px;
    }
    
    .play-button {
      padding: 10px 20px;
      font-size: 0.9rem;
    }
  }
}

/* 高分辨率屏幕优化 */
@media (min-resolution: 2dppx) {
  .game-card {
    border-width: 1.5px;
  }
  
  .details-content .play-button {
    border-bottom-width: 2px;
  }
}

/* 减少动画效果（用户偏好） */
@media (prefers-reduced-motion: reduce) {
  .game-card,
  .game-image img,
  .details-content .play-button,
  .details-content .close-button {
    transition: none;
  }
  
  .game-details-popup {
    animation: none;
  }
  
  .game-card:hover {
    transform: none;
  }
  
  .game-card:hover .game-image img {
    transform: none;
  }
}
</style>