<template>
  <div class="settings-page">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>系统设置</span>
          <el-space>
            <el-button type="primary" plain size="small" @click="reloadAll" :loading="loadingAll">刷新</el-button>
            <el-button type="danger" plain size="small" @click="resetCurrent" :disabled="!activeTab">重置当前分组</el-button>
            <el-button type="success" size="small" @click="saveCurrent" :loading="saving">保存当前分组</el-button>
          </el-space>
        </div>
      </template>

      <el-tabs v-model="activeTab" class="settings-tabs">
        <!-- 基础与品牌 -->
        <el-tab-pane label="基础与品牌" name="site.basic">
          <el-form ref="siteFormRef" :model="siteBasic" :rules="siteBasicRules" label-width="140px" status-icon>
            <el-row :gutter="24">
              <el-col :span="12">
                <el-form-item label="站点名称" prop="siteName">
                  <el-input v-model="siteBasic.siteName" />
                </el-form-item>
                <el-form-item label="站点描述" prop="siteDescription">
                  <el-input v-model="siteBasic.siteDescription" type="textarea" :rows="3" />
                </el-form-item>
                <el-form-item label="Logo URL">
                  <el-input v-model="siteBasic.logoUrl" placeholder="https://..." />
                </el-form-item>
                <el-form-item label="Favicon URL">
                  <el-input v-model="siteBasic.faviconUrl" placeholder="https://..." />
                </el-form-item>
                <el-form-item label="版权信息">
                  <el-input v-model="siteBasic.copyright" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="公告启用">
                  <el-switch v-model="siteBasic.announcement.enabled" />
                </el-form-item>
                <el-form-item label="公告内容" v-if="siteBasic.announcement.enabled">
                  <el-input v-model="siteBasic.announcement.content" type="textarea" :rows="4" />
                </el-form-item>
                <el-form-item label="维护模式">
                  <el-switch v-model="siteBasic.maintenance.enabled" />
                </el-form-item>
                <el-form-item label="维护提示" v-if="siteBasic.maintenance.enabled">
                  <el-input v-model="siteBasic.maintenance.message" type="textarea" :rows="2" />
                </el-form-item>
                <el-form-item label="白名单 IP" v-if="siteBasic.maintenance.enabled">
                  <el-select v-model="siteBasic.maintenance.whitelistIPs" multiple filterable allow-create default-first-option placeholder="输入并回车添加">
                    <el-option v-for="ip in siteBasic.maintenance.whitelistIPs" :key="ip" :label="ip" :value="ip" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>

        <!-- 用户与账号策略 -->
        <el-tab-pane label="用户与账号策略" name="account.policy">
          <el-form ref="accountPolicyRef" :model="accountPolicy" label-width="180px" status-icon>
            <el-divider content-position="left">注册与登录</el-divider>
            <el-form-item label="允许注册">
              <el-switch v-model="accountPolicy.registration.enabled" />
            </el-form-item>
            <el-form-item label="单点登录 (SSO)">
              <el-switch v-model="accountPolicy.sso.enabled" />
            </el-form-item>
            <el-alert type="info" show-icon :closable="false" class="mb12" title="SSO 开启后，同一账号新登录会使旧会话失效" />
            <el-divider content-position="left">密码策略</el-divider>
            <el-row :gutter="16">
              <el-col :span="8"><el-form-item label="最小长度"><el-input-number v-model="accountPolicy.password.minLength" :min="4" :max="64" style="width: 100%" /></el-form-item></el-col>
              <el-col :span="8"><el-form-item label="最大长度"><el-input-number v-model="accountPolicy.password.maxLength" :min="8" :max="128" style="width: 100%" /></el-form-item></el-col>
              <el-col :span="8"><el-form-item label="禁止重复最近 N 次"><el-input-number v-model="accountPolicy.password.disallowReuse" :min="0" :max="10" style="width: 100%" /></el-form-item></el-col>
            </el-row>
            <el-row :gutter="16">
              <el-col :span="6"><el-form-item label="需大写"><el-switch v-model="accountPolicy.password.requireUppercase" /></el-form-item></el-col>
              <el-col :span="6"><el-form-item label="需小写"><el-switch v-model="accountPolicy.password.requireLowercase" /></el-form-item></el-col>
              <el-col :span="6"><el-form-item label="需数字"><el-switch v-model="accountPolicy.password.requireNumber" /></el-form-item></el-col>
              <el-col :span="6"><el-form-item label="需符号"><el-switch v-model="accountPolicy.password.requireSymbol" /></el-form-item></el-col>
            </el-row>
            <el-alert type="info" show-icon :closable="false" class="mb12" :title="passwordPolicyDesc" />
            <el-divider content-position="left">账号注销</el-divider>
            <el-form-item label="允许用户注销">
              <el-switch v-model="accountPolicy.accountDeletion.enabled" />
            </el-form-item>
            <el-form-item label="冷静期(天)" v-if="accountPolicy.accountDeletion.enabled">
              <el-input-number v-model="accountPolicy.accountDeletion.coolingDays" :min="0" :max="90" />
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 安全与风控 -->
        <el-tab-pane label="安全与风控" name="security.risk">
          <el-form ref="securityFormRef" :model="securityRisk" label-width="200px" status-icon>
            <el-divider content-position="left">CORS</el-divider>
            <el-form-item label="允许来源">
              <el-select v-model="securityRisk.cors.allowedOrigins" multiple filterable allow-create default-first-option placeholder="* 或 https://example.com">
                <el-option v-for="o in securityRisk.cors.allowedOrigins" :key="o" :label="o" :value="o" />
              </el-select>
            </el-form-item>
            <el-divider content-position="left">IP 控制</el-divider>
            <el-form-item label="白名单 IP">
              <el-select v-model="securityRisk.ip.whitelist" multiple filterable allow-create default-first-option placeholder="输入并回车添加">
                <el-option v-for="ip in securityRisk.ip.whitelist" :key="ip" :label="ip" :value="ip" />
              </el-select>
            </el-form-item>
            <el-form-item label="黑名单 IP">
              <el-select v-model="securityRisk.ip.blacklist" multiple filterable allow-create default-first-option placeholder="输入并回车添加">
                <el-option v-for="ip in securityRisk.ip.blacklist" :key="ip" :label="ip" :value="ip" />
              </el-select>
            </el-form-item>
            <el-divider content-position="left">限流</el-divider>
            <el-form-item label="启用限流">
              <el-switch v-model="securityRisk.rateLimit.enabled" />
            </el-form-item>
            <el-row v-if="securityRisk.rateLimit.enabled" :gutter="16">
              <el-col :span="8"><el-form-item label="IP 每分钟"><el-input-number v-model="securityRisk.rateLimit.perIpPerMinute" :min="10" :max="10000" /></el-form-item></el-col>
              <el-col :span="8"><el-form-item label="用户每分钟"><el-input-number v-model="securityRisk.rateLimit.perUserPerMinute" :min="10" :max="10000" /></el-form-item></el-col>
            </el-row>
            <el-divider content-position="left">审计 & 保护</el-divider>
            <el-row :gutter="16">
              <el-col :span="6"><el-form-item label="记录 IP"><el-switch v-model="securityRisk.audit.recordIp" /></el-form-item></el-col>
              <el-col :span="6"><el-form-item label="记录 UA"><el-switch v-model="securityRisk.audit.recordUserAgent" /></el-form-item></el-col>
              <el-col :span="6"><el-form-item label="脱敏敏感"><el-switch v-model="securityRisk.audit.maskSensitive" /></el-form-item></el-col>
            </el-row>
            <el-divider content-position="left">高风险操作</el-divider>
            <el-form-item label="需确认操作码">
              <el-select v-model="securityRisk.adminConfirm.dangerousActions" multiple filterable allow-create default-first-option>
                <el-option v-for="code in securityRisk.adminConfirm.dangerousActions" :key="code" :label="code" :value="code" />
              </el-select>
            </el-form-item>
            <el-form-item label="维护镜像跳转">
              <el-input v-model="securityRisk.maintenanceMirrorRedirect" placeholder="https://mirror.example.com 或留空" />
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 游戏与内容策略 -->
        <el-tab-pane label="游戏与内容策略" name="game.policy">
          <el-form ref="gameFormRef" :model="gamePolicy" label-width="200px" status-icon>
            <el-divider content-position="left">发布流程</el-divider>
            <el-form-item label="发布模式">
              <el-radio-group v-model="gamePolicy.publishFlow">
                <el-radio label="DIRECT">直接发布</el-radio>
                <el-radio label="REVIEW">需要审核</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-divider content-position="left">封面限制</el-divider>
            <el-row :gutter="16">
              <el-col :span="8"><el-form-item label="最大大小(MB)"><el-input-number v-model="gamePolicy.cover.maxSizeMB" :min="1" :max="20" /></el-form-item></el-col>
              <el-col :span="8"><el-form-item label="允许 MIME">
                <el-select v-model="gamePolicy.cover.allowedMime" multiple filterable allow-create default-first-option>
                  <el-option v-for="m in gamePolicy.cover.allowedMime" :key="m" :value="m" :label="m" />
                </el-select>
              </el-form-item></el-col>
              <el-col :span="8"><el-form-item label="宽高比"><el-input v-model="gamePolicy.cover.aspectRatio" placeholder="16:9 或留空" /></el-form-item></el-col>
            </el-row>
            <el-divider content-position="left">包限制</el-divider>
            <el-row :gutter="16">
              <el-col :span="8"><el-form-item label="包大小(MB)"><el-input-number v-model="gamePolicy.package.maxSizeMB" :min="10" :max="500" /></el-form-item></el-col>
              <el-col :span="8"><el-form-item label="入口文件"><el-input v-model="gamePolicy.package.requiredEntry" /></el-form-item></el-col>
            </el-row>
            <el-divider content-position="left">播放统计</el-divider>
            <el-row :gutter="16">
              <el-col :span="8"><el-form-item label="有效时长(秒)"><el-input-number v-model="gamePolicy.playCount.minDurationSeconds" :min="5" :max="600" /></el-form-item></el-col>
              <el-col :span="8"><el-form-item label="管理员测试免计数"><el-switch v-model="gamePolicy.playCount.testModeByAdmin" /></el-form-item></el-col>
            </el-row>
            <el-divider content-position="left">展示策略</el-divider>
            <el-form-item label="默认排序">
              <el-select v-model="gamePolicy.listDefaultSort">
                <el-option label="按播放次数" value="PLAY_COUNT" />
                <el-option label="按激活次数" value="ACTIVATION_COUNT" />
                <el-option label="最新发布" value="NEWEST" />
              </el-select>
            </el-form-item>
            <el-divider content-position="left">激活策略</el-divider>
            <el-form-item label="允许撤销激活">
              <el-switch v-model="gamePolicy.activation.allowRevoke" />
            </el-form-item>
            <el-divider content-position="left">审核策略</el-divider>
            <el-row :gutter="16">
              <el-col :span="8"><el-form-item label="自动批准天数"><el-input-number v-model="gamePolicy.review.autoApproveAfterDays" :min="1" :max="30" /></el-form-item></el-col>
              <el-col :span="8"><el-form-item label="更新需重审"><el-switch v-model="gamePolicy.review.requireReviewForUpdate" /></el-form-item></el-col>
            </el-row>
            <el-alert type="info" show-icon :closable="false" class="mb12" title="审核策略仅在发布模式为'需要审核'时生效" />
            <el-divider content-position="left">内容策略</el-divider>
            <el-row :gutter="16">
              <el-col :span="6"><el-form-item label="允许成人内容"><el-switch v-model="gamePolicy.content.allowAdultContent" /></el-form-item></el-col>
              <el-col :span="6"><el-form-item label="要求内容分级"><el-switch v-model="gamePolicy.content.requireContentRating" /></el-form-item></el-col>
              <el-col :span="6"><el-form-item label="最大标签数"><el-input-number v-model="gamePolicy.content.maxTagsPerGame" :min="1" :max="50" /></el-form-item></el-col>
            </el-row>
          </el-form>
        </el-tab-pane>

        <!-- 邮件与SMTP设置 -->
        <el-tab-pane label="邮件与SMTP" name="email.smtp">
          <el-form ref="emailSmtpRef" :model="emailSmtp" label-width="180px" status-icon>
            <el-divider content-position="left">SMTP服务配置</el-divider>
            <el-form-item label="启用邮件服务">
              <el-switch v-model="emailSmtp.enabled" />
            </el-form-item>
            
            <template v-if="emailSmtp.enabled">
              <el-row :gutter="16">
                <el-col :span="10">
                  <el-form-item label="SMTP服务器" required>
                    <el-input v-model="emailSmtp.host" placeholder="smtp.example.com" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="端口" required>
                    <el-input-number v-model="emailSmtp.port" :min="1" :max="65535" style="width: 100%" />
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="SSL/TLS">
                    <el-switch v-model="emailSmtp.secure" />
                  </el-form-item>
                </el-col>
              </el-row>
              
              <el-row :gutter="16">
                <el-col :span="12">
                  <el-form-item label="用户名" required>
                    <el-input v-model="emailSmtp.auth.user" placeholder="username@example.com" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="密码" required>
                    <el-input v-model="emailSmtp.auth.pass" type="password" placeholder="请输入SMTP密码" show-password />
                  </el-form-item>
                </el-col>
              </el-row>
              
              <el-row :gutter="16">
                <el-col :span="12">
                  <el-form-item label="发件人名称" required>
                    <el-input v-model="emailSmtp.from.name" placeholder="网站名称" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="发件人邮箱" required>
                    <el-input v-model="emailSmtp.from.address" placeholder="noreply@example.com" />
                  </el-form-item>
                </el-col>
              </el-row>
              
              <el-form-item label="连接测试">
                <el-space>
                  <el-button type="primary" plain @click="testSmtp" :loading="smtpTesting">测试连接</el-button>
                  <el-input v-model="testEmailAddress" placeholder="输入测试邮箱地址" style="width: 200px" />
                  <el-button type="success" plain @click="sendTestEmailFn" :loading="testEmailSending">发送测试邮件</el-button>
                </el-space>
              </el-form-item>
            </template>
            
            <el-divider content-position="left">验证码设置</el-divider>
            <el-row :gutter="24">
              <el-col :span="12">
                <h4>注册验证码</h4>
                <el-form-item label="启用注册验证码">
                  <el-switch v-model="emailSmtp.verification.register.enabled" />
                </el-form-item>
                <el-form-item label="有效期(分钟)" v-if="emailSmtp.verification.register.enabled">
                  <el-input-number v-model="emailSmtp.verification.register.expiryMinutes" :min="1" :max="60" style="width: 150px" />
                </el-form-item>
                <el-form-item label="邮件主题" v-if="emailSmtp.verification.register.enabled">
                  <el-input v-model="emailSmtp.verification.register.subject" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <h4>找回密码验证码</h4>
                <el-form-item label="启用找回密码验证码">
                  <el-switch v-model="emailSmtp.verification.forgotPassword.enabled" />
                </el-form-item>
                <el-form-item label="有效期(分钟)" v-if="emailSmtp.verification.forgotPassword.enabled">
                  <el-input-number v-model="emailSmtp.verification.forgotPassword.expiryMinutes" :min="1" :max="120" style="width: 150px" />
                </el-form-item>
                <el-form-item label="邮件主题" v-if="emailSmtp.verification.forgotPassword.enabled">
                  <el-input v-model="emailSmtp.verification.forgotPassword.subject" />
                </el-form-item>
              </el-col>
            </el-row>
            
            <el-divider content-position="left">邮件模板</el-divider>
            <el-row :gutter="24">
              <el-col :span="12">
                <el-form-item label="注册邮件HTML模板">
                  <el-input v-model="emailSmtp.verification.register.htmlTemplate" type="textarea" :rows="8" />
                </el-form-item>
                <el-form-item label="注册邮件文本模板">
                  <el-input v-model="emailSmtp.verification.register.textTemplate" type="textarea" :rows="3" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="找回密码HTML模板">
                  <el-input v-model="emailSmtp.verification.forgotPassword.htmlTemplate" type="textarea" :rows="8" />
                </el-form-item>
                <el-form-item label="找回密码文本模板">
                  <el-input v-model="emailSmtp.verification.forgotPassword.textTemplate" type="textarea" :rows="3" />
                </el-form-item>
              </el-col>
            </el-row>
            
            <el-alert type="info" show-icon :closable="false" class="mb12">
              <template #title>
                模板变量说明
              </template>
              <p>可使用的模板变量：</p>
              <ul>
                <li><code v-text="'{{siteName}}'"></code> - 站点名称</li>
                <li><code v-text="'{{code}}'"></code> - 验证码</li>
                <li><code v-text="'{{expiryMinutes}}'"></code> - 有效期分钟数</li>
                <li><code v-text="'{{email}}'"></code> - 收件人邮箱</li>
              </ul>
            </el-alert>
            
            <el-divider content-position="left">发送限制</el-divider>
            <el-row :gutter="16">
              <el-col :span="8">
                <el-form-item label="每邮箱每小时">
                  <el-input-number v-model="emailSmtp.limits.perEmailPerHour" :min="1" :max="100" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="每邮箱每天">
                  <el-input-number v-model="emailSmtp.limits.perEmailPerDay" :min="1" :max="500" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="全局每分钟">
                  <el-input-number v-model="emailSmtp.limits.globalPerMinute" :min="1" :max="1000" style="width: 100%" />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>

        <!-- 页面内容管理 -->
        <el-tab-pane label="页面内容" name="content.pages">
          <el-form ref="contentPagesRef" :model="contentPages" label-width="180px" status-icon>
            <el-divider content-position="left">关于我们页面</el-divider>
            <el-form-item label="启用关于页面">
              <el-switch v-model="contentPages.about.enabled" />
            </el-form-item>
            
            <template v-if="contentPages.about.enabled">
              <el-form-item label="页面标题">
                <el-input v-model="contentPages.about.title" placeholder="关于我们" />
              </el-form-item>
              
              <el-form-item label="内容格式">
                <el-radio-group v-model="contentPages.about.contentType">
                  <el-radio label="markdown">Markdown</el-radio>
                  <el-radio label="html">HTML</el-radio>
                </el-radio-group>
              </el-form-item>
              
              <el-form-item label="页面内容">
                <el-input
                  v-model="contentPages.about.content"
                  type="textarea"
                  :rows="20"
                  :placeholder="contentPlaceholder"
                />
              </el-form-item>
              
              <el-form-item label="SEO描述">
                <el-input
                  v-model="contentPages.about.seoDescription"
                  type="textarea"
                  :rows="2"
                  placeholder="用于SEO的页面描述..."
                />
              </el-form-item>
              
              <el-form-item label="内容预览">
                <el-card class="content-preview">
                  <div v-if="contentPages.about.contentType === 'html'" v-html="contentPages.about.content"></div>
                  <div v-else class="markdown-preview">{{ contentPages.about.content }}</div>
                </el-card>
              </el-form-item>
            </template>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { msg, AdminText } from '@/utils/message'
