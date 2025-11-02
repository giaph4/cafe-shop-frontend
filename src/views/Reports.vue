<template>
    <div class="app-page-container">
        <div class="page-header">
            <h1 class="page-title">Trung tâm Báo cáo</h1>
            <el-date-picker v-model="dateRange" type="daterange" range-separator="Đến" start-placeholder="Ngày bắt đầu"
                end-placeholder="Ngày kết thúc" @change="fetchAllReports" :clearable="false" size="large" />
        </div>

        <el-tabs v-model="activeTab" class="report-tabs">

            <el-tab-pane label="Doanh thu & Lợi nhuận" name="revenue">
                <el-row :gutter="20" class="kpi-cards" v-loading="loading.profit">
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
                                    <div class="kpi-title">Tổng Giá vốn (COGS)</div>
                                    <div class="kpi-value cost">{{ formatCurrency(profitStats.totalCostOfGoodsSold) }}
                                    </div>
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
                            <template #header><span>Doanh thu theo ngày</span></template>
                            <div class="chart-container">
                                <LineChart v-if="chartData.revenue.labels.length" :chartData="chartData.revenue" />
                            </div>
                        </el-card>
                    </el-col>
                    <el-col :span="8">
                        <el-card class="box-card chart-card" v-loading="loading.bestSellers">
                            <template #header><span>Top 5 Sản phẩm (Theo Doanh thu)</span></template>
                            <div class="chart-container">
                                <BarChart v-if="chartData.bestSellers.labels.length"
                                    :chartData="chartData.bestSellers" />
                            </div>
                        </el-card>
                    </el-col>
                </el-row>
            </el-tab-pane>

            <el-tab-pane label="Chi phí" name="expenses">
                <el-card class="box-card chart-card" v-loading="loading.expenses">
                    <template #header><span>Chi phí theo ngày (Cột chồng)</span></template>
                    <div class="chart-container" style="height: 500px;">
                        <StackedBarChart v-if="chartData.expenses.labels.length" :chartData="chartData.expenses" />
                    </div>
                </el-card>
            </el-tab-pane>

            <el-tab-pane label="Tồn kho" name="inventory">
                <el-card class="box-card" v-loading="loading.inventory">
                    <template #header>
                        <div class="d-flex justify-content-between align-items-center">
                            <span>Báo cáo Tồn kho</span>
                            <el-switch v-model="lowStockOnly" @change="fetchInventoryData" size="large"
                                active-text="Chỉ hiển thị hàng sắp hết" />
                        </div>
                    </template>
                    <el-table :data="inventory" style="width: 100%" border :row-class-name="inventoryRowClass">
                        <el-table-column type="index" label="#" width="50" />
                        <el-table-column prop="name" label="Tên Nguyên vật liệu" sortable />
                        <el-table-column prop="quantityOnHand" label="Tồn kho" sortable align="center" />
                        <el-table-column prop="unit" label="Đơn vị" width="100" align="center" />
                        <el-table-column prop="reorderLevel" label="Ngưỡng cảnh báo" sortable align="center" />
                    </el-table>
                </el-card>
            </el-tab-pane>

            <el-tab-pane label="Xuất Excel" name="export">
                <el-card class="box-card" style="width: 500px; margin: 0 auto; text-align: center;">
                    <template #header><span>Xuất Báo cáo Đơn hàng</span></template>
                    <p>Chọn khoảng thời gian bạn muốn xuất file Excel.</p>
                    <el-date-picker v-model="exportDateRange" type="daterange" range-separator="Đến"
                        start-placeholder="Từ ngày" end-placeholder="Đến ngày" class="w-100"
                        style="margin-bottom: 20px;" />
                    <el-button type="success" size="large" @click="handleExportExcel" :loading="loading.exporting"
                        class="w-100">
                        <el-icon style="margin-right: 8px;">
                            <Download />
                        </el-icon>
                        Tải xuống file Excel
                    </el-button>
                </el-card>
            </el-tab-pane>

        </el-tabs>
    </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { useToast } from 'vue-toastification'
import { saveAs } from 'file-saver' // Import thư viện mới
import { Download } from '@element-plus/icons-vue'
import {
    getProfitReport,
    getRevenueByDateRange,
    getBestSellers,
    getExpensesByDateRange,
    getInventoryReport,
    exportOrdersToExcel
} from '@/api/reportService.js'
import { formatCurrency, formatDateISO, formatStackedBarChartData } from '@/utils/formatters.js'

// Import components biểu đồ
import LineChart from '@/components/charts/LineChart.vue'
import BarChart from '@/components/charts/BarChart.vue'
import StackedBarChart from '@/components/charts/StackedBarChart.vue' // (MỚI)

const toast = useToast()
const activeTab = ref('revenue')

