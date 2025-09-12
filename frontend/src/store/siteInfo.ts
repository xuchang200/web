import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fetchPublicSiteBasic, type PublicSiteBasicSettings } from '@/api/publicSettings'

interface AnnouncementState {
	dismissedUntil: number | null // 时间戳：24h 免提醒
	dismissedSession: boolean // 本次会话关闭
}

export const useSiteInfoStore = defineStore('siteInfo', () => {
	const loading = ref(false)
	const site = ref<PublicSiteBasicSettings | null>(null)
	const announcementState = ref<AnnouncementState>({ dismissedUntil: null, dismissedSession: false })

	function loadAnnouncementState() {
		try {
			const raw = localStorage.getItem('site_announcement_state')
			if (raw) announcementState.value = JSON.parse(raw)
		} catch {}
	}
	function persistAnnouncementState() {
		localStorage.setItem('site_announcement_state', JSON.stringify(announcementState.value))
	}

	async function fetch() {
		loading.value = true
		try {
			const res = await fetchPublicSiteBasic()
			if (res.success) site.value = res.data
		} finally {
			loading.value = false
		}
	}

	const siteName = computed(() => site.value?.siteName || 'withU')
	const copyright = computed(() => site.value?.copyright || '')
	const announcement = computed(() => site.value?.announcement)

	const shouldShowAnnouncement = computed(() => {
		const ann = announcement.value
		if (!ann || !ann.enabled) return false
		const now = Date.now()
		if (announcementState.value.dismissedSession) return false
		if (announcementState.value.dismissedUntil && now < announcementState.value.dismissedUntil) return false
		// 时间窗口
		if (ann.startAt && now < Date.parse(ann.startAt)) return false
		if (ann.endAt && now > Date.parse(ann.endAt)) return false
		return true
	})

	function dismissAnnouncement(mode: 'session' | '24h') {
		if (mode === 'session') announcementState.value.dismissedSession = true
		else announcementState.value.dismissedUntil = Date.now() + 24*60*60*1000
		persistAnnouncementState()
	}

	loadAnnouncementState()

	return { fetch, site, siteName, copyright, announcement, shouldShowAnnouncement, dismissAnnouncement }
})