import { confirmAction } from '@/utils/confirm'
import { getSettingsGroup, patchSettingsGroup, resetSettingsGroup, getEmailSmtpSettings, updateEmailSmtpSettings, testSmtpConnection, sendTestEmail } from '@/api/settings'
import { DEFAULT_SITE_BASIC, DEFAULT_ACCOUNT_POLICY, DEFAULT_SECURITY_RISK, DEFAULT_GAME_POLICY, DEFAULT_EMAIL_SMTP, DEFAULT_CONTENT_PAGES, type SiteBasicSettings, type AccountPolicySettings, type SecurityRiskSettings, type GamePolicySettings, type EmailSmtpSettings, type ContentPagesSettings } from '@/types/settings'

const activeTab = ref<'site.basic' | 'account.policy' | 'security.risk' | 'game.policy' | 'email.smtp' | 'content.pages'>('site.basic')
const loadingAll = ref(false)
const saving = ref(false)

// 各分组状态
const siteBasic = reactive<SiteBasicSettings>({ ...DEFAULT_SITE_BASIC })
const accountPolicy = reactive<AccountPolicySettings>({ ...DEFAULT_ACCOUNT_POLICY })
const securityRisk = reactive<SecurityRiskSettings>({ ...DEFAULT_SECURITY_RISK })
const gamePolicy = reactive<GamePolicySettings>({ ...DEFAULT_GAME_POLICY })
const emailSmtp = reactive<EmailSmtpSettings>({ ...DEFAULT_EMAIL_SMTP })
const contentPages = reactive<ContentPagesSettings>({ ...DEFAULT_CONTENT_PAGES })

