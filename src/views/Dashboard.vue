<template>
    <div class="dashboard-page">
        <div class="view-toggle">
            <label class="toggle-label" for="dashboard-toggle">Chế độ hiển thị</label>
            <el-switch
                id="dashboard-toggle"
                v-model="showAdvanced"
                inline-prompt
                :style="switchStyle"
                :active-color="SWITCH_COLORS.active"
                :inactive-color="SWITCH_COLORS.inactive"
                :active-text="SWITCH_LABELS.active"
                :inactive-text="SWITCH_LABELS.inactive"
            />
        </div>

        <LegacyDashboard v-if="!showAdvanced"/>

        <div v-else class="advanced-dashboard">
            <div class="page-header">
                <div class="page-header__meta">
                    <h1 class="page-title">{{ pageTitle }}</h1>
                    <p class="page-subtitle">{{ pageSubtitle }}</p>
                </div>
                <div class="page-header__actions">
                    <el-radio-group
                        v-if="roleOptions.length > 1"
                        v-model="activeRole"
                        size="small"
                        @change="handleRoleChange"
                    >
                        <el-radio-button
                            v-for="option in roleOptions"
                            :key="option.value"
                            :label="option.value"
                        >
                            {{ option.label }}
                        </el-radio-button>
                    </el-radio-group>
                    <el-button type="primary" plain size="small" :loading="loading" @click="handleRefresh">
                        Tải lại
                    </el-button>
                    <span v-if="formattedLastUpdated" class="updated-at">Cập nhật lúc {{ formattedLastUpdated }}</span>
                </div>
            </div>

            <el-alert
                v-if="errorMessage"
                type="error"
                :closable="false"
                class="alert-block"
                :title="errorMessage"
            />

            <el-skeleton v-if="loading && !dashboardData" :rows="6" animated/>

            <AdminDashboardPanel
                v-if="activeRole === 'ADMIN' && dashboardData"
                :data="dashboardData"
                :revenue-chart-data="adminRevenueChart"
                :product-chart-data="adminProductChart"
            />
            <ManagerDashboardPanel
                v-if="activeRole === 'MANAGER' && dashboardData"
                :data="dashboardData"
                :shift-chart-data="managerShiftChart"
                :team-chart-data="managerTeamChart"
            />
            <StaffDashboardPanel
                v-if="activeRole === 'STAFF' && dashboardData"
                :data="dashboardData"
                title="Dashboard nhân viên"
                :last-updated="formattedLastUpdated"
                :performance-chart-data="staffPerformanceChart"
            />

            <StaffDashboardPanel
                v-if="shouldShowSelfStaffPanel"
                :data="selfStaffData"
                title="Dashboard cá nhân"
                subtitle="Dữ liệu dành cho nhân viên"
                :last-updated="formattedSelfUpdated"
                :performance-chart-data="selfPerformanceChart"
                class="mt-24"
            />

            <section v-if="canViewStaffDashboard" class="impersonate-section">
                <el-card shadow="never" class="impersonate-card">
                    <template #header>
                        <span>Dashboard nhân viên (xem hộ)</span>
                    </template>
                    <el-form class="impersonate-form" @submit.prevent="handleFetchStaffDashboard">
                        <el-row :gutter="12" align="middle">
                            <el-col :xs="24" :sm="12" :md="8">
                                <el-form-item label="User ID">
                                    <el-input
                                        v-model="impersonate.userId"
                                        placeholder="Nhập mã nhân viên"
                                        clearable
                                    />
                                </el-form-item>
                            </el-col>
                            <el-col :xs="24" :sm="12" :md="8" class="impersonate-actions">
                                <el-button
                                    type="primary"
                                    :loading="impersonate.loading"
                                    :disabled="!canSubmitImpersonate"
                                    native-type="submit"
                                >
                                    Tải dashboard
                                </el-button>
                                <el-button
                                    :disabled="impersonate.loading || !impersonate.userId"
                                    @click="resetImpersonation"
                                >
                                    Xóa
                                </el-button>
                            </el-col>
                        </el-row>
                    </el-form>

                    <el-alert
                        v-if="impersonate.error"
                        type="warning"
                        :closable="false"
                        class="alert-block"
                        :title="impersonate.error"
                    />

                    <StaffDashboardPanel
                        v-if="impersonate.data"
                        :data="impersonate.data"
                        :title="`Dashboard nhân viên #${impersonate.userId}`"
                        subtitle="Dữ liệu truy cập hộ"
                        :last-updated="formattedImpersonateUpdated"
                        :performance-chart-data="impersonatePerformanceChart"
                    />
                </el-card>
            </section>
        </div>
    </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'

