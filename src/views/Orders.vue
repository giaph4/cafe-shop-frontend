<template>
    <div class="app-page-container animate__animated animate__fadeInUp stagger-item">
        <div class="section-header mb-4">
            <h1 class="section-title">Lịch sử Đơn hàng</h1>
        </div>

        <el-card class="filter-card mb-4">
            <el-row :gutter="20">
                <el-col :span="6">
                    <el-select v-model="filters.status" placeholder="Lọc theo trạng thái" @change="fetchData" clearable
                               class="w-100">
                        <el-option label="Đang chờ (PENDING)" value="PENDING"/>
                        <el-option label="Hoàn thành (PAID)" value="PAID"/>
                        <el-option label="Đã hủy (CANCELLED)" value="CANCELLED"/>
                    </el-select>
                </el-col>
                <el-col :span="6">
                    <el-date-picker
                        v-model="filters.startDate"
                        type="date"
                        placeholder="Từ ngày"
                        @change="fetchData"
                        :clearable="true"
                        class="w-100"
                        format="DD/MM/YYYY"
                        value-format="YYYY-MM-DD"
                    />
                </el-col>
                <el-col :span="6">
                    <el-date-picker
                        v-model="filters.endDate"
                        type="date"
                        placeholder="Đến ngày"
                        @change="fetchData"
                        :clearable="true"
                        class="w-100"
                        format="DD/MM/YYYY"
                        value-format="YYYY-MM-DD"
                    />
                </el-col>
            </el-row>
        </el-card>

        <EasyDataTable v-model:server-options="serverOptions" :server-items-length="serverItemsLength"
                       :headers="headers" :items="items" :loading="loading" table-class-name="data-table"
                       buttons-pagination show-index>
            <template #item-id="{ id }">
                <strong>#{{ id }}</strong>
            </template>

            <template #item-createdAt="{ createdAt }">
                {{ new Date(createdAt).toLocaleString('vi-VN') }}
            </template>

            <template #item-status="{ status }">
                <span class="status-tag" :class="status.toLowerCase()">{{ getStatusLabel(status) }}</span>
            </template>

            <template #item-totalAmount="{ totalAmount }">
                {{ formatCurrency(totalAmount) }}
            </template>

            <template #item-actions="item">
                <el-button type="info" plain size="small" @click="openDetailModal(item.id)">
                    Xem
                </el-button>

                <el-button v-if="item.status === 'PAID'" type="success" plain size="small" @click="printBill(item)">
                    🖨️ In Bill
                </el-button>

                <el-button v-if="item.status === 'PENDING'" type="success" size="small" @click="openPaymentModal(item)">
                    Thanh toán
                </el-button>

                <el-popconfirm v-if="item.status === 'PENDING' && authStore.isAdmin"
                               title="Bạn chắc chắn muốn HỦY đơn hàng này?" @confirm="handleCancel(item.id)">
                    <template #reference>
                        <el-button type="danger" plain size="small">Hủy đơn</el-button>
                    </template>
                </el-popconfirm>
            </template>
        </EasyDataTable>

        <OrderDetailModal v-model:visible="detailModalVisible" :order-id="selectedId"/>

        <el-dialog v-model="paymentModalVisible" class="modern-dialog" :show-close="true" width="520px">
            <template #header>
                <div class="modal-header">
                    <h3 class="modal-title">Thanh toán đơn hàng</h3>
                </div>
            </template>
            <div v-if="selectedOrder">
                <el-descriptions :column="1" border class="modal-section">
                    <el-descriptions-item label="Mã đơn">#{{ selectedOrder.id }}</el-descriptions-item>
                    <el-descriptions-item label="Bàn">{{ selectedOrder.tableName || 'Mang đi' }}</el-descriptions-item>
                    <el-descriptions-item label="Tổng tiền">
                        <strong class="modal-highlight">{{ formatCurrency(selectedOrder.totalAmount) }}</strong>
                    </el-descriptions-item>
                </el-descriptions>

                <el-divider/>

                <div class="modal-note">
                    <p>💡 Để thêm thông tin khách hàng, vui lòng cập nhật khi tạo đơn hàng</p>
                    <p>Khách hàng nên được chọn ngay từ lúc tạo đơn để đảm bảo thông tin đầy đủ</p>
                </div>

                <el-divider/>

                <h3 class="modal-subtitle">Phương thức thanh toán</h3>

                <el-form-item>
                    <div class="payment-methods">
                        <el-button
                            size="large"
                            @click="selectedPaymentMethod = 'CASH'"
                            :type="selectedPaymentMethod === 'CASH' ? 'primary' : ''"
                        >
                            Tiền mặt
                        </el-button>
                        <el-button
                            size="large"
                            @click="selectedPaymentMethod = 'TRANSFER'"
                            :type="selectedPaymentMethod === 'TRANSFER' ? 'primary' : ''"
                        >
                            Chuyển khoản
                        </el-button>
                        <el-button
                            size="large"
                            @click="selectedPaymentMethod = 'CARD'"
                            :type="selectedPaymentMethod === 'CARD' ? 'primary' : ''"
                        >
                            Thẻ
                        </el-button>
                    </div>
                </el-form-item>
            </div>

            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="paymentModalVisible = false">Hủy</el-button>
                    <el-button
                        type="primary"
                        @click="handlePayment"
                        :disabled="!selectedPaymentMethod"
                        :loading="paymentLoading"
                    >
                        Xác nhận thanh toán
                    </el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import {ref, onMounted, watch} from 'vue'
