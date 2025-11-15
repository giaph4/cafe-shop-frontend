<template>
    <div class="admin-dashboard-panel">
        <el-row :gutter="16" class="chart-row">
            <el-col :xs="24" :md="16">
                <el-card shadow="never" class="chart-card" v-loading="isLoading">
                    <template #header>
                        <span>Doanh thu theo ngày</span>
                    </template>
                    <div class="chart-container">
                        <LineChart v-if="hasRevenueChart" :chart-data="revenueChartData" />
                        <el-empty v-else description="Chưa có dữ liệu" />
                    </div>
                </el-card>
            </el-col>
            <el-col :xs="24" :md="8">
                <el-card shadow="never" class="chart-card" v-loading="isLoading">
                    <template #header>
                        <span>Top sản phẩm (chart)</span>
                    </template>
                    <div class="chart-container">
                        <BarChart v-if="hasProductChart" :chart-data="productChartData" />
                        <el-empty v-else description="Chưa có dữ liệu" />
                    </div>
                </el-card>
            </el-col>
        </el-row>

        <el-row :gutter="16" class="admin-metric-row">
            <el-col :xs="24" :md="8">
                <el-card shadow="never" class="metric-card" v-loading="isLoading">
                    <template #header>
                        <span>Doanh thu</span>
                    </template>
                    <ul class="metric-list">
                        <li v-for="item in revenueMetrics" :key="item.label" :class="{ 'metric-highlight': item.highlight }">
                            <span>{{ item.label }}</span>
                            <el-tooltip :content="item.tooltip" placement="top">
                                <strong class="metric-value">{{ item.value }}</strong>
                            </el-tooltip>
                        </li>
                    </ul>
                </el-card>
            </el-col>
            <el-col :xs="24" :md="8">
                <el-card shadow="never" class="metric-card" v-loading="isLoading">
                    <template #header>
                        <span>Đơn hàng</span>
                    </template>
                    <ul class="metric-list">
                        <li v-for="item in orderMetrics" :key="item.label" :class="{ 'metric-highlight': item.highlight }">
                            <span>{{ item.label }}</span>
                            <el-tooltip :content="item.tooltip" placement="top">
                                <strong class="metric-value">{{ item.value }}</strong>
                            </el-tooltip>
                        </li>
                    </ul>
                </el-card>
            </el-col>
            <el-col :xs="24" :md="8">
                <el-card shadow="never" class="metric-card" v-loading="isLoading">
                    <template #header>
                        <span>Tồn kho & Nhà cung cấp</span>
                    </template>
                    <ul class="metric-list">
                        <li v-for="item in inventoryMetrics" :key="item.label" :class="{ 'metric-highlight': item.highlight }">
                            <span>{{ item.label }}</span>
                            <el-tooltip :content="item.tooltip" placement="top">
                                <strong class="metric-value">{{ item.value }}</strong>
                            </el-tooltip>
                        </li>
                    </ul>
                </el-card>
            </el-col>
        </el-row>

        <el-row :gutter="16">
            <el-col :xs="24" :md="8">
                <el-card shadow="never" class="list-card" v-loading="isLoading">
                    <template #header>
                        <span>Top nhân viên</span>
                    </template>
                    <EasyDataTable
                        :headers="staffHeaders"
                        :items="topStaff"
                        :loading="isLoading"
                        table-class-name="data-table"
                        empty-message="Chưa có dữ liệu"
                    >
                        <template #item-orders="{ value }">{{ formatNumber(value ?? 0) }}</template>
                        <template #item-revenue="{ value }">{{ formatCurrency(value ?? 0) }}</template>
                    </EasyDataTable>
                </el-card>
            </el-col>
            <el-col :xs="24" :md="8">
                <el-card shadow="never" class="list-card" v-loading="isLoading">
                    <template #header>
                        <span>Top sản phẩm</span>
                    </template>
                    <EasyDataTable
                        :headers="productHeaders"
                        :items="topProducts"
                        :loading="isLoading"
                        table-class-name="data-table"
                        empty-message="Chưa có dữ liệu"
                    >
                        <template #item-quantity="{ value }">{{ formatNumber(value ?? 0) }}</template>
                        <template #item-revenue="{ value }">{{ formatCurrency(value ?? 0) }}</template>
                    </EasyDataTable>
                </el-card>
            </el-col>
            <el-col :xs="24" :md="8">
                <el-card shadow="never" class="list-card" v-loading="isLoading">
                    <template #header>
                        <span>Top khách hàng</span>
                    </template>
                    <EasyDataTable
                        :headers="customerHeaders"
                        :items="topCustomers"
                        :loading="isLoading"
                        table-class-name="data-table"
                        empty-message="Chưa có dữ liệu"
                    >
                        <template #item-orders="{ value }">{{ formatNumber(value ?? 0) }}</template>
                        <template #item-spend="{ value }">{{ formatCurrency(value ?? 0) }}</template>
                    </EasyDataTable>
                </el-card>
            </el-col>
        </el-row>

        <el-card
            v-if="alerts.length"
            shadow="never"
            class="alert-card"
            v-loading="isLoading"
        >
            <template #header>
                <span>Cảnh báo</span>
            </template>
            <div class="alert-list">
                <el-alert
                    v-for="(alert, index) in alerts"
                    :key="`${alert.type}-${index}`"
                    :title="alert.message"
                    :description="alert.type"
                    :type="severityTagType(alert.severity)"
                    show-icon
                    :closable="false"
                />
            </div>
        </el-card>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import EasyDataTable from 'vue3-easy-data-table'
