<template>
    <div class="app-page-container">
        <div class="page-header">
            <h1 class="page-title">Trung tâm Báo cáo</h1>
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
                        @change="fetchAllReports"
                        :clearable="false"
                        format="DD/MM/YYYY"
                        value-format="YYYY-MM-DD"
                    />
                    <span class="date-separator">đến</span>
                    <el-date-picker
                        v-model="endDate"
                        type="date"
                        placeholder="Đến ngày"
                        @change="fetchAllReports"
                        :clearable="false"
                        format="DD/MM/YYYY"
                        value-format="YYYY-MM-DD"
                    />
                </div>
            </div>
        </div>

        <el-tabs v-model="activeTab" class="report-tabs animate__animated animate__fadeInUp stagger-item">

            <el-tab-pane label="📊 Tổng quan" name="revenue">
                <el-alert type="info" :closable="false" style="margin-bottom: 20px;">
                    <template #title>
                        <strong>Hướng dẫn:</strong> Tab này hiển thị tổng quan về doanh thu, lợi nhuận và các chỉ số
                        kinh doanh quan trọng trong khoảng thời gian đã chọn.
                    </template>
                </el-alert>

                <el-row :gutter="20" class="kpi-cards" v-loading="loading.profit || loading.financialTotals">
                    <el-col :span="8">
                        <el-card shadow="hover" class="kpi-card">
                            <div class="kpi-content">
                                <div class="kpi-icon revenue-icon">💰</div>
                                <div class="kpi-text">
                                    <div class="kpi-title">Tổng Doanh thu</div>
                                    <div class="kpi-value revenue">{{ formatCurrency(profitStats.totalRevenue) }}</div>
                                    <div class="kpi-desc">Tổng tiền thu được từ bán hàng</div>
                                </div>
                            </div>
                        </el-card>
                    </el-col>
                    <el-col :span="8">
                        <el-card shadow="hover" class="kpi-card">
                            <div class="kpi-content">
                                <div class="kpi-icon cost-icon">📦</div>
                                <div class="kpi-text">
                                    <div class="kpi-title">Giá vốn hàng bán</div>
                                    <div class="kpi-value cost">{{
                                            formatCurrency(profitStats.totalCostOfGoodsSold)
                                        }}
                                    </div>
                                    <div class="kpi-desc">Chưa tính chi phí và tiền nguyên vật liệu</div>
                                </div>
                            </div>
                        </el-card>
                    </el-col>
                    <el-col :span="8">
                        <el-card shadow="hover" class="kpi-card">
                            <div class="kpi-content">
                                <div class="kpi-icon profit-icon">📈</div>
                                <div class="kpi-text">
                                    <div class="kpi-title">Lợi nhuận gộp</div>
                                    <div class="kpi-value profit">{{ formatCurrency(profitStats.totalProfit) }}</div>
                                    <div class="kpi-desc">Doanh thu - Giá vốn</div>
                                </div>
                            </div>
                        </el-card>
                    </el-col>
                    <el-col :span="8">
                        <el-card shadow="hover" class="kpi-card">
                            <div class="kpi-content">
                                <div class="kpi-icon expense-icon">🧾</div>
                                <div class="kpi-text">
                                    <div class="kpi-title">Tổng Chi phí vận hành</div>
                                    <div class="kpi-value expense">{{ formatCurrency(totalExpenses) }}</div>
                                    <div class="kpi-desc">Bao gồm lương, thuê mặt bằng, marketing...</div>
                                </div>
                            </div>
                        </el-card>
                    </el-col>
                    <el-col :span="8">
                        <el-card shadow="hover" class="kpi-card">
                            <div class="kpi-content">
                                <div class="kpi-icon import-icon">🚚</div>
                                <div class="kpi-text">
                                    <div class="kpi-title">Chi phí nhập nguyên liệu</div>
                                    <div class="kpi-value import">{{
                                            formatCurrency(totalImportedIngredientCost)
                                        }}
                                    </div>
                                    <div class="kpi-desc">Các đơn nhập kho đã hoàn tất</div>
                                </div>
                            </div>
                        </el-card>
                    </el-col>
                    <el-col :span="8">
                        <el-card shadow="hover" class="kpi-card">
                            <div class="kpi-content">
                                <div class="kpi-icon margin-icon">📊</div>
                                <div class="kpi-text">
                                    <div class="kpi-title">Tỷ suất lợi nhuận</div>
                                    <div class="kpi-value margin">{{ profitMarginDisplay }}</div>
                                    <div class="kpi-desc">Sau khi trừ chi phí vận hành & nhập nguyên liệu</div>
                                </div>
                            </div>
                        </el-card>
                    </el-col>
                </el-row>
                <el-row :gutter="20">
                    <el-col :span="16">
                        <el-card class="box-card chart-card" v-loading="loading.revenue">
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
                                <LineChart v-if="chartType === 'line' && chartData.revenue.labels.length"
                                           :chartData="chartData.revenue"/>
                                <BarChart v-if="chartType === 'bar' && chartData.revenue.labels.length"
                                          :chartData="chartData.revenue"/>
                                <LineChart v-if="chartType === 'area' && chartData.revenue.labels.length"
                                           :chartData="chartDataArea"/>
                            </div>
                        </el-card>
                    </el-col>
                    <el-col :span="8">
                        <el-card class="box-card chart-card" v-loading="loading.bestSellers">
                            <template #header><span>Top 5 Sản phẩm (Theo Doanh thu)</span></template>
                            <div class="chart-container">
                                <BarChart v-if="chartData.bestSellers.labels.length"
                                          :chartData="chartData.bestSellers"/>
                            </div>
                        </el-card>
                    </el-col>
                </el-row>

                <el-row :gutter="20" style="margin-top: 20px;">
                    <el-col :span="12">
                        <el-card class="box-card chart-card">
                            <template #header>
                                <div class="chart-header">
                                    <span>📅 Thống kê theo giờ trong ngày</span>
                                    <el-tag type="info" size="small">Giờ cao điểm</el-tag>
                                </div>
                            </template>
                            <div class="chart-container">
                                <BarChart v-if="chartData.hourly.labels.length" :chartData="chartData.hourly"/>
                            </div>
                            <div class="chart-summary">
                                <div class="summary-item">
                                    <span class="summary-label">Giờ bận nhất:</span>
                                    <span class="summary-value">{{ peakHour }}</span>
                                </div>
                                <div class="summary-item">
                                    <span class="summary-label">Tổng đơn:</span>
                                    <span class="summary-value">{{ totalHourlyOrders }} đơn</span>
                                </div>
                            </div>
                        </el-card>
                    </el-col>
                    <el-col :span="12">
                        <el-card class="box-card chart-card">
                            <template #header>
                                <div class="chart-header">
                                    <span>📊 Doanh thu theo Danh mục</span>
                                    <el-tag type="success" size="small">Real-time</el-tag>
                                </div>
                            </template>
                            <div class="chart-container" v-loading="loading.categories">
                                <BarChart v-if="chartData.categories.labels.length" :chartData="chartData.categories"/>
                            </div>
                        </el-card>
                    </el-col>
                </el-row>
            </el-tab-pane>

            <el-tab-pane label="☕ Sản phẩm" name="products">
                <el-alert type="success" :closable="false" style="margin-bottom: 20px;">
                    <template #title>
                        <strong>Phân tích sản phẩm:</strong> Xem sản phẩm nào bán chạy nhất, danh mục nào có doanh thu
                        cao để tối ưu menu và kho hàng.
                    </template>
                </el-alert>

                <el-row :gutter="20" style="margin-bottom: 20px;">
                    <el-col :span="24">
                        <el-card class="box-card product-summary-card" v-loading="loading.productSummary">
                            <template #header>
                                <div class="chart-header product-summary-header">
                                    <div class="product-summary-title">
                                        <span>Thống kê bán hàng theo sản phẩm</span>
                                        <el-tag type="primary" size="small">API</el-tag>
                                    </div>
                                    <div class="product-summary-totals">
                                        <div class="summary-pill">
                                            <span class="pill-label">Tổng lượng bán</span>
                                            <span class="pill-value">{{ totalQuantitySoldDisplay }}</span>
                                        </div>
                                        <div class="summary-pill">
                                            <span class="pill-label">Tổng doanh thu</span>
                                            <span class="pill-value">{{ totalRevenueGeneratedDisplay }}</span>
                                        </div>
                                    </div>
                                </div>
                            </template>


                            <EasyDataTable
                                :headers="productSummaryHeaders"
                                :items="productSummaryItems"
                                :loading="loading.productSummary"
                                table-class-name="data-table"
                                :row-class-name="productSummaryRowClass"
                                alternating
                            >
                                <template #item-productName="{ productName, productId }">
                                    <div class="product-name-cell">
                                        <span>{{ productName }}</span>
                                        <el-tag
                                            v-if="productRankSets.top.has(productId ?? productName)"
                                            type="success"
                                            size="small"
                                        >Top 5
                                        </el-tag>
                                        <el-tag
                                            v-else-if="productRankSets.bottom.has(productId ?? productName)"
                                            type="danger"
                                            size="small"
                                        >Bottom 5
                                        </el-tag>
                                    </div>
                                </template>

                                <template #item-totalQuantitySold="{ totalQuantitySold }">
                                    {{ (Number(totalQuantitySold) || 0).toLocaleString('vi-VN') }}
                                </template>

                                <template #item-totalRevenueGenerated="{ totalRevenueGenerated }">
                                    {{ formatCurrency(Number(totalRevenueGenerated) || 0) }}
                                </template>
                            </EasyDataTable>
                        </el-card>
                    </el-col>
                </el-row>

                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-card class="box-card chart-card" v-loading="loading.bestSellers">
                            <template #header>
                                <div class="chart-header">
                                    <span>Top 10 Sản phẩm bán chạy (Số lượng)</span>
                                    <el-tag type="primary" size="small">Real API</el-tag>
                                </div>
                            </template>
                            <div class="chart-container">
                                <BarChart v-if="chartData.topProducts.labels.length"
                                          :chartData="chartData.topProducts"/>
                            </div>
                            <div class="chart-container">
                                <PieChart v-if="chartData.topProducts.labels.length"
                                          :chartData="chartData.topProducts"/>
                            </div>
                        </el-card>
                    </el-col>
                    <el-col :span="12">
                        <el-card class="box-card chart-card" v-loading="loading.categories">
                            <template #header>
                                <div class="chart-header">
                                    <span>Doanh thu theo Danh mục</span>
                                    <el-tag type="success" size="small">Real API</el-tag>
                                </div>
                            </template>
                            <div class="chart-container">
                                <BarChart v-if="chartData.categories.labels.length" :chartData="chartData.categories"/>
                            </div>
                            <div class="chart-container">
                                <PieChart v-if="chartData.categories.labels.length" :chartData="chartData.categories"/>
                            </div>
                        </el-card>
                    </el-col>
                </el-row>
            </el-tab-pane>

            <el-tab-pane label="💸 Chi phí" name="expenses">
                <el-alert type="warning" :closable="false" style="margin-bottom: 20px;">
                    <template #title>
                        <strong>Quản lý chi phí:</strong> Theo dõi các khoản chi phí vận hành hàng ngày để kiểm soát
                        ngân sách và tối ưu lợi nhuận.
                    </template>
                </el-alert>
                <el-card class="box-card chart-card" v-loading="loading.expenses">
                    <template #header><span>Chi phí theo ngày</span></template>
                    <div class="chart-container" style="height: 500px;">
                        <BarChart v-if="chartData.expenses.labels.length" :chartData="chartData.expenses"/>
                    </div>
                </el-card>
            </el-tab-pane>

            <el-tab-pane label="📦 Tồn kho" name="inventory">
                <el-alert type="error" :closable="false" style="margin-bottom: 20px;">
                    <template #title>
                        <strong>Cảnh báo tồn kho:</strong> Kiểm tra nguyên vật liệu sắp hết để đặt hàng kịp thời, tránh
                        gián đoạn kinh doanh.
                    </template>
                </el-alert>
                <el-card class="box-card" v-loading="loading.inventory">
                    <template #header>
                        <div class="d-flex justify-content-between align-items-center">
                            <span>Báo cáo Tồn kho</span>
                            <el-switch v-model="lowStockOnly" @change="fetchInventoryData" size="large"
                                       active-text="Chỉ hiển thị hàng sắp hết"/>
                        </div>
                    </template>
                    <EasyDataTable :headers="inventoryHeaders" :items="inventory" :loading="loading.inventory"
                                   table-class-name="data-table" show-index :row-class-name="inventoryRowClass">
                    </EasyDataTable>
                </el-card>

            </el-tab-pane>

            <el-tab-pane label="👥 Khách hàng & Nhân viên" name="people">
                <el-alert type="success" :closable="false" style="margin-bottom: 20px;">
                    <template #title>
                        <strong>Phân tích con người:</strong> Xem khách hàng VIP và nhân viên xuất sắc để có chiến lược
                        chăm sóc và khen thưởng phù hợp.
                    </template>
                </el-alert>

                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-card class="box-card" v-loading="loading.customers">
                            <template #header>
                                <div class="chart-header">
                                    <span>👑 Top 10 Khách hàng VIP</span>
                                    <el-tag type="warning" size="small">Theo doanh thu</el-tag>
                                </div>
                            </template>
                            <EasyDataTable :headers="topCustomersHeaders" :items="topCustomers"
                                           :loading="loading.customers" table-class-name="data-table" max-height="500">
                                <template #item-index="{ index }">
                                    <el-tag v-if="index === 0" type="danger" size="small">⭐</el-tag>
                                    <span v-else>{{ index + 1 }}</span>
                                </template>

                                <template #item-phone="{ customerPhone, phone }">
                                    <span v-if="customerPhone || phone">
                                        {{ customerPhone || phone }}
                                    </span>
                                    <el-tag v-else type="info" size="small">Chưa có</el-tag>
                                </template>

                                <template #item-totalSpent="{ totalSpent }">
                                    <strong style="color: #8B7355;">{{ formatCurrency(totalSpent) }}</strong>
                                </template>

                                <template #item-averageOrderValue="{ averageOrderValue }">
                                    {{ formatCurrency(averageOrderValue) }}
                                </template>
                            </EasyDataTable>
                        </el-card>
                    </el-col>

                    <el-col :span="12">
                        <el-card class="box-card" v-loading="loading.staff">
                            <template #header>
                                <div class="chart-header">
                                    <span>🏆 Hiệu suất Nhân viên</span>
                                    <el-tag type="success" size="small">Leaderboard</el-tag>
                                </div>
                            </template>
                            <EasyDataTable :headers="staffHeaders" :items="staffPerformance" :loading="loading.staff"
                                           table-class-name="data-table" max-height="500">
                                <template #item-index="{ index }">
                                    <el-tag v-if="index === 0" type="danger" size="small">⭐</el-tag>
                                    <span v-else>{{ index + 1 }}</span>
                                </template>

                                <template #item-fullName="{ fullName, username }">
                                    <div>
                                        <div style="font-weight: 600;">{{ fullName }}</div>
                                        <div style="font-size: 0.85em; color: #909399;">@{{ username }}</div>
                                    </div>
                                </template>

                                <template #item-totalRevenue="{ totalRevenue }">
                                    <strong style="color: #67C23A;">{{ formatCurrency(totalRevenue) }}</strong>
                                </template>

                                <template #item-averageOrderValue="{ averageOrderValue }">
                                    {{ formatCurrency(averageOrderValue) }}
                                </template>
                            </EasyDataTable>
                        </el-card>
                    </el-col>
                </el-row>
            </el-tab-pane>

            <el-tab-pane label="💳 Phương thức Thanh toán" name="payment">
                <el-alert type="warning" :closable="false" style="margin-bottom: 20px;">
                    <template #title>
                        <strong>Phân tích thanh toán:</strong> Hiểu rõ khách hàng thích thanh toán bằng cách nào để
                        chuẩn bị đầy đủ phương thức.
                    </template>
                </el-alert>

                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-card class="box-card chart-card" v-loading="loading.paymentMethods">
                            <template #header><span>Biểu đồ Phương thức Thanh toán</span></template>
                            <div class="chart-container">
                                <PieChart v-if="chartData.paymentMethods.labels.length"
                                          :chartData="chartData.paymentMethods"/>
                            </div>
                        </el-card>
                    </el-col>

                    <el-col :span="12">
                        <el-card class="box-card" v-loading="loading.paymentMethods">
                            <template #header><span>Chi tiết Thống kê</span></template>
                            <EasyDataTable :headers="paymentHeaders" :items="paymentMethodStats"
                                           :loading="loading.paymentMethods" table-class-name="data-table">
                                <template #item-paymentMethod="{ paymentMethod }">
                                    <el-tag v-if="paymentMethod === 'CASH'" type="success">💵 Tiền mặt</el-tag>
                                    <el-tag v-else-if="paymentMethod === 'TRANSFER'" type="primary">🏦 Chuyển khoản
                                    </el-tag>
                                    <el-tag v-else-if="paymentMethod === 'CARD'" type="warning">💳 Thẻ</el-tag>
                                    <el-tag v-else type="info">{{ paymentMethod }}</el-tag>
                                </template>

                                <template #item-totalAmount="{ totalAmount }">
                                    <strong>{{ formatCurrency(totalAmount) }}</strong>
                                </template>

                                <template #item-percentage="{ percentage }">
                                    <el-progress :percentage="percentage" :stroke-width="12" :show-text="false"/>
                                    <div style="margin-top: 4px; font-weight: 600;">{{ percentage.toFixed(1) }}%</div>
                                </template>
                            </EasyDataTable>
                        </el-card>
                    </el-col>
                </el-row>
            </el-tab-pane>

            <el-tab-pane label="📥 Xuất Excel" name="export">
                <el-alert type="info" :closable="false" style="margin-bottom: 20px;">
                    <template #title>
                        <strong>Xuất báo cáo:</strong> Tải xuống file Excel chứa chi tiết để phân tích offline hoặc lưu
                        trữ.
                    </template>
                </el-alert>

                <el-row :gutter="20">
                    <el-col :span="8">
                        <el-card class="box-card export-card">
                            <template #header>
                                <div style="text-align: center;">
                                    <span style="font-size: 2rem;">📋</span>
                                    <div style="margin-top: 8px; font-weight: 600;">Đơn hàng</div>
                                </div>
                            </template>
                            <div style="text-align: center;">
                                <p>Xuất danh sách đơn hàng chi tiết</p>
                                <div class="date-filters" style="margin-bottom: 20px; flex-direction: column;">
                                    <el-date-picker
                                        v-model="exportStartDate"
                                        type="date"
                                        placeholder="Từ ngày"
                                        format="DD/MM/YYYY"
                                        value-format="YYYY-MM-DD"
                                        style="width: 100%; margin-bottom: 8px;"
                                    />
                                    <el-date-picker
                                        v-model="exportEndDate"
                                        type="date"
                                        placeholder="Đến ngày"
                                        format="DD/MM/YYYY"
                                        value-format="YYYY-MM-DD"
                                        style="width: 100%;"
                                    />
                                </div>
                                <el-button type="success" @click="handleExportExcel" :loading="loading.exporting"
                                           style="width: 100%;">
                                    <el-icon style="margin-right: 8px;">
                                        <Download/>
                                    </el-icon>
                                    Tải xuống
                                </el-button>
                            </div>
                        </el-card>
                    </el-col>

                    <el-col :span="8">
                        <el-card class="box-card export-card">
                            <template #header>
                                <div style="text-align: center;">
                                    <span style="font-size: 2rem;">📦</span>
                                    <div style="margin-top: 8px; font-weight: 600;">Tồn kho</div>
                                </div>
                            </template>
                            <div style="text-align: center;">
                                <p>Xuất báo cáo tồn kho hiện tại</p>
                                <div
                                    style="height: 88px; display: flex; align-items: center; justify-content: center; color: #909399;">
                                    Xuất tất cả nguyên vật liệu
                                </div>
                                <el-button type="primary" @click="handleExportInventory" :loading="loading.exporting"
                                           style="width: 100%;">
                                    <el-icon style="margin-right: 8px;">
                                        <Download/>
                                    </el-icon>
                                    Tải xuống
                                </el-button>
                            </div>
                        </el-card>
                    </el-col>

                    <el-col :span="8">
                        <el-card class="box-card export-card">
                            <template #header>
                                <div style="text-align: center;">
                                    <span style="font-size: 2rem;">💸</span>
                                    <div style="margin-top: 8px; font-weight: 600;">Chi phí</div>
                                </div>
                            </template>
                            <div style="text-align: center;">
                                <p>Xuất danh sách chi phí theo kỳ</p>
                                <div class="date-filters" style="margin-bottom: 20px; flex-direction: column;">
                                    <el-date-picker
                                        v-model="exportStartDate"
                                        type="date"
                                        placeholder="Từ ngày"
                                        format="DD/MM/YYYY"
                                        value-format="YYYY-MM-DD"
                                        style="width: 100%; margin-bottom: 8px;"
                                    />
                                    <el-date-picker
                                        v-model="exportEndDate"
                                        type="date"
                                        placeholder="Đến ngày"
                                        format="DD/MM/YYYY"
                                        value-format="YYYY-MM-DD"
                                        style="width: 100%;"
                                    />
                                </div>
                                <el-button type="warning" @click="handleExportExpenses" :loading="loading.exporting"
                                           style="width: 100%;">
                                    <el-icon style="margin-right: 8px;">
                                        <Download/>
                                    </el-icon>
                                    Tải xuống
                                </el-button>
                            </div>
                        </el-card>
                    </el-col>
                </el-row>
            </el-tab-pane>

        </el-tabs>
    </div>
