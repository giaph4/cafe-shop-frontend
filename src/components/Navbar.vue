<template>
    <el-header class="navbar" :class="{ 'sidebar-collapsed': isSidebarCollapsed }">
        <button class="sidebar-toggle" type="button" @click="emitToggleSidebar" :aria-label="isSidebarCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'">
            <component :is="isSidebarCollapsed ? ChevronRight : ChevronLeft" class="sidebar-toggle-icon" />
        </button>
        <div class="page-title">
            {{ $route.meta.title || 'Dashboard' }}
        </div>

        <div class="user-menu">
            <el-dropdown @command="handleCommand">
                <span class="el-dropdown-link">
                    <UserCircle class="user-icon" />
                    <span class="user-name">{{ authStore.user.fullName }}</span>
                    <ChevronDown class="arrow-icon" />
                </span>
                <template #dropdown>
                    <el-dropdown-menu>
                        <el-dropdown-item command="profile">
                            Thông tin cá nhân
                        </el-dropdown-item>
                        <el-dropdown-item command="logout" divided>
                            Đăng xuất
                        </el-dropdown-item>
                    </el-dropdown-menu>
                </template>
            </el-dropdown>
        </div>

        <el-dialog
            v-model="logoutDialogVisible"
            title="Xác nhận đăng xuất"
            width="460px"
            :close-on-click-modal="false"
        >
            <p class="logout-dialog-text">
                Bạn có muốn kết ca trước khi đăng xuất khỏi hệ thống POS không?
            </p>
            <template #footer>
                <div class="logout-dialog-actions">
                    <el-button @click="logoutDialogVisible = false" :disabled="isGeneratingSummary || isLoggingOut">Hủy</el-button>
                    <el-button
                        @click="logoutWithoutShift"
                        :loading="isLoggingOut"
                        :disabled="isGeneratingSummary"
                    >
                        Đăng xuất không kết ca
                    </el-button>
                    <el-button
                        type="primary"
                        @click="logoutWithShift"
                        :loading="isGeneratingSummary"
                        :disabled="isLoggingOut"
                    >
                        Đăng xuất và kết ca
                    </el-button>
                </div>
            </template>
        </el-dialog>

    </el-header>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/store/auth'
import { useSidebarStore } from '@/store/sidebar'
import { buildShiftSummary } from '@/utils/shiftManager.js'
import { formatCurrency } from '@/utils/formatters.js'
import { UserCircle, ChevronDown, ChevronLeft, ChevronRight } from '@/components/icons'
import { useShiftSummaryStore } from '@/store/shiftSummary.js'

const authStore = useAuthStore()
const router = useRouter()
const sidebarStore = useSidebarStore()
const toast = useToast()
const shiftSummaryStore = useShiftSummaryStore()

const logoutDialogVisible = ref(false)
const isGeneratingSummary = ref(false)
const isLoggingOut = ref(false)

const isSidebarCollapsed = computed(() => sidebarStore.isCollapsed)

const emitToggleSidebar = () => {
    sidebarStore.toggle()
}

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
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    background: #FDFCFB;
    border-bottom: 1px solid #E8E6E3;
    padding: 0 32px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
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
    color: #212121;
    letter-spacing: -0.5px;
}

.user-menu {
    display: flex;
    align-items: center;
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
}

.el-dropdown-link:hover {
    background: #EAE7E3;
}

.user-icon {
    width: 28px;
    height: 28px;
    color: #8B7355;
}

.user-name {
    font-weight: 600;
    color: #212121;
    font-size: 0.95rem;
}

.arrow-icon {
    width: 18px;
    height: 18px;
    color: #757575;
    transition: transform 0.2s;
}

.el-dropdown-link:hover .arrow-icon {
    transform: rotate(180deg);
}

.logout-dialog-text {
    margin: 0 0 16px;
    font-size: 1rem;
    color: #414141;
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