// 监听端口变化，自动调整SSL设置
watch(() => emailSmtp.port, (newPort) => {
  if (newPort === 465) {
    emailSmtp.secure = true
    msg.info(AdminText.smtpPort465Adjust, 'smtp465')
  } else if (newPort === 587) {
    emailSmtp.secure = false
    msg.info(AdminText.smtpPort587Adjust, 'smtp587')
  }
})

// 变更跟踪（简单对比）
const dirtyMap = reactive<Record<string, boolean>>({})

// 表单 refs
const siteFormRef = ref()
const accountPolicyRef = ref()
const securityFormRef = ref()
const gameFormRef = ref()

// 校验规则（示例：仅基础）
const siteBasicRules = {
  siteName: [{ required: true, message: '必填', trigger: 'blur' }],
  siteDescription: [{ required: true, message: '必填', trigger: 'blur' }]
}

// 动态密码策略描述
const passwordPolicyDesc = computed(() => {
  const p = accountPolicy.password
  const parts: string[] = [`长度 ${p.minLength}-${p.maxLength}`]
  if (p.requireLowercase) parts.push('小写字母')
  if (p.requireUppercase) parts.push('大写字母')
  if (p.requireNumber) parts.push('数字')
  if (p.requireSymbol) parts.push('符号')
  return '密码需包含: ' + parts.join('、')
})

