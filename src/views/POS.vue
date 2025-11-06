<template>
    <div class="app-page-container pos-page">
        <div class="page-header">
            <h1 class="page-title">Bán Hàng (POS)</h1>
            <div class="header-actions">
                <el-button type="success" size="large" @click="openTakeAwayModal">
                    <el-icon style="margin-right: 8px;">
                        <ShoppingCart />
                    </el-icon>
                    Đơn Mang đi (Take Away)
                </el-button>
            </div>
        </div>

        <el-row :gutter="20" class="pos-main-content">
            <!-- Khu vực Menu/Sản phẩm -->
            <el-col :span="14">
                <el-card class="box-card menu-section">
                    <template #header>
                        <div class="card-header">
                            <span class="card-title">Menu Sản phẩm</span>
                            <el-input 
                                v-model="productSearch" 
                                placeholder="Tìm món..." 
                                clearable 
                                style="width: 300px;"
                            />
                        </div>
                    </template>
                    <div v-loading="loadingProducts" class="product-grid">
                        <el-card 
                            v-for="product in filteredProducts" 
                            :key="product.id" 
                            class="product-card"
                            shadow="hover" 
                            @click="addProductToCart(product)"
                            :body-style="{ padding: '10px' }"
                        >
                            <el-image 
                                :src="product.imageUrl" 
                                fit="cover" 
                                class="product-image"
                            >
                                <template #error>
                                    <div class="image-placeholder">
                                        <el-icon><Image /></el-icon>
                                    </div>
                                </template>
                            </el-image>
                            <div class="product-info">
                                <div class="product-name">{{ product.name }}</div>
                                <div class="product-price">{{ formatCurrency(product.price) }}</div>
                            </div>
                        </el-card>
                    </div>
                </el-card>
            </el-col>

            <!-- Khu vực Sơ đồ Bàn -->
            <el-col :span="10">
                <el-card class="box-card table-section">
                    <template #header>
                        <span class="card-title">Sơ đồ Bàn</span>
                    </template>
                    <div v-loading="loadingTables" class="table-grid">
                        <el-card 
                            v-for="table in tables" 
                            :key="table.id" 
                            class="table-card"
                            :class="getTableClass(table.status)" 
                            shadow="hover" 
                            @click="openOrderModal(table)"
                        >
                            <div class="table-name">{{ table.name }}</div>
                            <div class="table-status">{{ getStatusText(table.status) }}</div>
                            <div class="table-capacity">{{ table.capacity }} chỗ</div>
                        </el-card>
                    </div>
                </el-card>
            </el-col>
        </el-row>

        <!-- Giỏ hàng tạm (floating) -->
        <transition name="slide-up">
            <div v-if="tempCart.length > 0" class="temp-cart-floating">
                <el-card class="temp-cart-card">
                    <template #header>
                        <div class="cart-header">
                            <span class="cart-title">Giỏ hàng tạm ({{ tempCart.length }} món)</span>
                            <el-button type="danger" size="small" text @click="clearTempCart">
                                Xóa tất cả
                            </el-button>
                        </div>
                    </template>
                    <div class="cart-items">
                        <div v-for="(item, index) in tempCart" :key="index" class="cart-item">
                            <span class="item-name">{{ item.name }}</span>
                            <div class="item-actions">
                                <el-input-number 
                                    v-model="item.quantity" 
                                    :min="1" 
                                    size="small"
                                    style="width: 100px;"
                                />
                                <el-button 
                                    type="danger" 
                                    size="small" 
                                    circle 
                                    @click="removeFromCart(index)"
                                >
                                    <el-icon><X /></el-icon>
                                </el-button>
                            </div>
                        </div>
                    </div>
                    <div class="cart-total">
                        <span>Tổng cộng:</span>
                        <span class="total-amount">{{ formatCurrency(cartTotal) }}</span>
                    </div>
                    <div class="cart-actions">
                        <el-button type="primary" size="large" @click="showTableSelection = true" style="width: 100%;">
                            Chọn bàn và Tạo đơn
                        </el-button>
                    </div>
                </el-card>
            </div>
        </transition>

        <!-- Dialog chọn bàn cho giỏ hàng tạm -->
        <el-dialog 
            v-model="showTableSelection" 
            title="Chọn bàn tại quán" 
            width="700px"
            :close-on-click-modal="false"
        >
            <div class="table-selection-dialog">
                <el-alert 
                    type="info" 
                    :closable="false"
                    style="margin-bottom: 20px;"
                >
                    <template #title>
                        Bạn đã chọn {{ tempCart.length }} món ({{ formatCurrency(cartTotal) }}). Vui lòng chọn bàn.
                    </template>
                </el-alert>
                
                <div v-if="emptyTables.length === 0" style="text-align: center; padding: 40px; color: #909399;">
                    <el-icon style="font-size: 48px; margin-bottom: 16px;"><InfoFilled /></el-icon>
                    <div style="font-size: 16px;">Không có bàn trống</div>
                    <div style="font-size: 14px; margin-top: 8px;">Vui lòng chọn "Đơn Mang đi" ở góc trên</div>
                </div>
                
                <div v-else class="table-grid-dialog">
                    <el-card 
                        v-for="table in emptyTables" 
                        :key="table.id" 
                        class="table-card-dialog"
                        shadow="hover" 
                        @click="createOrderFromCart(table)"
                    >
                        <div class="table-name">{{ table.name }}</div>
                        <div class="table-capacity">{{ table.capacity }} chỗ</div>
                    </el-card>
                </div>
            </div>
        </el-dialog>

        <OrderEditorModal v-if="posStore.isModalOpen" />

    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useToast } from 'vue-toastification'