import { useAuthStore } from '@/store/auth'
import {
    getAdminDashboard,
    getManagerDashboard,
    getStaffDashboard,
    getStaffDashboardByUserId,
} from '@/api/dashboardService'
import { formatDateTimeDisplay } from '@/utils/formatters'
import { createBarChartData, createLineChartData } from '@/utils/chartHelpers'

import AdminDashboardPanel from '@/components/dashboard/AdminDashboardPanel.vue'
import ManagerDashboardPanel from '@/components/dashboard/ManagerDashboardPanel.vue'
import StaffDashboardPanel from '@/components/dashboard/StaffDashboardPanel.vue'
import LegacyDashboard from '@/components/dashboard/LegacyDashboard.vue'

const CACHE_TTL = 60_000
const ROLE_PRIORITY = ['ADMIN', 'MANAGER', 'STAFF']
const ROLE_LABELS = {
    ADMIN: 'Admin',
    MANAGER: 'Manager',
    STAFF: 'Staff',
}
const SWITCH_COLORS = {
    active: '#16a34a',
    inactive: '#bdbdbd',
}
const SWITCH_LABELS = {
    active: 'Dashboard nâng cao',
    inactive: 'Dashboard truyền thống',
}
const DEFAULT_LABEL_KEYS = ['label', 'date', 'day', 'name', 'period', 'category', 'timestamp']
const DEFAULT_VALUE_KEYS = ['value', 'amount', 'total', 'count', 'revenue', 'orders', 'score', 'quantity']
const DASHBOARD_VIEW_STORAGE_KEY = 'dashboard-view-mode'

const authStore = useAuthStore()
const toast = useToast()

const dashboardData = ref(null)
const selfStaffData = ref(null)
const loading = ref(false)
const errorMessage = ref('')
const lastUpdated = ref('')
const selfLastUpdated = ref('')
const dashboardCache = reactive({})

const impersonate = reactive({
    userId: '',
    loading: false,
    data: null,
    lastUpdated: '',
    error: '',
})

const advancedInitialized = ref(false)
const showAdvanced = ref(getStoredAdvancedView())

const switchStyle = computed(() => ({
    '--el-switch-on-color': SWITCH_COLORS.active,
    '--el-switch-off-color': SWITCH_COLORS.inactive,
}))

const availableRoles = computed(() => {
    const roles = authStore.roles || []
    const set = new Set()

    roles.forEach((role) => {
        switch (role) {
            case 'ROLE_ADMIN':
                set.add('ADMIN')
                set.add('MANAGER')
                set.add('STAFF')
                break
            case 'ROLE_MANAGER':
                set.add('MANAGER')
                set.add('STAFF')
                break
            case 'ROLE_STAFF':
                set.add('STAFF')
                break
            default:
                break
        }
    })

    return ROLE_PRIORITY.filter(role => set.has(role))
})

const activeRole = ref(availableRoles.value[0] ?? 'STAFF')

watch(availableRoles, (roles) => {
    if (!roles.length) {
        activeRole.value = 'STAFF'
        return
    }
    if (!roles.includes(activeRole.value)) {
        activeRole.value = roles[0]
    }
    if (showAdvanced.value && advancedInitialized.value) {
        ensureAdvancedData({ force: true })
    }
})

const roleOptions = computed(() => availableRoles.value.map(role => ({
    value: role,
    label: ROLE_LABELS[role] ?? role,
})))

