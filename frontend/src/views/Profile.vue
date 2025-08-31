<template>
  <div class="profile-container">
    <h2>User Profile</h2>
    <div v-if="authStore.user">
      <p><strong>Username:</strong> {{ authStore.user.username }}</p>
      <p><strong>Email:</strong> {{ authStore.user.email }}</p>
    </div>

    <hr />

    <h3>Activate a Game</h3>
    <div class="activation-form">
      <input v-model="activationCode" type="text" placeholder="Enter your activation code" />
      <button @click="handleActivation">Activate</button>
      <p v-if="activationMessage" :class="{ 'success': isSuccess, 'error': !isSuccess }">{{ activationMessage }}</p>
    </div>

    <hr />

    <h3>My Games</h3>
    <!-- We will list the user's games here later -->
    <ul>
      <li>Game 1 (Placeholder)</li>
      <li>Game 2 (Placeholder)</li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '../stores/auth';
import axios from 'axios';

const authStore = useAuthStore();
const activationCode = ref('');
const activationMessage = ref('');
const isSuccess = ref(false);

const handleActivation = async () => {
  if (!activationCode.value.trim()) {
    activationMessage.value = 'Please enter a code.';
    isSuccess.value = false;
    return;
  }

  try {
    const response = await axios.post('http://localhost:3000/activate', {
      code: activationCode.value,
    });
    activationMessage.value = response.data.message;
    isSuccess.value = true;
    activationCode.value = ''; // Clear input on success
    // Here we should ideally refresh the user's game list
  } catch (err: any) {
    activationMessage.value = err.response?.data?.message || 'Activation failed.';
    isSuccess.value = false;
  }
};
</script>

<style scoped>
.profile-container {
  max-width: 600px;
  margin: 50px auto;
  padding: 20px;
  text-align: left;
}
.activation-form {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}
.success {
  color: green;
}
.error {
  color: red;
}
</style>