</template>

<script setup>
import {ref, reactive, onMounted, computed} from 'vue'
import {useToast} from 'vue-toastification'
import {saveAs} from 'file-saver'
import {Download} from '@element-plus/icons-vue'
import EasyDataTable from 'vue3-easy-data-table'
import 'vue3-easy-data-table/dist/style.css'
import {
    getProfitReport,
    getRevenueByDateRange,
    getBestSellers,
    getExpensesByDateRange,
    getInventoryReport,
    exportOrdersToExcel,
    getTopCustomers,
    getStaffPerformance,
    getCategorySales,
    getHourlySales,
    getPaymentMethodStats,
    getProductSalesSummary,
    getTotalExpenses,
    getTotalImportedIngredientCost,
    exportInventoryToExcel,
    exportExpensesToExcel
} from '@/api/reportService.js'
import {formatCurrency, formatDateISO, formatStackedBarChartData} from '@/utils/formatters.js'
import {getDefaultDateRange, getDateRangeByFilter} from '@/utils/dateHelpers'
import {createBarChartData, createPieChartData, createLineChartData} from '@/utils/chartHelpers'
import {getChartColors} from '@/utils/chartColors'

import LineChart from '@/components/charts/LineChart.vue'
import BarChart from '@/components/charts/BarChart.vue'
import StackedBarChart from '@/components/charts/StackedBarChart.vue'
import PieChart from '@/components/charts/PieChart.vue'