const pageTitle = computed(() => {
    switch (activeRole.value) {
        case 'ADMIN':
            return 'Dashboard quản trị'
        case 'MANAGER':
            return 'Dashboard điều hành'
        case 'STAFF':
        default:
            return 'Dashboard nhân viên'
    }
})

const pageSubtitle = computed(() => {
    switch (activeRole.value) {
        case 'ADMIN':
            return 'Theo dõi doanh thu, đơn hàng, tồn kho và cảnh báo toàn hệ thống.'
        case 'MANAGER':
            return 'Quản lý ca làm việc, hiệu suất đội nhóm và vấn đề vận hành.'
        case 'STAFF':
        default:
            return 'Tổng quan ca làm việc, hiệu suất cá nhân và chấm công.'
    }
})

const formattedLastUpdated = computed(() => (lastUpdated.value ? formatDateTimeDisplay(lastUpdated.value) : ''))
const formattedSelfUpdated = computed(() => (selfLastUpdated.value ? formatDateTimeDisplay(selfLastUpdated.value) : ''))
const formattedImpersonateUpdated = computed(() => (impersonate.lastUpdated ? formatDateTimeDisplay(impersonate.lastUpdated) : ''))

const shouldShowSelfStaffPanel = computed(() => activeRole.value !== 'STAFF' && !!selfStaffData.value)
const canViewStaffDashboard = computed(() => availableRoles.value.includes('MANAGER') || availableRoles.value.includes('ADMIN'))
const canSubmitImpersonate = computed(() => !!impersonate.userId?.trim())

const serviceMap = {
    ADMIN: getAdminDashboard,
    MANAGER: getManagerDashboard,
    STAFF: getStaffDashboard,
}

const adminRevenueChart = computed(() => buildLineChart(
    dashboardData.value?.revenueTrend
    ?? dashboardData.value?.revenue?.trend
    ?? dashboardData.value?.revenue?.history
    ?? dashboardData.value?.revenueHistory
    ?? [],
    'Doanh thu',
    { labelKeys: ['date', 'label', 'period'], valueKeys: ['revenue', 'value', 'amount', 'total'] },
))

const adminProductChart = computed(() => buildBarChart(
    dashboardData.value?.topProducts
    ?? dashboardData.value?.productStats
    ?? [],
    'Doanh thu',
    { labelKeys: ['productName', 'name', 'label'], valueKeys: ['revenue', 'totalRevenue', 'totalRevenueGenerated', 'amount', 'value'] },
))

const managerShiftChart = computed(() => buildBarChart(
    dashboardData.value?.shiftOverview?.weeklyDistribution
    ?? dashboardData.value?.shiftOverview?.dailyDistribution
    ?? dashboardData.value?.shiftOverview?.scheduleSummary
    ?? [],
    'Số ca',
    { labelKeys: ['day', 'label', 'date', 'name'], valueKeys: ['count', 'value', 'total', 'shifts', 'scheduled'] },
))

const managerTeamChart = computed(() => buildLineChart(
    dashboardData.value?.teamPerformance?.trend
    ?? dashboardData.value?.teamPerformance?.history
    ?? [],
    'Doanh thu',
    { labelKeys: ['period', 'label', 'date', 'name'], valueKeys: ['revenue', 'value', 'amount', 'totalRevenue'] },
))

const staffPerformanceChart = computed(() => buildLineChart(
    dashboardData.value?.performance?.trend
    ?? dashboardData.value?.performance?.history
    ?? [],
    'Doanh thu',
    { labelKeys: ['period', 'label', 'date', 'name'], valueKeys: ['revenue', 'value', 'amount', 'total'] },
))

const selfPerformanceChart = computed(() => buildLineChart(
    selfStaffData.value?.performance?.trend
    ?? selfStaffData.value?.performance?.history
    ?? [],
    'Doanh thu',
    { labelKeys: ['period', 'label', 'date', 'name'], valueKeys: ['revenue', 'value', 'amount', 'total'] },
))

const impersonatePerformanceChart = computed(() => buildLineChart(
    impersonate.data?.performance?.trend
    ?? impersonate.data?.performance?.history
    ?? [],
    'Doanh thu',
    { labelKeys: ['period', 'label', 'date', 'name'], valueKeys: ['revenue', 'value', 'amount', 'total'] },
))

