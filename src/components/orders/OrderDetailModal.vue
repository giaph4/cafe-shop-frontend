<template>
    <el-dialog 
        :model-value="visible" 
        @update:model-value="$emit('update:visible', $event)" 
        title="Chi tiết Đơn hàng"
        width="1000px"
        @open="fetchOrderDetails"
        destroy-on-close
        :append-to-body="true">
        <div v-loading="loading">
            <div v-if="order" class="order-detail-container">
                <el-descriptions :column="3" border class="mb-3">
                    <el-descriptions-item label="Mã Đơn">#{{ order.id }}</el-descriptions-item>
                    <el-descriptions-item label="Trạng thái">
                        <el-tag :type="statusType(order.status)">{{ order.status }}</el-tag>
                    </el-descriptions-item>
                    <el-descriptions-item label="Loại">
                        {{ order.type === 'AT_TABLE' ? 'Tại bàn' : 'Mang đi' }}
                    </el-descriptions-item>
                    <el-descriptions-item label="Bàn">{{ order.tableName || 'N/A' }}</el-descriptions-item>
                    <el-descriptions-item label="Nhân viên">{{ order.staffUsername }}</el-descriptions-item>
                    <el-descriptions-item label="Khách hàng" :span="2">
                        <div v-if="order.customerName">
                            <strong>{{ order.customerName }}</strong>
                            <br>
                            <small style="color: #909399;">📞 {{ order.customerPhone || 'N/A' }}</small>
                        </div>
                        <div v-else style="color: #909399;">
                            <em>Khách vãng lai</em>
                            <br>
                            <small>💡 Khách hàng được chọn khi tạo đơn hàng</small>
                        </div>
                    </el-descriptions-item>
                    <el-descriptions-item label="Ngày tạo">
                        {{ new Date(order.createdAt).toLocaleString('vi-VN') }}
                    </el-descriptions-item>
                    <el-descriptions-item label="Ngày thanh toán" :span="2">
                        {{ order.paidAt ? new Date(order.paidAt).toLocaleString('vi-VN') : 'N/A' }}
                    </el-descriptions-item>
                </el-descriptions>

                <h4 class="modal-subtitle">Danh sách món đã gọi</h4>
                <EasyDataTable :headers="orderDetailHeaders" :items="order.orderDetails" table-class-name="data-table" show-index>
                    <template #item-priceAtOrder="{ priceAtOrder }">
                        {{ formatCurrency(priceAtOrder) }}
                    </template>
                    <template #item-lineTotal="{ priceAtOrder, quantity }">
                        {{ formatCurrency(priceAtOrder * quantity) }}
                    </template>
                </EasyDataTable>

                <div class="summary-wrapper">
                    <div class="payment-info">
                        <p v-if="order.paymentMethod"><strong>Phương thức TT:</strong> {{ order.paymentMethod }}</p>
                    </div>
                    <div class="totals">
                        <div class="total-row">
                            <span>Tạm tính:</span>
                            <span>{{ formatCurrency(order.subTotal) }}</span>
                        </div>
                        <div class="total-row discount">
                            <span>Giảm giá ({{ order.voucherCode || 'N/A' }}):</span>
                            <span>- {{ formatCurrency(order.discountAmount) }}</span>
                        </div>
                        <div class="total-row final-total">
                            <span>Tổng cộng:</span>
                            <span>{{ formatCurrency(order.totalAmount) }}</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>

        <template #footer>
            <span class="dialog-footer">
                <el-button type="primary" @click="$emit('update:visible', false)">Đóng</el-button>
            </span>
        </template>
    </el-dialog>
</template>

<script setup>
import { ref } from 'vue'
import { getOrderById } from '@/api/orderService.js'
import { formatCurrency } from '@/utils/formatters.js'
import { useToast } from 'vue-toastification'
import EasyDataTable from 'vue3-easy-data-table'
import 'vue3-easy-data-table/dist/style.css'

const props = defineProps({
    visible: Boolean,
    orderId: Number,
})

const emit = defineEmits(['update:visible'])
const toast = useToast()
const loading = ref(false)
const order = ref(null)

const orderDetailHeaders = [
    { text: "Tên món", value: "productName", minWidth: 250 },
    { text: "Số lượng", value: "quantity", width: 100 },
    { text: "Đơn giá", value: "priceAtOrder", width: 150 },
    { text: "Thành tiền", value: "lineTotal", width: 150 },
    { text: "Ghi chú", value: "notes", minWidth: 200 }
]

const fetchOrderDetails = async () => {
    if (!props.orderId) return

    loading.value = true
    order.value = null
    try {
        console.log('=== FETCHING ORDER DETAILS ===')
        console.log('Order ID:', props.orderId)
        
        const response = await getOrderById(props.orderId)
        order.value = response.data
        
        console.log('=== RECEIVED ORDER DATA ===')
        console.log('Full order object:', order.value)
        console.log('Customer ID from API:', order.value.customerId)
        console.log('Customer Name from API:', order.value.customerName)
        console.log('Customer Phone from API:', order.value.customerPhone)
        
    } catch (error) {
        console.error('Error fetching order details:', error)
        toast.error('Lỗi khi tải chi tiết đơn hàng.')
    } finally {
        loading.value = false
    }
}

const statusType = (status) => {
    if (status === 'PAID') return 'success'
    if (status === 'CANCELLED') return 'danger'
    return 'warning' // PENDING
}
</script>

<style scoped>
.modal-subtitle {
    margin-top: 15px;
    margin-bottom: 10px;
    font-weight: 600;
}

.summary-wrapper {
    display: flex;
    justify-content: space-between;
    margin-top: 20px;
}

.payment-info {
    font-size: 0.9rem;
    color: #606266;
}

.totals {
    width: 300px;
    font-size: 1rem;
}

.total-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
}

.total-row.discount span {
    color: #F56C6C;
}

.total-row.final-total {
    font-size: 1.25rem;
    font-weight: 700;
    border-top: 1px solid #ebeef5;
    padding-top: 10px;
    margin-top: 10px;
}
</style>
