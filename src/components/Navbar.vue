<template>
    <el-header class="navbar" :class="{ 'sidebar-collapsed': isSidebarCollapsed }">
        <button class="sidebar-toggle" type="button" @click="emitToggleSidebar" :aria-label="isSidebarCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'">
            <component :is="isSidebarCollapsed ? ChevronRight : ChevronLeft" class="sidebar-toggle-icon" />
        </button>
        <div class="page-title">
            {{ $route.meta.title || 'Dashboard' }}
        </div>

        <div class="user-menu">
            <el-dropdown @command="handleCommand">
                <span class="el-dropdown-link">
                    <UserCircle class="user-icon" />
                    <span class="user-name">{{ authStore.user.fullName }}</span>
                    <ChevronDown class="arrow-icon" />
                </span>
                <template #dropdown>
                    <el-dropdown-menu>
                        <el-dropdown-item command="profile">
                            Thông tin cá nhân
                        </el-dropdown-item>
                        <el-dropdown-item command="logout" divided>
                            Đăng xuất
                        </el-dropdown-item>
                    </el-dropdown-menu>
                </template>
            </el-dropdown>
        </div>

        <el-dialog
            v-model="logoutDialogVisible"
            title="Xác nhận đăng xuất"
            width="460px"
            :close-on-click-modal="false"
        >
            <p class="logout-dialog-text">
                Bạn có muốn kết ca trước khi đăng xuất khỏi hệ thống POS không?
            </p>
            <template #footer>
                <div class="logout-dialog-actions">
                    <el-button @click="logoutDialogVisible = false" :disabled="isGeneratingSummary || isLoggingOut">Hủy</el-button>
                    <el-button
                        @click="logoutWithoutShift"
                        :loading="isLoggingOut"
                        :disabled="isGeneratingSummary"
                    >
                        Đăng xuất không kết ca
                    </el-button>
                    <el-button
                        type="primary"
                        @click="logoutWithShift"
                        :loading="isGeneratingSummary"
                        :disabled="isLoggingOut"
                    >
                        Đăng xuất và kết ca
                    </el-button>
                </div>
            </template>
        </el-dialog>

        <el-dialog
            v-model="summaryDialogVisible"
            title="Tổng kết ca làm việc"
            width="720px"
            :close-on-click-modal="false"
        >
            <div v-if="shiftSummary" class="shift-summary">
                <el-descriptions :column="2" border>
                    <el-descriptions-item label="Nhân viên">
                        {{ shiftSummary.fullName || shiftSummary.username || 'N/A' }}
                    </el-descriptions-item>
                    <el-descriptions-item label="Mã nhân viên">
                        {{ shiftSummary.username || 'N/A' }}
                    </el-descriptions-item>
                    <el-descriptions-item label="Bắt đầu ca">
                        {{ formatDateTime(shiftSummary.loginTime) }}
                    </el-descriptions-item>
                    <el-descriptions-item label="Kết thúc ca">
                        {{ formatDateTime(shiftSummary.logoutTime) }}
                    </el-descriptions-item>
                    <el-descriptions-item label="Tổng số đơn (đã kết toán)">
                        {{ shiftSummary.totalOrders }}
                    </el-descriptions-item>
                    <el-descriptions-item label="Tổng số món bán">
                        {{ shiftSummary.totalItems }}
                    </el-descriptions-item>
                    <el-descriptions-item label="Tổng doanh thu">
                        <strong class="highlight">{{ formatCurrency(shiftSummary.totalRevenue) }}</strong>
                    </el-descriptions-item>
                </el-descriptions>

                <el-divider content-position="left">Chi tiết đơn hàng</el-divider>

                <div class="order-summary-list">
                    <el-empty v-if="!shiftSummary.orders.length" description="Không có đơn hàng trong ca" />
                    <el-card
                        v-for="order in (shiftSummary.orders || [])"
                        :key="order.id"
                        class="order-summary-card"
                        shadow="hover"
                    >
                        <div class="order-summary-header">
                            <div>
                                <strong>#{{ order.id }}</strong>
                                <span class="order-status" :class="(order.status || '').toLowerCase()">{{ translateStatus(order.status) }}</span>
                            </div>
                            <div class="order-meta">
                                <span>{{ order.tableName || 'Mang đi' }}</span>
                                <span>{{ formatDateTime(order.paidAt || order.createdAt) }}</span>
                            </div>
                        </div>
                        <ul class="order-items">
                            <li v-for="detail in (order.orderDetails || [])" :key="detail.id || detail.productName">
                                <span>{{ detail.productName }}</span>
                                <span>x{{ detail.quantity }}</span>
                                <span>{{ formatCurrency(detail.unitPrice) }}</span>
                                <span class="order-line-total">{{ formatCurrency(detail.totalPrice) }}</span>
                            </li>
                        </ul>
                        <div class="order-summary-footer">
                            <span>Tổng: {{ formatCurrency(order.totalAmount) }}</span>
                            <span>Giảm giá: {{ formatCurrency(order.discountAmount) }}</span>
                        </div>
                    </el-card>
                </div>
            </div>
            <template #footer>
                <div class="summary-dialog-actions">
                    <el-button @click="summaryDialogVisible = false" :disabled="isLoggingOut">Trở lại</el-button>
                    <el-button @click="printShiftSummary" :disabled="isLoggingOut || !shiftSummary">🖨️ In / Xuất PDF</el-button>
                    <el-button type="primary" @click="confirmLogoutAfterShift" :loading="isLoggingOut" :disabled="!shiftSummary">
                        Xác nhận đăng xuất
                    </el-button>
                </div>
            </template>
        </el-dialog>
    </el-header>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/store/auth'