import { ShoppingCart, Image, X } from '@/components/icons'
import { getAllTables } from '@/api/tableService.js'
import { getAvailableProducts } from '@/api/productService.js'
import { usePosStore } from '@/store/posStore.js'
import { formatCurrency } from '@/utils/formatters.js'
import OrderEditorModal from '@/components/OrderEditorModal.vue'

const toast = useToast()
const posStore = usePosStore()

const tables = ref([])
const loadingTables = ref(true)
const products = ref([])
const loadingProducts = ref(true)
const productSearch = ref('')
const tempCart = ref([])
const showTableSelection = ref(false)

// --- Computed ---
const filteredProducts = computed(() => {
    if (!productSearch.value) return products.value
    return products.value.filter(p => 
        p.name.toLowerCase().includes(productSearch.value.toLowerCase())
    )
})

const emptyTables = computed(() => {
    return tables.value.filter(t => t.status === 'EMPTY')
})

const cartTotal = computed(() => {
    return tempCart.value.reduce((sum, item) => sum + (item.price * item.quantity), 0)
})

// --- Tải Sơ đồ bàn ---
const fetchTables = async () => {
    loadingTables.value = true
    try {
        const response = await getAllTables()
        tables.value = response.data
    } catch (error) {
        toast.error('Lỗi khi tải sơ đồ bàn')
    } finally {
        loadingTables.value = false
    }
}

// --- Tải Menu sản phẩm ---
const fetchProducts = async () => {
    loadingProducts.value = true
    try {
        const response = await getAvailableProducts()
        products.value = response.data.content.filter(p => p.available)
    } catch (error) {
        toast.error('Lỗi khi tải menu sản phẩm')
    } finally {
        loadingProducts.value = false
    }
}

// --- Xử lý Modal ---
const openOrderModal = (table) => {
    // Bàn đang phục vụ hoặc trống đều mở modal
    if (table.status === 'SERVING' || table.status === 'EMPTY') {
        posStore.openPosModal(table)
    } else {
        toast.warning(`Bàn ${table.name} đã được đặt, không thể tạo đơn.`)
    }
}

const openTakeAwayModal = () => {
    // Nếu có món trong giỏ hàng tạm, tạo đơn mang đi luôn
    if (tempCart.value.length > 0) {
        createOrderFromCart(null) // null = Take Away
    } else {
        // Nếu chưa có món, mở modal để chọn món
        const takeAwayTable = {
            id: null,
            name: 'Đơn Mang đi',
            status: 'EMPTY'
        }
        posStore.openPosModal(takeAwayTable)
    }
}

// --- Xử lý Giỏ hàng tạm ---
const addProductToCart = (product) => {
    const existingItem = tempCart.value.find(item => item.id === product.id)
    if (existingItem) {
        existingItem.quantity++
        toast.success(`Đã tăng số lượng ${product.name}`)
    } else {
        tempCart.value.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1
        })
        toast.success(`Đã thêm ${product.name} vào giỏ`)
    }
}

const removeFromCart = (index) => {
    const item = tempCart.value[index]
    tempCart.value.splice(index, 1)
    toast.info(`Đã xóa ${item.name}`)
}

const clearTempCart = () => {
    tempCart.value = []
    toast.info('Đã xóa giỏ hàng')
}

const createOrderFromCart = async (table) => {
    if (tempCart.value.length === 0) {
        toast.warning('Giỏ hàng trống')
        return
    }

    const items = tempCart.value.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        notes: ''
    }))

    const orderData = {
        tableId: table?.id || null,
        type: table ? 'AT_TABLE' : 'TAKE_AWAY',
        items: items
    }

    try {
        await posStore.createOrder(orderData)
        
        // Clear giỏ hàng và đóng dialog
        tempCart.value = []
        showTableSelection.value = false
        
        // Refresh bàn
        await fetchTables()
        
        // Mở modal để tiếp tục quản lý đơn
        const targetTable = table || {
            id: null,
            name: 'Đơn Mang đi',
            status: 'EMPTY'
        }
        
        // Đợi một chút để bàn được cập nhật
        setTimeout(() => {
            posStore.openPosModal(targetTable)
        }, 300)
        
    } catch (error) {
        console.error('Error creating order:', error)
        toast.error(error.response?.data?.message || 'Lỗi khi tạo đơn hàng')
    }
}