import EasyDataTable from 'vue3-easy-data-table'
import 'vue3-easy-data-table/dist/style.css'
import {useToast} from 'vue-toastification'
import {useAuthStore} from '@/store/auth'
import {formatCurrency} from '@/utils/formatters'
import {
    getAllOrders,
    getOrdersByStatus,
    getOrdersByDateRange,
    cancelOrder,
    payOrder,
    getOrderById
} from '@/api/orderService'
import OrderDetailModal from '@/components/orders/OrderDetailModal.vue'

const toast = useToast()
const authStore = useAuthStore()

const items = ref([])
const loading = ref(true)
const serverItemsLength = ref(0)
const serverOptions = ref({
    page: 1,
    rowsPerPage: 10,
    sortBy: 'createdAt', // Sắp xếp mặc định
    sortType: 'desc',
})

const detailModalVisible = ref(false)
const selectedId = ref(null)
const paymentModalVisible = ref(false)
const selectedOrder = ref(null)
const selectedPaymentMethod = ref(null)
const paymentLoading = ref(false)

const filters = ref({
    status: null,
    startDate: null,
    endDate: null,
})

const headers = [
    {text: "Mã Đơn", value: "id", width: 80},
    {text: "Bàn", value: "tableName", sortable: true},
    {text: "Nhân viên", value: "staffUsername", sortable: true},
    {text: "Khách hàng", value: "customerName", sortable: true},
    {text: "Ngày tạo", value: "createdAt", sortable: true},
    {text: "Tổng tiền", value: "totalAmount", sortable: true, align: 'right'},
    {text: "Trạng thái", value: "status", sortable: true, align: 'center'},
    {text: "Hành động", value: "actions", width: 180, align: 'center'},
]

const fetchData = async () => {
    loading.value = true
    try {
        const params = {
            page: serverOptions.value.page - 1,
            size: serverOptions.value.rowsPerPage,
            sort: `${serverOptions.value.sortBy},${serverOptions.value.sortType}`,
        }

        let response;
        // API backend của bạn tách biệt 3 hàm
        if (filters.value.startDate && filters.value.endDate) {
            // Cả hai ngày đều có giá trị
            response = await getOrdersByDateRange(filters.value.startDate, filters.value.endDate, params)
        } else if (filters.value.status) {
            response = await getOrdersByStatus(filters.value.status, params)
        } else {
            response = await getAllOrders(params)
        }

        items.value = response.data.content
        serverItemsLength.value = response.data.totalElements

    } catch (error) {
        toast.error('Lỗi khi tải danh sách đơn hàng')
    } finally {
        loading.value = false
    }
}

const handlePayment = async () => {
    if (!selectedPaymentMethod.value) {
        toast.warning('Vui lòng chọn phương thức thanh toán')
        return
    }

    paymentLoading.value = true
    try {
        await payOrder(selectedOrder.value.id, {paymentMethod: selectedPaymentMethod.value})

        const response = await getOrderById(selectedOrder.value.id)
        const updatedOrder = response.data

        const billContent = generateBillContent(updatedOrder)
        downloadBill(billContent, `bill_${updatedOrder.id}.txt`)

        toast.success('Thanh toán thành công! Đã tạo bill.')
        paymentModalVisible.value = false
        await fetchData()
    } catch (error) {
        const msg = error.response?.data?.message || 'Lỗi khi thanh toán'
        toast.error(msg)
    } finally {
        paymentLoading.value = false
    }
}

