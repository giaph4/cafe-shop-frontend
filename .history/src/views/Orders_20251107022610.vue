<template>
    <div class="app-page-container">
        <div class="page-header">
            <h1 class="page-title">Lịch sử Đơn hàng</h1>
        </div>

        <el-card class="box-card filter-card mb-3">
            <el-row :gutter="20">
                <el-col :span="6">
                    <el-select v-model="filters.status" placeholder="Lọc theo trạng thái" @change="fetchData" clearable
                        class="w-100">
                        <el-option label="Đang chờ (PENDING)" value="PENDING" />
                        <el-option label="Hoàn thành (PAID)" value="PAID" />
                        <el-option label="Đã hủy (CANCELLED)" value="CANCELLED" />
                    </el-select>
                </el-col>
                <el-col :span="12">
                    <el-date-picker v-model="filters.dateRange" type="daterange" range-separator="Đến"
                        start-placeholder="Từ ngày" end-placeholder="Đến ngày" @change="fetchData" :clearable="true"
                        class="w-100" />
                </el-col>
            </el-row>
        </el-card>

        <EasyDataTable v-model:server-options="serverOptions" :server-items-length="serverItemsLength"
            :headers="headers" :items="items" :loading="loading" table-class-name="data-table" theme-color="#409EFF"
            buttons-pagination>
            <template #item-id="{ id }">
                <strong>#{{ id }}</strong>
            </template>

            <template #item-createdAt="{ createdAt }">
                {{ new Date(createdAt).toLocaleString('vi-VN') }}
            </template>

            <template #item-status="{ status }">
                <el-tag :type="statusType(status)">{{ status }}</el-tag>
            </template>

            <template #item-totalAmount="{ totalAmount }">
                {{ formatCurrency(totalAmount) }}
            </template>

            <template #item-actions="item">
                <el-button type="info" plain size="small" @click="openDetailModal(item.id)">
                    Xem
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

        <OrderDetailModal v-model:visible="detailModalVisible" :order-id="selectedId" />
        
        <el-dialog v-model="paymentModalVisible" title="Thanh toán đơn hàng" width="500px">
            <div v-if="selectedOrder">
                <el-descriptions :column="1" border>
                    <el-descriptions-item label="Mã đơn">#{{ selectedOrder.id }}</el-descriptions-item>
                    <el-descriptions-item label="Bàn">{{ selectedOrder.tableName || 'Mang đi' }}</el-descriptions-item>
                    <el-descriptions-item label="Tổng tiền">
                        <strong style="color: #409EFF; font-size: 1.2rem;">{{ formatCurrency(selectedOrder.totalAmount) }}</strong>
                    </el-descriptions-item>
                </el-descriptions>

                <el-divider />

                <el-form-item label="Chọn phương thức thanh toán">
                    <div class="payment-methods">
                        <el-button 
                            size="large" 
                            @click="selectedPaymentMethod = 'CASH'" 
                            :type="selectedPaymentMethod === 'CASH' ? 'primary' : ''"
                            style="flex: 1;"
                        >
                            Tiền mặt
                        </el-button>
                        <el-button 
                            size="large" 
                            @click="selectedPaymentMethod = 'TRANSFER'" 
                            :type="selectedPaymentMethod === 'TRANSFER' ? 'primary' : ''"
                            style="flex: 1;"
                        >
                            Chuyển khoản
                        </el-button>
                        <el-button 
                            size="large" 
                            @click="selectedPaymentMethod = 'CARD'" 
                            :type="selectedPaymentMethod === 'CARD' ? 'primary' : ''"
                            style="flex: 1;"
                        >
                            Thẻ
                        </el-button>
                    </div>
                </el-form-item>
            </div>

            <template #footer>
                <el-button @click="paymentModalVisible = false">Hủy</el-button>
                <el-button 
                    type="primary" 
                    @click="handlePayment" 
                    :disabled="!selectedPaymentMethod"
                    :loading="paymentLoading"
                >
                    Xác nhận thanh toán
                </el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import EasyDataTable from 'vue3-easy-data-table'
