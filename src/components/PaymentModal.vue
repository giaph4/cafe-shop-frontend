<template>
  <el-dialog :model-value="visible" @update:model-value="$emit('update:visible', $event)" title="Thanh toán Đơn hàng"
    width="600px" :close-on-click-modal="false">
    <div v-loading="loading">
      <div v-if="orderData" class="payment-content">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="Mã đơn">#{{ orderData.id }}</el-descriptions-item>
          <el-descriptions-item label="Bàn">{{ orderData.tableName || 'Mang đi' }}</el-descriptions-item>
          <el-descriptions-item label="Nhân viên">{{ orderData.staffUsername }}</el-descriptions-item>
          <el-descriptions-item label="Khách hàng">{{ orderData.customerName || 'Khách vãng lai' }}</el-descriptions-item>
        </el-descriptions>

        <div class="order-summary">
          <div class="summary-row">
            <span>Tạm tính:</span>
            <span>{{ formatCurrency(orderData.subTotal) }}</span>
          </div>
          <div class="summary-row discount">
            <span>Giảm giá:</span>
            <span>- {{ formatCurrency(orderData.discountAmount) }}</span>
          </div>
          <div class="summary-row total">
            <span>TỔNG CỘNG:</span>
            <span>{{ formatCurrency(orderData.totalAmount) }}</span>
          </div>
        </div>

        <el-form-item label="Chọn phương thức thanh toán">
          <div class="payment-methods">
            <el-button size="large" @click="selectedMethod = 'CASH'" :icon="DollarSign"
              :type="selectedMethod === 'CASH' ? 'primary' : ''">
              Tiền mặt
            </el-button>
            <el-button size="large" @click="selectedMethod = 'TRANSFER'" :icon="Landmark"
              :type="selectedMethod === 'TRANSFER' ? 'primary' : ''">
              Chuyển khoản
            </el-button>
            <el-button size="large" @click="selectedMethod = 'CARD'" :icon="CreditCard"
              :type="selectedMethod === 'CARD' ? 'primary' : ''">
              Thẻ
            </el-button>
          </div>
        </el-form-item>
      </div>
    </div>

    <template #footer>
      <el-button @click="$emit('update:visible', false)">Hủy</el-button>
      <el-button type="primary" @click="handlePay" :disabled="!selectedMethod" :loading="loading">
        Xác nhận Thanh toán
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import { getOrderById, payOrder } from '@/api/orderService'
import { formatCurrency } from '@/utils/formatters'
import { DollarSign, Landmark, CreditCard } from '@/components/icons'

const props = defineProps({
  visible: Boolean,
  orderId: Number
})

const emit = defineEmits(['update:visible', 'success'])

const toast = useToast()
const loading = ref(false)
const orderData = ref(null)
const selectedMethod = ref(null)

const loadOrderData = async () => {
  if (!props.orderId) return
  loading.value = true
  try {
    const response = await getOrderById(props.orderId)
    orderData.value = response.data
  } catch (error) {
    toast.error('Lỗi khi tải thông tin đơn hàng')
  } finally {
    loading.value = false
  }
}

const handlePay = async () => {
  loading.value = true
  try {
    await payOrder(props.orderId, { paymentMethod: selectedMethod.value })
    toast.success('Thanh toán thành công!')
    emit('success')
    emit('update:visible', false)
  } catch (error) {
    const msg = error.response?.data?.message || 'Lỗi khi thanh toán'
    toast.error(msg)
  } finally {
    loading.value = false
  }
}

watch(() => props.visible, (newVal) => {
  if (newVal) {
    selectedMethod.value = null
    loadOrderData()
  }
})
</script>

<style scoped>
.payment-content {
  padding: 10px 0;
}

.order-summary {
  margin: 20px 0;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 1rem;
}

.summary-row.discount {
  color: #F56C6C;
}

.summary-row.total {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--el-color-primary);
  border-top: 2px solid #dcdfe6;
  padding-top: 10px;
  margin-top: 10px;
}

.payment-methods {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.payment-methods .el-button {
  flex: 1;
  height: 60px;
}
</style>
