import { Router } from 'express'
import { getPublicSiteSettings, getPublicAccountPolicy } from '../controllers/publicSettingsController'

const router = Router()
router.get('/site-basic', getPublicSiteSettings)
router.get('/account-policy', getPublicAccountPolicy)
export default router