const openPaymentModal = (order) => {
    selectedOrder.value = order
    selectedPaymentMethod.value = null
    paymentModalVisible.value = true
}

const printBill = async (order) => {
    try {
        // Fetch full order details if not available
        let fullOrder = order
        if (!order.orderDetails) {
            const response = await getOrderById(order.id)
            fullOrder = response.data
        }

        const billContent = generateBillContent(fullOrder)
        downloadBill(billContent, `bill_${fullOrder.id}.txt`)
        toast.success('Đã tạo bill thành công!')
    } catch (error) {
        console.error('Error printing bill:', error)
        toast.error('Lỗi khi tạo bill')
    }
}

const generateBillContent = (order) => {
    const date = new Date(order.createdAt).toLocaleString('vi-VN')
    const paidDate = order.paidAt ? new Date(order.paidAt).toLocaleString('vi-VN') : 'N/A'

    let bill = `
══════════════════════════════════════════
           COFFEE SHOP - HOA BILL
══════════════════════════════════════════

Mã đơn: #${order.id}
Bàn: ${order.tableName || 'Mang đi'}
Loại: ${order.type === 'AT_TABLE' ? 'Tại bàn' : 'Mang đi'}
Nhân viên: ${order.staffUsername}
Khách hàng: ${order.customerName || 'Khách vãng lai'}
SĐT: ${order.customerPhone || 'N/A'}

Ngày tạo: ${date}
Ngày thanh toán: ${paidDate}
Phương thức: ${order.paymentMethod || 'N/A'}

══════════════════════════════════════════
                 CHI TIẾT ĐƠN HÀNG
══════════════════════════════════════════

`

    order.orderDetails.forEach((item, index) => {
        bill += `${index + 1}. ${item.productName}\n`
        bill += `   Số lượng: ${item.quantity}\n`
        bill += `   Đơn giá: ${formatCurrency(item.priceAtOrder)}\n`
        bill += `   Thành tiền: ${formatCurrency(item.priceAtOrder * item.quantity)}\n`
        if (item.notes) {
            bill += `   Ghi chú: ${item.notes}\n`
        }
        bill += `\n`
    })

    bill += `══════════════════════════════════════════\n`
    bill += `Tổng tiền: ${formatCurrency(order.subTotal)}\n`
    if (order.discountAmount > 0) {
        bill += `Giảm giá: -${formatCurrency(order.discountAmount)}\n`
    }
    bill += `THÀNH TIỀN: ${formatCurrency(order.totalAmount)}\n`
    bill += `══════════════════════════════════════════\n\n`

    bill += `Cảm ơn quý khách đã ghé thăm!\n`
    bill += `Hẹn gặp lại quý khách lần sau!\n\n`

    bill += `Thời gian in: ${new Date().toLocaleString('vi-VN')}\n`

    return bill
}

const downloadBill = (content, filename) => {
    const blob = new Blob([content], {type: 'text/plain;charset=utf-8'})
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
}

const handleCancel = async (orderId) => {
    try {
        await cancelOrder(orderId)
        toast.success('Đã hủy đơn hàng thành công')
        await fetchData()
    } catch (error) {
        const msg = error.response?.data?.message || 'Lỗi khi hủy đơn hàng'
        toast.error(msg)
    }
}

const openDetailModal = (orderId) => {
    selectedId.value = orderId
    detailModalVisible.value = true
}

const getStatusLabel = (status) => {
    if (status === 'PAID') return 'Đã thanh toán'
    if (status === 'CANCELLED') return 'Đã hủy'
    return 'Chờ thanh toán' // PENDING
}

watch(serverOptions, (newValue, oldValue) => {
    fetchData()
}, {deep: true})

onMounted(() => {
    fetchData()
})
</script>

<style scoped>
.modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 var(--space-4);
}

.modal-title {
    font-size: var(--font-h4);
    font-weight: var(--font-semibold);
    color: var(--text-primary-color);
}

.modal-highlight {
    color: var(--color-primary);
    font-size: var(--font-h4);
    font-weight: var(--font-semibold);
}

.modal-note {
    text-align: center;
    color: var(--text-secondary-color);
    font-size: var(--font-body-sm);
    line-height: 1.6;
    padding: 0 var(--space-4);
}

@media (max-width: 768px) {
    .modal-header {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--space-2);
    }
}
</style>