import 'vue3-easy-data-table/dist/style.css'

import LineChart from '@/components/charts/LineChart.vue'
import BarChart from '@/components/charts/BarChart.vue'
import { formatCurrency, formatNumber } from '@/utils/formatters'

const props = defineProps({
    data: {
        type: Object,
        required: true,
    },
    revenueChartData: {
        type: Object,
        default: () => ({ labels: [], datasets: [] }),
    },
    productChartData: {
        type: Object,
        default: () => ({ labels: [], datasets: [] }),
    },
})

const staffHeaders = [
    { text: 'Nhân viên', value: 'staffName', sortable: true },
    { text: 'Đơn', value: 'orders', sortable: true },
    { text: 'Doanh thu', value: 'revenue', sortable: true },
]

const productHeaders = [
    { text: 'Sản phẩm', value: 'productName', sortable: true },
    { text: 'Số lượng', value: 'quantity', sortable: true },
    { text: 'Doanh thu', value: 'revenue', sortable: true },
]

const customerHeaders = [
    { text: 'Khách hàng', value: 'customerName', sortable: true },
    { text: 'Đơn', value: 'orders', sortable: true },
    { text: 'Chi tiêu', value: 'spend', sortable: true },
]

const isLoading = computed(() => !props.data || Object.keys(props.data).length === 0)

const createMetric = (label, formatted, raw, formatFn = formatNumber) => ({
    label,
    value: formatted,
    tooltip: formatFn(raw ?? 0),
    highlight: Number(raw ?? 0) > 0 && raw === Math.max(raw ?? 0),
    raw: raw ?? 0,
})

const applyHighlight = (metrics) => {
    const maxValue = Math.max(...metrics.map(item => Number(item.raw ?? 0)))
    return metrics.map(item => ({
        ...item,
        highlight: maxValue > 0 && Number(item.raw ?? 0) === maxValue,
    }))
}

const revenueMetrics = computed(() => {
    const revenue = props.data.revenue ?? {}
    const metrics = [
        createMetric('Hôm nay', formatCurrency(revenue.today ?? 0), revenue.today ?? 0, formatCurrency),
        createMetric('Tháng', formatCurrency(revenue.month ?? 0), revenue.month ?? 0, formatCurrency),
        createMetric('Năm', formatCurrency(revenue.year ?? 0), revenue.year ?? 0, formatCurrency),
        createMetric('Giá trị đơn TB', formatCurrency(revenue.averageOrderValue ?? 0), revenue.averageOrderValue ?? 0, formatCurrency),
        createMetric('Lợi nhuận hôm nay', formatCurrency(revenue.todayProfit ?? 0), revenue.todayProfit ?? 0, formatCurrency),
        createMetric('Lợi nhuận tháng', formatCurrency(revenue.monthProfit ?? 0), revenue.monthProfit ?? 0, formatCurrency),
    ]
    return applyHighlight(metrics)
})

