<template>
    <div class="app-page-container pos-page animate__animated animate__fadeInUp stagger-item">
        <div class="page-header">
            <h1 class="page-title">Bán Hàng (POS)</h1>
            <div class="header-actions">
                <el-button type="success" size="large" @click="openTakeAwayModal">
                    <el-icon style="margin-right: 8px;">
                        <ShoppingCart/>
                    </el-icon>
                    Đơn Mang đi (Take Away)
                </el-button>
                <el-select
                    v-model="selectedCustomerId"
                    placeholder="Chọn khách hàng"
                    filterable
                    clearable
                    style="width: 200px;"
                >
                    <el-option label="Khách vãng lai" :value="null"/>
                    <el-option
                        v-for="customer in customers"
                        :key="customer.id"
                        :label="`${customer.fullName} (${customer.phone})`"
                        :value="customer.id"
                    />
                </el-select>
            </div>
        </div>


        <div class="pos-content">
            <div class="pos-layout">
                <section class="menu-section">
                    <div class="menu-header-bar">
                        <div class="menu-header-left">
                            <span class="menu-title">Menu Sản phẩm</span>
                            <el-tag v-if="filteredProducts.length" type="success" effect="plain" round>
                                {{ filteredProducts.length }} món khả dụng
                            </el-tag>
                        </div>
                        <div class="menu-filters">
                            <el-input
                                v-model="productSearch"
                                placeholder="Tìm món..."
                                clearable
                                class="filter-control"
                            >
                                <template #prefix>
                                    <el-icon>
                                        <Search/>
                                    </el-icon>
                                </template>
                            </el-input>
                            <el-select
                                v-model="selectedCategory"
                                placeholder="Danh mục"
                                clearable
                                class="filter-control"
                            >
                                <el-option label="Tất cả" :value="null"/>
                                <el-option
                                    v-for="cat in categories"
                                    :key="cat.id"
                                    :label="cat.name"
                                    :value="cat.id"
                                />
                            </el-select>
                            <el-select
                                v-model="priceRange"
                                placeholder="Giá bán"
                                clearable
                                class="filter-control"
                            >
                                <el-option label="Tất cả" :value="null"/>
                                <el-option label="< 50k" value="0-50000"/>
                                <el-option label="50k - 100k" value="50000-100000"/>
                                <el-option label="> 200k" value="200000-999999999"/>
                            </el-select>
                        </div>
                    </div>
                    <div v-loading="loadingProducts" class="product-grid">
                        <div
                            v-for="product in filteredProducts"
                            :key="product.id"
                            class="product-card"
                            @click="addProductToCart(product)"
                        >
                            <el-image
                                :src="product.imageUrl"
                                fit="cover"
                                class="product-image"
                            >
                                <template #error>
                                    <div class="image-placeholder">
                                        <el-icon>
                                            <Image/>
                                        </el-icon>
                                    </div>
                                </template>
                            </el-image>
                            <div class="product-info">
                                <h4 class="product-name">{{ product.name }}</h4>
                                <div class="product-meta">
                                    <span class="product-category">{{ product.categoryName || 'Chưa phân loại' }}</span>
                                    <span class="product-price">{{ formatCurrency(product.price) }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section class="table-board">
                    <div class="table-board__header">
                        <div>
                            <h2>Sơ đồ Bàn</h2>
                            <p>Quản lý tình trạng phục vụ và đặt chỗ theo thời gian thực</p>
                        </div>
                        <div class="table-board__actions">
                            <el-input
                                v-model="tableSearch"
                                placeholder="Tìm bàn..."
                                clearable
                                class="filter-control"
                            >
                                <template #prefix>
                                    <el-icon>
                                        <Search/>
                                    </el-icon>
                                </template>
                            </el-input>
                            <el-segmented
                                v-model="tableStatusFilter"
                                :options="tableStatusSegments"
                                size="large"
                            />
                        </div>
                    </div>

                    <div v-loading="loadingTables" class="board-grid">
                        <el-empty
                            v-if="displayTables.length === 0 && !loadingTables"
                            description="Không có bàn phù hợp"
                        />
                        <div
                            v-for="table in displayTables"
                            :key="table.id"
                            class="board-card"
                            :class="`board-card--${table.status.toLowerCase()}`"
                            @click="openOrderModal(table)"
                        >
                            <div class="board-card__top">
                                <span class="board-card__name">{{ table.name }}</span>
                                <el-tag effect="dark" round :type="statusMeta[table.status].tagType">
                                    {{ statusMeta[table.status].label }}
                                </el-tag>
                            </div>
                            <div class="board-card__info">
                                <span>
                                    <el-icon>
                                        <UserFilled/>
                                    </el-icon>
                                    {{ table.capacity }} chỗ
                                </span>
                                <span>
                                    {{ statusMeta[table.status].note }}
                                </span>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>

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
                            <div class="item-header">
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
                                        <el-icon>
                                            <X/>
                                        </el-icon>
                                    </el-button>
                                </div>
                            </div>
                            <el-input
                                v-model="item.notes"
                                placeholder="Ghi chú (ít đá, nhiều đường...)"
                                size="small"
                                style="margin-top: 8px;"
                            />
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
                        Bạn đã chọn {{ tempCart.length }} món ({{ formatCurrency(cartTotal) }}).
                        Khách hàng: {{ selectedCustomer ? selectedCustomer.fullName : 'Khách vãng lai' }}
                    </template>
                </el-alert>

                <el-input
                    v-model="dialogTableSearch"
                    placeholder="Tìm bàn..."
                    clearable
                    style="margin-bottom: 20px;"
                >
                    <template #prefix>
                        <el-icon>
                            <Search/>
                        </el-icon>
                    </template>
                </el-input>

                <div v-if="filteredEmptyTables.length === 0" style="text-align: center; padding: 40px; color: #909399;">
                    <el-icon style="font-size: 48px; margin-bottom: 16px;">
                        <InfoFilled/>
                    </el-icon>
                    <div style="font-size: 16px;">Không tìm thấy bàn trống</div>
                    <div style="font-size: 14px; margin-top: 8px;">Vui lòng thử từ khóa khác hoặc chọn "Đơn Mang đi"
                    </div>
                </div>

                <div v-else class="table-grid-dialog">
                    <el-card
                        v-for="table in filteredEmptyTables"
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

        <OrderEditorModal v-if="posStore.isModalOpen"/>

    </div>
</template>

<script setup>
import {ref, computed, onMounted, watch} from 'vue'
import {useToast} from 'vue-toastification'
import {ShoppingCart, Image, X, Search} from '@/components/icons'
import {InfoFilled} from '@element-plus/icons-vue'
import {getAllTables} from '@/api/tableService.js'
import {getAvailableProducts} from '@/api/productService.js'
import {getAllCategories} from '@/api/categoryService.js'
import {searchCustomers} from '@/api/customerService.js'
import {usePosStore} from '@/store/posStore.js'
import {formatCurrency} from '@/utils/formatters.js'
import OrderEditorModal from '@/components/OrderEditorModal.vue'

const toast = useToast()
const posStore = usePosStore()

const tables = ref([])
const loadingTables = ref(true)
const products = ref([])
const categories = ref([])
const loadingProducts = ref(true)
const customers = ref([])
const loadingCustomers = ref(true)
const productSearch = ref('')
const selectedCategory = ref(null)
const priceRange = ref(null)
const tableSearch = ref('')
const dialogTableSearch = ref('')
const tempCart = ref([])
const showTableSelection = ref(false)
const selectedCustomerId = ref(null)
const tableStatusFilter = ref('ALL')

const tableStatusSegments = [
    { label: 'Tất cả', value: 'ALL' },
    { label: 'Trống', value: 'EMPTY' },
    { label: 'Phục vụ', value: 'SERVING' },
    { label: 'Đặt trước', value: 'RESERVED' }
]

const statusMeta = {
    EMPTY: {
        label: 'Bàn trống',
        tagType: 'success',
        note: 'Sẵn sàng phục vụ'
    },
    SERVING: {
        label: 'Đang phục vụ',
        tagType: 'warning',
        note: 'Đã có khách'
    },
    RESERVED: {
        label: 'Đã đặt',
        tagType: 'info',
        note: 'Giữ bàn cho khách'
    }
}

const filteredProducts = computed(() => {
    let result = products.value

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

    // Filter by price range
    if (priceRange.value) {
        const [min, max] = priceRange.value.split('-').map(Number)
        result = result.fiylter(p => p.price >= min && p.price <= max)
    }

    return result
})

const filteredTables = computed(() => {
    let result = tables.value
    if (tableStatusFilter.value !== 'ALL') {
        result = result.filter((table) => table.status === tableStatusFilter.value)
    }
    if (!tableSearch.value) return result
    return result.filter((t) =>
        t.name.toLowerCase().includes(tableSearch.value.toLowerCase())
    )
})

const emptyTables = computed(() => {
    return tables.value.filter(t => t.status === 'EMPTY')
})

const filteredEmptyTables = computed(() => {
    if (!dialogTableSearch.value) return emptyTables.value
    return emptyTables.value.filter(t =>
        t.name.toLowerCase().includes(dialogTableSearch.value.toLowerCase())
    )
})

const cartTotal = computed(() => {
    return tempCart.value.reduce((sum, item) => sum + (item.price * item.quantity), 0)
})

const selectedCustomer = computed(() => {
    if (!selectedCustomerId.value) return null
    return customers.value.find(c => c.id === selectedCustomerId.value)
})

const tableSummary = computed(() => {
    const summary = {
        total: tables.value.length,
        EMPTY: 0,
        SERVING: 0,
        RESERVED: 0
    }
    tables.value.forEach((table) => {
        if (summary[table.status] !== undefined) {
            summary[table.status] += 1
        }
    })
    return summary
})

const displayTables = computed(() => filteredTables.value)

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

const fetchProducts = async () => {
    loadingProducts.value = true
    try {
        const response = await getAvailableProducts()
        products.value = response.data.content.filter(p => p.available)

        // Fetch categories
        const catResponse = await getAllCategories()
        categories.value = catResponse.data
    } catch (error) {
        toast.error('Lỗi khi tải menu sản phẩm')
    } finally {
        loadingProducts.value = false
    }
}

const fetchCustomers = async () => {
    loadingCustomers.value = true
    try {
        const response = await searchCustomers({page: 0, size: 1000}) // Get all customers
        customers.value = response.data.content
    } catch (error) {
        toast.error('Lỗi khi tải danh sách khách hàng')
    } finally {
        loadingCustomers.value = false
    }
}

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
            quantity: 1,
            notes: '',
            category: product.categoryName
        })
        toast.success(`Đã thêm ${product.name}`)
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
        notes: item.notes || ''
    }))

    const orderData = {
        tableId: table?.id || null,
        customerId: selectedCustomerId.value,
        type: table ? 'AT_TABLE' : 'TAKE_AWAY',
        items: items
    }

    console.log('=== ORDER CREATION DEBUG ===')
    console.log('Selected customer ID:', selectedCustomerId.value)
    console.log('Selected customer object:', selectedCustomer.value)
    console.log('Order data to send:', orderData)
    console.log('Customer list length:', customers.value.length)

    try {
        const response = await posStore.createOrder(orderData)
        console.log('Order creation response:', response)

        // Clear giỏ hàng và reset customer selection
        tempCart.value = []
        selectedCustomerId.value = null
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
        console.error('Error response:', error.response)
        toast.error(error.response?.data?.message || 'Lỗi khi tạo đơn hàng')
    }
}

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

