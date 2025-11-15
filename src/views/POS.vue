<template>
    <div class="app-page-container pos-page animate__animated animate__fadeInUp stagger-item">
        <div class="page-header">
            <h1 class="page-title">Bán Hàng (POS)</h1>
            <div class="header-actions">
                <el-button type="success" size="large" class="take-away-btn" @click="openTakeAwayModal">
                    <el-icon class="take-away-icon">
                        <ShoppingCart/>
                    </el-icon>
                    Đơn Mang đi (Take Away)
                </el-button>
                <el-select
                    v-model="selectedCustomerId"
                    placeholder="Chọn khách hàng"
                    filterable
                    clearable
                    class="customer-select"
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
                        <ProductCard
                            v-for="product in filteredProducts"
                            :key="product.id"
                            :product="product"
                            @add="addProductToCart"
                        />
                    </div>
                </section>

                <section class="table-board">
                    <div class="table-board__header">
                        <div class="table-board__title">
                            <h2>Quản lý bàn</h2>
                            <p class="table-board__subtitle">
                                Tổng {{ tableSummary.total }} bàn · Trống {{ tableSummary.EMPTY }} · Phục vụ {{ tableSummary.SERVING }} · Đặt trước {{ tableSummary.RESERVED }}
                            </p>
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
                        <TempCartItem
                            v-for="(item, index) in tempCart"
                            :key="index"
                            :item="item"
                            @update:quantity="(value) => updateTempCartQuantity(index, value)"
                            @update:notes="(value) => updateTempCartNotes(index, value)"
                            @remove="removeFromCart(index)"
                        />
                    </div>
                    <div class="cart-total">
                        <span>Tổng cộng:</span>
                        <span class="total-amount">{{ formatCurrency(cartTotal) }}</span>
                    </div>
                    <div class="cart-actions">
                        <el-button type="primary" size="large" class="cart-primary-btn" @click="showTableSelection = true">
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
                    class="table-dialog-alert"
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
                    class="table-dialog-search"
                >
                    <template #prefix>
                        <el-icon>
                            <Search/>
                        </el-icon>
                    </template>
                </el-input>

                <el-empty
                    v-if="filteredEmptyTables.length === 0"
                    description="Không tìm thấy bàn trống"
                    class="table-dialog-empty"
                >
                    <template #extra>
                        <div class="table-dialog-empty-extra">
                            Vui lòng thử từ khóa khác hoặc chọn "Đơn Mang đi".
                        </div>
                    </template>
                </el-empty>

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
import {ShoppingCart, Search} from '@/components/icons'
import {InfoFilled} from '@element-plus/icons-vue'
import {getAllTables} from '@/api/tableService.js'
import {getAvailableProducts} from '@/api/productService.js'
import {getAllCategories} from '@/api/categoryService.js'
import {searchCustomers} from '@/api/customerService.js'
import {usePosStore} from '@/store/posStore.js'
import {formatCurrency} from '@/utils/formatters.js'
import OrderEditorModal from '@/components/pos/OrderEditorModal.vue'
import ProductCard from '@/components/pos/ProductCard.vue'
import TempCartItem from '@/components/pos/TempCartItem.vue'

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
    {label: 'Tất cả', value: 'ALL'},
    {label: 'Trống', value: 'EMPTY'},
    {label: 'Phục vụ', value: 'SERVING'},
    {label: 'Đặt trước', value: 'RESERVED'}
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
        const [min, max] = priceRange.value.split('-').map((part) => Number(part))
        const minValue = Number.isFinite(min) ? min : 0
        const maxValue = Number.isFinite(max) ? max : Number.POSITIVE_INFINITY
        result = result.filter(p => {
            const price = Number(p.price) || 0
            return price >= minValue && price <= maxValue
        })
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

const updateTempCartQuantity = (index, value) => {
    const item = tempCart.value[index]
    if (!item) return
    item.quantity = value
}

const updateTempCartNotes = (index, value) => {
    const item = tempCart.value[index]
    if (!item) return
    item.notes = value
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
    width: 100%;
    min-height: 0;
}

.pos-layout .menu-section {
    flex: 3;
    min-width: 0;
}

.pos-layout .table-board {
    flex: 2;
    min-width: 0;
}

