<template>
    <el-card shadow="never" class="staff-dashboard-panel">
        <template #header>
            <div class="card-header">
                <div>
                    <span class="section-title">{{ title }}</span>
                    <p v-if="subtitle" class="section-subtitle">{{ subtitle }}</p>
                </div>
                <el-tooltip v-if="lastUpdated" :content="`Cập nhật lần cuối: ${lastUpdated}`" placement="bottom">
                    <span class="updated-at">Cập nhật lúc {{ lastUpdated }}</span>
                </el-tooltip>
            </div>
        </template>

        <div class="chart-section">
            <p class="section-title">Hiệu suất theo thời gian</p>
            <div class="chart-container">
                <LineChart v-if="hasPerformanceChart" :chart-data="performanceChartData" />
                <el-empty v-else description="Chưa có dữ liệu biểu đồ" />
            </div>
        </div>

        <div class="metric-grid">
            <el-card shadow="never" class="metric-card">
                <p class="metric-title">Tóm tắt ca</p>
                <ul class="metric-list">
                    <li v-for="item in shiftMetrics" :key="item.label" :class="{ 'metric-highlight': item.highlight }">
                        <span>{{ item.label }}</span>
                        <el-tooltip :content="item.tooltip" placement="top">
                            <strong>{{ item.value }}</strong>
                        </el-tooltip>
                    </li>
                </ul>
            </el-card>

            <el-card shadow="never" class="metric-card">
                <p class="metric-title">Hiệu suất</p>
                <ul class="metric-list">
                    <li v-for="item in performanceMetrics" :key="item.label" :class="{ 'metric-highlight': item.highlight }">
                        <span>{{ item.label }}</span>
                        <el-tooltip :content="item.tooltip" placement="top">
                            <strong>{{ item.value }}</strong>
                        </el-tooltip>
                    </li>
                </ul>
            </el-card>

            <el-card shadow="never" class="metric-card">
                <p class="metric-title">Chấm công</p>
                <ul class="metric-list">
                    <li v-for="item in attendanceMetrics" :key="item.label" :class="{ 'metric-highlight': item.highlight }">
                        <span>{{ item.label }}</span>
                        <el-tooltip :content="item.tooltip" placement="top">
                            <strong>{{ item.value }}</strong>
                        </el-tooltip>
                    </li>
                </ul>
                <div class="attendance-status">
                    <el-tag :type="attendanceTagType" effect="light">
                        {{ data.attendance?.currentlyCheckedIn ? 'Đang làm việc' : 'Ngoài ca' }}
                    </el-tag>
                </div>
            </el-card>

            <el-card shadow="never" class="metric-card">
                <p class="metric-title">Payroll</p>
                <ul class="metric-list">
                    <li v-for="item in payrollMetrics" :key="item.label" :class="{ 'metric-highlight': item.highlight }">
                        <span>{{ item.label }}</span>
                        <el-tooltip :content="item.tooltip" placement="top">
                            <strong>{{ item.value }}</strong>
                        </el-tooltip>
                    </li>
                </ul>
            </el-card>
        </div>

        <div class="secondary-grid">
            <div>
                <p class="block-title">Ca sắp tới</p>
                <el-timeline v-if="(data.upcomingShifts ?? []).length">
                    <el-timeline-item
                        v-for="shift in data.upcomingShifts"
                        :key="shift.assignmentId"
                        :timestamp="formatDateDisplay(shift.shiftDate)"
                        placement="top"
                    >
                        <div class="timeline-item">
                            <strong>{{ shift.timeRange }} · {{ shift.role }}</strong>
                            <p>Trạng thái: {{ shift.status }}</p>
                            <small v-if="shift.managerNote">Ghi chú: {{ shift.managerNote }}</small>
                        </div>
                    </el-timeline-item>
                </el-timeline>
                <el-empty v-else description="Không có ca sắp tới" />
            </div>

            <div>
                <p class="block-title">Nhắc việc</p>
                <div v-if="(data.taskReminders ?? []).length" class="alert-stack">
                    <el-alert
                        v-for="(task, index) in data.taskReminders"
                        :key="index"
                        type="info"
                        :title="task.title ?? task"
                        :description="task.description ?? ''"
                        :closable="false"
                    />
                </div>
                <el-empty v-else description="Không có nhắc việc" />
            </div>

            <div>
                <p class="block-title">Thông báo</p>
                <div v-if="(data.announcements ?? []).length" class="alert-stack">
                    <el-alert
                        v-for="(note, index) in data.announcements"
                        :key="index"
                        type="primary"
                        :title="note.title ?? note"
                        :description="note.content ?? ''"
                        :closable="false"
                    />
                </div>
                <el-empty v-else description="Không có thông báo" />
            </div>
        </div>
    </el-card>
