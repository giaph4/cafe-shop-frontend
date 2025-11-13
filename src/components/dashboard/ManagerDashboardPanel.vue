<template>
    <div class="manager-dashboard-panel">
        <el-row :gutter="16" class="chart-row">
            <el-col :xs="24" :lg="12">
                <el-card shadow="never" class="chart-card">
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
                <el-card shadow="never" class="chart-card">
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
                <el-card shadow="never" class="metric-card">
                    <template #header>
                        <span>Tổng quan ca</span>
                    </template>
                    <ul class="metric-list">
                        <li><span>Lên lịch hôm nay</span><strong>{{ formatNumber(shiftOverview.scheduledToday ?? 0) }}</strong></li>
                        <li><span>Đang diễn ra</span><strong>{{ formatNumber(shiftOverview.inProgress ?? 0) }}</strong></li>
                        <li><span>Hoàn tất</span><strong>{{ formatNumber(shiftOverview.completed ?? 0) }}</strong></li>
                        <li><span>Hủy</span><strong>{{ formatNumber(shiftOverview.cancelled ?? 0) }}</strong></li>
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
                <el-card shadow="never" class="metric-card">
                    <template #header>
                        <span>Hiệu suất đội nhóm</span>
                    </template>
                    <ul class="metric-list">
                        <li><span>Doanh thu</span><strong>{{ formatCurrency(teamPerformance.totalRevenue ?? 0) }}</strong></li>
                        <li><span>Tổng đơn</span><strong>{{ formatNumber(teamPerformance.totalOrders ?? 0) }}</strong></li>
                        <li><span>Giá trị đơn TB</span><strong>{{ formatCurrency(teamPerformance.averageOrderValue ?? 0) }}</strong></li>
                    </ul>
                    <EasyDataTable
                        :headers="teamHeaders"
                        :items="topStaff"
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
                <el-card shadow="never" class="metric-card">
                    <template #header>
                        <span>Tồn kho trọng điểm</span>
                    </template>
                    <ul class="metric-list">
                        <li><span>Hàng thấp</span><strong>{{ formatNumber(inventory.lowStockItems ?? 0) }}</strong></li>
                        <li><span>Hàng nguy cấp</span><strong>{{ formatNumber(inventory.criticalStockItems ?? 0) }}</strong></li>
                    </ul>
                    <EasyDataTable
                        :headers="inventoryHeaders"
                        :items="inventoryAlerts"
                        table-class-name="data-table"
                        empty-message="Không có cảnh báo"
                    >
                        <template #item-quantityOnHand="{ value }">{{ formatNumber(value ?? 0) }}</template>
                        <template #item-reorderLevel="{ value }">{{ formatNumber(value ?? 0) }}</template>
                    </EasyDataTable>
                </el-card>
            </el-col>
            <el-col :xs="24" :lg="12">
                <el-card shadow="never" class="metric-card">
                    <template #header>
                        <span>Payroll & Phê duyệt</span>
                    </template>
                    <ul class="metric-list">
                        <li><span>Payroll ước tính</span><strong>{{ formatCurrency(payroll.estimatedPayroll ?? 0) }}</strong></li>
                        <li><span>Thưởng</span><strong>{{ formatCurrency(payroll.bonusTotal ?? 0) }}</strong></li>
                        <li><span>Phạt</span><strong>{{ formatCurrency(payroll.penaltyTotal ?? 0) }}</strong></li>
                        <li><span>Điều chỉnh</span><strong>{{ formatCurrency(payroll.adjustmentNet ?? 0) }}</strong></li>
                        <li><span>Số nhân viên</span><strong>{{ formatNumber(payroll.staffCount ?? 0) }}</strong></li>
                    </ul>
                    <div class="timeline-wrapper">
                        <p class="section-title">Yêu cầu chờ duyệt</p>
                        <EasyDataTable
                            :headers="approvalHeaders"
                            :items="pendingApprovals"
                            table-class-name="data-table"
                            empty-message="Không có yêu cầu chờ duyệt"
                        />
                    </div>
                </el-card>
            </el-col>
        </el-row>

        <el-row :gutter="16">
            <el-col :xs="24" :lg="12">
                <el-card shadow="never" class="list-card">
                    <template #header>
                        <span>Cảnh báo chấm công</span>
                    </template>
                    <EasyDataTable
                        :headers="attendanceHeaders"
                        :items="attendanceAlerts"
                        table-class-name="data-table"
                        empty-message="Không có cảnh báo"
                    >
                        <template #item-issueType="{ value }">{{ attendanceIssueLabel(value) }}</template>
                    </EasyDataTable>
                </el-card>
            </el-col>
            <el-col :xs="24" :lg="12">
                <el-card shadow="never" class="list-card">
                    <template #header>
                        <span>Sự cố dịch vụ</span>
                    </template>
                    <EasyDataTable
                        :headers="serviceHeaders"
                        :items="serviceIssues"
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
}

.metric-list strong {
    font-weight: var(--font-bold);
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