// --- Helpers ---
const getStatusText = (status) => {
    if (status === 'SERVING') return 'Đang phục vụ'
    if (status === 'RESERVED') return 'Đã đặt'
    return 'Còn trống' // EMPTY
}

const getTableClass = (status) => {
    if (status === 'SERVING') return 'status-serving'
    if (status === 'RESERVED') return 'status-reserved'
    return 'status-empty'
}

// --- Tải dữ liệu khi trang được mở ---
onMounted(() => {
    fetchTables()
    fetchProducts()
})

// Theo dõi Pinia store để refresh bàn khi modal đóng
watch(() => posStore.isModalOpen, (newValue, oldValue) => {
    if (oldValue === true && newValue === false) {
        fetchTables() // Refresh danh sách bàn khi modal đóng
    }
})
</script>

<style>
.app-page-container {
    padding: 20px;
}

.header-actions {
    display: flex;
    gap: 10px;
}

.pos-main-content {
    margin-top: 20px;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.card-title {
    font-size: 1.1rem;
    font-weight: 600;
}

/* Menu Section */
.menu-section {
    height: calc(100vh - 180px);
}

:deep(.menu-section .el-card__body) {
    padding: 0;
    height: calc(100% - 60px);
}

.product-grid {
    height: 100%;
    overflow-y: auto;
    padding: 15px;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 15px;
}

.product-card {
    cursor: pointer;
    transition: all 0.2s ease;
}

.product-card:hover {
    transform: translateY(-3px);
    box-shadow: var(--el-box-shadow);
}

.product-image {
    width: 100%;
    height: 120px;
    border-radius: 4px;
}

.image-placeholder {
    width: 100%;
    height: 120px;
    background: #f5f7fa;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #c0c4cc;
    font-size: 2rem;
}

.product-info {
    margin-top: 8px;
}

.product-name {
    font-weight: 500;
    font-size: 0.95rem;
    margin-bottom: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.product-price {
    color: var(--el-color-primary);
    font-weight: 600;
}

/* Table Section */
.table-section {
    height: calc(100vh - 180px);
}

:deep(.table-section .el-card__body) {
    padding: 15px;
    height: calc(100% - 60px);
    overflow-y: auto;
}

.table-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 15px;
}

.table-card {
    cursor: pointer;
    text-align: center;
    transition: all 0.2s ease;
    border: 2px solid transparent;
}

.table-card:hover {
    transform: translateY(-5px);
    box-shadow: var(--el-box-shadow-light);
}

.table-name {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 5px;
}

.table-status {
    font-size: 0.9rem;
    margin-bottom: 10px;
}

.table-capacity {
    font-size: 0.8rem;
    color: #909399;
}

/* --- Màu theo Trạng thái --- */
.table-card.status-empty {
    border-color: var(--el-color-success-light-3);
    background-color: var(--el-color-success-light-9);
}

.table-card.status-empty .table-status {
    color: var(--el-color-success);
}

.table-card.status-serving {
    border-color: var(--el-color-danger-light-3);
    background-color: var(--el-color-danger-light-9);
}

.table-card.status-serving .table-status {
    color: var(--el-color-danger);
}

.table-card.status-reserved {
    border-color: var(--el-color-warning-light-3);
    background-color: var(--el-color-warning-light-9);
}

.table-card.status-reserved .table-status {
    color: var(--el-color-warning);
}

/* Floating Cart */
.temp-cart-floating {
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 400px;
    z-index: 1000;
}

.temp-cart-card {
    box-shadow: var(--el-box-shadow-dark);
}

.cart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.cart-title {
    font-weight: 600;
    font-size: 1.05rem;
}

.cart-items {
    max-height: 300px;
    overflow-y: auto;
}

.cart-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;
    border-bottom: 1px solid #e4e7ed;
}

.item-name {
    flex: 1;
    font-weight: 500;
}

.item-actions {
    display: flex;
    gap: 10px;
    align-items: center;
}

.cart-total {
    display: flex;
    justify-content: space-between;
    padding: 15px 0;
    border-top: 2px solid #e4e7ed;
    font-size: 1.1rem;
    font-weight: 600;
}

.total-amount {
    color: var(--el-color-primary);
    font-size: 1.3rem;
}

.cart-actions {
    padding-top: 10px;
}

/* Table Selection Dialog */
.table-selection-dialog {
    padding: 10px 0;
}

.table-grid-dialog {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 15px;
    max-height: 400px;
    overflow-y: auto;
}

.table-card-dialog {
    cursor: pointer;
    text-align: center;
    transition: all 0.2s ease;
    border: 2px solid var(--el-color-success-light-3);
    background-color: var(--el-color-success-light-9);
}

.table-card-dialog:hover {
    transform: translateY(-3px);
    box-shadow: var(--el-box-shadow);
    border-color: var(--el-color-success);
}

/* Animations */
.slide-up-enter-active,
.slide-up-leave-active {
    transition: all 0.3s ease;
}

.slide-up-enter-from {
    transform: translateY(100%);
    opacity: 0;
}

.slide-up-leave-to {
    transform: translateY(100%);
    opacity: 0;
}
</style>