import { useSidebarStore } from '@/store/sidebar'
import { buildShiftSummary } from '@/utils/shiftManager.js'
import { formatCurrency } from '@/utils/formatters.js'
import { UserCircle, ChevronDown, ChevronLeft, ChevronRight } from '@/components/icons'

const authStore = useAuthStore()
const router = useRouter()
const sidebarStore = useSidebarStore()
const toast = useToast()

const logoutDialogVisible = ref(false)
const summaryDialogVisible = ref(false)
const shiftSummary = ref(null)
const isGeneratingSummary = ref(false)
const isLoggingOut = ref(false)

const isSidebarCollapsed = computed(() => sidebarStore.isCollapsed)

const emitToggleSidebar = () => {
    sidebarStore.toggle()
}

const openLogoutDialog = () => {
    if (!authStore.user?.userId) {
        authStore.logout()
        return
    }
    logoutDialogVisible.value = true
}

const logoutWithoutShift = () => {
    if (isLoggingOut.value) return
    isLoggingOut.value = true
    try {
        authStore.logout()
    } finally {
        isLoggingOut.value = false
        logoutDialogVisible.value = false
    }
}

const logoutWithShift = () => {
    if (isGeneratingSummary.value) return
    if (!authStore.user?.userId) {
        toast.warning('Không tìm thấy thông tin người dùng. Đăng xuất trực tiếp.')
        logoutWithoutShift()
        return
    }
    isGeneratingSummary.value = true
    try {
        const summary = buildShiftSummary({
            userId: authStore.user.userId,
            logoutTime: new Date().toISOString()
        })

        if (!summary) {
            toast.warning('Không tìm thấy dữ liệu ca làm việc. Đăng xuất trực tiếp.')
            logoutWithoutShift()
            return
        }

        shiftSummary.value = summary
        summaryDialogVisible.value = true
        logoutDialogVisible.value = false
    } finally {
        isGeneratingSummary.value = false
    }
}

const confirmLogoutAfterShift = () => {
    if (isLoggingOut.value) return
    isLoggingOut.value = true
    try {
        authStore.logout()
    } finally {
        isLoggingOut.value = false
        summaryDialogVisible.value = false
        shiftSummary.value = null
    }
}

