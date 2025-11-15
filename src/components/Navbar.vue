<template>
    <el-header class="navbar" :class="{ 'sidebar-collapsed': isSidebarCollapsed }">
        <button
            class="sidebar-toggle"
            type="button"
            @click="toggleSidebar"
            :aria-label="sidebarToggleLabel"
            :aria-expanded="sidebarToggleExpanded"
            :title="sidebarToggleLabel"
        >
            <component :is="sidebarToggleIcon" class="sidebar-toggle-icon" />
        </button>
        <div class="page-title" :title="currentTitle">
            {{ currentTitle }}
        </div>

        <div class="navbar-controls" role="group" :aria-label="t('navbar.controlGroupLabel')">
            <div
                v-for="control in selectControls"
                :key="control.id"
                :class="['control-group', control.class]"
            >
                <el-icon class="control-icon">
                    <component :is="control.icon" />
                </el-icon>
                <span class="control-label">{{ control.label }}</span>
                <el-select
                    class="control-select"
                    size="small"
                    :placeholder="control.placeholder"
                    :aria-label="control.ariaLabel"
                    :model-value="control.value"
                    @update:model-value="control.onChange"
                >
                    <el-option
                        v-for="option in control.options"
                        :key="option.value"
                        :value="option.value"
                        :label="option.label"
                    />
                </el-select>
            </div>
            <div class="user-menu">
                <el-dropdown @command="handleCommand">
                    <span class="el-dropdown-link">
                        <el-avatar :size="34" :src="userAvatar" class="user-avatar">
                            <UserCircle class="user-icon" />
                        </el-avatar>
                        <span class="user-name">{{ userDisplayName }}</span>
                        <ChevronDown class="arrow-icon" />
                    </span>
                    <template #dropdown>
                        <el-dropdown-menu>
                            <el-dropdown-item command="profile">
                                {{ t('navbar.profile') }}
                            </el-dropdown-item>
                            <el-dropdown-item command="logout" divided>
                                {{ t('navbar.logout') }}
                            </el-dropdown-item>
                        </el-dropdown-menu>
                    </template>
                </el-dropdown>
            </div>
        </div>

        <el-dialog
            v-model="logoutDialogVisible"
            :title="t('navbar.logoutTitle')"
            width="460px"
            :close-on-click-modal="false"
        >
            <p class="logout-dialog-text">
                {{ t('navbar.logoutQuestion') }}
            </p>
            <template #footer>
                <div class="logout-dialog-actions">
                    <el-button
                        @click="logoutDialogVisible = false"
                        :disabled="isGeneratingSummary || isLoggingOut"
                    >
                        {{ t('common.cancel') }}
                    </el-button>
                    <el-button
                        @click="logoutWithoutShift"
                        :loading="isLoggingOut"
                        :disabled="isGeneratingSummary"
                    >
                        {{ t('navbar.logoutWithoutShift') }}
                    </el-button>
                    <el-button
                        type="primary"
                        @click="logoutWithShift"
                        :loading="isGeneratingSummary"
                        :disabled="isLoggingOut"
                    >
                        {{ t('navbar.logoutWithShift') }}
                    </el-button>
                </div>
            </template>
        </el-dialog>

    </el-header>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/store/auth'
import { useSidebarStore } from '@/store/sidebar'
import { buildShiftSummary } from '@/utils/shiftManager.js'
import { UserCircle, ChevronDown, ChevronLeft, ChevronRight, Sun, Moon, Languages } from '@/components/icons'
import { useShiftSummaryStore } from '@/store/shiftSummary.js'
import { useI18n } from 'vue-i18n'
import { useSettingsStore } from '@/store/settings.js'
import { getUserAvatar } from '@/utils/avatar'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()
const sidebarStore = useSidebarStore()
const toast = useToast()
const shiftSummaryStore = useShiftSummaryStore()
const settingsStore = useSettingsStore()
const { t } = useI18n()

const logoutDialogVisible = ref(false)
const isGeneratingSummary = ref(false)
const isLoggingOut = ref(false)

const isSidebarCollapsed = computed(() => sidebarStore.isCollapsed)

