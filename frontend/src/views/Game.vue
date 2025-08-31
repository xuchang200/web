<template>
  <div class="game-container">
    <div v-if="isLoading" class="loading">Loading game...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <iframe v-if="gameEntryUrl" :src="gameEntryUrl" class="game-frame"></iframe>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import axios from 'axios';

const route = useRoute();
const authStore = useAuthStore();

const isLoading = ref(true);
const error = ref<string | null>(null);
const gameEntryUrl = ref<string | null>(null);

onMounted(async () => {
  const gameId = route.params.id;

  // 1. Check for login
  if (!authStore.isLoggedIn) {
    error.value = 'You must be logged in to play this game.';
    isLoading.value = false;
    return;
  }

  try {
    // 2. Verify permission and get game info from backend
    const response = await axios.get(`http://localhost:3000/games/${gameId}/play`);
    
    // The backend will return the entry path if the user has permission
    gameEntryUrl.value = response.data.gameEntryPath;

  } catch (err: any) {
    if (err.response && err.response.status === 403) {
      error.value = 'You do not have permission to play this game.';
    } else {
      error.value = 'Failed to load the game. Please try again later.';
    }
    console.error(err);
  } finally {
    isLoading.value = false;
  }
});
</script>

<style scoped>
.game-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}
.game-frame {
  width: 100%;
  height: 100%;
  border: none;
}
.loading, .error {
  font-size: 1.5em;
}
</style>