onMounted(() => {
    fetchTables()
    fetchProducts()
    fetchCustomers()
})

// Theo dõi Pinia store để refresh bàn khi modal đóng
watch(() => posStore.isModalOpen, (newValue, oldValue) => {
    if (oldValue === true && newValue === false) {
        fetchTables()
    }
})
</script>

<style>

.pos-content {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.pos-layout {
    display: flex;
    gap: 24px;
    align-items: flex-start;
}

.pos-layout .menu-section {
    flex: 1.6;
}

.pos-layout .table-board {
    flex: 1;
}

.filter-control {
    min-width: 160px;
}

.menu-section {
    background: #fefcf9;
    border-radius: 20px;
    border: 1px solid #f0eae3;
    box-shadow: 0 18px 40px rgba(15, 23, 42, 0.04);
    padding: 0 24px 24px;
}

.menu-header-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px 0;
}

.menu-header-left {
    display: flex;
    align-items: center;
    gap: 12px;
}

.menu-title {
    font-size: 1.4rem;
    font-weight: 700;
    color: #1f2937;
}

.menu-filters {
    display: flex;
    gap: 16px;
    align-items: center;
}

.product-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 16px;
    max-height: 68vh;
    overflow-y: auto;
    padding-bottom: 8px;
}



.product-card {
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
    background: #ffffff;
    border-radius: 16px;
    border: 1px solid transparent;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    position: relative;
    overflow: hidden;
    box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
}

