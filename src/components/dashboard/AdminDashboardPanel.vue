<template>
    <div class="admin-dashboard-panel">
        <el-row :gutter="16" class="chart-row">
            <el-col :xs="24" :md="16">
                <el-card shadow="never" class="chart-card">
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
                <el-card shadow="never" class="chart-card">
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
                <el-card shadow="never" class="metric-card">
                    <template #header>
                        <span>Doanh thu</span>
                    </template>
                    <ul class="metric-list">
                        <li v-for="item in revenueMetrics" :key="item.label">
                            <span>{{ item.label }}</span>
                            <strong>{{ item.value }}</strong>
                        </li>
                    </ul>
                </el-card>
            </el-col>
            <el-col :xs="24" :md="8">
                <el-card shadow="never" class="metric-card">
                    <template #header>
                        <span>Đơn hàng</span>
                    </template>
                    <ul class="metric-list">
                        <li v-for="item in orderMetrics" :key="item.label">
                            <span>{{ item.label }}</span>
                            <strong>{{ item.value }}</strong>
                        </li>
                    </ul>
                </el-card>
            </el-col>
            <el-col :xs="24" :md="8">
                <el-card shadow="never" class="metric-card">
                    <template #header>
                        <span>Tồn kho & Nhà cung cấp</span>
                    </template>
                    <ul class="metric-list">
                        <li v-for="item in inventoryMetrics" :key="item.label">
                            <span>{{ item.label }}</span>
                            <strong>{{ item.value }}</strong>
                        </li>
                    </ul>
                </el-card>
            </el-col>
        </el-row>

        <el-row :gutter="16">
            <el-col :xs="24" :md="8">
                <el-card shadow="never" class="list-card">
                    <template #header>
                        <span>Top nhân viên</span>
                    </template>
                    <EasyDataTable
                        :headers="staffHeaders"
                        :items="topStaff"
                        table-class-name="data-table"
                        empty-message="Chưa có dữ liệu"
                    >
                        <template #item-orders="{ value }">{{ formatNumber(value ?? 0) }}</template>
                        <template #item-revenue="{ value }">{{ formatCurrency(value ?? 0) }}</template>
                    </EasyDataTable>
                </el-card>
            </el-col>
            <el-col :xs="24" :md="8">
                <el-card shadow="never" class="list-card">
                    <template #header>
                        <span>Top sản phẩm</span>
                    </template>
                    <EasyDataTable
                        :headers="productHeaders"
                        :items="topProducts"
                        table-class-name="data-table"
                        empty-message="Chưa có dữ liệu"
                    >
                        <template #item-quantity="{ value }">{{ formatNumber(value ?? 0) }}</template>
                        <template #item-revenue="{ value }">{{ formatCurrency(value ?? 0) }}</template>
                    </EasyDataTable>
                </el-card>
            </el-col>
            <el-col :xs="24" :md="8">
                <el-card shadow="never" class="list-card">
                    <template #header>
                        <span>Top khách hàng</span>
                    </template>
                    <EasyDataTable
                        :headers="customerHeaders"
                        :items="topCustomers"
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

const revenueMetrics = computed(() => {
    const revenue = props.data.revenue ?? {}
    return [
        { label: 'Hôm nay', value: formatCurrency(revenue.today ?? 0) },
        { label: 'Tháng', value: formatCurrency(revenue.month ?? 0) },
        { label: 'Năm', value: formatCurrency(revenue.year ?? 0) },
        { label: 'Giá trị đơn TB', value: formatCurrency(revenue.averageOrderValue ?? 0) },
        { label: 'Lợi nhuận hôm nay', value: formatCurrency(revenue.todayProfit ?? 0) },
        { label: 'Lợi nhuận tháng', value: formatCurrency(revenue.monthProfit ?? 0) },
    ]
})

const orderMetrics = computed(() => {
    const orders = props.data.orders ?? {}
    return [
        { label: 'Đơn hôm nay', value: formatNumber(orders.today ?? 0) },
        { label: 'Đơn tháng', value: formatNumber(orders.month ?? 0) },
        { label: 'Đơn năm', value: formatNumber(orders.year ?? 0) },
        { label: 'Hủy hôm nay', value: formatNumber(orders.cancelledToday ?? 0) },
        { label: 'Hủy tháng', value: formatNumber(orders.cancelledMonth ?? 0) },
    ]
})

const inventoryMetrics = computed(() => {
    const inventory = props.data.inventory ?? {}
    return [
        { label: 'Nguyên liệu thấp', value: formatNumber(inventory.lowStockItems ?? 0) },
        { label: 'Nhà cung cấp', value: formatNumber(inventory.totalSuppliers ?? 0) },
        { label: 'PO chờ duyệt', value: formatNumber(inventory.pendingPurchaseOrders ?? 0) },
    ]
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
    border-radius: var(--radius-lg);
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
    border-radius: var(--radius-lg);
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
}

.metric-list strong {
    font-weight: var(--font-bold);
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