// 内容占位符
const contentPlaceholder = computed(() => {
  if (contentPages.about.contentType === 'markdown') {
    return '# 关于我们\n\n欢迎来到我们的平台...\n\n## 我们的使命\n\n为用户提供优质的游戏体验...'
  } else {
    return '<div class="about-container">\n  <h1>关于我们</h1>\n  <p>欢迎来到我们的平台...</p>\n</div>'
  }
})

// 监听（简化：使用 JSON stringify 对比，性能对当前规模可接受）
function watchDirty() {
  const snapshot: Record<string, string> = {}
  const update = () => {
    const current: Record<string, string> = {
      'site.basic': JSON.stringify(siteBasic),
      'account.policy': JSON.stringify(accountPolicy),
      'security.risk': JSON.stringify(securityRisk),
      'game.policy': JSON.stringify(gamePolicy),
      'email.smtp': JSON.stringify(emailSmtp),
      'content.pages': JSON.stringify(contentPages)
    }
    for (const k of Object.keys(current)) {
      if (!snapshot[k]) snapshot[k] = current[k]
      dirtyMap[k] = snapshot[k] !== current[k]
    }
  }
  setInterval(update, 1000)
}

async function loadGroup(group: string) {
  try {
    let res: any
    if (group === 'email.smtp') {
      res = await getEmailSmtpSettings()
    } else {
      res = await getSettingsGroup<any>(group)
    }
    
    if (res.success) {
      const target = group === 'site.basic' ? siteBasic :
                    group === 'account.policy' ? accountPolicy :
                    group === 'security.risk' ? securityRisk :
                    group === 'game.policy' ? gamePolicy :
                    group === 'content.pages' ? contentPages : emailSmtp
      Object.assign(target, res.data)
    }
  } catch (e) {
    // 兼容后端暂未实现时的错误，静默或提示
  }
}