.product-card::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 16px;
    border: 1px solid rgba(139, 115, 85, 0.08);
    pointer-events: none;
}

.product-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 24px 40px rgba(15, 23, 42, 0.12);
    border-color: rgba(139, 115, 85, 0.2);
}

.product-image {
    width: 100%;
    max-height: 140px;
    min-height: 140px;
    border-radius: 8px;
    overflow: hidden;
    display: block;
    margin-bottom: 8px;
    object-fit: cover;

}

:deep(.product-image img) {
    width: 100%;
    height: 140px;
    object-fit: fill;
    border-radius: 8px;
}

.image-placeholder {
    width: 100%;
    height: 140px;
    background: linear-gradient(135deg, #f5f7fa 0%, #e8ecef 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #c0c4cc;
    font-size: 3rem;
    border-radius: 8px;
}

.product-info {
    padding: 0 4px 4px;
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.product-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.85rem;
    color: #6b7280;
}

.product-category {
    background: rgba(139, 115, 85, 0.1);
    color: #8b7355;
    padding: 2px 10px;
    border-radius: 999px;
    font-weight: 600;
}

.product-name {
    margin: 0 0 6px 0;
    font-weight: 600;
    font-size: 0.9rem;
    color: #212121 !important;
    line-height: 1.3;
    overflow: visible;
    white-space: normal;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
}

.product-grid, .board-grid {
    scrollbar-width: thin;
    scrollbar-color: #c0c0c0 #f8f8f8;
}

.product-grid::-webkit-scrollbar,
.board-grid::-webkit-scrollbar {
    width: 6px;
}

.product-grid::-webkit-scrollbar-thumb,
.board-grid::-webkit-scrollbar-thumb {
    background-color: #bdbdbd;
    border-radius: 8px;
}

.product-grid::-webkit-scrollbar:horizontal {
    display: none;
}



.product-price {
    margin: 0;
    color: #8b7355 !important;
    font-weight: 700;
    align-items: center;
}

.table-board__header h2 {
    margin: 0;
    font-size: 1.4rem;
    font-weight: 700;
    color: #1f2937;
}

.table-board__header p {
    margin: 4px 0 0;
    color: #6b7280;
}

.table-board__actions {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    justify-content: flex-end;
}

.table-board__summary {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 16px;
}

.summary-card {
    border-radius: 16px;
    padding: 16px;
    box-shadow: 0 18px 30px rgba(15, 23, 42, 0.06);
    color: #1f2937;
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.summary-card.total { background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%); }
.summary-card.empty { background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); }
.summary-card.serving { background: linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%); }
.summary-card.reserved { background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%); }

.summary-label {
    font-size: 0.85rem;
    font-weight: 600;
    opacity: 0.8;
}

.summary-value {
    font-size: 1.6rem;
    font-weight: 700;
}


.board-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 16px;
    max-height: 68vh;
    overflow-y: auto;
    padding-bottom: 8px;
}

.board-card {
    border-radius: 18px;
    padding: 18px;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    display: flex;
    flex-direction: column;
    gap: 12px;
    border: 1px solid transparent;
    box-shadow: 0 16px 32px rgba(15, 23, 42, 0.08);
    min-height: 180px;
}

.board-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 24px 40px rgba(15, 23, 42, 0.12);
}

.board-card--empty { background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); }
.board-card--serving { background: linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%); }
.board-card--reserved { background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%); }

.board-card__top {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.board-card__name {
    font-size: 1.2rem;
    font-weight: 700;
    color: #1f2937;
}

.board-card__info {
    display: flex;
    flex-direction: column;
    gap: 6px;
    color: #374151;
}

.board-card__info span {
    display: inline-flex;
    gap: 6px;
    align-items: center;
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
    margin-bottom: 10px;
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
    flex-direction: column;
    padding: 12px 0;
    border-bottom: 1px solid #e4e7ed;
}

.item-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
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
