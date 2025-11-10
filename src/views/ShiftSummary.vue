<template>
    <div class="shift-summary-page" v-loading="loading">
        <div v-if="!loading && !hasSummary" class="empty-state">
            <el-result
                icon="warning"
                title="Không tìm thấy báo cáo kết ca"
                sub-title="Vui lòng kết ca lại hoặc liên hệ quản trị viên nếu vấn đề tiếp diễn."
            >
                <template #extra>
                    <el-button type="primary" @click="goHome">Quay về Dashboard</el-button>
                </template>
            </el-result>
        </div>

        <div v-else-if="summary" class="summary-wrapper animate__animated animate__fadeInUp">
            <header class="summary-header">
                <div>
                    <p class="summary-subtitle">Báo cáo kết ca làm việc</p>
                    <h1 class="summary-title">Tổng kết ca làm việc</h1>
                    <p class="summary-meta">Sinh lúc {{ formatDateTime(summaryStore.generatedAt) }}</p>
                </div>
                <div class="header-actions">
                    <el-button @click="goHome" plain>Trở lại</el-button>
                    <el-button @click="printSummary" :disabled="printing" plain>
                        🖨️ In / Xuất PDF
                    </el-button>
                    <el-button type="primary" @click="handleLogout" :loading="isLoggingOut">
                        Xác nhận đăng xuất
                    </el-button>
                </div>
            </header>

            <el-card class="summary-card" shadow="hover">
                <el-descriptions :column="3" border>
                    <el-descriptions-item label="Nhân viên">
                        {{ summary.fullName || summary.username || 'N/A' }}
                    </el-descriptions-item>
                    <el-descriptions-item label="Mã nhân viên">
                        {{ summary.username || 'N/A' }}
                    </el-descriptions-item>
                    <el-descriptions-item label="Tổng doanh thu">
                        <strong class="highlight">{{ formatCurrency(summary.totalRevenue) }}</strong>
                    </el-descriptions-item>
                    <el-descriptions-item label="Bắt đầu ca">
                        {{ formatDateTime(summary.loginTime) }}
                    </el-descriptions-item>
                    <el-descriptions-item label="Kết thúc ca">
                        {{ formatDateTime(summary.logoutTime) }}
                    </el-descriptions-item>
                    <el-descriptions-item label="Tổng số đơn (đã kết toán)">
                        {{ summary.totalOrders }}
                    </el-descriptions-item>
                    <el-descriptions-item label="Tổng số món bán">
                        {{ summary.totalItems }}
                    </el-descriptions-item>
                    <el-descriptions-item label="Số đơn hủy">
                        {{ cancelledOrders }}
                    </el-descriptions-item>
                    <el-descriptions-item label="Phương thức thanh toán phổ biến">
                        {{ popularPaymentMethod }}
                    </el-descriptions-item>
                </el-descriptions>

                <el-divider content-position="left">Chi tiết đơn hàng</el-divider>

                <div class="order-list" v-if="summary.orders && summary.orders.length">
                    <article
                        v-for="order in summary.orders"
                        :key="order.id"
                        class="order-card"
                    >
                        <header class="order-card__header">
                            <div class="order-card__id">
                                <span class="order-code">#{{ order.id }}</span>
                                <span class="order-status" :class="statusClass(order.status)">
                                    {{ translateStatus(order.status) }}
                                </span>
                            </div>
                            <div class="order-card__meta">
                                <span>{{ order.tableName || 'Mang đi' }}</span>
                                <span>{{ formatDateTime(order.paidAt || order.createdAt) }}</span>
                            </div>
                        </header>

                        <ul class="order-items">
                            <li
                                v-for="detail in order.orderDetails || []"
                                :key="detail.id || detail.productName"
                                class="order-item"
                            >
                                <span class="item-name">{{ detail.productName }}</span>
                                <span class="item-qty">x{{ detail.quantity }}</span>
                                <span class="item-price">{{ formatCurrency(detail.unitPrice) }}</span>
                                <span class="item-total">{{ formatCurrency(detail.totalPrice) }}</span>
                            </li>
                        </ul>

                        <footer class="order-card__footer">
                            <div class="footer-info">
                                <span>Tổng: <strong>{{ formatCurrency(order.totalAmount) }}</strong></span>
                                <span>Giảm giá: {{ formatCurrency(order.discountAmount) }}</span>
                            </div>
                            <div class="footer-meta">
                                <span>Hình thức: {{ translatePayment(order.paymentMethod) }}</span>
                            </div>
                        </footer>
                    </article>
                </div>
                <el-empty v-else description="Không có đơn hàng trong ca" />
            </el-card>
        </div>
    </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth.js'