.table-board {
    display: flex;
    flex-direction: column;
    background: #fbfbff;
    border-radius: 20px;
    border: 1px solid #efe6da;
    box-shadow: 0 12px 24px rgba(123, 86, 33, 0.04);
    padding: 0 24px 24px;
    display: flex;
    flex-direction: column;
}

.table-board__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 16px;
    margin-bottom: 18px;
}

.table-board__header h2 {
    margin: 0;
    font-size: 1.4rem;
    font-weight: 700;
    color: #1f2937;
}

.filter-control {
    min-width: 160px;
}

.menu-section {
    background: #fefcf9;
    border-radius: 20px;
    border: 1px solid #efe6da;
    box-shadow: 0 12px 24px rgba(123, 86, 33, 0.04);
    padding: 0 24px 24px;
    display: flex;
    flex-direction: column;
    min-height: 0;
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
    color: #4b3c2f;
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
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    padding-bottom: 8px;
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

.product-card {
    cursor: pointer;
    transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
    background: #fffdfa;
    border-radius: 14px;
    border: 1px solid #f2e9dd;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    position: relative;
    overflow: hidden;
    box-shadow: 0 6px 18px rgba(123, 86, 33, 0.08);
}

.product-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 18px 28px rgba(123, 86, 33, 0.12);
    border-color: #e7d5be;
}

.product-image {
    width: 100%;
    height: 140px;
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

.product-price {
    margin: 0;
    color: #6b4f2c !important;
    font-weight: 700;
    align-items: center;
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
    box-shadow: 0 10px 22px rgba(67, 56, 202, 0.08);
    color: #1f1c3d;
    display: flex;
    flex-direction: column;
    gap: 6px;
    border: 1px solid rgba(67, 56, 202, 0.08);
    background: #ffffff;
}

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
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    padding-bottom: 8px;
    scrollbar-width: thin;
    scrollbar-color: #c0c0c0 #f8f8f8;
}


.board-card {
    border-radius: 18px;
    padding: 18px;
    cursor: pointer;
    transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
    display: flex;
    flex-direction: column;
    gap: 12px;
    border: 1px solid #ebe7f5;
    box-shadow: 0 12px 28px rgba(47, 48, 87, 0.08);
    min-height: 180px;
    justify-content: space-between;
    background: #ffffff;
    position: relative;
}

.board-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 34px rgba(47, 48, 87, 0.14);
    border-color: rgba(99, 102, 241, 0.28);
}

.board-card--empty {
    border-color: rgba(34, 197, 94, 0.25);
    background: linear-gradient(150deg, rgba(34, 197, 94, 0.08) 0%, #ffffff 70%);
}

.board-card--serving {
    border-color: rgba(249, 115, 22, 0.25);
    background: linear-gradient(150deg, rgba(249, 115, 22, 0.08) 0%, #ffffff 70%);
}

.board-card--reserved {
    border-color: rgba(79, 70, 229, 0.25);
    background: linear-gradient(150deg, rgba(79, 70, 229, 0.08) 0%, #ffffff 70%);
}

.board-card__top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
}

.board-card__name {
    font-size: 1.2rem;
    font-weight: 700;
    color: #322f58;
}

.board-card__info {
    display: flex;
    flex-direction: column;
    gap: 6px;
    color: #4c4a6f;
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
    width: min(400px, calc(100vw - 32px));
    max-height: calc(100vh - 40px);
    overflow: hidden;
    z-index: 1000;
    pointer-events: none;
}

.temp-cart-card {
    box-shadow: var(--el-box-shadow-dark);
    display: flex;
    flex-direction: column;
    max-height: 100%;
    pointer-events: auto;
    border-radius: 18px;
    border: 1px solid #ece5da;
    background: #fffcf7;
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
    color: #3c3123;
}

.cart-items {
    max-height: 300px;
    overflow-y: auto;
    padding-right: 4px;
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
    border-top: 2px solid #ede1cf;
    font-size: 1.1rem;
    font-weight: 600;
}

.total-amount {
    color: #1a9b63;
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
    max-height: min(400px, 50vh);
    overflow-y: auto;
}

.table-card-dialog {
    cursor: pointer;
    text-align: center;
    transition: all 0.18s ease;
    border: 1px solid #e9ecef;
    background-color: #ffffff;
    border-radius: 12px;
    padding: 16px;
}

.table-card-dialog:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 24px rgba(34, 197, 94, 0.16);
    border-color: rgba(34, 197, 94, 0.32);
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
