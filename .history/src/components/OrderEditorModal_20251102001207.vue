<template>
  <el-dialog :model-value="posStore.isModalOpen" @update:model-value="posStore.closePosModal()" :title="modalTitle"
    width="95%" top="2vh" :close-on-click-modal="false" class="order-editor-modal">
    <div v-loading="posStore.isLoading">
      <el-row :gutter="20">
        <el-col :span="10">
          <el-card class="box-card menu-card">
            <template #header>
              <el-input v-model="productSearch" placeholder="Tìm món..." :prefix-icon="Search" clearable />
            </template>
            <div class="product-list">
              <div v-for="product in filteredProducts" :key="product.id" class="product-item"
                @click="onProductClick(product)">
                <el-image :src="product.imageUrl" fit="cover" class="product-item-img">
                  <template #error>
                    <div class="image-slot-small">
                      <Picture />
                    </div>
                  </template>
                </el-image>
                <div class="product-item-info">
                  <div class="product-item-name">{{ product.name }}</div>
                  <div class="product-item-price">{{ formatCurrency(product.price) }}</div>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :span="14">
          <el-card class="box-card cart-card">
            <el-tabs v-model="activeTab">
              <el-tab-pane label="Chi tiết Đơn hàng" name="cart">
                <div class="item-list">
                  <div v-if="posStore.orderItems.length === 0" class="empty-cart">
                    <el-empty description="Chưa có món nào. Vui lòng chọn món bên trái." />
                  </div>

                  <div v-else class="cart-item" v-for="item in posStore.orderItems" :key="item.id">
                    <div class="cart-item-info">
                      <div class="cart-item-name">{{ item.productName }}</div>
                      <div class="cart-item-price">{{ formatCurrency(item.priceAtOrder) }}</div>
                      <el-input v-model="item.notes" placeholder="Ghi chú (ít đá, nhiều đường...)" size="small"
                        @change="(newNote) => onNoteChange(item.id, newNote)" class="cart-item-notes" />
                    </div>
                    <div class="cart-item-actions">
                      <el-input-number :model-value="item.quantity"
                        @change="(newQty) => onQuantityChange(item.id, newQty)" :min="1" size="small"
                        class="cart-item-qty" />
                      <el-button type="danger" plain circle :icon="Trash2" size="small"
                        @click="posStore.removeItem(item.id)" />
                    </div>
                  </div>
                </div>
              </el-tab-pane>

              <el-tab-pane label="Thanh toán" name="payment" :disabled="posStore.orderItems.length === 0">
                <div class="payment-tab">
                  <el-form-item label="Tìm khách hàng (theo SĐT hoặc Tên)">
                    <el-select v-model="selectedCustomerId" filterable remote reserve-keyword
                      placeholder="Nhập SĐT hoặc tên..." :remote-method="searchCustomers"
                      :loading="customerSearchLoading" clearable class="w-100">
                      <el-option v-for="item in customers" :key="item.id" :label="`${item.fullName} - ${item.phone}`"
                        :value="item.id" />
                    </el-select>
                  </el-form-item>

                  <el-form-item label="Mã giảm giá">
                    <el-input v-model="voucherInput" placeholder="Nhập mã voucher" :disabled="!!posStore.voucher">
                      <template #append>
                        <el-button v-if="!posStore.voucher" :icon="Ticket" @click="posStore.applyVoucher(voucherInput)">
                          Áp dụng
                        </el-button>
                        <el-button v-else :icon="X" type="danger" plain @click="posStore.removeVoucher()">
                          Gỡ bỏ
                        </el-button>
                      </template>
                    </el-input>
                  </el-form-item>

                  <el-form-item label="Chọn phương thức thanh toán">
                    <div class="payment-methods">
                      <el-button size="large" @click="onPay('CASH')" :icon="DollarSign">Tiền mặt (CASH)</el-button>
                      <el-button size="large" @click="onPay('TRANSFER')" :icon="Landmark">Chuyển khoản
                        (TRANSFER)</el-button>
                      <el-button size="large" @click="onPay('CARD')" :icon="CreditCard">Thẻ (CARD)</el-button>
                    </div>
                  </el-form-item>
                </div>
              </el-tab-pane>
            </el-tabs>

            <div class="cart-summary">
              <div class="total-row">
                <span>Tạm tính:</span>
                <span>{{ formatCurrency(posStore.subTotal) }}</span>
              </div>
              <div class="total-row discount">
                <span>Giảm giá ({{ posStore.voucher || 'N/A' }}):</span>
                <span>- {{ formatCurrency(posStore.discount) }}</span>
              </div>
              <div class="total-row final-total">
                <span>TỔNG CỘNG:</span>
                <span>{{ formatCurrency(posStore.total) }}</span>
              </div>
            </div>

          </el-card>
        </el-col>
      </el-row>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { usePosStore } from '@/store/posStore.js' // Thêm .js
import { getAvailableProducts } from '@/api/productService.js' // Thêm .js
import { searchCustomersSimple } from '@/api/customerService.js' // Thêm .js
import { formatCurrency } from '@/utils/formatters.js' // Thêm .js
import { useToast } from 'vue-toastification'
import { Search, Picture, Plus, Trash2, Ticket, X, DollarSign, Landmark, CreditCard } from '@/components/icons'

const posStore = usePosStore()
const toast = useToast()

const activeTab = ref('cart')
const productSearch = ref('')
const allProducts = ref([])
const customers = ref([])
const customerSearchLoading = ref(false)
const selectedCustomerId = ref(null)
const voucherInput = ref('')

