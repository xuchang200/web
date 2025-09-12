# 前端系统提示规范（统一使用系统内消息组件，不使用浏览器原生弹窗）

## 设计原则
1. 必要且有用：仅在用户需要被告知成功/失败/后续行动时提示；避免无意义“操作成功”刷屏。
2. 及时但不过度：同一原因的重复错误 1.5s 内不重复出现（通过 `msg.*` 的 key 冷却实现）。
3. 可定位问题：失败提示包含直接原因；可选添加后续建议（不超过 1 句话）。
4. 中文面向终端用户，专业术语最小化，避免英文夹杂（除必要专有名词）。
5. 分级：success（绿色） / warning（黄色-可继续） / error（红色-阻断） / info（蓝色-背景信息）。

## 使用方式
```ts
import { msg, Text } from '@/utils/message'
msg.success(Text.registerSuccess)
msg.validation(Text.emailInvalid, 'register-email-invalid')
```

## 核心场景与标准文案
| 模块 | 场景 | 是否提示 | 级别 | 文案 | 备注 |
|------|------|---------|------|------|------|
| 注册 | 点击获取验证码但未填邮箱 | 提示 | validation | 请输入邮箱地址 | key: register-email-required |
| 注册 | 邮箱格式错误 | 提示 | validation | 请输入有效的邮箱地址 | 正则校验失败 |
| 注册 | 验证码发送成功 | 提示 | success | 验证码已发送到您的邮箱 | 成功提示一次即可 |
| 注册 | 验证码发送失败 | 提示 | error | 发送验证码失败，请稍后重试 | 网络/后端错误 |
| 注册 | 用户名为空 | 提示 | validation | 请输入用户名 | |
| 注册 | 邮箱为空 | 提示 | validation | 请输入邮箱地址 | |
| 注册 | 邮箱格式错误 | 提示 | validation | 请输入有效的邮箱地址 | 与获取验证码保持一致 |
| 注册 | 验证码为空 | 提示 | validation | 请输入验证码 | |
| 注册 | 密码为空 | 提示 | validation | 请输入密码 | |
| 注册 | 密码过短 | 提示 | validation | 密码长度不能少于{min} | 动态值 |
| 注册 | 密码过长 | 提示 | validation | 密码长度不能超过{max} | 动态值 |
| 注册 | 缺少小写/大写/数字/符号 | 提示 | validation | 需包含小写字母/需包含大写字母/需包含数字/需包含符号 | 根据策略逐条提示第一条不满足项 |
| 注册 | 注册成功 | 提示 | success | 注册成功！ | 然后跳转登录 |
| 注册 | 注册失败 | 提示 | error | 注册失败，请检查信息并重试 | 后端 message 优先 |
| 忘记密码 | 获取验证码邮箱为空 | 提示 | validation | 请输入邮箱地址 | |
| 忘记密码 | 获取验证码邮箱格式错 | 提示 | validation | 请输入有效的邮箱地址 | |
| 忘记密码 | 验证码发送成功 | 提示 | success | 验证码已发送到您的邮箱 | |
| 忘记密码 | 验证码发送失败 | 提示 | error | 发送验证码失败，请稍后重试 | |
| 忘记密码 | 提交时邮箱为空 | 提示 | validation | 请输入邮箱地址 | 与注册保持一致 |
| 忘记密码 | 邮箱格式错误 | 提示 | validation | 请输入有效的邮箱地址 | |
| 忘记密码 | 验证码为空 | 提示 | validation | 请输入验证码 | |
| 忘记密码 | 新密码为空 | 提示 | validation | 请输入新密码 | |
| 忘记密码 | 新密码长度不足 | 提示 | validation | 密码长度至少6位 | 可与策略统一后改为动态 |
| 忘记密码 | 两次密码不一致 | 提示 | validation | 两次输入的密码不一致 | |
| 忘记密码 | 重置成功 | 提示 | success | 密码重置成功！ | 跳转登录 |
| 忘记密码 | 重置失败 | 提示 | error | 密码重置失败，请检查验证码是否正确 | |

## 统一提示函数选择
- 表单字段缺失/格式错误：`msg.validation()` （type=warning，duration 2.5s）
- 操作成功：`msg.success()` （默认 2s）
- 操作失败：`msg.error()`
- 背景信息/提示性说明：`msg.info()`
- 需防抖/避免重复：传入 key，例如：`msg.validation(Text.emailInvalid, 'register-email-invalid')`

## 何时“不提示”
| 场景 | 不提示理由 |
|------|-----------|
| 同一字段多次快速点提交仍为空 | 有冷却 key，避免刷屏 |
| 输入过程中尚未触发提交 | 即时校验可辅以内联样式（后续可扩展），不弹出全局消息 |
| 页面切换后的历史成功提示 | 已完成任务，避免过期信息残留 |

## 后续扩展建议
1. 支持多语言：`Text` 改为结构化字典 + i18n key。
2. 支持内联表单校验：结合组件库 Form 校验规则减少弹窗提示频率。
3. 统一错误码映射：后端约定错误码 -> 前端翻译层减少硬编码。
4. 统一 Loading 与消息：在 `utils/feedback.ts` 抽象 `withLoadingAndMessage`。
5. 路由级全局错误：在 `router.beforeEach` 中集中处理 401/403/500。

## 已迁移文件
- `views/Register.vue`
- `views/ForgotPassword.vue`

## 待迁移文件（仍直接使用 ElMessage）
- 个人中心 / 管理后台若干（Profile.vue, UserManagement.vue, Settings.vue, LogManagement.vue, GameManagement.vue, CodeManagement.vue, AnalyticsDashboard.vue, router/index.ts 等）

> 建议按模块分批替换：先抽象更通用的文本常量（激活码、游戏上传、日志操作），再替换调用；过程保持原语义。
