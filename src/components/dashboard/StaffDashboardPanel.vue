<template>
    <el-card shadow="never" class="staff-dashboard-panel">
        <template #header>
            <div class="card-header">
                <div>
                    <span class="section-title">{{ title }}</span>
                    <p v-if="subtitle" class="section-subtitle">{{ subtitle }}</p>
                </div>
                <span v-if="lastUpdated" class="updated-at">Cập nhật lúc {{ lastUpdated }}</span>
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
                    <li><span>Ca tuần này</span><strong>{{ formatNumber(data.shiftSummary?.shiftsThisWeek ?? 0) }}</strong></li>
                    <li><span>Hoàn thành</span><strong>{{ formatNumber(data.shiftSummary?.completedShifts ?? 0) }}</strong></li>
                    <li><span>Chờ thực hiện</span><strong>{{ formatNumber(data.shiftSummary?.pendingShifts ?? 0) }}</strong></li>
                    <li><span>Check-in trễ</span><strong>{{ formatNumber(data.shiftSummary?.lateCheckIns ?? 0) }}</strong></li>
                    <li><span>Check-out sớm</span><strong>{{ formatNumber(data.shiftSummary?.earlyCheckOuts ?? 0) }}</strong></li>
                </ul>
            </el-card>

            <el-card shadow="never" class="metric-card">
                <p class="metric-title">Hiệu suất</p>
                <ul class="metric-list">
                    <li><span>Doanh thu</span><strong>{{ formatCurrency(data.performance?.totalRevenue ?? 0) }}</strong></li>
                    <li><span>Tổng đơn</span><strong>{{ formatNumber(data.performance?.totalOrders ?? 0) }}</strong></li>
                    <li><span>Đơn TB</span><strong>{{ formatCurrency(data.performance?.averageOrderValue ?? 0) }}</strong></li>
                    <li><span>Feedback (+)</span><strong>{{ formatNumber(data.performance?.positiveFeedbacks ?? 0) }}</strong></li>
                    <li><span>Feedback (−)</span><strong>{{ formatNumber(data.performance?.negativeFeedbacks ?? 0) }}</strong></li>
                </ul>
            </el-card>

            <el-card shadow="never" class="metric-card">
                <p class="metric-title">Chấm công</p>
                <ul class="metric-list">
                    <li><span>Check-in gần nhất</span><strong>{{ formatDateTimeDisplay(data.attendance?.lastCheckIn) }}</strong></li>
                    <li><span>Check-out gần nhất</span><strong>{{ formatDateTimeDisplay(data.attendance?.lastCheckOut) }}</strong></li>
                    <li><span>Ngày đúng giờ liên tiếp</span><strong>{{ formatNumber(data.attendance?.consecutiveOnTimeDays ?? 0) }}</strong></li>
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
                    <li><span>Chu kỳ hiện tại</span><strong>{{ formatCurrency(data.payroll?.estimatedCurrentCycle ?? 0) }}</strong></li>
                    <li><span>Thưởng</span><strong>{{ formatCurrency(data.payroll?.bonusTotal ?? 0) }}</strong></li>
                    <li><span>Phạt</span><strong>{{ formatCurrency(data.payroll?.penaltyTotal ?? 0) }}</strong></li>
                    <li><span>Điều chỉnh</span><strong>{{ formatCurrency(data.payroll?.adjustmentNet ?? 0) }}</strong></li>
                    <li><span>Chu kỳ trước</span><strong>{{ formatCurrency(data.payroll?.lastCyclePaid ?? 0) }}</strong></li>
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
</script>

<style scoped>
.staff-dashboard-panel {
    border-radius: var(--radius-lg);
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
    border: 1px solid var(--el-border-color);
    border-radius: var(--radius-lg);
    padding: 16px;
}

.chart-container {
    min-height: 220px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.metric-card {
    border-radius: var(--radius-lg);
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
}

.metric-list strong {
    font-weight: var(--font-bold);
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
