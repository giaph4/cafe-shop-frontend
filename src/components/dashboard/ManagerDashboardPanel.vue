<template>
    <div class="manager-dashboard-panel">
        <el-row :gutter="16" class="chart-row">
            <el-col :xs="24" :lg="12">
                <el-card shadow="never" class="chart-card" v-loading="isLoading">
                    <template #header>
                        <span>Phân bổ ca trong tuần</span>
                    </template>
                    <div class="chart-container">
                        <BarChart v-if="hasShiftChart" :chart-data="shiftChartData" />
                        <el-empty v-else description="Chưa có dữ liệu" />
                    </div>
                </el-card>
            </el-col>
            <el-col :xs="24" :lg="12">
                <el-card shadow="never" class="chart-card" v-loading="isLoading">
                    <template #header>
                        <span>Hiệu suất đội nhóm</span>
                    </template>
                    <div class="chart-container">
                        <LineChart v-if="hasTeamChart" :chart-data="teamChartData" />
                        <el-empty v-else description="Chưa có dữ liệu" />
                    </div>
                </el-card>
            </el-col>
        </el-row>

        <el-row :gutter="16">
            <el-col :xs="24" :lg="12">
                <el-card shadow="never" class="metric-card" v-loading="isLoading">
                    <template #header>
                        <span>Tổng quan ca</span>
                    </template>
                    <ul class="metric-list">
                        <li v-for="item in shiftMetrics" :key="item.label" :class="{ 'metric-highlight': item.highlight }">
                            <span>{{ item.label }}</span>
                            <el-tooltip :content="item.tooltip" placement="top">
                                <strong>{{ item.value }}</strong>
                            </el-tooltip>
                        </li>
                    </ul>
                    <div v-if="upcomingShifts.length" class="timeline-wrapper">
                        <p class="section-title">Ca sắp tới</p>
                        <el-timeline>
                            <el-timeline-item
                                v-for="shift in upcomingShifts"
                                :key="shift.shiftId"
                                :timestamp="formatDateDisplay(shift.shiftDate)"
                                placement="top"
                            >
                                <div class="list-item">
                                    <strong>#{{ shift.shiftId }} · {{ shift.timeRange }}</strong>
                                    <p>Trạng thái: {{ shift.status }} · Nhân viên: {{ formatNumber(shift.assignedStaff ?? 0) }}/{{ formatNumber(shift.capacity ?? 0) }}</p>
                                </div>
                            </el-timeline-item>
                        </el-timeline>
                    </div>
                    <el-empty v-else description="Không có ca sắp tới" />
                </el-card>
            </el-col>
            <el-col :xs="24" :lg="12">
                <el-card shadow="never" class="metric-card" v-loading="isLoading">
                    <template #header>
                        <span>Hiệu suất đội nhóm</span>
                    </template>
                    <ul class="metric-list">
                        <li v-for="item in performanceMetrics" :key="item.label" :class="{ 'metric-highlight': item.highlight }">
                            <span>{{ item.label }}</span>
                            <el-tooltip :content="item.tooltip" placement="top">
                                <strong>{{ item.value }}</strong>
                            </el-tooltip>
                        </li>
                    </ul>
                    <EasyDataTable
                        :headers="teamHeaders"
                        :items="topStaff"
                        :loading="isLoading"
                        table-class-name="data-table"
                        empty-message="Chưa có dữ liệu"
                    >
                        <template #item-orders="{ value }">{{ formatNumber(value ?? 0) }}</template>
                        <template #item-revenue="{ value }">{{ formatCurrency(value ?? 0) }}</template>
                        <template #item-averageOrderValue="{ value }">{{ formatCurrency(value ?? 0) }}</template>
                    </EasyDataTable>
                </el-card>
            </el-col>
        </el-row>

        <el-row :gutter="16">
            <el-col :xs="24" :lg="12">
                <el-card shadow="never" class="metric-card" v-loading="isLoading">
                    <template #header>
                        <span>Tồn kho trọng điểm</span>
                    </template>
                    <ul class="metric-list">
                        <li v-for="item in inventoryMetrics" :key="item.label" :class="{ 'metric-highlight': item.highlight }">
                            <span>{{ item.label }}</span>
                            <el-tooltip :content="item.tooltip" placement="top">
                                <strong>{{ item.value }}</strong>
                            </el-tooltip>
                        </li>
                    </ul>
                    <EasyDataTable
                        :headers="inventoryHeaders"
                        :items="inventoryAlerts"
                        :loading="isLoading"
                        table-class-name="data-table"
                        empty-message="Không có cảnh báo"
                    >
                        <template #item-quantityOnHand="{ value }">{{ formatNumber(value ?? 0) }}</template>
                        <template #item-reorderLevel="{ value }">{{ formatNumber(value ?? 0) }}</template>
                    </EasyDataTable>
                </el-card>
            </el-col>
            <el-col :xs="24" :lg="12">
                <el-card shadow="never" class="metric-card" v-loading="isLoading">
                    <template #header>
                        <span>Payroll & Phê duyệt</span>
                    </template>
                    <ul class="metric-list">
                        <li v-for="item in payrollMetrics" :key="item.label" :class="{ 'metric-highlight': item.highlight }">
                            <span>{{ item.label }}</span>
                            <el-tooltip :content="item.tooltip" placement="top">
                                <strong>{{ item.value }}</strong>
                            </el-tooltip>
                        </li>
                    </ul>
                    <div class="timeline-wrapper">
                        <p class="section-title">Yêu cầu chờ duyệt</p>
                        <EasyDataTable
                            :headers="approvalHeaders"
                            :items="pendingApprovals"
                            :loading="isLoading"
                            table-class-name="data-table"
                            empty-message="Không có yêu cầu chờ duyệt"
                        />
                    </div>
                </el-card>
            </el-col>
        </el-row>

        <el-row :gutter="16">
            <el-col :xs="24" :lg="12">
                <el-card shadow="never" class="list-card" v-loading="isLoading">
                    <template #header>
                        <span>Cảnh báo chấm công</span>
                    </template>
                    <EasyDataTable
                        :headers="attendanceHeaders"
                        :items="attendanceAlerts"
                        :loading="isLoading"
                        table-class-name="data-table"
                        empty-message="Không có cảnh báo"
                    >
                        <template #item-issueType="{ value }">{{ attendanceIssueLabel(value) }}</template>
                    </EasyDataTable>
                </el-card>
            </el-col>
            <el-col :xs="24" :lg="12">
                <el-card shadow="never" class="list-card" v-loading="isLoading">
                    <template #header>
                        <span>Sự cố dịch vụ</span>
                    </template>
                    <EasyDataTable
                        :headers="serviceHeaders"
                        :items="serviceIssues"
                        :loading="isLoading"
                        table-class-name="data-table"
                        empty-message="Không có sự cố"
                    >
                        <template #item-orderId="{ value }">{{ formatNumber(value ?? 0) }}</template>
                        <template #item-createdDate="{ value }">{{ formatDateDisplay(value) }}</template>
                    </EasyDataTable>
                </el-card>
            </el-col>
        </el-row>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import EasyDataTable from 'vue3-easy-data-table'