const toast = useToast()
const activeTab = ref('revenue')
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
    fetchAllReports()
}

const profitStats = ref({totalRevenue: 0, totalCostOfGoodsSold: 0, totalProfit: 0})
const inventory = ref([])
const productSalesSummary = ref({
    products: [],
    totalQuantitySold: 0,
    totalRevenueGenerated: 0
})
const lowStockOnly = ref(false)
const exportStartDate = ref(formatDateISO(defaultDates[0]))
const exportEndDate = ref(formatDateISO(defaultDates[1]))
const hourlyStats = ref([])
const topCustomers = ref([])
const staffPerformance = ref([])
const paymentMethodStats = ref([])
const productSummaryChartMode = ref('revenue')

const totalExpenses = ref(0)
const totalImportedIngredientCost = ref(0)

const chartData = reactive({
    revenue: {labels: [], datasets: []},
    bestSellers: {labels: [], datasets: []},
    expenses: {labels: [], datasets: []},
    topProducts: {labels: [], datasets: []},
    categories: {labels: [], datasets: []},
    hourly: {labels: [], datasets: []},
    tables: {labels: [], datasets: []},
    paymentMethods: {labels: [], datasets: []},
    productSummaryRevenue: {labels: [], datasets: []},
    productSummaryQuantity: {labels: [], datasets: []},
})

