<template>
  <footer class="site-footer" v-if="copyright">
    <span>{{ copyright }}</span>
  </footer>
</template>
<script setup lang="ts">
import { useSiteInfoStore } from '@/store/siteInfo'
const store = useSiteInfoStore()
const copyright = store.copyright
</script>
<style scoped>
.site-footer { text-align:center; padding:20px 10px; opacity:.8; font-size:12px; color:#555; }
</style>
