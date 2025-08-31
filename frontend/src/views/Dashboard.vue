<template>
  <div class="dashboard">
    <h1>Admin Dashboard</h1>
    <div class="admin-content">
      <aside class="sidebar">
        <router-link to="/admin/games">Game Management</router-link>
        <router-link to="/admin/codes">Code Management</router-link>
      </aside>
      <main class="main-view">
        <router-view></router-view>
      </main>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
}
.admin-content {
  display: flex;
}
.sidebar {
  width: 200px;
  padding: 20px;
  background-color: #f4f4f4;
  display: flex;
  flex-direction: column;
}
.main-view {
  flex-grow: 1;
  padding: 20px;
}
</style>