const loading = reactive({
    profit: false,
    financialTotals: false,
    revenue: false,
    bestSellers: false,
    expenses: false,
    inventory: false,
    exporting: false,
    customers: false,
    staff: false,
    hourly: false,
    categories: false,
    paymentMethods: false,
    productSummary: false,
})

// Table headers
const inventoryHeaders = [
    {text: "Tên Nguyên vật liệu", value: "name", minWidth: 300, sortable: true},
    {text: "Tồn kho", value: "quantityOnHand", width: 120, sortable: true},
    {text: "Đơn vị", value: "unit", width: 100},
    {text: "Ngưỡng cảnh báo", value: "reorderLevel", width: 150, sortable: true}
]

const topCustomersHeaders = [
    {text: "#", value: "index", width: 60},
    {text: "Tên khách hàng", value: "customerName", minWidth: 200},
    {text: "SĐT", value: "phone", width: 140},
    {text: "Số đơn", value: "totalOrders", width: 100, sortable: true},
    {text: "Tổng chi tiêu", value: "totalSpent", width: 160, sortable: true},
    {text: "TB/Đơn", value: "averageOrderValue", width: 130}
]

const staffHeaders = [
    {text: "#", value: "index", width: 60},
    {text: "Nhân viên", value: "fullName", minWidth: 200},
    {text: "Số đơn", value: "totalOrders", width: 100, sortable: true},
    {text: "Doanh thu", value: "totalRevenue", width: 160, sortable: true},
    {text: "TB/Đơn", value: "averageOrderValue", width: 130}
]

