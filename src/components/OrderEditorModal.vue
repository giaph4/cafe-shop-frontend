<template>
  <el-drawer
    :model-value="posStore.isModalOpen"
    @update:model-value="posStore.closePosModal()"
    :title="modalTitle"
    direction="rtl"
    size="95%"
    :close-on-click-modal="false"
    class="order-editor-drawer">
    <div v-loading="posStore.isLoading">
      <el-row :gutter="20">
        <el-col :span="10">
          <el-card class="menu-card" shadow="hover">
            <template #header>
              <div class="menu-card-header">
                <span class="section-title">🍝 Menu</span>
                <el-tag type="info" size="small">{{ filteredProducts.length }} món</el-tag>
              </div>
            </template>
            <div class="menu-header">
              <el-input v-model="productSearch" placeholder="Tìm món..." :prefix-icon="Search" clearable />
              <el-select v-model="selectedCategory" placeholder="Danh mục" clearable class="w-100" style="margin-top: 12px;">
                <el-option label="Tất cả" :value="null" />
                <el-option v-for="cat in categories" :key="cat.id" :label="cat.name" :value="cat.id" />
              </el-select>
            </div>
            <div class="product-list">
              <div v-for="product in filteredProducts" :key="product.id" 
                   class="product-item hover-lift"
                   @click="onProductClick(product)">
                <el-badge :value="'+1'" class="item-badge" type="success">
                  <el-image :src="product.imageUrl" fit="cover" class="product-item-img">
                    <template #error>
                      <div class="image-slot-small">
                        <Picture />
                      </div>
                    </template>
                  </el-image>
                </el-badge>
                <div class="product-item-info">
                  <div class="product-item-name">{{ product.name }}</div>
                  <div class="product-item-price">{{ formatCurrency(product.price) }}</div>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :span="14">
          <el-card class="box-card cart-card" shadow="hover">
            <template #header>
              <div class="cart-card-header">
                <span class="section-title">🛒 Đơn hàng</span>
                <el-tag :type="posStore.orderItems.length > 0 ? 'success' : 'info'" size="small">
                  {{ posStore.orderItems.length }} món
                </el-tag>
              </div>
            </template>
            <el-tabs v-model="activeTab" class="order-tabs">
              <el-tab-pane label="Chi tiết Đơn hàng" name="cart">
                <div class="item-list">
                  <div v-if="posStore.orderItems.length === 0" class="empty-cart">
                    <el-empty description="Chưa có món nào. Vui lòng chọn món bên trái." />
                  </div>

                  <div v-else class="cart-item" v-for="(item, index) in posStore.orderItems" :key="item.id">
                    <div class="cart-item-index">{{ index + 1 }}</div>
                    <div class="cart-item-info">
                      <div class="cart-item-name">
                        <el-icon class="item-icon"><Picture /></el-icon>
                        {{ item.productName }}
                      </div>
                      <div class="cart-item-price">{{ formatCurrency(item.priceAtOrder) }} x {{ item.quantity }}</div>
                      <el-input :model-value="item.notes" placeholder="📝 Ghi chú..." size="small"
                        @input="(newNote) => onNoteChange(item.id, newNote)" class="cart-item-notes" />
                    </div>
                    <div class="cart-item-actions">
                      <el-input-number :model-value="item.quantity"
                        @change="(newQty) => onQuantityChange(item.id, newQty)" :min="1" size="small"
                        class="cart-item-qty" />
                      <el-button type="danger" plain circle :icon="Trash2" size="small"
                        @click="posStore.removeItem(item.id)" class="delete-btn" />
                    </div>
                  </div>
                </div>
                <div class="order-actions-bottom">
                  <el-button v-if="posStore.isQuickOrder && posStore.orderItems.length > 0" type="primary" @click="activeTab = 'selectTable'">
                    Tiếp theo: Chọn bàn
                  </el-button>
                  <el-button v-if="posStore.isEditing" type="danger" plain @click="posStore.cancelOrder()">
                    Hủy Đơn
                  </el-button>
                  <el-button v-if="posStore.isEditing" type="primary" @click="onConfirmOrderDetails()">
                    Xác nhận
                  </el-button>
                </div>
              </el-tab-pane>

              <el-tab-pane v-if="posStore.isQuickOrder" label="Chọn bàn" name="selectTable" :disabled="posStore.orderItems.length === 0">
                <div class="table-selection">
                  <el-alert type="info" :closable="false" style="margin-bottom: 20px;">
                    <template #title>
                      Bạn đã chọn {{ posStore.orderItems.length }} món. Vui lòng chọn bàn để tạo đơn hàng.
                    </template>
                  </el-alert>
                  <el-input
                    v-model="tableSearch"
                    placeholder="Tìm bàn..."
                    clearable
                    style="margin-bottom: 20px;"
                  >
                    <template #prefix>
                      <el-icon><Search /></el-icon>
                    </template>
                  </el-input>
                  <div class="table-grid-modal">
                    <el-card v-for="table in filteredTables" :key="table.id" class="table-card-modal"
                      :class="getTableClass(table.status)" shadow="hover" @click="onSelectTable(table)">
                      <div class="table-name">{{ table.name }}</div>
                      <div class="table-status">{{ getStatusText(table.status) }}</div>
                      <div class="table-capacity">{{ table.capacity }} chỗ</div>
                    </el-card>
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
                        <el-button v-else :icon="Close" type="danger" plain @click="posStore.removeVoucher()">
                          Gỡ bỏ
                        </el-button>
                      </template>
                    </el-input>
                  </el-form-item>

                  <el-form-item label="Chọn phương thức thanh toán">
                    <div class="payment-methods">
                      <el-button size="large" @click="selectedPaymentMethod = 'CASH'" :icon="DollarSign"
                        :type="selectedPaymentMethod === 'CASH' ? 'primary' : ''">Tiền mặt (CASH)</el-button>
                      <el-button size="large" @click="selectedPaymentMethod = 'TRANSFER'" :icon="Landmark"
                        :type="selectedPaymentMethod === 'TRANSFER' ? 'primary' : ''">Chuyển khoản
                        (TRANSFER)</el-button>
                      <el-button size="large" @click="selectedPaymentMethod = 'CARD'" :icon="CreditCard"
                        :type="selectedPaymentMethod === 'CARD' ? 'primary' : ''">Thẻ (CARD)</el-button>
                    </div>
                  </el-form-item>
                </div>
                <div class="payment-actions-bottom">
                  <el-button type="primary" size="large" :disabled="!selectedPaymentMethod" @click="onPay(selectedPaymentMethod)">
                    Thanh Toán
                  </el-button>
                </div>
              </el-tab-pane>
            </el-tabs>

            <div class="cart-summary">
              <div class="summary-gradient">
                <div class="total-row">
                  <span>💵 Tạm tính:</span>
                  <span>{{ formatCurrency(posStore.subTotal) }}</span>
                </div>
                <div class="total-row discount" v-if="posStore.discount > 0">
                  <span>🎟️ Giảm giá:</span>
                  <span>- {{ formatCurrency(posStore.discount) }}</span>
                </div>
                <div class="total-row final-total">
                  <span>💰 TỔNG CỘNG:</span>
                  <span>{{ formatCurrency(posStore.total) }}</span>
                </div>
              </div>
            </div>

          </el-card>
        </el-col>
      </el-row>
    </div>
  </el-drawer>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { usePosStore } from '@/store/posStore.js'
