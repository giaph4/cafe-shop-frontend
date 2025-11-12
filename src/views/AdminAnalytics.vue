<template>
    <div class="app-page-container analytics-insight">
        <div class="page-header">
            <h1 class="page-title">AI Insight Quản trị</h1>
            <p class="page-subtitle">
                Khai thác dữ liệu đa chiều và AI để đưa ra quyết định nhanh, chính xác.
            </p>
        </div>

        <el-row :gutter="20" class="main-grid">
            <el-col :span="12" :xs="24">
                <el-card class="box-card filter-card" shadow="never">
                    <template #header>
                        <div class="card-header">
                            <span>Thiết lập truy vấn nâng cao</span>
                            <div class="header-actions">
                                <el-button
                                    text
                                    type="primary"
                                    size="small"
                                    @click="resetFilters"
                                    :disabled="loading.metrics || loading.insight"
                                >
                                    Đặt lại
                                </el-button>
                            </div>
                        </div>
                    </template>

                    <el-form label-position="top" class="insight-form" @submit.prevent>
                        <el-form-item label="Khoảng thời gian">
                            <el-date-picker
                                v-model="form.dateRange"
                                type="daterange"
                                unlink-panels
                                start-placeholder="Từ ngày"
                                end-placeholder="Đến ngày"
                                value-format="YYYY-MM-DD"
                                format="DD/MM/YYYY"
                                range-separator="Đến"
                                :disabled="loading.metrics || loading.insight"
                                :shortcuts="dateShortcuts"
                                @change="handleDateChange"
                            />
                        </el-form-item>

                        <el-row :gutter="16" class="flag-row">
                            <el-col :span="8">
                                <div class="flag-item">
                                    <span>Top sản phẩm</span>
                                    <el-switch
                                        v-model="form.includeTopProducts"
                                        :disabled="loading.metrics"
                                        @change="handleFlagChange"
                                    />
                                </div>
                            </el-col>
                            <el-col :span="8">
                                <div class="flag-item">
                                    <span>Voucher</span>
                                    <el-switch
                                        v-model="form.includeVoucherStats"
                                        :disabled="loading.metrics"
                                        @change="handleFlagChange"
                                    />
                                </div>
                            </el-col>
                            <el-col :span="8">
                                <div class="flag-item">
                                    <span>Khách hàng</span>
                                    <el-switch
                                        v-model="form.includeCustomerStats"
                                        :disabled="loading.metrics"
                                        @change="handleFlagChange"
                                    />
                                </div>
                            </el-col>
                        </el-row>

                        <el-form-item label="Câu hỏi cho AI">
                            <el-input
                                v-model="form.question"
                                type="textarea"
                                :rows="4"
                                :maxlength="QUESTION_LIMIT"
                                show-word-limit
                                placeholder="Ví dụ: So sánh doanh thu tuần này với tuần trước và gợi ý chiến dịch marketing phù hợp"
                                :disabled="loading.insight"
                                @blur="handleQuestionSanitize"
                            />
                        </el-form-item>

                        <div class="form-actions">
                            <el-button type="primary" :loading="loading.insight" @click="handleGenerateInsight">
                                Gửi sinh Insight
                            </el-button>
                            <el-button :loading="loading.metrics" @click="handleFetchMetrics">
                                Cập nhật số liệu
                            </el-button>
                        </div>
                    </el-form>

                    <el-alert
                        v-if="errorMessage"
                        type="error"
                        :closable="false"
                        class="mt-4"
                        :title="errorMessage"
                    />
                </el-card>

                <el-card class="box-card history-card" shadow="never">
                    <template #header>
                        <div class="card-header">
                            <span>Lưu vết truy vấn gần đây</span>
                            <small>Nhấp vào một truy vấn để áp dụng lại nhanh.</small>
                        </div>
                    </template>

                    <el-empty
                        v-if="!requestHistory.length"
                        description="Chưa có truy vấn nào"
                    />
                    <el-timeline v-else>
                        <el-timeline-item
                            v-for="item in requestHistory"
                            :key="item.id"
                            :timestamp="formatTimeline(item.timestamp)"
                            type="primary"
                            placement="top"
                        >
                            <div class="history-item">
                                <div class="history-meta">
                                    <strong>{{ item.question }}</strong>
                                    <span>{{ item.from }} - {{ item.to }}</span>
                                </div>
                                <el-button text type="primary" size="small" @click="applyHistory(item)">
                                    Tải sẵn
                                </el-button>
                            </div>
                        </el-timeline-item>
                    </el-timeline>
                </el-card>
            </el-col>

            <el-col :span="12" :xs="24">
                <el-card class="box-card insight-card" shadow="never">
                    <template #header>
                        <div class="card-header">
                            <span>AI Insight</span>
                            <div class="header-actions">
                                <el-button
                                    text
                                    type="primary"
                                    size="small"
                                    :disabled="!aiInsightMarkdown"
                                    @click="copyInsight"
                                >
                                    Sao chép
                                </el-button>
                            </div>
                        </div>
                    </template>

                    <div class="insight-content" v-loading="loading.insight">
                        <el-empty
                            v-if="!aiInsightMarkdown && !loading.insight"
                            description="Chờ AI sinh báo cáo"
                        />
                        <div v-else class="markdown-preview" v-html="renderedInsight" />
                    </div>
                </el-card>

                <el-card class="box-card metrics-card" shadow="never" v-loading="loading.metrics">
                    <template #header>
                        <div class="card-header">
                            <span>Tóm tắt định lượng</span>
                            <small v-if="metrics?.from">Cập nhật: {{ metrics.from }} - {{ metrics.to }}</small>
                        </div>
                    </template>

                    <el-skeleton v-if="loading.metrics" animated :count="3" style="margin-bottom: 16px" />
                    <div v-else-if="metrics" class="metrics-summary">
                        <div class="kpi-grid">
                            <div class="kpi-item">
                                <span class="kpi-label">Tổng đơn</span>
                                <strong>{{ formatNumber(metrics.totalOrders) }}</strong>
                            </div>
                            <div class="kpi-item">
                                <span class="kpi-label">Đơn thanh toán</span>
                                <strong>{{ formatNumber(metrics.paidOrders) }}</strong>
                            </div>
                            <div class="kpi-item">
                                <span class="kpi-label">Đơn hủy</span>
                                <strong>{{ formatNumber(metrics.cancelledOrders) }}</strong>
                            </div>
                            <div class="kpi-item">
                                <span class="kpi-label">Doanh thu</span>
                                <strong>{{ formatCurrency(metrics.totalRevenue) }}</strong>
                            </div>
                            <div class="kpi-item">
                                <span class="kpi-label">Giá trị đơn TB</span>
                                <strong>{{ formatCurrency(metrics.averageOrderValue) }}</strong>
                            </div>
                            <div class="kpi-item">
                                <span class="kpi-label">Giảm giá</span>
                                <strong>{{ formatCurrency(metrics.totalDiscount) }}</strong>
                            </div>
                            <div class="kpi-item" v-if="form.includeVoucherStats">
                                <span class="kpi-label">Lượt dùng voucher</span>
                                <strong>{{ formatNumber(metrics.voucherUsageCount) }}</strong>
                            </div>
                        </div>

                        <el-collapse v-model="activePanels" class="metrics-collapse">
                            <el-collapse-item name="products" title="Top sản phẩm" v-if="form.includeTopProducts">
                                <EasyDataTable :headers="productHeaders" :items="topProducts" table-class-name="data-table">
                                    <template #item-totalRevenue="{ value }">
                                        {{ formatCurrency(value) }}
                                    </template>
                                    <template #item-totalQuantity="{ value }">
                                        {{ formatNumber(value) }}
                                    </template>
                                </EasyDataTable>
                            </el-collapse-item>

                            <el-collapse-item name="customers" title="Top khách hàng" v-if="form.includeCustomerStats">
                                <EasyDataTable :headers="customerHeaders" :items="topCustomers" table-class-name="data-table">
                                    <template #item-totalSpend="{ value }">
                                        {{ formatCurrency(value) }}
                                    </template>
                                    <template #item-averageSpend="{ value }">
                                        {{ formatCurrency(value) }}
                                    </template>
                                    <template #item-orderCount="{ value }">
                                        {{ formatNumber(value) }}
                                    </template>
                                </EasyDataTable>
                            </el-collapse-item>

                            <el-collapse-item name="staff" title="Hiệu suất nhân viên">
                                <EasyDataTable :headers="staffHeaders" :items="topStaff" table-class-name="data-table">
                                    <template #item-totalRevenue="{ value }">
                                        {{ formatCurrency(value) }}
                                    </template>
                                    <template #item-orderCount="{ value }">
                                        {{ formatNumber(value) }}
                                    </template>
                                </EasyDataTable>
                            </el-collapse-item>
                        </el-collapse>
                    </div>

                    <el-empty v-else description="Chờ tải dữ liệu" />
                </el-card>
            </el-col>
        </el-row>
    </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import EasyDataTable from 'vue3-easy-data-table'
