import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '@/store/auth';
import { msg, AdminText } from '@/utils/message';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/Home.vue'),
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/Register.vue'),
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('../views/ForgotPassword.vue'),
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/Profile.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('../views/About.vue')
  },
  {
    path: '/game/:id',
    name: 'GamePlay',
    component: () => import('../views/GamePlay.vue'),
    meta: { requiresAuth: true }
  },
  // 管理后台路由
  {
    path: '/admin',
    component: () => import('../views/admin/AdminLayout.vue'),
    redirect: '/admin/analytics',
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      {
        path: 'analytics',
        name: 'AdminAnalytics',
        component: () => import('../views/admin/AnalyticsDashboard.vue'),
        meta: { title: '数据分析仪表盘' }
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: () => import('../views/admin/UserManagement.vue'),
        meta: { title: '用户管理' }
      },
      {
        path: 'games',
        name: 'AdminGames',
        component: () => import('../views/admin/GameManagement.vue'),
        meta: { title: '游戏管理' }
      },
      {
        path: 'codes',
        name: 'AdminCodes',
        component: () => import('../views/admin/CodeManagement.vue'),
        meta: { title: '激活码管理' }
      },
      {
        path: 'logs',
        name: 'AdminLogs',
        component: () => import('../views/admin/LogManagement.vue'),
        meta: { title: '日志管理' }
      },
      {
        path: 'settings',
        name: 'AdminSettings',
        component: () => import('../views/admin/Settings.vue'),
        meta: { title: '系统设置' }
      }
    ]
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore();
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const requiresAdmin = to.matched.some(record => record.meta.requiresAdmin);

  // 检查认证状态
  if (requiresAuth && !authStore.isAuthenticated) {
  msg.validation(AdminText.needLogin, 'needLoginRoute');
    return next({ name: 'Login', query: { redirect: to.fullPath } });
  }

  // 检查管理员权限
  if (requiresAdmin && authStore.userRole !== 'ADMIN') {
  msg.error(AdminText.noPermission, 'noAdmin');
    return next({ name: 'home' });
  }

  next();
});

export default router;