const paymentHeaders = [
    {text: "Phương thức", value: "paymentMethod", width: 180},
    {text: "Số đơn", value: "orderCount", width: 120, sortable: true},
    {text: "Tổng tiền", value: "totalAmount", width: 160, sortable: true},
    {text: "Tỷ lệ", value: "percentage", width: 120, sortable: true}
]

const productSummaryHeaders = [
    {text: '#', value: 'index', width: 60},
    {text: 'Sản phẩm', value: 'productName', minWidth: 220, sortable: true},
    {text: 'Số lượng đã bán', value: 'totalQuantitySold', width: 160, sortable: true},
    {text: 'Doanh thu', value: 'totalRevenueGenerated', width: 180, sortable: true}
]

const netProfit = computed(() => {
    const grossProfit = Number(profitStats.value?.totalProfit) || 0
    const operatingCost = Number(totalExpenses.value) || 0
    const importCost = Number(totalImportedIngredientCost.value) || 0
    return grossProfit - operatingCost - importCost
})

const profitMargin = computed(() => {
    const revenue = Number(profitStats.value?.totalRevenue) || 0
    if (revenue === 0) return 0
    try {
        return (netProfit.value / revenue) * 100
    } catch (e) {
        return 0
    }
})

const profitMarginDisplay = computed(() => {
    try {
        const margin = Number.isFinite(profitMargin.value) ? profitMargin.value : 0
        const formattedMargin = margin.toFixed(2)
        return `${formattedMargin}% (${formatCurrency(netProfit.value)})`
    } catch (e) {
        return `0.00% (${formatCurrency(0)})`
    }
})

