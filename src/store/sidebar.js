import { defineStore } from 'pinia'

const STORAGE_KEY = 'app::sidebar-collapsed'

const readInitialState = () => {
    if (typeof window === 'undefined') return false
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === null) return false
    return stored === 'true'
}

export const useSidebarStore = defineStore('sidebar', {
    state: () => ({
        isCollapsed: readInitialState()
    }),
    actions: {
        toggle() {
            this.setCollapsed(!this.isCollapsed)
        },
        setCollapsed(value) {
            this.isCollapsed = value
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(STORAGE_KEY, value ? 'true' : 'false')
            }
        }
    }
})