import { getAvailableProducts } from '@/api/productService.js'
import { getAllCategories } from '@/api/categoryService.js'
import { searchCustomersSimple } from '@/api/customerService.js'
import { getAllTables } from '@/api/tableService.js'
import { formatCurrency } from '@/utils/formatters.js'
import { useToast } from 'vue-toastification'
import { Search, Trash2, Ticket, DollarSign, Landmark, CreditCard } from '@/components/icons/index.js'
import { Picture, Plus, Close } from '@element-plus/icons-vue'

const posStore = usePosStore()
const toast = useToast()

const activeTab = ref('cart')
const productSearch = ref('')
const selectedCategory = ref(null)
const tableSearch = ref('')
const allProducts = ref([])
const categories = ref([])
const customers = ref([])
const customerSearchLoading = ref(false)
const selectedCustomerId = ref(null)
const voucherInput = ref('')
const selectedPaymentMethod = ref(null)
const availableTables = ref([])

onMounted(async () => {
  try {
    const response = await getAvailableProducts()
    allProducts.value = response.data.content.filter(p => p.available)
    
    // Fetch categories
    const catResponse = await getAllCategories()
    categories.value = catResponse.data
  } catch (error) {
    toast.error('Lỗi khi tải danh sách món')
  }
})

const modalTitle = computed(() => {
  if (posStore.isQuickOrder && !posStore.activeOrder) {
    return 'Bán hàng nhanh - Chọn món trước'
  }
  const table = posStore.currentTable?.name || 'Đơn hàng'
  const orderId = posStore.activeOrder?.id
  return orderId ? `Đơn hàng #${orderId} - ${table}` : `Đơn hàng mới - ${table}`
})