const orderMetrics = computed(() => {
    const orders = props.data.orders ?? {}
    const metrics = [
        createMetric('Đơn hôm nay', formatNumber(orders.today ?? 0), orders.today ?? 0),
        createMetric('Đơn tháng', formatNumber(orders.month ?? 0), orders.month ?? 0),
        createMetric('Đơn năm', formatNumber(orders.year ?? 0), orders.year ?? 0),
        createMetric('Hủy hôm nay', formatNumber(orders.cancelledToday ?? 0), orders.cancelledToday ?? 0),
        createMetric('Hủy tháng', formatNumber(orders.cancelledMonth ?? 0), orders.cancelledMonth ?? 0),
    ]
    return applyHighlight(metrics)
})

const inventoryMetrics = computed(() => {
    const inventory = props.data.inventory ?? {}
    const metrics = [
        createMetric('Nguyên liệu thấp', formatNumber(inventory.lowStockItems ?? 0), inventory.lowStockItems ?? 0),
        createMetric('Nhà cung cấp', formatNumber(inventory.totalSuppliers ?? 0), inventory.totalSuppliers ?? 0),
        createMetric('PO chờ duyệt', formatNumber(inventory.pendingPurchaseOrders ?? 0), inventory.pendingPurchaseOrders ?? 0),
    ]
    return applyHighlight(metrics)
})

const topStaff = computed(() => (Array.isArray(props.data.topStaff) ? props.data.topStaff.slice(0, 10) : []))
const topProducts = computed(() => (Array.isArray(props.data.topProducts) ? props.data.topProducts.slice(0, 10) : []))
const topCustomers = computed(() => (Array.isArray(props.data.topCustomers) ? props.data.topCustomers.slice(0, 10) : []))
const alerts = computed(() => (Array.isArray(props.data.alerts) ? props.data.alerts : []))

const hasRevenueChart = computed(() => (props.revenueChartData?.labels?.length ?? 0) > 0)
const hasProductChart = computed(() => (props.productChartData?.labels?.length ?? 0) > 0)

function severityTagType(severity) {
    switch ((severity ?? '').toUpperCase()) {
        case 'HIGH':
            return 'error'
        case 'MEDIUM':
            return 'warning'
        case 'INFO':
            return 'info'
        default:
            return 'info'
    }
}
</script>

<style scoped>
.admin-dashboard-panel {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.chart-row {
    margin-bottom: 8px;
}

.chart-card {
    border-radius: 20px;
    border: 1px solid var(--app-border-color);
    background: var(--app-surface-muted);
    box-shadow: var(--card-shadow, 0 6px 24px rgba(15, 23, 42, 0.08));
}

.chart-container {
    height: 260px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.metric-card,
.list-card,
.alert-card {
    border-radius: 20px;
    border: 1px solid var(--app-border-color);
    background: var(--app-surface-muted);
    box-shadow: var(--card-shadow, 0 6px 24px rgba(15, 23, 42, 0.08));
}

.metric-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 8px;
}

.metric-list li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.95rem;
    padding: 6px 10px;
    border-radius: 12px;
    transition: background-color 0.2s ease;
}

.metric-list strong {
    font-weight: var(--font-bold);
}

.metric-highlight {
    background: rgba(22, 163, 74, 0.12);
}

.alert-list {
    display: grid;
    gap: 12px;
}

.data-table {
    --easy-table-border: none;
    --easy-table-header-font-size: 13px;
    --easy-table-body-font-size: 13px;
}
</style>