import 'vue3-easy-data-table/dist/style.css'
import { useToast } from 'vue-toastification'

import { fetchDashboardMetrics, generateDashboardInsight } from '@/api/adminAnalyticsService'
import { formatCurrency as formatCurrencyUtil, formatDateISO } from '@/utils/formatters'

const toast = useToast()
const QUESTION_LIMIT = 500
const HISTORY_STORAGE_KEY = 'admin-analytics-history'

const loading = reactive({
    metrics: false,
    insight: false,
})

const form = reactive({
    dateRange: [],
    question: 'Tóm tắt doanh thu, xu hướng bán hàng và gợi ý chiến dịch marketing phù hợp?'.slice(0, QUESTION_LIMIT),
    includeTopProducts: true,
    includeVoucherStats: true,
    includeCustomerStats: true,
})

const metrics = ref(null)
const aiInsightMarkdown = ref('')
const renderedInsight = computed(() => markdownToHtml(aiInsightMarkdown.value))
const errorMessage = ref('')
const requestHistory = ref(loadHistory())
const activePanels = ref(['products', 'customers', 'staff'])

const productHeaders = [
    { text: 'Sản phẩm', value: 'productName', sortable: true },
    { text: 'Số lượng', value: 'totalQuantity', sortable: true },
    { text: 'Doanh thu', value: 'totalRevenue', sortable: true },
]