const filteredProducts = computed(() => {
  let result = allProducts.value
  
  // Filter by search
  if (productSearch.value) {
    result = result.filter(p =>
      p.name.toLowerCase().includes(productSearch.value.toLowerCase())
    )
  }
  
  // Filter by category
  if (selectedCategory.value) {
    const selectedCat = categories.value.find(c => c.id === selectedCategory.value)
    if (selectedCat) {
      result = result.filter(p => p.categoryName === selectedCat.name)
    }
  }
  
  return result
})

const filteredTables = computed(() => {
  if (!tableSearch.value) {
    return availableTables.value
  }
  return availableTables.value.filter(t =>
    t.name.toLowerCase().includes(tableSearch.value.toLowerCase())
  )
})

const onProductClick = (product) => {
  const itemData = {
    productId: product.id,
    quantity: 1,
    notes: ''
  }
  posStore.addItem(itemData)
}

const onQuantityChange = (orderDetailId, newQuantity) => {
  posStore.updateItem(orderDetailId, { quantity: newQuantity, notes: null })
}

const onNoteChange = (orderDetailId, newNote) => {
  // Lưu ngay lập tức, không delay
  const currentItem = posStore.orderItems.find(item => item.id === orderDetailId)
  if (currentItem) {
    posStore.updateItem(orderDetailId, { quantity: currentItem.quantity, notes: newNote })
  }
}

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

const onConfirmOrderDetails = () => {
  if (!posStore.currentTable?.id) {
    // Nếu là đơn mang đi, chuyển sang tab thanh toán
    activeTab.value = 'payment'
  } else {
    // Nếu là đơn tại bàn, đóng modal
    posStore.closePosModal()
  }
}

const onPay = async (paymentMethod) => {
  const success = await posStore.pay(paymentMethod, selectedCustomerId.value)
  if (success) {
    // (Modal đã tự đóng trong store)
  }
}

watch(() => posStore.voucher, (newVoucher) => {
  if (newVoucher) {
    voucherInput.value = newVoucher
  } else {
    voucherInput.value = ''
  }
})

watch(() => posStore.isModalOpen, (newValue) => {
  if (!newValue) {
    // Reset selectedPaymentMethod when modal closes
    selectedPaymentMethod.value = null
  } else if (posStore.isQuickOrder) {
    // Load tables when quick order modal opens
    loadTables()
  }
})

const loadTables = async () => {
  try {
    const response = await getAllTables()
    availableTables.value = response.data.filter(t => t.status === 'EMPTY' || t.status === 'SERVING')
  } catch (error) {
    toast.error('Lỗi khi tải danh sách bàn')
  }
}