const currentTheme = computed({
    get: () => settingsStore.theme,
    set: (value) => settingsStore.setTheme(value)
})

const currentLocale = computed({
    get: () => settingsStore.locale,
    set: (value) => settingsStore.setLocale(value)
})

const themeOptions = computed(() => [
    { label: t('common.themeLight'), value: 'light' },
    { label: t('common.themeDark'), value: 'dark' }
])

const languageOptions = computed(() => [
    { label: t('common.languageVietnamese'), value: 'vi' },
    { label: t('common.languageEnglish'), value: 'en' }
])

const themeIcon = computed(() => (currentTheme.value === 'dark' ? Moon : Sun))

const userAvatar = computed(() => getUserAvatar(authStore.user))

const userDisplayName = computed(() => authStore.userFullName)

const currentTitle = computed(() => {
    const meta = route.meta || {}
    if (meta.titleKey) {
        return t(meta.titleKey)
    }
    return meta.title || t('navbar.defaultTitle')
})

const toggleSidebar = () => {
    sidebarStore.toggle()
}

const sidebarToggleLabel = computed(() =>
    isSidebarCollapsed.value ? t('navbar.sidebarExpand') : t('navbar.sidebarCollapse'),
)

const sidebarToggleExpanded = computed(() => !isSidebarCollapsed.value)

const sidebarToggleIcon = computed(() => (isSidebarCollapsed.value ? ChevronRight : ChevronLeft))

const selectControls = computed(() => [
    {
        id: 'theme',
        class: 'control-theme',
        icon: themeIcon.value,
        label: t('common.theme'),
        placeholder: t('common.theme'),
        ariaLabel: t('common.theme'),
        value: currentTheme.value,
        options: themeOptions.value,
        onChange: (val) => currentTheme.value = val,
    },
    {
        id: 'language',
        class: 'control-language',
        icon: Languages,
        label: t('common.language'),
        placeholder: t('common.language'),
        ariaLabel: t('common.language'),
        value: currentLocale.value,
        options: languageOptions.value,
        onChange: (val) => currentLocale.value = val,
    },
])

const openLogoutDialog = () => {
    if (!authStore.user?.userId) {
        authStore.logout()
        return
    }
    logoutDialogVisible.value = true
}

const logoutWithoutShift = () => {
    if (isLoggingOut.value) return
    isLoggingOut.value = true
    try {
        shiftSummaryStore.clearSummary()
        authStore.logout()
    } finally {
        isLoggingOut.value = false
        logoutDialogVisible.value = false
    }
}

const logoutWithShift = () => {
    if (isGeneratingSummary.value) return
    if (!authStore.user?.userId) {
        toast.warning('Không tìm thấy thông tin người dùng. Đăng xuất trực tiếp.')
        logoutWithoutShift()
        return
    }
    isGeneratingSummary.value = true
    try {
        shiftSummaryStore.clearSummary()
        const summary = buildShiftSummary({
            userId: authStore.user.userId,
            logoutTime: new Date().toISOString()
        })

        if (!summary) {
            toast.warning('Không tìm thấy dữ liệu ca làm việc. Đăng xuất trực tiếp.')
            logoutWithoutShift()
            return
        }

        shiftSummaryStore.setSummary(summary)
        router.push({ name: 'ShiftSummary' })
        logoutDialogVisible.value = false
    } finally {
        isGeneratingSummary.value = false
    }
}

const handleCommand = (command) => {
    if (command === 'logout') {
        openLogoutDialog()
    } else if (command === 'profile') {
        router.push('/profile')
    }
}
</script>

<style scoped>
.navbar {
    height: 70px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    background: var(--navbar-bg);
    border-bottom: 1px solid var(--navbar-border-color);
    padding: 0 32px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    transition: background-color 0.3s ease, border-color 0.3s ease;
}

.navbar.sidebar-collapsed {
    padding-left: 24px;
}

.sidebar-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border: none;
    border-radius: 12px;
    background: rgba(139, 115, 85, 0.12);
    color: #6F5B45;
    cursor: pointer;
    transition: background 0.2s ease, color 0.2s ease;
    outline: none;
}