</template>

<script setup>
import { computed } from 'vue'
import LineChart from '@/components/charts/LineChart.vue'
import { formatCurrency, formatNumber, formatDateDisplay, formatDateTimeDisplay } from '@/utils/formatters'

const props = defineProps({
    data: {
        type: Object,
        required: true,
    },
    title: {
        type: String,
        default: 'Dashboard nhân viên',
    },
    subtitle: {
        type: String,
        default: '',
    },
    lastUpdated: {
        type: String,
        default: '',
    },
    performanceChartData: {
        type: Object,
        default: () => ({ labels: [], datasets: [] }),
    },
})

const attendanceTagType = computed(() => (props.data.attendance?.currentlyCheckedIn ? 'success' : 'info'))
const hasPerformanceChart = computed(() => (props.performanceChartData?.labels?.length ?? 0) > 0)

const isLoading = computed(() => !props.data || Object.keys(props.data).length === 0)

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
    buildMetric('Ca tuần này', props.data.shiftSummary?.shiftsThisWeek),
    buildMetric('Hoàn thành', props.data.shiftSummary?.completedShifts),
    buildMetric('Chờ thực hiện', props.data.shiftSummary?.pendingShifts),
    buildMetric('Check-in trễ', props.data.shiftSummary?.lateCheckIns),
    buildMetric('Check-out sớm', props.data.shiftSummary?.earlyCheckOuts),
]))

const performanceMetrics = computed(() => applyHighlight([
    buildMetric('Doanh thu', props.data.performance?.totalRevenue, formatCurrency),
    buildMetric('Tổng đơn', props.data.performance?.totalOrders),
    buildMetric('Đơn TB', props.data.performance?.averageOrderValue, formatCurrency),
    buildMetric('Feedback (+)', props.data.performance?.positiveFeedbacks),
    buildMetric('Feedback (−)', props.data.performance?.negativeFeedbacks),
]))

const attendanceMetrics = computed(() => applyHighlight([
    buildMetric('Check-in gần nhất', props.data.attendance?.lastCheckIn, formatDateTimeDisplay),
    buildMetric('Check-out gần nhất', props.data.attendance?.lastCheckOut, formatDateTimeDisplay),
    buildMetric('Ngày đúng giờ liên tiếp', props.data.attendance?.consecutiveOnTimeDays),
]))

const payrollMetrics = computed(() => applyHighlight([
    buildMetric('Chu kỳ hiện tại', props.data.payroll?.estimatedCurrentCycle, formatCurrency),
    buildMetric('Thưởng', props.data.payroll?.bonusTotal, formatCurrency),
    buildMetric('Phạt', props.data.payroll?.penaltyTotal, formatCurrency),
    buildMetric('Điều chỉnh', props.data.payroll?.adjustmentNet, formatCurrency),
    buildMetric('Chu kỳ trước', props.data.payroll?.lastCyclePaid, formatCurrency),
]))
</script>

<style scoped>
.staff-dashboard-panel {
    border-radius: 20px;
    border: 1px solid var(--app-border-color);
    background: var(--app-surface-muted);
    box-shadow: var(--card-shadow, 0 6px 24px rgba(15, 23, 42, 0.08));
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
}

.section-title {
    font-size: 1.25rem;
    font-weight: var(--font-semibold);
}

.section-subtitle {
    margin-top: 4px;
    color: var(--gray-600);
}

.updated-at {
    font-size: 0.85rem;
    color: var(--gray-600);
}

.metric-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 16px;
}

.chart-section {
    border: 1px solid var(--app-border-color);
    border-radius: 20px;
    padding: 16px;
    background: var(--app-surface-muted);
    box-shadow: var(--card-shadow, 0 4px 18px rgba(15, 23, 42, 0.06));
}

.chart-container {
    min-height: 220px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.metric-card {
    border-radius: 20px;
    border: 1px solid var(--app-border-color);
    background: var(--app-surface-muted);
    box-shadow: var(--card-shadow, 0 4px 18px rgba(15, 23, 42, 0.06));
}

.metric-title {
    font-weight: var(--font-semibold);
    margin-bottom: 12px;
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
    background: rgba(99, 102, 241, 0.14);
}

.attendance-status {
    margin-top: 12px;
}

.secondary-grid {
    margin-top: 24px;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 16px;
}

.block-title {
    font-weight: var(--font-semibold);
    margin-bottom: 8px;
}

.timeline-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.alert-stack {
    display: grid;
    gap: 12px;
}
</style>
