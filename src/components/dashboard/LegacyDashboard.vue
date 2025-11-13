<template>
    <div class="legacy-dashboard">
        <div class="page-header">
            <h1 class="page-title">Tổng quan báo cáo</h1>
            <div class="filter-controls">
                <el-radio-group v-model="quickFilter" @change="handleQuickFilter">
                    <el-radio-button label="today">Hôm nay</el-radio-button>
                    <el-radio-button label="week">7 ngày</el-radio-button>
                    <el-radio-button label="month">30 ngày</el-radio-button>
                    <el-radio-button label="custom">Tùy chỉnh</el-radio-button>
                </el-radio-group>
                <div class="date-filters" v-if="quickFilter === 'custom'">
                    <el-date-picker
                        v-model="startDate"
                        type="date"
                        placeholder="Từ ngày"
                        format="DD/MM/YYYY"
                        value-format="YYYY-MM-DD"
                        :clearable="false"
                        @change="fetchDashboardData"
                    />
                    <span class="date-separator">đến</span>
                    <el-date-picker
                        v-model="endDate"
                        type="date"
                        placeholder="Đến ngày"
                        format="DD/MM/YYYY"
                        value-format="YYYY-MM-DD"
                        :clearable="false"
                        @change="fetchDashboardData"
                    />
                </div>
            </div>
        </div>

        <el-row :gutter="20" class="kpi-cards">
            <el-col :xs="24" :md="8">
                <el-card shadow="hover" class="kpi-card">
                    <div class="kpi-content">
                        <div class="kpi-icon gradient-primary">💰</div>
                        <div class="kpi-text">
                            <div class="kpi-title">Tổng doanh thu</div>
                            <div class="kpi-value revenue">{{ formatCurrency(profitStats.totalRevenue) }}</div>
                        </div>
                    </div>
                </el-card>
            </el-col>
            <el-col :xs="24" :md="8">
                <el-card shadow="hover" class="kpi-card">
                    <div class="kpi-content">
                        <div class="kpi-icon gradient-danger">📦</div>
                        <div class="kpi-text">
                            <div class="kpi-title">Tổng chi phí (Giá vốn)</div>
                            <div class="kpi-value cost">{{ formatCurrency(profitStats.totalCostOfGoodsSold) }}</div>
                        </div>
                    </div>
                </el-card>
            </el-col>
            <el-col :xs="24" :md="8">
                <el-card shadow="hover" class="kpi-card">
                    <div class="kpi-content">
                        <div class="kpi-icon gradient-success">📈</div>
                        <div class="kpi-text">
                            <div class="kpi-title">Lợi nhuận</div>
                            <div class="kpi-value profit">{{ formatCurrency(profitStats.totalProfit) }}</div>
                        </div>
                    </div>
                </el-card>
            </el-col>
        </el-row>

        <el-row :gutter="20">
            <el-col :xs="24" :lg="16">
                <el-card class="chart-card" shadow="hover" :loading="loading.revenue">
                    <template #header>
                        <div class="chart-header">
                            <span>Doanh thu theo ngày</span>
                            <el-radio-group v-model="chartType" size="small">
                                <el-radio-button label="line">Đường</el-radio-button>
                                <el-radio-button label="bar">Cột</el-radio-button>
                                <el-radio-button label="area">Area</el-radio-button>
                            </el-radio-group>
                        </div>
                    </template>
                    <div class="chart-container">
                        <LineChart v-if="chartType === 'line' && chartData.revenue.labels.length" :chart-data="chartData.revenue" />
                        <BarChart v-else-if="chartType === 'bar' && chartData.revenue.labels.length" :chart-data="chartData.revenue" />
                        <LineChart v-else-if="chartType === 'area' && chartData.revenue.labels.length" :chart-data="chartDataArea" />
                        <el-empty v-else description="Chưa có dữ liệu" />
                    </div>
                </el-card>
            </el-col>

            <el-col :xs="24" :lg="8">
                <el-card class="chart-card" shadow="hover" :loading="loading.bestSellers">
                    <template #header>
                        <span>Top 5 sản phẩm (doanh thu)</span>
                    </template>
                    <div class="chart-container">
                        <BarChart v-if="chartData.bestSellers.labels.length" :chart-data="chartData.bestSellers" />
                        <el-empty v-else description="Chưa có dữ liệu" />
                    </div>
                </el-card>
            </el-col>
        </el-row>
    </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useToast } from 'vue-toastification'

import { getProfitReport, getRevenueByDateRange, getBestSellers } from '@/api/reportService'
import { getDefaultDateRange, getDateRangeByFilter } from '@/utils/dateHelpers'
import { createBarChartData, createLineChartData } from '@/utils/chartHelpers'
import { formatCurrency, formatDateISO } from '@/utils/formatters'

import LineChart from '@/components/charts/LineChart.vue'
import BarChart from '@/components/charts/BarChart.vue'

const toast = useToast()