function getStoredAdvancedView() {
    if (typeof window === 'undefined') {
        return false
    }
    return window.localStorage.getItem(DASHBOARD_VIEW_STORAGE_KEY) === 'advanced'
}

function persistAdvancedView(value) {
    if (typeof window === 'undefined') {
        return
    }
    window.localStorage.setItem(DASHBOARD_VIEW_STORAGE_KEY, value ? 'advanced' : 'legacy')
}

function cacheKeyForRole(role) {
    return role.toLowerCase()
}

function cacheKeyForStaff(userId) {
    return `staff:${userId ?? 'self'}`
}

function isCacheValid(entry) {
    if (!entry || !entry.timestamp) return false
    const diff = Date.now() - new Date(entry.timestamp).getTime()
    return diff < CACHE_TTL
}

function readCache(key) {
    const entry = dashboardCache[key]
    if (isCacheValid(entry)) {
        return entry
    }
    return null
}

function writeCache(key, data) {
    dashboardCache[key] = {
        data,
        timestamp: new Date().toISOString(),
    }
    return dashboardCache[key]
}

function emptyChart() {
    return { labels: [], datasets: [] }
}

function extractSeries(source, { labelKeys = DEFAULT_LABEL_KEYS, valueKeys = DEFAULT_VALUE_KEYS } = {}) {
    if (!source) return []

    let collection = []
    if (Array.isArray(source)) {
        collection = source
    } else if (typeof source === 'object') {
        collection = Object.entries(source).map(([key, value]) => {
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                return { label: key, ...value }
            }
            return { label: key, value }
        })
    }

    return collection
        .map(item => {
            const label = [...labelKeys, 'label']
                .map(key => item?.[key])
                .find(val => val !== undefined && val !== null && val !== '') ?? ''

            const rawValue = [...valueKeys, 'value', 'count', 'total']
                .map(key => item?.[key])
                .find(val => val !== undefined && val !== null)

            let numeric = rawValue
            if (numeric && typeof numeric === 'object') {
                numeric = Object.values(numeric).find(val => typeof val === 'number')
            }

            const value = Number(numeric ?? 0)
            return {
                label: label.toString(),
                value: Number.isFinite(value) ? value : 0,
            }
        })
        .filter(entry => entry.label)
}

function buildLineChart(source, datasetLabel, options = {}) {
    const series = extractSeries(source, options)
    if (!series.length) return emptyChart()
    const labels = series.map(item => item.label)
    const values = series.map(item => item.value)
    return createLineChartData(labels, values, datasetLabel, options.chartOptions ?? { tension: 0.3 })
}

function buildBarChart(source, datasetLabel, options = {}) {
    const series = extractSeries(source, options)
    if (!series.length) return emptyChart()
    const labels = series.map(item => item.label)
    const values = series.map(item => item.value)
    return createBarChartData(labels, values, datasetLabel)
}

function resolveErrorMessage(error) {
    const status = error?.response?.status
    if (status === 403) {
        return 'Bạn không có quyền truy cập dashboard này.'
    }
    if (status === 404) {
        return 'Không tìm thấy dữ liệu.'
    }
    if (status === 401) {
        return 'Phiên đăng nhập hết hạn, vui lòng đăng nhập lại.'
    }
    return error?.response?.data?.message || error?.message || 'Không thể tải dữ liệu dashboard.'
}

async function loadDashboard(role, { force = false } = {}) {
    const key = cacheKeyForRole(role)
    const service = serviceMap[role]
    if (!service) return

    if (!force) {
        const cached = readCache(key)
        if (cached) {
            dashboardData.value = cached.data
            lastUpdated.value = cached.timestamp
            return
        }
    }

    loading.value = true
    errorMessage.value = ''
    try {
        const response = await service()
        const data = response?.data ?? response
        dashboardData.value = data
        const { timestamp } = writeCache(key, data)
        lastUpdated.value = timestamp
    } catch (error) {
        errorMessage.value = resolveErrorMessage(error)
        toast.error(errorMessage.value)
    } finally {
        loading.value = false
    }
}