const printShiftSummary = () => {
    if (!shiftSummary.value) return

    const summary = shiftSummary.value
    const printWindow = window.open('', '_blank')

    if (!printWindow) {
        toast.error('Không thể mở cửa sổ in. Vui lòng kiểm tra trình duyệt.')
        return
    }

    const ordersHtml = summary.orders.map((order) => {
        const details = order.orderDetails.map((item) => `
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
                        ${details}
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
                    body { font-family: 'Segoe UI', sans-serif; padding: 20px; color: #1f2937; }
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
                    <div class="summary-item"><strong>Nhân viên:</strong> ${summary.fullName || summary.username || 'N/A'}</div>
                    <div class="summary-item"><strong>Mã nhân viên:</strong> ${summary.username || 'N/A'}</div>
                    <div class="summary-item"><strong>Bắt đầu ca:</strong> ${formatDateTime(summary.loginTime)}</div>
                    <div class="summary-item"><strong>Kết thúc ca:</strong> ${formatDateTime(summary.logoutTime)}</div>
                    <div class="summary-item"><strong>Tổng số đơn:</strong> ${summary.totalOrders}</div>
                    <div class="summary-item"><strong>Tổng số món:</strong> ${summary.totalItems}</div>
                    <div class="summary-item"><strong>Tổng doanh thu:</strong> ${formatCurrency(summary.totalRevenue)}</div>
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

const handleCommand = (command) => {
    if (command === 'logout') {
        openLogoutDialog()
    } else if (command === 'profile') {
        router.push('/profile')
    }
}
</script>

<style scoped>
.navbar {
    height: 70px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    background: #FDFCFB;
    border-bottom: 1px solid #E8E6E3;
    padding: 0 32px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.navbar.sidebar-collapsed {
    padding-left: 24px;
}

.sidebar-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border: none;
    border-radius: 12px;
    background: rgba(139, 115, 85, 0.12);
    color: #6F5B45;
    cursor: pointer;
    transition: background 0.2s ease, color 0.2s ease;
}

.sidebar-toggle:hover {
    background: rgba(139, 115, 85, 0.2);
    color: #4E3D2B;
}

.sidebar-toggle-icon {
    width: 20px;
    height: 20px;
}

.page-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: #212121;
    letter-spacing: -0.5px;
}

.user-menu {
    display: flex;
    align-items: center;
}

.el-dropdown-link {
    cursor: pointer;
    display: flex;
    align-items: center;
    outline: none;
    padding: 8px 16px;
    border-radius: 12px;
    transition: all 0.2s;
    gap: 8px;
}

.el-dropdown-link:hover {
    background: #EAE7E3;
}

.user-icon {
    width: 28px;
    height: 28px;
    color: #8B7355;
}

.user-name {
    font-weight: 600;
    color: #212121;
    font-size: 0.95rem;
}

.arrow-icon {
    width: 18px;
    height: 18px;
    color: #757575;
    transition: transform 0.2s;
}

.el-dropdown-link:hover .arrow-icon {
    transform: rotate(180deg);
}

.logout-dialog-text {
    margin: 0 0 16px;
    font-size: 1rem;
    color: #414141;
    line-height: 1.5;
}

.logout-dialog-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    flex-wrap: wrap;
}

.shift-summary {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.order-summary-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-height: 360px;
    overflow-y: auto;
}

.order-summary-card {
    border-radius: 12px;
}

.order-summary-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
    gap: 12px;
}

.order-status {
    margin-left: 8px;
    padding: 2px 8px;
    border-radius: 999px;
    font-size: 0.8rem;
    text-transform: uppercase;
}

.order-status.paid {
    background: #e6f7ff;
    color: #1890ff;
}

.order-status.pending {
    background: #fff7e6;
    color: #fa8c16;
}

.order-status.cancelled {
    background: #fff1f0;
    color: #f5222d;
}

.order-meta {
    display: flex;
    flex-direction: column;
    gap: 4px;
    color: #6b7280;
    font-size: 0.85rem;
    text-align: right;
}

.order-items {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    row-gap: 6px;
}

.order-items li {
    display: grid;
    grid-template-columns: 1fr auto auto auto;
    gap: 12px;
    align-items: center;
    font-size: 0.9rem;
    color: #374151;
}

.order-line-total {
    font-weight: 700;
    color: #111827;
}

.order-summary-footer {
    display: flex;
    justify-content: space-between;
    margin-top: 12px;
    font-weight: 600;
    color: #1f2937;
}

.summary-dialog-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
}

.highlight {
    color: #b45309;
}
</style>