const peakHour = computed(() => {
    if (!hourlyStats.value || !hourlyStats.value.length) return 'N/A'
    try {
        const peak = hourlyStats.value.reduce((max, curr) =>
            (curr.orders > max.orders) ? curr : max
        )
        return peak?.hour || 'N/A'
    } catch (e) {
        return 'N/A'
    }
})

const totalHourlyOrders = computed(() => {
    if (!hourlyStats.value || !hourlyStats.value.length) return 0
    try {
        return hourlyStats.value.reduce((sum, curr) => sum + (curr.orders || 0), 0)
    } catch (e) {
        return 0
    }
})

const totalQuantitySoldDisplay = computed(() => {
    const qty = Number(productSalesSummary.value?.totalQuantitySold) || 0
    return qty.toLocaleString('vi-VN')
})

const totalRevenueGeneratedDisplay = computed(() => {
    const revenue = productSalesSummary.value?.totalRevenueGenerated || 0
    try {
        return formatCurrency(revenue)
    } catch (e) {
        return formatCurrency(0)
    }
})

const productRankSets = computed(() => {
    const products = Array.isArray(productSalesSummary.value?.products)
        ? productSalesSummary.value.products
        : []

    if (!products.length) {
        return {top: new Set(), bottom: new Set()}
    }

    const normalized = products.map(item => ({
        ...item,
        totalQuantitySold: Number(item.totalQuantitySold) || 0
    }))

    const descending = [...normalized].sort((a, b) => b.totalQuantitySold - a.totalQuantitySold)
    const ascending = [...normalized].sort((a, b) => a.totalQuantitySold - b.totalQuantitySold)

    const top = descending.slice(0, 5).map(item => item.productId ?? item.productName)
    const bottom = ascending.slice(0, 5).map(item => item.productId ?? item.productName)

    return {
        top: new Set(top),
        bottom: new Set(bottom)
    }
})


const productSummaryItems = computed(() => {
    const products = Array.isArray(productSalesSummary.value?.products)
        ? productSalesSummary.value.products
        : []

    return products.map(item => ({
        ...item,
        totalQuantitySold: Number(item.totalQuantitySold) || 0,
        totalRevenueGenerated: Number(item.totalRevenueGenerated) || 0
    }))
})