import { useShiftSummaryStore } from '@/store/shiftSummary.js'
import { formatCurrency } from '@/utils/formatters.js'

const router = useRouter()
const authStore = useAuthStore()
const summaryStore = useShiftSummaryStore()

const isLoggingOut = ref(false)
const printing = ref(false)
const loading = ref(true)

const summary = computed(() => summaryStore.summary)
const hasSummary = computed(() => summaryStore.hasSummary)

const cancelledOrders = computed(() => {
    if (!summary.value?.orders) return 0
    return summary.value.orders.filter(order => order.status === 'CANCELLED').length
})

const popularPaymentMethod = computed(() => {
    if (!summary.value?.orders || !summary.value.orders.length) return 'N/A'
    const counts = summary.value.orders.reduce((acc, order) => {
        const key = order.paymentMethod || 'KHÁC'
        acc[key] = (acc[key] || 0) + 1
        return acc
    }, {})
    const [method] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
    return translatePayment(method)
})

onMounted(() => {
    if (!hasSummary.value) {
        loading.value = false
        router.replace({ name: 'Dashboard' })
        return
    }
    loading.value = false
})

const goHome = () => {
    router.push({ name: 'Dashboard' })
}

const handleLogout = () => {
    if (isLoggingOut.value) return
    isLoggingOut.value = true
    try {
        summaryStore.clearSummary()
        authStore.logout()
    } finally {
        isLoggingOut.value = false
    }
}

const printSummary = () => {
    if (!summary.value || printing.value) return
    printing.value = true

    const printWindow = window.open('', '_blank')
    if (!printWindow) {
        printing.value = false
        return
    }

    const ordersHtml = (summary.value.orders || []).map((order) => {
        const itemsHtml = (order.orderDetails || []).map((item) => `
            <tr>
                <td>${item.productName}</td>
                <td style="text-align:center;">${item.quantity}</td>
                <td style="text-align:right;">${formatCurrency(item.unitPrice)}</td>
                <td style="text-align:right;">${formatCurrency(item.totalPrice)}</td>
            </tr>
        `).join('')

        return `
            <section class="order-block">
                <h3>Đơn #${order.id} - ${order.tableName || 'Mang đi'} (${translateStatus(order.status)})</h3>
                <p>Thời gian: ${formatDateTime(order.paidAt || order.createdAt)} | Tổng: ${formatCurrency(order.totalAmount)}</p>
                <p>Thanh toán: ${translatePayment(order.paymentMethod)}</p>
                <table>
                    <thead>
                        <tr>
                            <th>Món</th>
                            <th>Số lượng</th>
                            <th>Đơn giá</th>
                            <th>Thành tiền</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>
            </section>
        `
    }).join('')

    printWindow.document.write(`
        <html>
            <head>
                <title>Tổng kết ca làm việc</title>
                <style>
                    body { font-family: 'Segoe UI', sans-serif; padding: 24px; color: #1f2937; background: #fafafa; }
                    h1 { text-align: center; margin-bottom: 24px; }
                    h2 { margin-top: 32px; }
                    h3 { margin: 16px 0 8px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
                    th, td { border: 1px solid #d1d5db; padding: 8px; }
                    th { background: #f3f4f6; }
                    .summary-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
                    .summary-item { background: #f9fafb; padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; }
                    .order-block { page-break-inside: avoid; margin-bottom: 24px; }
                </style>
            </head>
            <body>
                <h1>Tổng kết ca làm việc</h1>
                <div class="summary-grid">
                    <div class="summary-item"><strong>Nhân viên:</strong> ${summary.value.fullName || summary.value.username || 'N/A'}</div>
                    <div class="summary-item"><strong>Mã nhân viên:</strong> ${summary.value.username || 'N/A'}</div>
                    <div class="summary-item"><strong>Bắt đầu ca:</strong> ${formatDateTime(summary.value.loginTime)}</div>
                    <div class="summary-item"><strong>Kết thúc ca:</strong> ${formatDateTime(summary.value.logoutTime)}</div>
                    <div class="summary-item"><strong>Tổng số đơn:</strong> ${summary.value.totalOrders}</div>
                    <div class="summary-item"><strong>Tổng số món:</strong> ${summary.value.totalItems}</div>
                    <div class="summary-item"><strong>Tổng doanh thu:</strong> ${formatCurrency(summary.value.totalRevenue)}</div>
                </div>
                <h2>Chi tiết đơn hàng</h2>
                ${ordersHtml || '<p>Không có đơn hàng trong ca.</p>'}
            </body>
        </html>
    `)

    printWindow.document.close()
    printWindow.focus()
    printWindow.onload = () => {
        printWindow.print()
        printWindow.close()
        printing.value = false
    }
}

