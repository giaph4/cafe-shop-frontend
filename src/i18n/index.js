import { createI18n } from 'vue-i18n'
import { messages } from './messages'
import { SETTINGS_STORAGE_KEY } from '@/store/settings'

const detectLocale = () => {
  if (typeof window === 'undefined') return 'vi'

  try {
    const stored = window.localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (parsed?.locale === 'en') {
        return 'en'
      }
      if (parsed?.locale === 'vi') {
        return 'vi'
      }
    }

    const browserLocale = window.navigator.language || 'vi'
    if (browserLocale.toLowerCase().startsWith('en')) {
      return 'en'
    }
  } catch (error) {
    console.warn('[i18n] Failed to detect locale from storage', error)
  }

  return 'vi'
}

export const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: detectLocale(),
  fallbackLocale: 'vi',
  messages
})
