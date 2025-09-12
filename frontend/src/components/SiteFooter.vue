<template>
  <footer class="site-footer" v-if="copyright">
    <div class="footer-content">
      <span class="copyright">{{ copyright }}</span>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { useSiteInfoStore } from '@/store/siteInfo'

const store = useSiteInfoStore()
const copyright = store.copyright
</script>

<style scoped lang="scss">
.site-footer {
  text-align: center;
  padding: 20px 10px;
  opacity: 0.8;
  font-size: 12px;
  color: #555;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(5px);
  border-top: 1px solid rgba(255, 128, 171, 0.1);
  margin-top: auto;
  
  @media (max-width: 767px) {
    padding: 15px 10px;
    font-size: 11px;
    
    /* 为移动端导航预留空间 */
    padding-bottom: calc(15px + env(safe-area-inset-bottom));
  }
  
  @media (max-width: 479px) {
    padding: 12px 8px;
    font-size: 10px;
  }
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  
  @media (max-width: 767px) {
    padding: 0 15px;
  }
}

.copyright {
  display: inline-block;
  color: rgba(255, 255, 255, 0.8);
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
  
  @media (max-width: 767px) {
    display: block;
    margin: 5px 0;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .site-footer {
    background: rgba(0, 0, 0, 0.2);
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .copyright {
    color: rgba(255, 255, 255, 0.9);
  }
}
</style>
