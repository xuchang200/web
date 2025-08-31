import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

import Home from '../views/Home.vue';
import Login from '../views/Login.vue';
import Game from '../views/Game.vue';
import Profile from '../views/Profile.vue';
import Dashboard from '../views/Dashboard.vue';
import GameManager from '../components/admin/GameManager.vue';

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/login', name: 'Login', component: Login },
  { path: '/reset-password', name: 'ResetPassword', component: Login }, // 重用Login组件处理密码重置
  { path: '/profile', name: 'Profile', component: Profile, meta: { requiresAuth: true } },
  { path: '/game/:id', name: 'Game', component: Game, meta: { requiresAuth: true } },
  {
    path: '/admin',
    component: Dashboard,
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      { path: 'games', component: GameManager },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();

  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    return next('/login');
  }

  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    if (!authStore.user) {
      authStore.fetchUser().then(() => {
        if (!authStore.isAdmin) return next('/');
        else return next();
      });
    } else {
      return next('/');
    }
  }

  next();
});

export default router;