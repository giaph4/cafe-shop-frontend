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
                   theme-color="#8B7355"
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

    <el-dialog v-model="paymentModalVisible" title="Thanh toán đơn hàng" width="500px">
      <div v-if="selectedOrder">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="Mã đơn">#{{ selectedOrder.id }}</el-descriptions-item>
          <el-descriptions-item label="Bàn">{{ selectedOrder.tableName || 'Mang đi' }}</el-descriptions-item>
          <el-descriptions-item label="Tổng tiền">
            <strong style="color: #409EFF; font-size: 1.2rem;">{{ formatCurrency(selectedOrder.totalAmount) }}</strong>
          </el-descriptions-item>
        </el-descriptions>

        <el-divider/>

        <div style="text-align: center; color: #909399; font-size: 0.9rem;">
          <p>💡 Để thêm thông tin khách hàng, vui lòng cập nhật khi tạo đơn hàng</p>
          <p>Khách hàng nên được chọn ngay từ lúc tạo đơn để đảm bảo thông tin đầy đủ</p>
        </div>

        <el-divider/>

        <h3>Phương thức thanh toán</h3>

        <el-form-item>
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
import {ref, onMounted, watch} from 'vue'
import EasyDataTable from 'vue3-easy-data-table'
import 'vue3-easy-data-table/dist/style.css'
import {useToast} from 'vue-toastification'
import {useAuthStore} from '@/store/auth'
import {formatCurrency} from '@/utils/formatters'
import {getAllOrders, getOrdersByStatus, getOrdersByDateRange, cancelOrder, payOrder, getOrderById} from '@/api/orderService'
import OrderDetailModal from '@/components/OrderDetailModal.vue'

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

    // Fetch updated order data for bill printing
    const response = await getOrderById(selectedOrder.value.id)
    const updatedOrder = response.data

    // Auto-generate bill after payment
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
    bill += `   Thành tiền: ${formatCurrency(item.lineTotal)}\n`
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

<style>
/* FORCE BROWN THEME FOR THIS PAGE */
.vue3-easy-data-table thead {
  background: linear-gradient(135deg, #8B7355 0%, #6F5B45 100%) !important;
}

.vue3-easy-data-table th {
  background: transparent !important;
  color: #FFFFFF !important;
}

.vue3-easy-data-table .header-text {
  color: #FFFFFF !important;
}

.vue3-easy-data-table .buttons-pagination button.pagination__active-button {
  background: linear-gradient(135deg, #8B7355 0%, #6F5B45 100%) !important;
  color: #FFFFFF !important;
}
</style>

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

/* vue3-easy-data-table styles */
:deep(.vue3-easy-data-table) {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 2px solid #E0E0E0;
  background: #FFFFFF;
}

:deep(.vue3-easy-data-table__main) {
  background: #FFFFFF;
}


:deep(.vue3-easy-data-table thead tr) {
  background: transparent !important;
}

:deep(.vue3-easy-data-table th) {
  background: transparent !important;
  color: #FFFFFF !important;
  font-weight: 700 !important;
  font-size: 0.875rem !important;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 18px 20px !important;
  border: none !important;
}

:deep(.vue3-easy-data-table .header-text) {
  color: #FFFFFF !important;
  font-weight: 700 !important;
}

:deep(.vue3-easy-data-table .sortable) {
  cursor: pointer;
}

:deep(.vue3-easy-data-table .sortable .sortType-icon) {
  color: #FFFFFF !important;
  opacity: 0.7;
}

:deep(.vue3-easy-data-table .sortable:hover .sortType-icon) {
  opacity: 1;
}


:deep(.vue3-easy-data-table td) {
  padding: 16px 20px !important;
  font-size: 1rem !important;
  font-weight: 500 !important;
  color: #424242 !important;
  border: none !important;
}

:deep(.vue3-easy-data-table .buttons-pagination) {
  padding: 16px 20px;
  background: #FAFAFA;
  border-top: 2px solid #E0E0E0;
}

:deep(.vue3-easy-data-table .buttons-pagination button) {
  background: #FFFFFF;
  border: 2px solid #E0E0E0;
  border-radius: 8px;
  padding: 8px 12px;
  font-weight: 600;
  color: #424242;
  transition: all 0.2s;
}

:deep(.vue3-easy-data-table .buttons-pagination button:hover:not(.pagination__active-button)) {
  background: #F5F5F5;
  border-color: #2196F3;
  color: #2196F3;
}

:deep(.vue3-easy-data-table .buttons-pagination button.pagination__active-button) {
  background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
  border-color: #2196F3;
  color: #FFFFFF;
  font-weight: 700;
}

.status-tag {
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.status-tag.pending {
  background: #FFF3E0;
  color: #FF9800;
  border: 2px solid #FF9800;
}

.status-tag.paid {
  background: #E8F5E9;
  color: #4CAF50;
  border: 2px solid #4CAF50;
}

.status-tag.cancelled {
  background: #FFEBEE;
  color: #F44336;
  border: 2px solid #F44336;
}

.payment-methods {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.payment-methods .el-button {
  flex: 1;
  height: 70px;
  font-size: 1.1rem;
  font-weight: 700;
  border-radius: 12px;
}
</style>
