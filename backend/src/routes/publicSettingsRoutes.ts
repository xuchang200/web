import { Router } from 'express'
import { getPublicSiteSettings, getPublicAccountPolicy } from '../controllers/publicSettingsController'
import { getAboutPageContent } from '../controllers/contentPagesController'

const router = Router()
router.get('/site-basic', getPublicSiteSettings)
router.get('/account-policy', getPublicAccountPolicy)
router.get('/about-content', getAboutPageContent)
export default router
