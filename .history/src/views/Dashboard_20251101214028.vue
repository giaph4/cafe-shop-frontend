<template>
    <div class="dashboard-container">
        <el-card class="box-card filter-card">
            <div class="d-flex justify-content-between align-items-center">
                <span class="page-title">Tổng quan Báo cáo</span>
                <el-date-picker v-model="dateRange" type="daterange" range-separator="Đến"
                    start-placeholder="Ngày bắt đầu" end-placeholder="Ngày kết thúc" @change="fetchDashboardData"
                    :clearable="false" />
            </div>
        </el-card>

        <el-row :gutter="20" class="kpi-cards">
            <el-col :span="8">
                <el-card shadow="hover">
                    <div class="kpi-content">
                        <div class="kpi-text">
                            <div class="kpi-title">Tổng Doanh thu</div>
                            <div class="kpi-value revenue">{{ formatCurrency(profitStats.totalRevenue) }}</div>
                        </div>
                    </div>
                </el-card>
            </el-col>
            <el-col :span="8">
                <el-card shadow="hover">
                    <div class="kpi-content">
                        <div class="kpi-text">
                            <div class="kpi-title">Tổng Chi phí (Giá vốn)</div>
                            <div class="kpi-value cost">{{ formatCurrency(profitStats.totalCostOfGoodsSold) }}</div>
                        </div>
                    </div>
                </el-card>
            </el-col>
            <el-col :span="8">
                <el-card shadow="hover">
                    <div class="kpi-content">
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
                <el-card class="box-card chart-card" v-loading="loading.revenue">
                    <template #header>
                        <span>Doanh thu theo ngày</span>
                    </template>
                    <div class="chart-container">
                        <LineChart v-if="chartData.revenue.labels.length" :chartData="chartData.revenue" />
                    </div>
                </el-card>
            </el-col>

            <el-col :span="8">
                <el-card class="box-card chart-card" v-loading="loading.bestSellers">
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
import { ref, onMounted, reactive } from 'vue'
import {
    getProfitReport,
    getRevenueByDateRange,
    getBestSellers,
    getExpensesByDateRange
} from '@/api/reportService'
import { formatCurrency, formatDateISO } from '@/utils/formatters'
import { useToast } from 'vue-toastification'

// Import components biểu đồ
import LineChart from '@/components/charts/LineChart.vue'
import BarChart from '/components/charts/BarChart.vue'
// import PieChart from '@/components/charts/PieChart.vue'

const toast = useToast()

// --- State cho Bộ lọc Ngày ---
const defaultDateRange = () => {
    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - 29) // Mặc định 30 ngày
    return [start, end]
}
const dateRange = ref(defaultDateRange())

// --- State cho Thẻ KPI ---
const profitStats = ref({
    totalRevenue: 0,
    totalCostOfGoodsSold: 0,
    totalProfit: 0,
})

// --- State cho Biểu đồ ---
const chartData = reactive({
    revenue: { labels: [], datasets: [] },
    bestSellers: { labels: [], datasets: [] },
    expenses: { labels: [], datasets: [] },
})

// --- State Tải (Loading) ---
const loading = reactive({
    profit: false,
    revenue: false,
    bestSellers: false,
    expenses: false,
})

// --- Hàm xử lý Data cho Biểu đồ Doanh thu (Line) ---
const processRevenueData = (apiData) => {
    const labels = Object.keys(apiData)
    const data = Object.values(apiData)

    chartData.revenue = {
        labels: labels,
        datasets: [
            {
                label: 'Doanh thu',
                backgroundColor: 'rgba(64, 158, 255, 0.2)',
                borderColor: '#409EFF',
                tension: 0.1,
                fill: true,
                data: data,
            },
        ],
    }
}

// --- Hàm xử lý Data cho Biểu đồ Bán chạy (Bar) ---
const processBestSellerData = (apiData) => {
    const labels = apiData.map(item => item.productName)
    const data = apiData.map(item => item.totalRevenueGenerated)

    chartData.bestSellers = {
        labels: labels,
        datasets: [
            {
                label: 'Doanh thu',
                backgroundColor: ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399'],
                data: data,
            },
        ],
    }
}

// --- Hàm Fetch Dữ liệu ---
const fetchDashboardData = async () => {
    if (!dateRange.value || dateRange.value.length < 2) {
        return;
    }

    const [start, end] = dateRange.value.map(date => formatDateISO(date))

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

// --- Tải dữ liệu khi component được mounted ---
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

.kpi-cards {
    margin-bottom: 20px;
}

.kpi-content {
    display: flex;
    align-items: center;
}

.kpi-text {
    flex: 1;
}

.kpi-title {
    font-size: 0.9rem;
    color: #909399;
    margin-bottom: 5px;
}

.kpi-value {
    font-size: 1.5rem;
    font-weight: 700;
}

.kpi-value.revenue {
    color: #409EFF;
}

.kpi-value.cost {
    color: #F56C6C;
}

.kpi-value.profit {
    color: #67C23A;
}

.chart-card {
    height: 450px;
}

.chart-container {
    position: relative;
    height: 350px;
}
</style>