const chartDataArea = computed(() => {
    if (!chartData.revenue.labels.length) return {labels: [], datasets: []}

    const data = createLineChartData(
        chartData.revenue.labels,
        chartData.revenue.datasets[0]?.data || [],
        'Doanh thu',
        {fill: true, tension: 0.4}
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
        {fill: false, tension: 0.1}
    )
}
const processBestSellerData = (apiData) => {
    if (!apiData || !apiData.length) {
        chartData.bestSellers = {labels: [], datasets: []}
        return
    }

    chartData.bestSellers = createBarChartData(
        apiData.map(item => item.productName),
        apiData.map(item => item.totalRevenueGenerated),
        'Doanh thu'
    )
}

const fetchAllReports = async () => {
    if (!startDate.value || !endDate.value) return;
    const start = formatDateISO(startDate.value)
    const end = formatDateISO(endDate.value)

    // 1. Fetch Profit (KPIs)
    loading.profit = true
    getProfitReport(start, end)
        .then(res => {
            profitStats.value = res.data
        })
        .catch(() => toast.error('Lỗi tải báo cáo lợi nhuận'))
        .finally(() => {
            loading.profit = false
        })

    // 1b. Fetch total expenses & imported ingredient costs
    loading.financialTotals = true
    Promise.all([
        getTotalExpenses(start, end),
        getTotalImportedIngredientCost(start, end)
    ])
        .then(([expenseRes, importsRes]) => {
            const expenseValue = expenseRes.data?.totalExpenses ?? expenseRes.data ?? 0
            const importValue = importsRes.data?.totalImportedIngredientCost ?? importsRes.data ?? 0
            totalExpenses.value = isNaN(Number(expenseValue)) ? 0 : Number(expenseValue)
            totalImportedIngredientCost.value = isNaN(Number(importValue)) ? 0 : Number(importValue)
        })
        .catch(() => toast.error('Lỗi tải tổng chi phí'))
        .finally(() => {
            loading.financialTotals = false
        })

    // 2. Fetch Revenue by Date (Line Chart)
    loading.revenue = true
    getRevenueByDateRange(start, end)
        .then(res => {
            processRevenueData(res.data)
        })
        .catch(() => toast.error('Lỗi tải biểu đồ doanh thu'))
        .finally(() => {
            loading.revenue = false
        })

    // 3. Fetch Best Sellers (Bar Chart)
    loading.bestSellers = true
    getBestSellers(start, end, 5, 'revenue')
        .then(res => {
            processBestSellerData(res.data)
        })
        .catch(() => toast.error('Lỗi tải top sản phẩm'))
        .finally(() => {
            loading.bestSellers = false
        })

    // 4. Fetch Expenses by Date (Stacked Bar Chart)
    loading.expenses = true
    getExpensesByDateRange(start, end)
        .then(res => {
            chartData.expenses = formatStackedBarChartData(res.data)
        })
        .catch(() => toast.error('Lỗi tải biểu đồ chi phí'))
        .finally(() => {
            loading.expenses = false
        })

    // 5. Fetch Category Sales
    fetchCategorySales()

    // 6. Fetch Top Products by Quantity
    fetchTopProducts()

    // 7. Fetch Product Sales Summary
    fetchProductSalesSummary()
}

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

const fetchHourlySales = async () => {
    loading.hourly = true
    try {
        const today = new Date().toISOString().split('T')[0]
        const response = await getHourlySales(today)
        const data = response.data

        hourlyStats.value = data.map(item => ({
            hour: `${item.hour}:00`,
            orders: item.orderCount,
            revenue: item.revenue
        }))

        const colors = getChartColors(2)

        chartData.hourly = {
            labels: hourlyStats.value.map(h => h.hour),
            datasets: [
                {
                    label: 'Số đơn hàng',
                    backgroundColor: colors[0],
                    borderColor: colors[0],
                    data: hourlyStats.value.map(h => h.orders),
                    yAxisID: 'y',
                },
                {
                    label: 'Doanh thu',
                    backgroundColor: colors[1],
                    borderColor: colors[1],
                    data: hourlyStats.value.map(h => Math.round(h.revenue)),
                    yAxisID: 'y1',
                }
            ]
        }
    } catch (error) {
        toast.error('Lỗi tải dữ liệu theo giờ')
    } finally {
        loading.hourly = false
    }
}

const fetchTopProducts = async () => {
    loading.bestSellers = true
    try {
        const start = formatDateISO(startDate.value)
        const end = formatDateISO(endDate.value)
        const response = await getBestSellers(start, end, 10, 'quantity')
        const data = response.data

        chartData.topProducts = createBarChartData(
            data.map(item => item.productName),
            data.map(item => item.totalQuantitySold),
            'Số lượng bán'
        )
    } catch (error) {
        console.error('Error fetching top products:', error)
        toast.error('Lỗi tải top sản phẩm theo số lượng')
        chartData.topProducts = {labels: [], datasets: []}
    } finally {
        loading.bestSellers = false
    }
}

const fetchProductSalesSummary = async () => {
    loading.productSummary = true
    try {
        const start = formatDateISO(startDate.value)
        const end = formatDateISO(endDate.value)
        const response = await getProductSalesSummary(start, end)
        const data = response.data || {}

        const products = Array.isArray(data.products) ? data.products : []

        productSalesSummary.value = {
            products,
            totalQuantitySold: Number(data.totalQuantitySold) || 0,
            totalRevenueGenerated: data.totalRevenueGenerated || 0
        }

        chartData.productSummaryRevenue = createBarChartData(
            products.map(item => item.productName),
            products.map(item => Number(item.totalRevenueGenerated) || 0),
            'Doanh thu'
        )

        chartData.productSummaryQuantity = createBarChartData(
            products.map(item => item.productName),
            products.map(item => Number(item.totalQuantitySold) || 0),
            'Số lượng bán'
        )
    } catch (error) {
        console.error('Error fetching product sales summary:', error)
        toast.error('Lỗi tải thống kê sản phẩm')
        productSalesSummary.value = {
            products: [],
            totalQuantitySold: 0,
            totalRevenueGenerated: 0
        }
        chartData.productSummaryRevenue = {labels: [], datasets: []}
        chartData.productSummaryQuantity = {labels: [], datasets: []}
    } finally {
        loading.productSummary = false
    }
}

const fetchCategorySales = async () => {
    loading.categories = true
    try {
        const start = formatDateISO(startDate.value)
        const end = formatDateISO(endDate.value)
        const response = await getCategorySales(start, end)
        const data = response.data

        chartData.categories = createBarChartData(
            data.map(item => item.categoryName),
            data.map(item => item.totalRevenue),
            'Doanh thu'
        )
    } catch (error) {
        console.error('Error fetching category sales:', error)
        toast.error('Lỗi tải dữ liệu danh mục')
        chartData.categories = {labels: [], datasets: []}
    } finally {
        loading.categories = false
    }
}

const handleExportExcel = async () => {
    if (!exportStartDate.value || !exportEndDate.value) {
        toast.error('Vui lòng chọn khoảng ngày để xuất file.')
        return
    }

    const start = exportStartDate.value
    const end = exportEndDate.value
    loading.exporting = true

    try {
        const response = await exportOrdersToExcel(start, end)
        const filename = `Orders_${start}_to_${end}.xlsx`
        saveAs(new Blob([response.data]), filename)
        toast.success('Xuất file thành công!')
    } catch (error) {
        toast.error('Lỗi khi xuất file Excel.')
    } finally {
        loading.exporting = false
    }
}

const inventoryRowClass = ({row}) => {
    if (!row) return ''
    if ((row.quantityOnHand !== undefined && row.reorderLevel !== undefined) &&
        (row.quantityOnHand <= row.reorderLevel)) {
        return 'row-danger'
    }
    return ''
}

const productSummaryRowClass = ({row}) => {
    if (!row) return ''
    const key = row.productId ?? row.productName
    if (productRankSets.value.top.has(key)) {
        return 'row-top-product'
    }
    if (productRankSets.value.bottom.has(key)) {
        return 'row-bottom-product'
    }
    return ''
}

const fetchTopCustomers = async () => {
    loading.customers = true
    try {
        const start = formatDateISO(startDate.value)
        const end = formatDateISO(endDate.value)
        const response = await getTopCustomers(start, end, 10)
        topCustomers.value = response.data
    } catch (error) {
        toast.error('Lỗi tải top khách hàng')
    } finally {
        loading.customers = false
    }
}

const fetchStaffPerformance = async () => {
    loading.staff = true
    try {
        const start = formatDateISO(startDate.value)
        const end = formatDateISO(endDate.value)
        const response = await getStaffPerformance(start, end, 10)
        staffPerformance.value = response.data
    } catch (error) {
        toast.error('Lỗi tải hiệu suất nhân viên')
    } finally {
        loading.staff = false
    }
}

const fetchPaymentMethodStats = async () => {
    loading.paymentMethods = true
    try {
        const start = formatDateISO(startDate.value)
        const end = formatDateISO(endDate.value)
        const response = await getPaymentMethodStats(start, end)
        paymentMethodStats.value = response.data

        chartData.paymentMethods = createPieChartData(
            response.data.map(item => item.paymentMethod),
            response.data.map(item => item.totalAmount),
            'Doanh thu'
        )
    } catch (error) {
        toast.error('Lỗi tải thống kê thanh toán')
    } finally {
        loading.paymentMethods = false
    }
}

const handleExportInventory = async () => {
    loading.exporting = true
    try {
        const response = await exportInventoryToExcel()
        const filename = `Inventory_${new Date().toISOString().split('T')[0]}.xlsx`
        saveAs(new Blob([response.data]), filename)
        toast.success('Xuất file tồn kho thành công!')
    } catch (error) {
        toast.error('Lỗi khi xuất file tồn kho')
    } finally {
        loading.exporting = false
    }
}

const handleExportExpenses = async () => {
    if (!exportStartDate.value || !exportEndDate.value) {
        toast.error('Vui lòng chọn khoảng ngày')
        return
    }
    loading.exporting = true
    try {
        const response = await exportExpensesToExcel(exportStartDate.value, exportEndDate.value)
        const filename = `Expenses_${exportStartDate.value}_to_${exportEndDate.value}.xlsx`
        saveAs(new Blob([response.data]), filename)
        toast.success('Xuất file chi phí thành công!')
    } catch (error) {
        toast.error('Lỗi khi xuất file chi phí')
    } finally {
        loading.exporting = false
    }
}

onMounted(() => {
    fetchAllReports()
    fetchInventoryData()
    fetchHourlySales()
    fetchTopCustomers()
    fetchStaffPerformance()
    fetchPaymentMethodStats()
})
</script>

<style scoped>
.app-page-container {
    padding: 20px;
}

.report-tabs {
    margin-top: 20px;
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
    margin-top: 20px;
    transition: all 0.3s;
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
    font-size: 3rem;
    width: 70px;
    height: 70px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
}

.revenue-icon {
    background: linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%);
}

