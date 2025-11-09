<template>
    <div class="app-page-container">
        <div class="page-header">
            <h1 class="page-title">Tổng quan Báo cáo</h1>
            <div class="filter-controls">
                    <el-radio-group v-model="quickFilter" @change="handleQuickFilter" size="default">
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
                            @change="fetchDashboardData"
                            :clearable="false"
                            format="DD/MM/YYYY"
                            value-format="YYYY-MM-DD"
                        />
                        <span class="date-separator">đến</span>
                        <el-date-picker
                            v-model="endDate"
                            type="date"
                            placeholder="Đến ngày"
                            @change="fetchDashboardData"
                            :clearable="false"
                            format="DD/MM/YYYY"
                            value-format="YYYY-MM-DD"
                        />
                    </div>
            </div>
        </div>

        <el-row :gutter="20" class="kpi-cards">
            <el-col :span="8" class="animate__animated animate__fadeInUp stagger-item">
                <el-card shadow="hover" class="kpi-card hover-lift">
                    <div class="kpi-content">
                        <div class="kpi-icon gradient-primary">
                            💰
                        </div>
                        <div class="kpi-text">
                            <div class="kpi-title">Tổng Doanh thu</div>
                            <div class="kpi-value revenue">{{ formatCurrency(profitStats.totalRevenue) }}</div>
                        </div>
                    </div>
                </el-card>
            </el-col>
            <el-col :span="8" class="animate__animated animate__fadeInUp stagger-item">
                <el-card shadow="hover" class="kpi-card hover-lift">
                    <div class="kpi-content">
                        <div class="kpi-icon gradient-danger">
                            📦
                        </div>
                        <div class="kpi-text">
                            <div class="kpi-title">Tổng Chi phí (Giá vốn)</div>
                            <div class="kpi-value cost">{{ formatCurrency(profitStats.totalCostOfGoodsSold) }}</div>
                        </div>
                    </div>
                </el-card>
            </el-col>
            <el-col :span="8" class="animate__animated animate__fadeInUp stagger-item">
                <el-card shadow="hover" class="kpi-card hover-lift">
                    <div class="kpi-content">
                        <div class="kpi-icon gradient-success">
                            📈
                        </div>
                        <div class="kpi-text">
                            <div class="kpi-title">Lợi nhuận</div>
                            <div class="kpi-value profit">{{ formatCurrency(profitStats.totalProfit) }}</div>
                        </div>
                    </div>
                </el-card>
            </el-col>
        </el-row>

        <el-row :gutter="20">
            <el-col :span="16">
                <el-card class="box-card chart-card" v-loading="loading.revenue" data-aos="fade-right" data-aos-delay="200">
                    <template #header>
                        <div class="chart-header">
                            <span>Doanh thu theo ngày</span>
                            <el-radio-group v-model="chartType" size="small">
                                <el-radio-button label="line">Line</el-radio-button>
                                <el-radio-button label="bar">Bar</el-radio-button>
                                <el-radio-button label="area">Area</el-radio-button>
                            </el-radio-group>
                        </div>
                    </template>
                    <div class="chart-container">
                        <LineChart v-if="chartType === 'line' && chartData.revenue.labels.length" :chartData="chartData.revenue" />
                        <BarChart v-if="chartType === 'bar' && chartData.revenue.labels.length" :chartData="chartData.revenue" />
                        <LineChart v-if="chartType === 'area' && chartData.revenue.labels.length" :chartData="chartDataArea" />
                    </div>
                </el-card>
            </el-col>

            <el-col :span="8">
                <el-card class="box-card chart-card" v-loading="loading.bestSellers" data-aos="fade-left" data-aos-delay="300">
                    <template #header>
                        <span>Top 5 Sản phẩm (Theo Doanh thu)</span>
                    </template>
                    <div class="chart-container">
                        <BarChart v-if="chartData.bestSellers.labels.length" :chartData="chartData.bestSellers" />
                    </div>
                </el-card>
            </el-col>
        </el-row>

    </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { getProfitReport, getRevenueByDateRange, getBestSellers } from '@/api/reportService'
import { formatCurrency, formatDateISO } from '@/utils/formatters'
import { useToast } from 'vue-toastification'
import { getDefaultDateRange, getDateRangeByFilter } from '@/utils/dateHelpers'
import { createBarChartData, createLineChartData } from '@/utils/chartHelpers'