async function reloadAll() {
  loadingAll.value = true
  await Promise.all(['site.basic','account.policy','security.risk','game.policy','email.smtp','content.pages'].map(loadGroup))
  loadingAll.value = false
  msg.success(AdminText.loadSettingsAll)
}

async function saveCurrent() {
  const group = activeTab.value
  saving.value = true
  try {
    const payload: any = group === 'site.basic' ? siteBasic :
                        group === 'account.policy' ? accountPolicy :
                        group === 'security.risk' ? securityRisk :
                        group === 'game.policy' ? gamePolicy :
                        group === 'content.pages' ? contentPages : emailSmtp
    
    if (group === 'email.smtp') {
      await updateEmailSmtpSettings(payload)
    } else {
      await patchSettingsGroup<any>(group, payload as any)
    }
    
    msg.success(AdminText.saveSuccess)
    dirtyMap[group] = false
  } catch (e:any) {
    msg.error(e.message || AdminText.saveFail)
  } finally {
    saving.value = false
  }
}

function resetCurrent() {
  const group = activeTab.value
  confirmAction({
    message: AdminText.resetGroupConfirm,
    title: '重置确认',
    confirmText: '确认重置',
    successMessage: AdminText.resetGroupSuccess,
    errorMessage: AdminText.resetGroupFail,
    onConfirm: async () => {
      await resetSettingsGroup(group)
      if (group==='site.basic') Object.assign(siteBasic, DEFAULT_SITE_BASIC)
      else if (group==='account.policy') Object.assign(accountPolicy, DEFAULT_ACCOUNT_POLICY)
      else if (group==='security.risk') Object.assign(securityRisk, DEFAULT_SECURITY_RISK)
      else if (group==='game.policy') Object.assign(gamePolicy, DEFAULT_GAME_POLICY)
      else if (group==='content.pages') Object.assign(contentPages, DEFAULT_CONTENT_PAGES)
      else Object.assign(emailSmtp, DEFAULT_EMAIL_SMTP)
      dirtyMap[group] = false
    }
  })
}