const formatDateTime = (value) => {
    if (!value) return 'N/A'
    return new Date(value).toLocaleString('vi-VN')
}

const translateStatus = (status) => {
    if (!status) return 'Không xác định'
    if (status === 'PAID') return 'Đã thanh toán'
    if (status === 'PENDING') return 'Chờ thanh toán'
    if (status === 'CANCELLED') return 'Đã hủy'
    return status
}

const translatePayment = (method) => {
    if (!method) return 'Không xác định'
    const normalized = method.toUpperCase()
    if (normalized === 'CASH') return 'Tiền mặt'
    if (normalized === 'CARD') return 'Thẻ'
    if (normalized === 'TRANSFER') return 'Chuyển khoản'
    return method
}

const statusClass = (status) => {
    if (!status) return 'status-default'
    const normalized = status.toLowerCase()
    if (normalized === 'paid') return 'status-paid'
    if (normalized === 'pending') return 'status-pending'
    if (normalized === 'cancelled') return 'status-cancelled'
    return 'status-default'
}
</script>

<style scoped>
.shift-summary-page {
    padding: 24px;
    min-height: calc(100vh - 70px);
    background: linear-gradient(135deg, #f8f5f0 0%, #fefefe 100%);
    display: flex;
    justify-content: center;
    align-items: flex-start;
}

.summary-wrapper {
    width: min(1100px, 100%);
}

.summary-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 20px;
}

.summary-subtitle {
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    color: #909399;
    font-size: 13px;
}

.summary-title {
    margin: 4px 0 8px;
    font-size: 28px;
    font-weight: 700;
    color: #2c3e50;
}

.summary-meta {
    margin: 0;
    font-size: 13px;
    color: #7f8c8d;
}

.header-actions {
    display: flex;
    gap: 12px;
}

.summary-card {
    border-radius: 18px;
    box-shadow: 0 18px 40px rgba(52, 73, 94, 0.08);
}

.highlight {
    color: #b8864d;
}

.order-list {
    display: grid;
    gap: 16px;
    margin-top: 12px;
}

.order-card {
    border-radius: 14px;
    background: #ffffff;
    box-shadow: 0 10px 28px rgba(41, 53, 82, 0.08);
    padding: 16px;
    border: 1px solid rgba(255, 255, 255, 0.7);
}

.order-card__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 12px;
}

.order-card__id {
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 600;
    color: #2c3e50;
}

.order-code {
    font-size: 16px;
}

.order-status {
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
}

.status-paid {
    background: rgba(103, 194, 58, 0.12);
    color: #4CAF50;
}

.status-pending {
    background: rgba(255, 152, 0, 0.12);
    color: #d48806;
}

.status-cancelled {
    background: rgba(245, 108, 108, 0.12);
    color: #d93025;
}

.status-default {
    background: rgba(144, 147, 153, 0.12);
    color: #606266;
}

.order-card__meta {
    display: flex;
    flex-direction: column;
    font-size: 13px;
    color: #7f8c8d;
    text-align: right;
}

.order-items {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 8px;
}

.order-item {
    display: grid;
    grid-template-columns: 1fr 80px 110px 120px;
    align-items: center;
    background: #f8f5f0;
    border-radius: 10px;
    padding: 10px 12px;
    font-size: 14px;
    color: #424242;
}

.item-name {
    font-weight: 600;
}

.item-qty {
    text-align: center;
    font-weight: 500;
}

.item-price {
    text-align: right;
    color: #7f8c8d;
}

.item-total {
    text-align: right;
    font-weight: 700;
    color: #2c3e50;
}

.order-card__footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 14px;
    font-size: 14px;
    color: #606266;
}

.order-card__footer strong {
    color: #2c3e50;
}

.footer-info {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
}

.footer-meta {
    font-style: italic;
}

.empty-state {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 60px 0;
}

@media (max-width: 992px) {
    .summary-header {
        flex-direction: column;
    }

    .header-actions {
        align-self: flex-start;
        flex-wrap: wrap;
    }

    .order-item {
        grid-template-columns: 1fr 60px 90px 100px;
        font-size: 13px;
    }
}

@media (max-width: 768px) {
    .shift-summary-page {
        padding: 16px;
    }

    .order-item {
        grid-template-columns: repeat(2, 1fr);
        row-gap: 6px;
    }

    .item-qty,
    .item-price,
    .item-total {
        text-align: left;
    }

    .order-card__footer {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
    }
}
</style>