import LineChart from '@/components/charts/LineChart.vue'
import BarChart from '@/components/charts/BarChart.vue'

const toast = useToast()

const quickFilter = ref('month')
const chartType = ref('line')

const defaultDates = getDefaultDateRange(30)
const startDate = ref(formatDateISO(defaultDates[0]))
const endDate = ref(formatDateISO(defaultDates[1]))

const handleQuickFilter = () => {
    if (quickFilter.value === 'custom') return
    
    const [start, end] = getDateRangeByFilter(quickFilter.value)
    startDate.value = formatDateISO(start)
    endDate.value = formatDateISO(end)
    fetchDashboardData()
}

const profitStats = ref({
    totalRevenue: 0,
    totalCostOfGoodsSold: 0,
    totalProfit: 0,
})

const chartData = reactive({
    revenue: { labels: [], datasets: [] },
    bestSellers: { labels: [], datasets: [] },
    expenses: { labels: [], datasets: [] },
})

const loading = reactive({
    profit: false,
    revenue: false,
    bestSellers: false,
    expenses: false,
})

const chartDataArea = computed(() => {
    if (!chartData.revenue.labels.length) return { labels: [], datasets: [] }

    const data = createLineChartData(
        chartData.revenue.labels,
        chartData.revenue.datasets[0]?.data || [],
        'Doanh thu',
        { fill: true, tension: 0.4 }
    )
    
    // Make background more transparent for area chart
    data.datasets[0].backgroundColor = data.datasets[0].backgroundColor.replace('0.8)', '0.3)')
    
    return data
})

const processRevenueData = (apiData) => {
    chartData.revenue = createLineChartData(
        Object.keys(apiData),
        Object.values(apiData),
        'Doanh thu',
        { fill: false, tension: 0.1 }
    )
}

const processBestSellerData = (apiData) => {
    chartData.bestSellers = createBarChartData(
        apiData.map(item => item.productName),
        apiData.map(item => item.totalRevenueGenerated),
        'Doanh thu'
    )
}

const fetchDashboardData = async () => {
    if (!startDate.value || !endDate.value) {
        return;
    }

    const start = formatDateISO(startDate.value)
    const end = formatDateISO(endDate.value)

    // 1. Fetch Profit (KPIs)
    loading.profit = true
    try {
        const res = await getProfitReport(start, end)
        profitStats.value = res.data
    } catch (err) {
        toast.error('Lỗi tải báo cáo lợi nhuận')
    } finally {
        loading.profit = false
    }

    // 2. Fetch Revenue by Date (Line Chart)
    loading.revenue = true
    try {
        const res = await getRevenueByDateRange(start, end)
        processRevenueData(res.data)
    } catch (err) {
        toast.error('Lỗi tải biểu đồ doanh thu')
    } finally {
        loading.revenue = false
    }

    // 3. Fetch Best Sellers (Bar Chart)
    loading.bestSellers = true
    try {
        const res = await getBestSellers(start, end, 5, 'revenue')
        processBestSellerData(res.data)
    } catch (err) {
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
/* Thêm padding cho nội dung trang Dashboard */
.dashboard-container {
    padding: 20px;
}

.filter-card {
    margin-bottom: 20px;
}

.filter-controls {
    display: flex;
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
    color: #757575;
}

.chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
}

.kpi-cards {
    margin-bottom: 20px;
}

.kpi-card {
    transition: all 0.3s ease;
    border-radius: var(--radius-lg);
    overflow: hidden;
}

.kpi-content {
    display: flex;
    align-items: center;
    gap: var(--space-4);
}

.kpi-icon {
    width: 80px;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2.5rem;
    border-radius: var(--radius-xl);
    flex-shrink: 0;
}

.kpi-text {
    flex: 1;
}

.kpi-title {
    font-size: 0.875rem;
    color: var(--gray-600);
    font-weight: var(--font-medium);
    margin-bottom: var(--space-2);
}

.kpi-value {
    font-size: 1.75rem;
    font-weight: var(--font-bold);
    margin-bottom: var(--space-1);
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
    height: 450px;
}

.chart-container {
    position: relative;
    height: 350px;
}

.date-filters {
    display: flex;
    align-items: center;
    gap: 12px;
}

.date-separator {
    font-weight: 600;
    color: #757575;
    padding: 0 8px;
}
</style>