const quickFilter = ref('month')
const chartType = ref('line')

const defaultDates = getDefaultDateRange(30)
const startDate = ref(formatDateISO(defaultDates[0]))
const endDate = ref(formatDateISO(defaultDates[1]))

const profitStats = ref({
    totalRevenue: 0,
    totalCostOfGoodsSold: 0,
    totalProfit: 0,
})

const chartData = reactive({
    revenue: { labels: [], datasets: [] },
    bestSellers: { labels: [], datasets: [] },
})

const loading = reactive({
    profit: false,
    revenue: false,
    bestSellers: false,
})

const chartDataArea = computed(() => {
    if (!chartData.revenue.labels.length) {
        return { labels: [], datasets: [] }
    }
    const baseDataset = chartData.revenue.datasets[0]
    if (!baseDataset) {
        return { labels: [], datasets: [] }
    }
    const areaDataset = {
        ...baseDataset,
        fill: true,
        backgroundColor: (baseDataset.backgroundColor || '').replace('0.8)', '0.3)'),
    }
    return {
        labels: chartData.revenue.labels,
        datasets: [areaDataset],
    }
})

function handleQuickFilter() {
    if (quickFilter.value === 'custom') return
    const [start, end] = getDateRangeByFilter(quickFilter.value)
    startDate.value = formatDateISO(start)
    endDate.value = formatDateISO(end)
    fetchDashboardData()
}

function processRevenueData(apiData) {
    const labels = Object.keys(apiData || {})
    const values = Object.values(apiData || {})
    chartData.revenue = createLineChartData(labels, values, 'Doanh thu', { fill: false, tension: 0.1 })
}

function processBestSellerData(items) {
    const list = Array.isArray(items) ? items : []
    chartData.bestSellers = createBarChartData(
        list.map(item => item.productName ?? item.name ?? ''),
        list.map(item => item.totalRevenueGenerated ?? item.totalRevenue ?? item.revenue ?? 0),
        'Doanh thu'
    )
}

async function fetchDashboardData() {
    if (!startDate.value || !endDate.value) return

    const start = formatDateISO(startDate.value)
    const end = formatDateISO(endDate.value)

    loading.profit = true
    try {
        const res = await getProfitReport(start, end)
        profitStats.value = res.data ?? res ?? {
            totalRevenue: 0,
            totalCostOfGoodsSold: 0,
            totalProfit: 0,
        }
    } catch (error) {
        toast.error('Lỗi tải báo cáo lợi nhuận')
    } finally {
        loading.profit = false
    }

    loading.revenue = true
    try {
        const res = await getRevenueByDateRange(start, end)
        processRevenueData(res.data ?? res)
    } catch (error) {
        toast.error('Lỗi tải biểu đồ doanh thu')
    } finally {
        loading.revenue = false
    }

    loading.bestSellers = true
    try {
        const res = await getBestSellers(start, end, 5, 'revenue')
        processBestSellerData(res.data ?? res)
    } catch (error) {
        toast.error('Lỗi tải top sản phẩm')
    } finally {
        loading.bestSellers = false
    }
}

onMounted(() => {
    fetchDashboardData()
})
</script>

<style scoped>
.legacy-dashboard {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.page-header {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 16px;
    align-items: flex-start;
}

.page-title {
    font-size: 1.8rem;
    font-weight: var(--font-semibold);
}

.filter-controls {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 16px;
}

.date-filters {
    display: flex;
    align-items: center;
    gap: 12px;
}

.date-separator {
    font-weight: 600;
    color: var(--gray-600);
}

.kpi-cards {
    margin-bottom: 8px;
}

.kpi-card {
    border-radius: var(--radius-lg);
    transition: transform 0.2s ease;
}

.kpi-card:hover {
    transform: translateY(-4px);
}

.kpi-content {
    display: flex;
    align-items: center;
    gap: 16px;
}

.kpi-icon {
    width: 72px;
    height: 72px;
    border-radius: var(--radius-xl);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
}

.gradient-primary {
    background: linear-gradient(135deg, #4e54c8, #8f94fb);
    color: #fff;
}

.gradient-danger {
    background: linear-gradient(135deg, #ff758c, #ff7eb3);
    color: #fff;
}

.gradient-success {
    background: linear-gradient(135deg, #43cea2, #185a9d);
    color: #fff;
}

.kpi-text {
    flex: 1;
}

.kpi-title {
    font-size: 0.875rem;
    color: var(--gray-600);
    margin-bottom: 8px;
}

.kpi-value {
    font-size: 1.6rem;
    font-weight: var(--font-bold);
}

.kpi-value.revenue {
    color: var(--info-600);
}

.kpi-value.cost {
    color: var(--danger-600);
}

.kpi-value.profit {
    color: var(--success-600);
}

.chart-card {
    border-radius: var(--radius-lg);
}

.chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.chart-container {
    min-height: 320px;
    display: flex;
    align-items: center;
    justify-content: center;
}
</style>
