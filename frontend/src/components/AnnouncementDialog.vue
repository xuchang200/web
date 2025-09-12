<template>
  <el-dialog v-model="visible" :title="store.siteName + ' 公告'" width="480px" @close="onClose" :close-on-click-modal="false">
    <div class="announcement-content" v-html="content"></div>
    <template #footer>
      <el-space>
        <el-button @click="dismissSession">本次不再提示</el-button>
        <el-button @click="dismiss24h">24 小时不再提示</el-button>
        <el-button type="primary" @click="onClose">知道了</el-button>
      </el-space>
    </template>
  </el-dialog>
</template>
<script setup lang="ts">
import { ref, watch } from 'vue'
import { useSiteInfoStore } from '@/store/siteInfo'
const store = useSiteInfoStore()
const visible = ref(false)
const content = ref('')

watch(() => store.shouldShowAnnouncement, (val) => {
  if (val) {
    content.value = store.announcement?.content || ''
    visible.value = true
  }
}, { immediate: true })

function onClose() { visible.value = false }
function dismissSession() { store.dismissAnnouncement('session'); visible.value=false }
function dismiss24h() { store.dismissAnnouncement('24h'); visible.value=false }
</script>
<style scoped>
.announcement-content { white-space: pre-wrap; line-height:1.6; }
</style>