const customerHeaders = [
    { text: 'Khách hàng', value: 'customerName', sortable: true },
    { text: 'Số đơn', value: 'orderCount', sortable: true },
    { text: 'Tổng chi', value: 'totalSpend', sortable: true },
    { text: 'TB/đơn', value: 'averageSpend', sortable: true },
    { text: 'Số ĐT', value: 'phone', sortable: false },
]

const staffHeaders = [
    { text: 'Nhân viên', value: 'staffName', sortable: true },
    { text: 'Số đơn', value: 'orderCount', sortable: true },
    { text: 'Doanh thu', value: 'totalRevenue', sortable: true },
]

const topProducts = computed(() => metrics.value?.topProducts || [])
const topCustomers = computed(() => metrics.value?.topCustomers || [])
const topStaff = computed(() => metrics.value?.topStaff || [])

const dateShortcuts = [
    {
        text: '7 ngày',
        value: () => {
            const end = new Date()
            const start = new Date()
            start.setDate(end.getDate() - 6)
            return [formatDateISO(start), formatDateISO(end)]
        },
    },
    {
        text: '30 ngày',
        value: () => {
            const end = new Date()
            const start = new Date()
            start.setDate(end.getDate() - 29)
            return [formatDateISO(start), formatDateISO(end)]
        },
    },
    {
        text: 'Tháng nay',
        value: () => {
            const now = new Date()
            const start = new Date(now.getFullYear(), now.getMonth(), 1)
            return [formatDateISO(start), formatDateISO(now)]
        },
    },
]