.cost-icon {
    background: linear-gradient(135deg, #FFEBEE 0%, #FFCDD2 100%);
}

.profit-icon {
    background: linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%);
}

.margin-icon {
    background: linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%);
}

.expense-icon {
    background: linear-gradient(135deg, #F3E5F5 0%, #E1BEE7 100%);
}

.import-icon {
    background: linear-gradient(135deg, #E0F7FA 0%, #B2EBF2 100%);
}

.kpi-text {
    flex: 1;
}

.kpi-title {
    font-size: 0.875rem;
    color: #757575;
    margin-bottom: 8px;
    font-weight: 600;
}

.kpi-value {
    font-size: 1.75rem;
    font-weight: 800;
    margin-bottom: 4px;
}

.kpi-desc {
    font-size: 0.75rem;
    color: #9E9E9E;
}

.kpi-value.revenue {
    color: #2196F3;
}

.kpi-value.cost {
    color: #F44336;
}

.kpi-value.profit {
    color: #4CAF50;
}

.kpi-value.margin {
    color: #FF9800;
}

.kpi-value.profit {
    color: #67C23A;
}

.kpi-value.expense {
    color: #9C27B0;
}

.kpi-value.import {
    color: #00ACC1;
}

.chart-card {
    height: auto;
}

.chart-summary {
    display: flex;
    justify-content: space-around;
    padding: 16px 24px;
    background: linear-gradient(135deg, #F8F6F3 0%, #F5F3F0 100%);
    border-top: 2px solid #E8E6E3;
    margin: 0 -24px -24px -24px;
    border-radius: 0 0 14px 14px;
}

.summary-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
}

.summary-label {
    font-size: 0.875rem;
    color: #757575;
    font-weight: 600;
}

.summary-value {
    font-size: 1.25rem;
    font-weight: 800;
    color: #8B7355;
}

.chart-container {
    position: relative;
    height: 350px;
}

.w-100 {
    width: 100%;
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

.export-card {
    transition: all 0.3s;
}

.export-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}
</style>

<style>
/* Style chung (không scoped) để tô màu hàng tồn kho */
.el-table .row-danger {
    --el-table-tr-bg-color: var(--el-color-danger-light-9);
}

.el-table .row-danger:hover > td {
    background-color: var(--el-color-danger-light-8) !important;
}

.product-summary-card {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.product-summary-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
}

.product-summary-title {
    display: flex;
    align-items: center;
    gap: 12px;
    font-weight: 600;
}

.product-summary-totals {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
}

.summary-pill {
    display: flex;
    flex-direction: column;
    background: rgba(0, 0, 0, 0.04);
    padding: 8px 16px;
    border-radius: 12px;
    min-width: 160px;
}

.pill-label {
    font-size: 0.85rem;
    color: #909399;
}

.pill-value {
    font-size: 1.1rem;
    font-weight: 600;
    color: #303133;
}

.product-summary-chart-wrapper {
    padding: 12px 0 4px;
}

.product-summary-chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}

.product-name-cell {
    display: flex;
    align-items: center;
    gap: 8px;
}

.row-top-product {
    background: rgba(103, 194, 58, 0.12) !important;
}

.row-bottom-product {
    background: rgba(245, 108, 108, 0.12) !important;
}

.row-top-product:hover,
.row-bottom-product:hover {
    filter: brightness(0.98);
}

</style>
