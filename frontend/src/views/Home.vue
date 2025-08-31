<template>
  <div>
    <h1>Welcome to the Personal Game Website</h1>
    <div v-if="authStore.isLoggedIn">
      <p>Hello, {{ authStore.user?.username || 'User' }}!</p>
      <button @click="handleLogout">Logout</button>
    </div>
    <div v-else>
      <p>Please <router-link to="/login">login</router-link> to continue.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

// Fetch user info if logged in but page is reloaded
if (authStore.isLoggedIn && !authStore.user) {
  authStore.fetchUser();
}

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};
</script>