function initDefaultRange() {
    const [from, to] = dateShortcuts[0].value()
    form.dateRange = [from, to]
}

function formatNumber(val) {
    if (val === null || val === undefined) return '0'
    return Number(val).toLocaleString('vi-VN')
}

function formatCurrency(val) {
    return formatCurrencyUtil(val ?? 0)
}

function formatTimeline(isoString) {
    const date = new Date(isoString)
    return date.toLocaleString('vi-VN')
}

function sanitizeQuestion(value) {
    return value.replace(/[<>]/g, '').trim()
}

function handleQuestionSanitize() {
    form.question = sanitizeQuestion(form.question)
}

function getErrorMessage(error) {
    if (error.response) {
        return (
            error.response.data?.message ||
            error.response.data?.error ||
            error.response.data?.details ||
            `HTTP ${error.response.status}`
        )
    }
    if (error.message) return error.message
    return 'Không xác định được lỗi'
}

function validateDateRange() {
    if (!form.dateRange?.length || form.dateRange.length < 2) {
        toast.error('Vui lòng chọn khoảng thời gian')
        return false
    }
    const [from, to] = form.dateRange
    if (new Date(from) > new Date(to)) {
        toast.error('Ngày bắt đầu phải trước hoặc bằng ngày kết thúc')
        return false
    }
    return true
}

function handleDateChange() {
    if (metrics.value) {
        handleFetchMetrics()
    }
}

function handleFlagChange() {
    if (metrics.value) {
        handleFetchMetrics()
    }
}

function buildMetricParams() {
    const [from, to] = form.dateRange
    return {
        from,
        to,
        includeTopProducts: form.includeTopProducts,
        includeVoucherStats: form.includeVoucherStats,
        includeCustomerStats: form.includeCustomerStats,
    }
}

function toNumber(value) {
    if (value === null || value === undefined) return 0
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0
    if (typeof value === 'string') {
        const cleaned = value.replace(/,/g, '')
        const parsed = Number(cleaned)
        return Number.isFinite(parsed) ? parsed : 0
    }
    if (typeof value === 'object' && value !== null && 'value' in value) {
        return toNumber(value.value)
    }
    return 0
}

function normalizeProduct(item) {
    if (!item) return {
        productId: null,
        productName: 'Không xác định',
        totalQuantity: 0,
        totalRevenue: 0,
    }
    return {
        productId: item.productId ?? item.id ?? null,
        productName: item.productName ?? item.name ?? 'Không xác định',
        totalQuantity: toNumber(item.totalQuantity ?? item.totalQuantitySold ?? item.quantity),
        totalRevenue: toNumber(item.totalRevenue ?? item.totalRevenueGenerated ?? item.revenue),
    }
}

function normalizeCustomer(item) {
    if (!item) {
        return {
            customerId: null,
            customerName: 'Không xác định',
            orderCount: 0,
            totalSpend: 0,
            averageSpend: 0,
            phone: 'N/A',
        }
    }
    return {
        customerId: item.customerId ?? item.id ?? null,
        customerName: item.customerName ?? item.fullName ?? item.name ?? 'Không xác định',
        orderCount: toNumber(item.orderCount ?? item.totalOrders),
        totalSpend: toNumber(item.totalSpend ?? item.totalSpent ?? item.spend),
        averageSpend: toNumber(item.averageSpend ?? item.averageSpent ?? item.avgSpend),
        phone: item.phone ?? item.phoneNumber ?? 'N/A',
    }
}