import 'vue3-easy-data-table/dist/style.css'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/store/auth'
import { formatCurrency, formatDateISO } from '@/utils/formatters'
import { getAllOrders, getOrdersByStatus, getOrdersByDateRange, cancelOrder, payOrder } from '@/api/orderService'
import OrderDetailModal from '@/components/orders/OrderDetailModal.vue'

const toast = useToast()
const authStore = useAuthStore()

// --- State cho Bảng ---
const items = ref([])
const loading = ref(true)
const serverItemsLength = ref(0)
const serverOptions = ref({
    page: 1,
    rowsPerPage: 10,
    sortBy: 'createdAt', // Sắp xếp mặc định
    sortType: 'desc',
})

// --- State cho Modal ---
const detailModalVisible = ref(false)
const selectedId = ref(null)
const paymentModalVisible = ref(false)
const selectedOrder = ref(null)
const selectedPaymentMethod = ref(null)
const paymentLoading = ref(false)

// --- State cho Bộ lọc ---
const filters = ref({
    status: null,
    dateRange: null,
})

// --- Định nghĩa Cột cho Bảng ---
const headers = [
    { text: "Mã Đơn", value: "id", width: 80 },
    { text: "Bàn", value: "tableName", sortable: true },
    { text: "Nhân viên", value: "staffUsername", sortable: true },
    { text: "Khách hàng", value: "customerName", sortable: true },
    { text: "Ngày tạo", value: "createdAt", sortable: true },
    { text: "Tổng tiền", value: "totalAmount", sortable: true, align: 'right' },
    { text: "Trạng thái", value: "status", sortable: true, align: 'center' },
    { text: "Hành động", value: "actions", width: 180, align: 'center' },
]

// --- Hàm Tải Dữ liệu Chính ---
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
        if (filters.value.dateRange) {
            const [start, end] = filters.value.dateRange.map(d => formatDateISO(d))
            response = await getOrdersByDateRange(start, end, params)
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

// --- Xử lý Hành động ---
const openDetailModal = (id) => {
    selectedId.value = id
    detailModalVisible.value = true
}

const handleCancel = async (id) => {
    try {
        await cancelOrder(id)
        toast.success('Đã hủy đơn hàng!')
        await fetchData()
    } catch (error) {
        const msg = error.response?.data?.message || 'Lỗi khi hủy đơn hàng'
        toast.error(msg)
    }
}

const openPaymentModal = (order) => {
    selectedOrder.value = order
    selectedPaymentMethod.value = null
    paymentModalVisible.value = true
}

const handlePayment = async () => {
    if (!selectedPaymentMethod.value) {
        toast.warning('Vui lòng chọn phương thức thanh toán')
        return
    }

    paymentLoading.value = true
    try {
        await payOrder(selectedOrder.value.id, { paymentMethod: selectedPaymentMethod.value })
        toast.success('Thanh toán thành công!')
        paymentModalVisible.value = false
        await fetchData()
    } catch (error) {
        const msg = error.response?.data?.message || 'Lỗi khi thanh toán'
        toast.error(msg)
    } finally {
        paymentLoading.value = false
    }
}

// --- Helper ---
const statusType = (status) => {
    if (status === 'PAID') return 'success'
    if (status === 'CANCELLED') return 'danger'
    return 'warning' // PENDING
}

// --- Theo dõi khi phân trang/sort thay đổi ---
watch(serverOptions, (newValue, oldValue) => {
    fetchData()
}, { deep: true })

// --- Tải dữ liệu khi trang được mở ---
onMounted(() => {
    fetchData()
})
</script>

<style scoped>
.app-page-container {
    padding: 20px;
}

.filter-card {
    margin-bottom: 20px;
}

.w-100 {
    width: 100%;
}

.data-table {
    --easy-table-header-font-size: 14px;
    --easy-table-header-font-weight: 600;
    --easy-table-body-row-font-size: 14px;
}

.payment-methods {
    
    display: flex;
    gap: 10px;
    margin-top: 10px;
}
</style>