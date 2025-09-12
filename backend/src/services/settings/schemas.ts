import { z } from 'zod'
import { DEFAULT_SITE_BASIC, DEFAULT_GAME_POLICY } from './defaults'

export const SiteBasicSchema = z.object({
  siteName: z.string().min(1).max(60),
  siteDescription: z.string().min(1).max(300),
  copyright: z.string().min(1).max(120),
  announcement: z.object({
    enabled: z.boolean(),
    content: z.string().max(1000),
    startAt: z.string().datetime().nullish(),
    endAt: z.string().datetime().nullish()
  }),
  maintenance: z.object({
    enabled: z.boolean(),
    message: z.string().max(300),
    whitelistIPs: z.array(z.string().ip())
  })
})

export const GamePolicySchema = z.object({
  publishFlow: z.enum(['DIRECT', 'REVIEW']),
  cover: z.object({
    maxSizeMB: z.number().min(1).max(20),
    allowedMime: z.array(z.string()).min(1),
    aspectRatio: z.string().nullish()
  }),
  package: z.object({
    maxSizeMB: z.number().min(10).max(1000),
    requiredEntry: z.string().min(1)
  }),
  playCount: z.object({
    minDurationSeconds: z.number().min(5).max(3600),
    testModeByAdmin: z.boolean()
  }),
  listDefaultSort: z.enum(['PLAY_COUNT', 'ACTIVATION_COUNT', 'NEWEST']),
  activation: z.object({
    allowRevoke: z.boolean()
  }),
  review: z.object({
    autoApproveAfterDays: z.number().min(1).max(30),
    requireReviewForUpdate: z.boolean()
  }),
  content: z.object({
    allowAdultContent: z.boolean(),
    requireContentRating: z.boolean(),
    maxTagsPerGame: z.number().min(1).max(50)
  })
})

export type SiteBasicInput = z.infer<typeof SiteBasicSchema>
export type GamePolicyInput = z.infer<typeof GamePolicySchema>

export const schemaMap = {
  'site.basic': SiteBasicSchema,
  'game.policy': GamePolicySchema
}

export const defaultMap = {
  'site.basic': DEFAULT_SITE_BASIC,
  'game.policy': DEFAULT_GAME_POLICY
}

export type SettingsGroupKey = keyof typeof schemaMap

/**
 * 验证游戏策略设置
 */
export function validateGamePolicySettings(data: any): { success: boolean; errors?: any } {
  try {
    GamePolicySchema.parse(data)
    return { success: true }
  } catch (error: any) {
    return { 
      success: false, 
      errors: error.errors || error.message 
    }
  }
}
