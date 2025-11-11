import { defineStore } from 'pinia'

export const SETTINGS_STORAGE_KEY = 'app::settings'

const getInitialState = () => {
  if (typeof window === 'undefined') {
    return {
      theme: 'light',
      locale: 'vi'
    }
  }

  try {
    const stored = window.localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (!stored) {
      return {
        theme: 'light',
        locale: 'vi'
      }
    }

    const parsed = JSON.parse(stored)
    return {
      theme: parsed.theme === 'dark' ? 'dark' : 'light',
      locale: parsed.locale === 'en' ? 'en' : 'vi'
    }
  } catch (error) {
    console.warn('[settings-store] Failed to parse settings from storage', error)
    return {
      theme: 'light',
      locale: 'vi'
    }
  }
}

const persistState = (state) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(state))
}

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    ...getInitialState()
  }),
  actions: {
    setTheme(theme) {
      const normalized = theme === 'dark' ? 'dark' : 'light'
      this.theme = normalized
      persistState({ theme: this.theme, locale: this.locale })
    },
    setLocale(locale) {
      const normalized = locale === 'en' ? 'en' : 'vi'
      this.locale = normalized
      persistState({ theme: this.theme, locale: this.locale })
    }
  }
})
