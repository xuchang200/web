# 游戏反复加载循环问题修复

## 问题原因

游戏界面陷入反复加载循环的根本原因是 **路由冲突**：

1. 前端路由 `/game/:id` 加载 GamePlay.vue 组件
2. GamePlay.vue 创建 iframe，src 设置为 `http://localhost:5173/game/{gameId}?token=...`  
3. 这个 URL 被前端路由系统再次拦截，重新加载 GamePlay.vue 组件
4. 新的 GamePlay.vue 又创建新的 iframe，形成无限循环

从开发者工具日志可以看到：
- `GamePlay 组件已挂载，开始检查访问权限` 重复出现
- `[vite] connecting...` 和 `[vite] connected.` 重复出现
- 整个权限检查和游戏加载流程完全重复执行

## 修复方案

### 1. 修改后端游戏内容路由路径

将后端游戏内容访问路由从 `/game` 改为 `/api/game-content`，避免与前端路由冲突：

**修改文件：** `backend/src/app.ts`
```diff
- app.use('/game', gameContentRoutes);
+ app.use('/api/game-content', gameContentRoutes);
```

### 2. 更新前端 iframe URL 构建

修改前端组件中的游戏 URL 构建逻辑：

**修改文件：** `frontend/src/views/GamePlay.vue`
```diff
- gameUrl.value = `${baseUrl}/game/${gameId}?${queryParams.toString()}`
+ gameUrl.value = `${baseUrl}/api/game-content/${gameId}?${queryParams.toString()}`
```

**修改文件：** `frontend/src/views/GameLauncher.vue`  
```diff
- gameUrl.value = `/game/${gameId}?token=${token}`
+ gameUrl.value = `/api/game-content/${gameId}?token=${token}`
```

### 3. 修复后端重定向逻辑

优化后端重定向，避免不必要的重定向循环：

**修改文件：** `backend/src/routes/gameContentRoutes.ts`
```diff
- res.redirect(`/game/${game.id}/index.html`);
+ res.redirect(`/api/game-content/${game.id}/index.html`);
```

### 4. 改进前端状态管理

修复前端组件的状态管理问题：

- 修正 `loading.value = false` 为 `loading.value = true`
- 添加重复调用检查防护机制
- 优化错误重试逻辑
- 改进组件清理逻辑

### 5. 更新 SPA 回退逻辑

移除不必要的路径排除，简化 SPA 回退逻辑：

**修改文件：** `backend/src/app.ts`
```diff
- if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/uploads') && !req.path.startsWith('/game')) {
+ if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
```

## 修复效果

修复后：
1. 前端路由 `/game/:id` 正常加载 GamePlay.vue 组件
2. iframe 使用 `/api/game-content/{gameId}` 路径，不会与前端路由冲突
3. 游戏内容通过后端 API 正确加载，不会触发前端路由重新加载
4. 消除了无限循环，游戏可以正常加载和运行

## 测试验证

1. 访问任意游戏链接，如：`http://localhost:5173/game/d408fe9a-dbf7-4b4d-9fdb-e17902da6038`
2. 观察开发者工具控制台，确认不再出现重复的组件挂载日志
3. 验证游戏内容能正常在 iframe 中加载
4. 测试错误重试功能是否正常工作

## 注意事项

- 此修复不会影响用户的书签或外部链接，因为只修改了内部 iframe 的 URL 构建
- 前端路由路径保持不变，用户体验不受影响  
- 后端 API 路径变更不会影响其他功能模块

## 已完成的修改

### 后端修改
1. ✅ `backend/src/app.ts` - 修改游戏内容路由路径
2. ✅ `backend/src/app.ts` - 更新 SPA 回退逻辑  
3. ✅ `backend/src/routes/gameContentRoutes.ts` - 修复重定向逻辑

### 前端修改
1. ✅ `frontend/src/views/GamePlay.vue` - 更新 iframe URL 构建
2. ✅ `frontend/src/views/GamePlay.vue` - 修复状态管理问题
3. ✅ `frontend/src/views/GamePlay.vue` - 添加防重复调用机制
4. ✅ `frontend/src/views/GameLauncher.vue` - 更新 URL 构建和重试逻辑

所有关键修改已完成，游戏反复加载循环问题应该得到彻底解决。