// --- State cho Bộ lọc Ngày (Chung) ---
const defaultDateRange = () => {
    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - 29) // Mặc định 30 ngày
    return [start, end]
}
const dateRange = ref(defaultDateRange())

// --- State cho Dữ liệu ---
const profitStats = ref({ totalRevenue: 0, totalCostOfGoodsSold: 0, totalProfit: 0 })
const inventory = ref([])
const lowStockOnly = ref(false)
const exportDateRange = ref(defaultDateRange())
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
    inventory: false,
    exporting: false,
})

// --- Hàm xử lý Data cho Biểu đồ (Copy từ Dashboard.vue) ---
const processRevenueData = (apiData) => {
    chartData.revenue = {
        labels: Object.keys(apiData),
        datasets: [{
            label: 'Doanh thu',
            backgroundColor: 'rgba(64, 158, 255, 0.2)',
            borderColor: '#409EFF',
            tension: 0.1,
            fill: true,
            data: Object.values(apiData),
        }],
    }
}
const processBestSellerData = (apiData) => {
    chartData.bestSellers = {
        labels: apiData.map(item => item.productName),
        datasets: [{
            label: 'Doanh thu',
            backgroundColor: ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399'],
            data: apiData.map(item => item.totalRevenueGenerated),
        }],
    }
}

// --- Hàm Fetch Dữ liệu (Tất cả) ---
const fetchAllReports = async () => {
    if (!dateRange.value || dateRange.value.length < 2) return;
    const [start, end] = dateRange.value.map(date => formatDateISO(date))

    // 1. Fetch Profit (KPIs)
    loading.profit = true
    getProfitReport(start, end)
        .then(res => { profitStats.value = res.data })
        .catch(() => toast.error('Lỗi tải báo cáo lợi nhuận'))
        .finally(() => { loading.profit = false })

    // 2. Fetch Revenue by Date (Line Chart)
    loading.revenue = true
    getRevenueByDateRange(start, end)
        .then(res => { processRevenueData(res.data) })
        .catch(() => toast.error('Lỗi tải biểu đồ doanh thu'))
        .finally(() => { loading.revenue = false })

    // 3. Fetch Best Sellers (Bar Chart)
    loading.bestSellers = true
    getBestSellers(start, end, 5, 'revenue')
        .then(res => { processBestSellerData(res.data) })
        .catch(() => toast.error('Lỗi tải top sản phẩm'))
        .finally(() => { loading.bestSellers = false })

    // 4. Fetch Expenses by Date (Stacked Bar Chart)
    loading.expenses = true
    getExpensesByDateRange(start, end)
        .then(res => { chartData.expenses = formatStackedBarChartData(res.data) })
        .catch(() => toast.error('Lỗi tải biểu đồ chi phí'))
        .finally(() => { loading.expenses = false })
}

// --- Hàm Fetch Tồn kho (Riêng vì không phụ thuộc ngày) ---
const fetchInventoryData = async () => {
    loading.inventory = true
    try {
        // API: GET /api/v1/reports/inventory
        const response = await getInventoryReport(lowStockOnly.value)
        inventory.value = response.data
    } catch (error) {
        toast.error('Lỗi khi tải báo cáo tồn kho')
    } finally {
        loading.inventory = false
    }
}

// --- Xử lý Xuất Excel ---
const handleExportExcel = async () => {
    if (!exportDateRange.value || exportDateRange.value.length < 2) {
        toast.error('Vui lòng chọn khoảng ngày để xuất file.')
        return
    }

    const [start, end] = exportDateRange.value.map(date => formatDateISO(date))
    loading.exporting = true

    try {
        // API: GET /api/v1/reports/orders/export
        const response = await exportOrdersToExcel(start, end)

        // Tạo tên file
        const filename = `Orders_${start}_to_${end}.xlsx`
        // Dùng file-saver để tải file blob
        saveAs(new Blob([response.data]), filename)

    } catch (error) {
        toast.error('Lỗi khi xuất file Excel.')
    } finally {
        loading.exporting = false
    }
}

// --- Tô màu hàng Tồn kho ---
const inventoryRowClass = (row) => {
    if (row.quantityOnHand <= row.reorderLevel) {
        return 'row-danger'
    }
    return ''
}

// --- Tải dữ liệu khi trang được mở ---
onMounted(() => {
    fetchAllReports()
    fetchInventoryData()
})
</script>

<style scoped>
.app-page-container {
    padding: 20px;
}

.report-tabs {
    margin-top: 20px;
}

.kpi-cards {
    margin-bottom: 20px;
}

/* (Các style KPI copy từ Dashboard) */
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

.w-100 {
    width: 100%;
}
</style>

<style>
/* Style chung (không scoped) để tô màu hàng tồn kho */
.el-table .row-danger {
    --el-table-tr-bg-color: var(--el-color-danger-light-9);
}

.el-table .row-danger:hover>td {
    background-color: var(--el-color-danger-light-8) !important;
}
</style>