// --- Lấy dữ liệu khi Modal được tạo ---
onMounted(async () => {
  try {
    const response = await getAvailableProducts()
    allProducts.value = response.data.content.filter(p => p.available)
  } catch (error) {
    toast.error('Lỗi khi tải danh sách món')
  }
})

// --- Computed Properties ---
const modalTitle = computed(() => {
  const table = posStore.currentTable?.name || 'Đơn hàng'
  const orderId = posStore.activeOrder?.id
  return orderId ? `Đơn hàng #${orderId} - ${table}` : `Đơn hàng mới - ${table}`
})

const filteredProducts = computed(() => {
  if (!productSearch.value) {
    return allProducts.value
  }
  return allProducts.value.filter(p =>
    p.name.toLowerCase().includes(productSearch.value.toLowerCase())
  )
})

// --- Xử lý sự kiện trong Modal ---

// Click chọn món
const onProductClick = (product) => {
  const itemData = {
    productId: product.id,
    quantity: 1,
    notes: ''
  }
  posStore.addItem(itemData)
}

// Thay đổi số lượng
const onQuantityChange = (orderDetailId, newQuantity) => {
  posStore.updateItem(orderDetailId, { quantity: newQuantity, notes: null })
}

// Thay đổi ghi chú
let noteTimer = null
const onNoteChange = (orderDetailId, newNote) => {
  clearTimeout(noteTimer)
  noteTimer = setTimeout(() => {
    posStore.updateItem(orderDetailId, { quantity: 0, notes: newNote })
  }, 700)
}

// Tìm khách hàng
let customerTimer = null
const searchCustomers = (query) => {
  if (query) {
    customerSearchLoading.value = true
    clearTimeout(customerTimer)
    customerTimer = setTimeout(async () => {
      try {
        const response = await searchCustomersSimple(query)
        customers.value = response.data.content
      } catch (e) {
        toast.error('Lỗi tìm khách hàng')
      } finally {
        customerSearchLoading.value = false
      }
    }, 500)
  } else {
    customers.value = []
  }
}

// Thanh toán
const onPay = async (paymentMethod) => {
  const success = await posStore.pay(paymentMethod, selectedCustomerId.value)
  if (success) {
    // (Modal đã tự đóng trong store)
  }
}

// Đồng bộ voucher input
watch(() => posStore.voucher, (newVoucher) => {
  if (newVoucher) {
    voucherInput.value = newVoucher
  } else {
    voucherInput.value = ''
  }
})
</script>

<style scoped>
/* Ghi đè style của el-dialog */
:deep(.order-editor-modal .el-dialog__body) {
  padding: 10px 20px 20px 20px;
  background-color: #f0f2f5;
  height: 85vh;
  /* Chiều cao cố định */
}

:deep(.order-editor-modal .el-dialog__header) {
  padding: 15px 20px;
  border-bottom: 1px solid #e4e7ed;
  margin-right: 0;
}

/* Cột Menu */
.menu-card {
  height: 80vh;
  display: flex;
  flex-direction: column;
}

:deep(.menu-card .el-card__body) {
  padding: 0;
  flex: 1;
  overflow-y: hidden;
}

.product-list {
  height: calc(80vh - 60px);
  /* 60px là header card */
  overflow-y: auto;
  padding: 15px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.product-item {
  display: flex;
  align-items: center;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.product-item:hover {
  box-shadow: var(--el-box-shadow-light);
  border-color: var(--el-color-primary);
}

.product-item-img {
  width: 50px;
  height: 50px;
  border-radius: 4px;
  flex-shrink: 0;
}

.image-slot-small {
  width: 50px;
  height: 50px;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c0c4cc;
}

.product-item-info {
  margin-left: 10px;
  overflow: hidden;
}

.product-item-name {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.product-item-price {
  font-size: 0.9rem;
  color: #606266;
}

/* Cột Giỏ hàng */
.cart-card {
  height: 80vh;
  display: flex;
  flex-direction: column;
}

:deep(.cart-card .el-card__body) {
  flex: 1;
  padding: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

:deep(.el-tabs) {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

:deep(.el-tabs__header) {
  margin: 0;
  padding: 0 20px;
}

:deep(.el-tabs__content) {
  flex: 1;
  overflow-y: auto;
}

.el-tab-pane {
  padding: 20px;
}

.empty-cart {
  padding-top: 50px;
}

.cart-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 15px 0;
  border-bottom: 1px solid #e4e7ed;
}

.cart-item-info {
  flex: 1;
  margin-right: 15px;
}

.cart-item-name {
  font-weight: 600;
  font-size: 1.05rem;
}

.cart-item-price {
  font-size: 0.9rem;
  color: #606266;
  margin-bottom: 5px;
}

.cart-item-actions {
  display: flex;
  align-items: center;
}

.cart-item-qty {
  width: 100px;
  margin-right: 10px;
}

/* Tổng kết */
.cart-summary {
  padding: 20px;
  border-top: 2px solid #e4e7ed;
}

.total-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 1rem;
}

.total-row.discount span {
  color: #F56C6C;
}

.total-row.final-total {
  font-size: 1.7rem;
  font-weight: 700;
  color: var(--el-color-primary);
  border-top: 1px dashed #c0c4cc;
  padding-top: 10px;
  margin-top: 10px;
}

/* Tab Thanh toán */
.payment-methods {
  display: flex;
  gap: 15px;
  margin-top: 10px;
}

.payment-methods .el-button {
  flex: 1;
  height: 60px;
  font-size: 1rem;
}

.w-100 {
  width: 100%;
}
</style>