function normalizeStaff(item) {
    if (!item) {
        return {
            staffId: null,
            staffName: 'Không xác định',
            orderCount: 0,
            totalRevenue: 0,
        }
    }
    return {
        staffId: item.staffId ?? item.userId ?? item.id ?? null,
        staffName: item.staffName ?? item.fullName ?? item.username ?? 'Không xác định',
        orderCount: toNumber(item.orderCount ?? item.totalOrders),
        totalRevenue: toNumber(item.totalRevenue ?? item.revenue ?? item.totalRevenueGenerated),
    }
}

function normalizeMetrics(raw) {
    if (!raw) return null
    return {
        ...raw,
        totalOrders: toNumber(raw.totalOrders),
        paidOrders: toNumber(raw.paidOrders),
        cancelledOrders: toNumber(raw.cancelledOrders),
        totalRevenue: toNumber(raw.totalRevenue),
        averageOrderValue: toNumber(raw.averageOrderValue),
        totalDiscount: toNumber(raw.totalDiscount),
        voucherUsageCount: toNumber(raw.voucherUsageCount),
        topProducts: (raw.topProducts || raw.bestSellers || []).map(normalizeProduct),
        topCustomers: (raw.topCustomers || raw.customerMetrics || []).map(normalizeCustomer),
        topStaff: (raw.topStaff || raw.staffMetrics || []).map(normalizeStaff),
    }
}

function loadHistory() {
    try {
        const raw = localStorage.getItem(HISTORY_STORAGE_KEY)
        if (!raw) return []
        const data = JSON.parse(raw)
        return Array.isArray(data) ? data : []
    } catch (error) {
        console.warn('Không thể đọc lịch sử insight', error)
        return []
    }
}

function persistHistory() {
    try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(requestHistory.value))
    } catch (error) {
        console.warn('Không thể lưu lịch sử insight', error)
    }
}

function pushHistory(response) {
    const entry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        question: response.request?.question || form.question,
        from: response.request?.from || form.dateRange[0],
        to: response.request?.to || form.dateRange[1],
        insight: response.aiInsightMarkdown,
        timestamp: new Date().toISOString(),
    }
    requestHistory.value.unshift(entry)
    if (requestHistory.value.length > 10) {
        requestHistory.value.splice(10)
    }
}

function applyHistory(item) {
    form.dateRange = [item.from, item.to]
    form.question = item.question
    aiInsightMarkdown.value = item.insight
    handleFetchMetrics()
}

async function handleFetchMetrics() {
    if (!validateDateRange()) return
    loading.metrics = true
    errorMessage.value = ''
    try {
        const response = await fetchDashboardMetrics(buildMetricParams())
        metrics.value = normalizeMetrics(response.data)
    } catch (error) {
        errorMessage.value = getErrorMessage(error)
        toast.error(errorMessage.value)
    } finally {
        loading.metrics = false
    }
}

async function handleGenerateInsight() {
    if (!validateDateRange()) return
    handleQuestionSanitize()
    if (!form.question) {
        toast.error('Câu hỏi không được để trống')
        return
    }

    loading.insight = true
    errorMessage.value = ''
    try {
        const payload = {
            ...buildMetricParams(),
            question: form.question,
        }
        const response = await generateDashboardInsight(payload)
        metrics.value = normalizeMetrics(response.data.metrics)
        aiInsightMarkdown.value = response.data.aiInsightMarkdown?.trim() ||
            '### Insight chưa sẵn sàng\n- Hệ thống AI chưa trả lời.\n- Vui lòng thử lại sau vài phút.'
        pushHistory(response.data)
        toast.success('Đã cập nhật insight AI')
    } catch (error) {
        errorMessage.value = getErrorMessage(error)
        toast.error(errorMessage.value)
        await handleFetchMetrics()
    } finally {
        loading.insight = false
    }
}

function resetFilters() {
    initDefaultRange()
    form.includeTopProducts = true
    form.includeVoucherStats = true
    form.includeCustomerStats = true
    form.question = ''
    aiInsightMarkdown.value = ''
    metrics.value = null
    errorMessage.value = ''
}