import 'vue3-easy-data-table/dist/style.css'

import LineChart from '@/components/charts/LineChart.vue'
import BarChart from '@/components/charts/BarChart.vue'
import { formatCurrency, formatNumber, formatDateDisplay } from '@/utils/formatters'

const props = defineProps({
    data: {
        type: Object,
        required: true,
    },
    shiftChartData: {
        type: Object,
        default: () => ({ labels: [], datasets: [] }),
    },
    teamChartData: {
        type: Object,
        default: () => ({ labels: [], datasets: [] }),
    },
})

const isLoading = computed(() => !props.data || Object.keys(props.data).length === 0)

const shiftOverview = computed(() => props.data.shiftOverview ?? {})
const upcomingShifts = computed(() => Array.isArray(shiftOverview.value.upcomingShifts) ? shiftOverview.value.upcomingShifts.slice(0, 10) : [])
const teamPerformance = computed(() => props.data.teamPerformance ?? {})
const topStaff = computed(() => Array.isArray(teamPerformance.value.topStaff) ? teamPerformance.value.topStaff.slice(0, 10) : [])
const inventory = computed(() => props.data.inventory ?? {})
const inventoryAlerts = computed(() => Array.isArray(inventory.value.alerts) ? inventory.value.alerts : [])
const payroll = computed(() => props.data.payroll ?? {})
const pendingApprovals = computed(() => Array.isArray(props.data.pendingApprovals) ? props.data.pendingApprovals : [])
const attendanceAlerts = computed(() => Array.isArray(props.data.attendanceAlerts) ? props.data.attendanceAlerts : [])
const serviceIssues = computed(() => Array.isArray(props.data.serviceIssues) ? props.data.serviceIssues : [])

const teamHeaders = [
    { text: 'Nhân viên', value: 'staffName', sortable: true },
    { text: 'Đơn', value: 'orders', sortable: true },
    { text: 'Doanh thu', value: 'revenue', sortable: true },
    { text: 'Đơn TB', value: 'averageOrderValue', sortable: true },
]

