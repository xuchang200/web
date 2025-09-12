<template>
  <header class="app-header">
    <div class="logo">
      <router-link to="/">withU</router-link>
    </div>
    <nav class="navigation">
      <router-link to="/games">游戏列表</router-link>
      <router-link to="/about">关于我们</router-link>
    </nav>
    <div class="actions">
      <div class="search-bar">
        <input type="text" placeholder="搜索游戏..." />
      </div>
      <!-- 模拟未登录状态 -->
      <div v-if="!isLoggedIn" class="auth-buttons">
        <router-link to="/login" class="login-btn">登录</router-link>
        <router-link to="/register" class="register-btn">注册</router-link>
      </div>
      <!-- 模拟登录状态 -->
      <div v-else class="user-profile">
        <img src="https://via.placeholder.com/40" alt="User Avatar" class="avatar" />
        <div class="dropdown-menu">
          <router-link to="/profile">个人中心</router-link>
          <a href="#" @click.prevent="logout">退出登录</a>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

// 模拟用户登录状态，后续将由 Pinia store 管理
const isLoggedIn = ref(false); // 你可以切换这个值 (true/false) 来查看不同状态下的 UI

const router = useRouter();

const logout = () => {
  console.log('用户退出登录');
  isLoggedIn.value = false;
  router.push('/login');
};
</script>

<style scoped lang="scss">
// 设计变量已在 vite.config.ts 中全局引入

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 40px;
  height: 60px;
  background-color: rgba(255, 255, 255, 0.7); // 半透明背景
  backdrop-filter: blur(10px); // 毛玻璃效果
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  font-family: 'Comic Sans MS', 'Cute Font', sans-serif; // 沿用可爱字体

  .logo a {
    font-size: 28px;
    font-weight: bold;
    color: $--color-primary;
    text-decoration: none;
    // 沿用Login页面的字体风格，这里用一个可爱的字体代替
    font-family: 'YourCuteFont', 'Comic Sans MS', cursive;
  }

  .navigation a {
    margin: 0 20px;
    text-decoration: none;
    color: $--color-text-primary;
    font-size: 16px;
    transition: color 0.3s;

    &:hover {
      color: $--color-primary;
    }
  }

  .actions {
    display: flex;
    align-items: center;
    gap: 20px;
  }

  .search-bar input {
    border: 1px solid #ccc;
    border-radius: 20px;
    padding: 8px 15px;
    outline: none;
    transition: border-color 0.3s;
    font-family: inherit;

    &:focus {
      border-color: $--color-primary;
    }
  }

  .auth-buttons a {
    padding: 8px 16px;
    border-radius: 20px;
    text-decoration: none;
    transition: background-color 0.3s, color 0.3s;
    font-size: 14px;

    &.login-btn {
      background-color: transparent;
      color: $--color-primary;
      border: 1px solid $--color-primary;
      margin-right: 10px;
    }

    &.register-btn {
      background-color: $--color-primary;
      color: white;
    }
  }

  .user-profile {
    position: relative;
    cursor: pointer;

    .avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 2px solid $--color-primary;
    }

    .dropdown-menu {
      display: none;
      position: absolute;
      top: 50px;
      right: 0;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      padding: 10px 0;
      width: 120px;
      overflow: hidden;

      a {
        display: block;
        padding: 10px 20px;
        color: $--color-text-primary;
        text-decoration: none;
        font-size: 14px;

        &:hover {
          background-color: #f5f5f5;
        }
      }
    }

    &:hover .dropdown-menu {
      display: block;
    }
  }
}
</style>