const getStatusText = (status) => {
  if (status === 'SERVING') return 'Đang phục vụ'
  if (status === 'RESERVED') return 'Đã đặt'
  return 'Còn trống'
}

const getTableClass = (status) => {
  if (status === 'SERVING') return 'status-serving'
  if (status === 'RESERVED') return 'status-reserved'
  return 'status-empty'
}

const onSelectTable = async (table) => {
  if (table.status === 'RESERVED') {
    toast.warning(`Bàn ${table.name} đã được đặt, không thể tạo đơn.`)
    return
  }

  const success = await posStore.assignTableAndCreateOrder(table)
  if (success) {
    activeTab.value = 'payment'
  }
}
</script>

<style>
:deep(.order-editor-drawer .el-drawer__body) {
  padding: 20px;
  background: #F8F9FA;
  overflow-y: auto;
}

:deep(.order-editor-drawer .el-drawer__header) {
  padding: 20px;
  border-bottom: 2px solid #E0E0E0;
  margin-bottom: 0;
  background: #FFFFFF;
}

:deep(.order-editor-drawer .el-drawer__title) {
  font-size: 1.5rem;
  font-weight: var(--font-bold);
  color: var(--primary-700);
}

.menu-card {
  height: auto;
  min-height: 600px;
  border-radius: var(--radius-xl);
  overflow: hidden;
}

.menu-card-header,
.cart-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-title {
  font-size: 1.25rem;
  font-weight: var(--font-bold);
  color: var(--primary-700);
}

.menu-header {
  padding: var(--space-4);
  background: var(--gray-50);
}

.product-list {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 15px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  align-content: start;
}

.product-item {
  display: flex;
  align-items: center;
  border: 2px solid #E0E0E0;
  border-radius: 12px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  background: #FFFFFF;
}

.product-item:hover {
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.2);
  border-color: #2196F3;
  transform: translateY(-2px);
}

.product-item-img {
  width: 60px;
  height: 60px;
  border-radius: 10px;
  flex-shrink: 0;
  overflow: hidden;
  display: block;
}

:deep(.product-item-img img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-slot-small {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #F5F5F5 0%, #E0E0E0 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #BDBDBD;
  border-radius: 10px;
}

.product-item-info {
  margin-left: 12px;
  overflow: hidden;
  flex: 1;
}

.product-item-name {
  font-weight: 600;
  font-size: 0.95rem;
  color: #212121;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}

.product-item-price {
  font-size: 0.9rem;
  font-weight: 600;
  color: #2196F3;
}

.cart-card {
  height: auto;
  min-height: 600px;
  display: flex;
  flex-direction: column;
  border-radius: var(--radius-xl);
  overflow: hidden;
}

:deep(.cart-card .el-card__body) {
  flex: 1;
  padding: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #F8F9FA;
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
  background: #FFFFFF;
  border-bottom: 2px solid #E0E0E0;
}

:deep(.el-tabs__nav-wrap::after) {
  display: none;
}

:deep(.el-tabs__item) {
  font-size: 1rem;
  font-weight: 600;
  color: #757575;
  padding: 0 24px;
  height: 50px;
  line-height: 50px;
}

:deep(.el-tabs__item.is-active) {
  color: #2196F3;
  font-weight: 700;
}

:deep(.el-tabs__active-bar) {
  height: 3px;
  background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
}

:deep(.el-tabs__content) {
  flex: 1;
  overflow-y: auto;
}

.el-tab-pane {
  padding: 20px;
}

.item-list {
  max-height: 500px;
  overflow-y: auto;
  overflow-x: hidden;
}

.empty-cart {
  padding-top: 50px;
}

.cart-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: var(--space-4);
  border-bottom: 1px solid var(--gray-200);
  background: #FFFFFF;
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-2);
  transition: all 0.2s ease;
}

.cart-item:hover {
  background: var(--gray-50);
  box-shadow: var(--shadow-sm);
}

.cart-item-index {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--primary-100);
  color: var(--primary-700);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--font-bold);
  font-size: 0.875rem;
  margin-right: var(--space-3);
  flex-shrink: 0;
}