async function loadSelfStaffDashboard({ force = false } = {}) {
    if (!availableRoles.value.includes('STAFF')) {
        selfStaffData.value = null
        return
    }

    const key = cacheKeyForStaff('self')
    if (!force) {
        const cached = readCache(key)
        if (cached) {
            selfStaffData.value = cached.data
            selfLastUpdated.value = cached.timestamp
            return
        }
    }

    try {
        const response = await getStaffDashboard()
        const data = response?.data ?? response
        selfStaffData.value = data
        const { timestamp } = writeCache(key, data)
        selfLastUpdated.value = timestamp
    } catch (error) {
        console.warn('Không thể tải dashboard self staff', error)
    }
}

function ensureAdvancedData({ force = false } = {}) {
    if (!force && advancedInitialized.value && dashboardData.value) {
        if (!selfStaffData.value) {
            loadSelfStaffDashboard()
        }
        return
    }
    advancedInitialized.value = true
    loadDashboard(activeRole.value, { force })
    loadSelfStaffDashboard({ force })
}

function handleRoleChange() {
    if (!showAdvanced.value) return
    loadDashboard(activeRole.value)
    loadSelfStaffDashboard()
}

function handleRefresh() {
    if (!showAdvanced.value) {
        toast.info('Bật Dashboard nâng cao để làm mới dữ liệu.')
        return
    }
    ensureAdvancedData({ force: true })
}

async function handleFetchStaffDashboard() {
    if (!canSubmitImpersonate.value) return
    impersonate.loading = true
    impersonate.error = ''
    try {
        const userId = impersonate.userId.trim()
        const key = cacheKeyForStaff(userId)
        const cached = readCache(key)
        if (cached) {
            impersonate.data = cached.data
            impersonate.lastUpdated = cached.timestamp
        } else {
            const response = await getStaffDashboardByUserId(userId)
            const data = response?.data ?? response
            impersonate.data = data
            const { timestamp } = writeCache(key, data)
            impersonate.lastUpdated = timestamp
        }
        toast.success(`Đã tải dashboard nhân viên #${userId}`)
    } catch (error) {
        impersonate.error = resolveErrorMessage(error)
        toast.error(impersonate.error)
        impersonate.data = null
        impersonate.lastUpdated = ''
    } finally {
        impersonate.loading = false
    }
}

function resetImpersonation() {
    impersonate.userId = ''
    impersonate.data = null
    impersonate.lastUpdated = ''
    impersonate.error = ''
}

watch(showAdvanced, (value) => {
    persistAdvancedView(value)
    if (value) {
        ensureAdvancedData()
    }
})

watch(activeRole, (role) => {
    if (!showAdvanced.value || !advancedInitialized.value) return
    loadDashboard(role)
    loadSelfStaffDashboard()
})

onMounted(() => {
    if (showAdvanced.value) {
        ensureAdvancedData()
    }
})
</script>

<style scoped>

.dashboard-page {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.view-toggle {
    display: flex;
    justify-content: flex-end;
}

.advanced-dashboard {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.page-header {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
}

.page-title {
    font-size: 1.8rem;
    font-weight: var(--font-semibold);
}

.page-subtitle {
    margin-top: 4px;
    color: var(--gray-600);
}

.page-header__actions {
    display: flex;
    align-items: center;
    gap: 12px;
}

.updated-at {
    font-size: 0.85rem;
    color: var(--gray-600);
}

.alert-block {
    margin-bottom: 16px;
}

.mt-24 {
    margin-top: 24px;
}

.impersonate-section {
    margin-top: 16px;
}

.impersonate-card {
    border-radius: var(--radius-lg);
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.impersonate-form {
    margin-top: 8px;
}

.impersonate-actions {
    display: flex;
    align-items: center;
    gap: 12px;
}

@media (max-width: 768px) {
    .page-header {
        flex-direction: column;
        align-items: stretch;
    }

    .page-header__actions {
        flex-wrap: wrap;
    }

    .impersonate-actions {
        margin-top: 12px;
        justify-content: flex-start;
    }
}
</style>