// SMTP测试相关函数
const smtpTesting = ref(false)
const testEmailSending = ref(false)
const testEmailAddress = ref('')

async function testSmtp() {
  smtpTesting.value = true
  try {
    const res = await testSmtpConnection()
    msg.success(res.message || AdminText.smtpTestSuccess)
  } catch (e: any) {
    msg.error(e.message || AdminText.smtpTestFail)
  } finally {
    smtpTesting.value = false
  }
}

async function sendTestEmailFn() {
  if (!testEmailAddress.value) {
    msg.validation(AdminText.smtpNeedTestEmail)
    return
  }
  
  testEmailSending.value = true
  try {
    const res = await sendTestEmail(testEmailAddress.value)
    msg.success(res.message || AdminText.smtpMailSendSuccess)
  } catch (e: any) {
    msg.error(e.message || AdminText.smtpMailSendFail)
  } finally {
    testEmailSending.value = false
  }
}

onMounted(reloadAll)
watchDirty()
</script>

<style scoped>
.settings-page {
  padding: 24px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.settings-tabs {
  margin-top: 16px;
}

.content-preview {
  max-height: 400px;
  overflow-y: auto;
  background-color: var(--el-fill-color-lighter);
}

.markdown-preview {
  white-space: pre-wrap;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.6;
}

.mb12 {
  margin-bottom: 12px;
}
</style>