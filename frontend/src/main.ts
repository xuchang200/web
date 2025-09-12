import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './style.css'

// Element Plus
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

// 图标
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { useAuthStore } from './store/auth'
import { useSiteInfoStore } from './store/siteInfo'

// if (import.meta.env.DEV) {
//   import('./mock');
// }

const app = createApp(App)
const pinia = createPinia()

// 注册所有图标组件
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(ElementPlus)
app.use(pinia)
app.use(router)

// 在挂载应用之前，先尝试从 localStorage 加载认证状态
const authStore = useAuthStore()
authStore.loadStateFromStorage()

// 预加载站点信息
const siteInfoStore = useSiteInfoStore()
siteInfoStore.fetch().finally(()=>{
  // 动态设置浏览器标题
  document.title = siteInfoStore.siteName
})

app.mount('#app')