async function copyInsight() {
    if (!aiInsightMarkdown.value) return
    try {
        await navigator.clipboard.writeText(aiInsightMarkdown.value)
        toast.success('Đã sao chép nội dung insight')
    } catch (error) {
        toast.error('Không thể sao chép, vui lòng thao tác thủ công')
    }
}

function markdownToHtml(markdown) {
    if (!markdown) return ''

    const escapeHtml = (text) =>
        text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')

    const formatInline = (text) => {
        const escaped = escapeHtml(text)
        return escaped
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/`(.+?)`/g, '<code>$1</code>')
    }

    const lines = markdown.split('\n')
    let html = ''
    let inList = false

    const closeList = () => {
        if (inList) {
            html += '</ul>'
            inList = false
        }
    }

    lines.forEach((line) => {
        const trimmed = line.trim()

        if (!trimmed) {
            closeList()
            html += '<br />'
            return
        }

        const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/)
        if (headingMatch) {
            closeList()
            const level = Math.min(headingMatch[1].length, 6)
            html += `<h${level}>${formatInline(headingMatch[2])}</h${level}>`
            return
        }

        if (/^[-*]\s+/.test(trimmed)) {
            if (!inList) {
                html += '<ul>'
                inList = true
            }
            const content = trimmed.replace(/^[-*]\s+/, '')
            html += `<li>${formatInline(content)}</li>`
            return
        }

        closeList()
        html += `<p>${formatInline(trimmed)}</p>`
    })

    closeList()
    return html.replace(/(<br \/>)+$/, '')
}

watch(requestHistory, persistHistory, { deep: true })

onMounted(async () => {
    if (!form.dateRange.length) {
        initDefaultRange()
    }
    await handleFetchMetrics()
})
</script>

<style scoped>
.analytics-insight {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.page-header {
    margin-bottom: 12px;
}

.page-title {
    font-size: 1.8rem;
    font-weight: 700;
    margin-bottom: 6px;
}

.page-subtitle {
    color: var(--gray-600);
    margin: 0;
}

.main-grid {
    align-items: stretch;
}

.box-card {
    border-radius: var(--radius-lg);
    margin-bottom: 20px;
}

.card-header {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.card-header span {
    font-weight: 600;
}

.card-header small {
    color: var(--gray-600);
}

.header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
}

.insight-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.flag-row .flag-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    border: 1px solid #ebeef5;
    border-radius: 12px;
}

.form-actions {
    display: flex;
    gap: 12px;
    margin-top: 8px;
}

.insight-content {
    min-height: 260px;
    max-height: 480px;
    overflow: auto;
}

.markdown-preview {
    line-height: 1.6;
    font-size: 0.95rem;
}

.markdown-preview h1,
.markdown-preview h2,
.markdown-preview h3 {
    margin-top: 16px;
    margin-bottom: 8px;
    font-weight: 700;
}

.markdown-preview ul {
    padding-left: 20px;
}

.markdown-preview code {
    background: #f4f4f5;
    border-radius: 4px;
    padding: 2px 4px;
}

.metrics-summary {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.kpi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 12px;
}

.kpi-item {
    border: 1px solid #ebeef5;
    border-radius: 12px;
    padding: 12px;
    background-color: #fafafa;
}

.kpi-label {
    color: var(--gray-600);
    font-size: 0.85rem;
    display: block;
    margin-bottom: 4px;
}

.metrics-collapse :deep(.el-collapse-item__wrap) {
    padding: 0 0 16px;
}

.metrics-collapse :deep(.el-collapse-item__content) {
    padding-bottom: 0;
}

.history-card .history-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
}

.history-meta {
    display: flex;
    flex-direction: column;
}

.history-meta strong {
    font-weight: 600;
}

.history-meta span {
    color: var(--gray-600);
    font-size: 0.85rem;
}

@media (max-width: 1024px) {
    .form-actions {
        flex-direction: column;
    }
}
</style>