const inventoryHeaders = [
    { text: 'Nguyên liệu', value: 'ingredientName', sortable: true },
    { text: 'Tồn', value: 'quantityOnHand', sortable: true },
    { text: 'Mức đặt lại', value: 'reorderLevel', sortable: true },
]

const approvalHeaders = [
    { text: 'Module', value: 'module', sortable: true },
    { text: 'Trạng thái', value: 'status', sortable: true },
    { text: 'Mô tả', value: 'description', sortable: false },
    { text: 'Yêu cầu bởi', value: 'requestedBy', sortable: true },
    { text: 'Thời gian', value: 'requestedAt', sortable: true },
]

const attendanceHeaders = [
    { text: 'Nhân viên', value: 'staffName', sortable: true },
    { text: 'Loại', value: 'issueType', sortable: true },
    { text: 'Ghi chú', value: 'note', sortable: false },
]

const serviceHeaders = [
    { text: 'Đơn', value: 'orderId', sortable: true },
    { text: 'Bàn', value: 'tableName', sortable: true },
    { text: 'Mô tả', value: 'issue', sortable: false },
    { text: 'Ngày', value: 'createdDate', sortable: true },
]

const hasShiftChart = computed(() => (props.shiftChartData?.labels?.length ?? 0) > 0)
const hasTeamChart = computed(() => (props.teamChartData?.labels?.length ?? 0) > 0)

const buildMetric = (label, value, formatter = formatNumber) => ({
    label,
    value: formatter(value ?? 0),
    tooltip: formatter(value ?? 0),
    raw: Number(value ?? 0),
})

const applyHighlight = (metrics) => {
    const maxValue = Math.max(...metrics.map(item => item.raw))
    return metrics.map(item => ({
        ...item,
        highlight: maxValue > 0 && item.raw === maxValue,
    }))
}

const shiftMetrics = computed(() => applyHighlight([
    buildMetric('Lên lịch hôm nay', shiftOverview.value.scheduledToday),
    buildMetric('Đang diễn ra', shiftOverview.value.inProgress),
    buildMetric('Hoàn tất', shiftOverview.value.completed),
    buildMetric('Hủy', shiftOverview.value.cancelled),
]))

const performanceMetrics = computed(() => applyHighlight([
    buildMetric('Doanh thu', teamPerformance.value.totalRevenue, formatCurrency),
    buildMetric('Tổng đơn', teamPerformance.value.totalOrders),
    buildMetric('Giá trị đơn TB', teamPerformance.value.averageOrderValue, formatCurrency),
]))

const inventoryMetrics = computed(() => applyHighlight([
    buildMetric('Hàng thấp', inventory.value.lowStockItems),
    buildMetric('Hàng nguy cấp', inventory.value.criticalStockItems),
]))

const payrollMetrics = computed(() => applyHighlight([
    buildMetric('Payroll ước tính', payroll.value.estimatedPayroll, formatCurrency),
    buildMetric('Thưởng', payroll.value.bonusTotal, formatCurrency),
    buildMetric('Phạt', payroll.value.penaltyTotal, formatCurrency),
    buildMetric('Điều chỉnh', payroll.value.adjustmentNet, formatCurrency),
    buildMetric('Số nhân viên', payroll.value.staffCount),
]))

function attendanceIssueLabel(issue) {
    switch ((issue ?? '').toUpperCase()) {
        case 'NO_CHECK_IN':
            return 'Không check-in'
        case 'LATE_CHECK_IN':
            return 'Check-in trễ'
        case 'EARLY_CHECK_OUT':
            return 'Check-out sớm'
        default:
            return issue ?? 'Không xác định'
    }
}
</script>

<style scoped>
.manager-dashboard-panel {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.chart-row {
    margin-bottom: 12px;
}

.chart-card,
.metric-card,
.list-card {
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
.list-card {
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
    padding: 6px 10px;
    border-radius: 12px;
    transition: background-color 0.2s ease;
}

.metric-list strong {
    font-weight: var(--font-bold);
}

.metric-highlight {
    background: rgba(59, 130, 246, 0.14);
}

.section-title {
    font-weight: var(--font-semibold);
    margin-bottom: 8px;
}

.timeline-wrapper {
    margin-top: 16px;
}

.list-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.list-table {
    width: 100%;
}

.data-table {
    --easy-table-border: none;
    --easy-table-header-font-size: 13px;
    --easy-table-body-font-size: 13px;
}
</style>