.sidebar-toggle:hover {
    background: rgba(139, 115, 85, 0.2);
    color: #4E3D2B;
}

.sidebar-toggle-icon {
    width: 20px;
    height: 20px;
}

.page-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--app-text-color);
    letter-spacing: -0.5px;
    flex: 1 1 auto;
    min-width: 200px;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.navbar-controls {
    display: flex;
    align-items: center;
    gap: 18px;
    flex: 1 1 auto;
    justify-content: flex-end;
    min-width: 280px;
}

.control-group {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    border-radius: 12px;
    background: var(--app-surface-muted);
    border: 1px solid var(--app-border-color);
    box-shadow: var(--card-shadow);
    transition: background-color 0.3s ease, border-color 0.3s ease;
}

.control-label {
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--app-text-secondary);
    white-space: nowrap;
}

.control-icon {
    color: var(--app-text-secondary);
}

.control-select {
    min-width: 140px;
}

.user-menu {
    display: flex;
    align-items: center;
    justify-content: flex-end;
}

.el-dropdown-link {
    cursor: pointer;
    display: flex;
    align-items: center;
    outline: none;
    padding: 8px 16px;
    border-radius: 12px;
    transition: all 0.2s;
    gap: 8px;
    background: var(--app-surface-muted);
    border: 1px solid transparent;
}

.el-dropdown-link:hover {
    background: #EAE7E3;
}

.user-icon {
    width: 28px;
    height: 28px;
    color: var(--el-color-primary);
}

.user-name {
    font-weight: 600;
    color: var(--app-text-color);
    font-size: 0.95rem;
}

.arrow-icon {
    width: 18px;
    height: 18px;
    color: var(--app-text-secondary);
    transition: transform 0.2s;
}

.el-dropdown-link:hover .arrow-icon {
    transform: rotate(180deg);
}

@media (max-width: 1024px) {
    .navbar {
        padding: 0 24px;
        gap: 16px;
    }

    .page-title {
        flex: 1 1 100%;
        white-space: normal;
    }

    .navbar-controls {
        flex: 1 1 100%;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 12px;
    }

    .control-group {
        flex: 1 1 240px;
        justify-content: flex-start;
    }

    .user-menu {
        flex: 1 1 100%;
        justify-content: flex-end;
    }
}

@media (max-width: 640px) {
    .navbar {
        padding: 0 16px;
    }

    .control-group {
        flex: 1 1 100%;
    }

    .control-select {
        width: 100%;
    }

    .el-dropdown-link {
        width: 100%;
        justify-content: space-between;
    }
}

.logout-dialog-text {
    margin: 0 0 16px;
    font-size: 1rem;
    color: var(--app-text-color);
    line-height: 1.5;
}

.logout-dialog-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    flex-wrap: wrap;
}

.shift-summary {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.order-summary-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-height: 360px;
    overflow-y: auto;
}

.order-summary-card {
    border-radius: 12px;
}

.order-summary-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
    gap: 12px;
}

.order-status {
    margin-left: 8px;
    padding: 2px 8px;
    border-radius: 999px;
    font-size: 0.8rem;
    text-transform: uppercase;
}

.order-status.paid {
    background: #e6f7ff;
    color: #1890ff;
}

.order-status.pending {
    background: #fff7e6;
    color: #fa8c16;
}

.order-status.cancelled {
    background: #fff1f0;
    color: #f5222d;
}

.order-meta {
    display: flex;
    flex-direction: column;
    gap: 4px;
    color: #6b7280;
    font-size: 0.85rem;
    text-align: right;
}

.order-items {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    row-gap: 6px;
}

.order-items li {
    display: grid;
    grid-template-columns: 1fr auto auto auto;
    gap: 12px;
    align-items: center;
    font-size: 0.9rem;
    color: #374151;
}

.order-line-total {
    font-weight: 700;
    color: #111827;
}

.order-summary-footer {
    display: flex;
    justify-content: space-between;
    margin-top: 12px;
    font-weight: 600;
    color: #1f2937;
}

.summary-dialog-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
}

.highlight {
    color: #b45309;
}
</style>