.cart-item-info {
  flex: 1;
  margin-right: var(--space-4);
}

.cart-item-name {
  font-weight: var(--font-bold);
  font-size: 1rem;
  color: var(--gray-900);
  margin-bottom: var(--space-2);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.item-icon {
  color: var(--primary-500);
}

.cart-item-price {
  font-size: 1rem;
  font-weight: 600;
  color: #2196F3;
  margin-bottom: 8px;
}

.cart-item-notes {
  margin-top: 8px;
}

:deep(.cart-item-notes .el-input__wrapper) {
  background: #F8F9FA;
  border: 1px solid #E0E0E0;
  font-size: 0.9rem;
  color: #424242;
}

.cart-item-actions {
  display: flex;
  align-items: center;
}

.cart-item-qty {
  width: 100px;
  margin-right: var(--space-2);
}

.delete-btn {
  transition: all 0.2s ease;
}

.delete-btn:hover {
  transform: scale(1.1);
}

.cart-summary {
  padding: 0;
  margin: var(--space-4);
}

.summary-gradient {
  padding: var(--space-6);
  background: linear-gradient(135deg, var(--primary-50) 0%, var(--primary-100) 100%);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
}

.total-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--space-3);
  font-size: 1.1rem;
  font-weight: var(--font-medium);
  color: var(--gray-700);
}

.total-row span:first-child {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.total-row span:last-child {
  font-weight: var(--font-bold);
  color: var(--gray-900);
}

.total-row.discount span {
  color: var(--danger-600);
  font-weight: var(--font-bold);
}

.total-row.final-total {
  font-size: 1.75rem;
  font-weight: var(--font-bold);
  color: var(--success-700);
  border-top: 3px solid var(--success-500);
  padding-top: var(--space-4);
  margin-top: var(--space-4);
  background: rgba(255, 255, 255, 0.7);
  padding: var(--space-4);
  border-radius: var(--radius-lg);
}

.total-row.final-total span:last-child {
  color: var(--success-700);
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
  border: 2px solid #E0E0E0;
}

.payment-methods .el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
}

.w-100 {
  width: 100%;
}

.order-actions-bottom {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 20px;
  border-top: 2px solid #E0E0E0;
  margin-top: 20px;
}

.order-actions-bottom .el-button {
  font-size: 1rem;
  font-weight: 700;
  height: 45px;
  padding: 0 32px;
  border-radius: 12px;
}

.payment-actions-bottom {
  display: flex;
  justify-content: flex-end;
  padding-top: 20px;
  border-top: 2px solid #E0E0E0;
  margin-top: 20px;
}

.payment-actions-bottom .el-button {
  font-size: 1.2rem;
  font-weight: 700;
  height: 60px;
  padding: 0 48px;
  border-radius: 12px;
}

.table-selection {
  max-height: 600px;
  overflow-y: auto;
}

.table-grid-modal {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 15px;
}

.table-card-modal {
  cursor: pointer;
  text-align: center;
  transition: all 0.2s ease;
  border: 2px solid transparent;
}

.table-card-modal:hover {
  transform: translateY(-3px);
  box-shadow: var(--el-box-shadow-light);
}

.table-card-modal.status-empty {
  border-color: var(--el-color-success-light-3);
  background-color: var(--el-color-success-light-9);
}

.table-card-modal.status-empty .table-status {
  color: var(--el-color-success);
}

.table-card-modal.status-serving {
  border-color: var(--el-color-danger-light-3);
  background-color: var(--el-color-danger-light-9);
}

.table-card-modal.status-serving .table-status {
  color: var(--el-color-danger);
}

.table-card-modal.status-reserved {
  border-color: var(--el-color-warning-light-3);
  background-color: var(--el-color-warning-light-9);
  opacity: 0.6;
  cursor: not-allowed;
}

.table-card-modal.status-reserved .table-status {
  color: var(--el-color-warning);
}
</style>
