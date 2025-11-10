<template>
    <div class="app-page-container animate__animated animate__fadeInUp stagger-item">
        <div class="page-header">
            <div>
                <p class="page-subtitle">Bảng điều khiển sản phẩm</p>
                <h1 class="page-title">Quản lý Sản phẩm</h1>
            </div>
            <el-button type="primary" @click="openCreateModal">
                <el-icon style="margin-right: 8px;">
                    <Plus/>
                </el-icon>
                Thêm Sản phẩm
            </el-button>
        </div>

        <section class="overview-section" v-if="statInsights.length">
            <el-row :gutter="20">
                <el-col v-for="card in statInsights" :key="card.title" :xs="12" :sm="12" :md="6" :lg="6">
                    <div class="metric-card">
                        <p class="metric-card__title">{{ card.title }}</p>
                        <p class="metric-card__value">{{ card.primary }}</p>
                        <p class="metric-card__hint">{{ card.hint }}</p>
                    </div>
                </el-col>
            </el-row>
        </section>

        <section class="featured-section" v-if="highlightedProducts.length">
            <div class="section-header">
                <div>
                    <h2 class="section-title">Sản phẩm nổi bật</h2>
                    <p class="section-description">Gợi ý dựa trên biên lợi nhuận cao và mức giá hấp dẫn.</p>
                </div>
            </div>
            <div class="featured-grid">
                <div v-for="product in highlightedProducts" :key="product.id || product.code"
                     class="featured-card" :style="{ backgroundColor: getColorForProduct(product) }">
                    <div class="featured-card__header">
                        <span class="featured-card__category">{{ product.categoryName || 'Chưa phân loại' }}</span>
                        <el-tag size="small" :type="product.available ? 'success' : 'info'">
                            {{ product.available ? 'Đang bán' : 'Đã ẩn' }}
                        </el-tag>
                    </div>
                    <h3 class="featured-card__title">{{ product.name }}</h3>
                    <p class="featured-card__code">Mã SP: {{ product.code }}</p>

                    <div class="featured-card__prices">
                        <div class="featured-card__price-block">
                            <span>Giá bán</span>
                            <strong>{{ formatCurrency(product.price) }}</strong>
                        </div>
                        <div class="featured-card__price-block">
                            <span>Giá vốn</span>
                            <strong>{{ product.cost != null ? formatCurrency(product.cost) : '—' }}</strong>
                        </div>
                    </div>

                    <div class="featured-card__margin">
                        <span>Biên lợi nhuận</span>
                        <strong v-if="getMarginInfo(product).value != null">
                            {{ formatCurrency(getMarginInfo(product).value) }}
                            <small>({{ formatPercent(getMarginInfo(product).percent) }})</small>
                        </strong>
                        <strong v-else>Chưa cập nhật</strong>
                    </div>

                    <div class="featured-card__meta">
                        <span>Cập nhật: {{ formatDate(product.updatedAt || product.createdAt) }}</span>
                    </div>

                    <div class="featured-card__actions">
                        <el-button size="small" plain @click="openDetailModal(product.id)">Xem</el-button>
                        <el-button size="small" type="primary" plain @click="openEditModal(product)">Sửa</el-button>
                        <el-button size="small" type="warning" plain @click="openRecipeModal(product)">Công thức
                        </el-button>
                    </div>
                </div>
            </div>
        </section>

        <el-card class="box-card filter-card mb-3">
            <el-row :gutter="20">
                <el-col :xs="24" :sm="12" :md="10">
                    <el-input v-model="searchQuery" placeholder="Tìm theo tên sản phẩm..." @input="debouncedSearch"
                              clearable/>
                </el-col>
                <el-col :xs="24" :sm="12" :md="8">
                    <el-select v-model="selectedCategory" placeholder="Lọc theo danh mục" @change="fetchData" clearable
                               class="w-100">
                        <el-option v-for="category in categories" :key="category.id" :label="category.name"
                                   :value="category.id"/>
                    </el-select>
                </el-col>
            </el-row>
        </el-card>

        <EasyDataTable v-model:server-options="serverOptions" :server-items-length="serverItemsLength"
                       :headers="headers" :items="items" :loading="loading" table-class-name="data-table"
                       theme-color="#8B7355"
                       buttons-pagination show-index>
            <template #item-imageUrl="{ imageUrl }">
                <el-image v-if="imageUrl" :src="imageUrl" fit="cover" class="product-table-image" preview-teleported
                          :preview-src-list="[imageUrl]" lazy>
                    <template #error>
                        <div class="image-slot">
                            <el-icon>
                                <Picture/>
                            </el-icon>
                        </div>
                    </template>
                </el-image>
                <div v-else class="image-slot">
                    <el-icon>
                        <Picture/>
                    </el-icon>
                </div>
            </template>

            <template #item-price="{ price }">
                {{ formatCurrency(price) }}
            </template>

            <template #item-available="{ available, id }">
                <el-switch :model-value="available" @change="() => handleToggleAvailability(id, available)"/>
            </template>

            <template #item-actions="item">
                <el-button type="info" plain size="small" @click="openDetailModal(item.id)">
                    Xem
                </el-button>
                <el-button type="warning" plain size="small" @click="openRecipeModal(item)">
                    Công thức
                </el-button>
                <el-button type="primary" plain size="small" @click="openEditModal(item)">
                    Sửa
                </el-button>
                <el-popconfirm title="Bạn chắc chắn muốn xóa?" confirm-button-text="Đồng ý" cancel-button-text="Hủy"
                               @confirm="handleDelete(item.id)">
                    <template #reference>
                        <el-button type="danger" plain size="small">Xóa</el-button>
                    </template>
                </el-popconfirm>
            </template>
        </EasyDataTable>

        <ProductFormModal v-model:visible="formModalVisible" :product="selectedProduct" :categories="categories"
                          @success="handleModalSuccess"/>

        <ProductDetailModal v-model:visible="detailModalVisible" :product-id="selectedProductId"/>

        <ProductRecipeModal v-model:visible="recipeModalVisible" :product-id="selectedProductForRecipe?.id"
                            :product-name="selectedProductForRecipe?.name" @success="handleModalSuccess"/>

    </div>
</template>

<script setup>
import {ref, onMounted, onBeforeUnmount, watch, computed} from 'vue'
import EasyDataTable from 'vue3-easy-data-table'
import 'vue3-easy-data-table/dist/style.css'
import {useToast} from 'vue-toastification'
import {Plus, Picture} from '@element-plus/icons-vue'
import {formatCurrency} from '@/utils/formatters'
import {getProducts, deleteProduct, toggleProductAvailability} from '@/api/productService'
import {getAllCategories} from '@/api/categoryService'

// Import cả 3 modal
import ProductFormModal from '@/components/ProductFormModal.vue'
import ProductDetailModal from '@/components/ProductDetailModal.vue'
import ProductRecipeModal from '@/components/ProductRecipeModal.vue' // (MỚI)

const toast = useToast()

const items = ref([])
const loading = ref(true)
const serverItemsLength = ref(0)
const serverOptions = ref({
    page: 1,
    rowsPerPage: 10,
})

const formModalVisible = ref(false)
const detailModalVisible = ref(false)
const recipeModalVisible = ref(false) // (MỚI)

const selectedProduct = ref(null)
const selectedProductId = ref(null)
const selectedProductForRecipe = ref(null) // (MỚI)

const searchQuery = ref('')
const selectedCategory = ref(null)
const categories = ref([])
let searchTimer = null

const pastelPalette = [
    '#F5F7FA',
    '#FDF4EC',
    '#E6F3F1',
    '#F3F5FF',
    '#F8F5FF',
    '#F2F9F1',
    '#FDEEEE',
    '#F7F8E8',
]

const statInsights = computed(() => {
    const currentItems = items.value
    if (!currentItems.length) {
        return [
            {
                title: 'Tổng sản phẩm',
                primary: formatNumber(serverItemsLength.value || 0),
                hint: 'Trong toàn bộ hệ thống'
            },
            {title: 'Sản phẩm đang bán', primary: '0', hint: 'Theo trang hiện tại'},
            {title: 'Giá bán trung bình', primary: '—', hint: 'Trang hiện tại'},
            {title: 'Danh mục hiển thị', primary: '0', hint: 'Trang hiện tại'},
        ]
    }

    const availableCount = currentItems.filter(item => item.available).length
    const totalPrice = currentItems.reduce((sum, item) => sum + (item.price || 0), 0)
    const averagePrice = currentItems.length ? totalPrice / currentItems.length : null
    const uniqueCategories = new Set(currentItems.map(item => item.categoryName || 'Khác')).size

    return [
        {title: 'Tổng sản phẩm', primary: formatNumber(serverItemsLength.value || 0), hint: 'Trong toàn bộ hệ thống'},
        {title: 'Sản phẩm đang bán', primary: formatNumber(availableCount), hint: 'Theo trang hiện tại'},
        {
            title: 'Giá bán trung bình',
            primary: averagePrice != null ? formatCurrency(averagePrice) : '—',
            hint: 'Trang hiện tại'
        },
        {title: 'Danh mục hiển thị', primary: formatNumber(uniqueCategories), hint: 'Trang hiện tại'},
    ]
})

const highlightedProducts = computed(() => {
    if (!items.value.length) return []
    const sorted = [...items.value].sort((a, b) => {
        const marginA = (a.price || 0) - (a.cost || 0)
        const marginB = (b.price || 0) - (b.cost || 0)
        if (marginA === marginB) {
            return (b.price || 0) - (a.price || 0)
        }
        return marginB - marginA
    })
    return sorted.slice(0, Math.min(4, sorted.length))
})

const formatNumber = (value) => new Intl.NumberFormat('vi-VN').format(value || 0)

const formatPercent = (value) => {
    if (value == null || Number.isNaN(value)) return '—'
    return `${value.toFixed(1)}%`
}

const getMarginInfo = (product) => {
    if (product.price == null || product.cost == null) return {value: null, percent: null}
    const value = product.price - product.cost
    const percent = product.price ? (value / product.price) * 100 : null
    return {value, percent}
}

const getColorForProduct = (product) => {
    const source = `${product.id ?? ''}${product.code ?? ''}${product.name ?? ''}` || Math.random().toString()
    let hash = 0
    for (let i = 0; i < source.length; i += 1) {
        hash = (hash + source.charCodeAt(i) * (i + 1)) % pastelPalette.length
    }
    return pastelPalette[hash]
}

const formatDate = (value) => {
    if (!value) return 'Chưa cập nhật'
    try {
        return new Date(value).toLocaleString('vi-VN')
    } catch (error) {
        return 'Chưa cập nhật'
    }
}

const headers = [
    {text: "Ảnh", value: "imageUrl", width: 80},
    {text: "Tên Sản phẩm", value: "name", sortable: true},
    {text: "Mã SP", value: "code"},
    {text: "Danh mục", value: "categoryName"},
    {text: "Giá bán", value: "price", sortable: true},
    {text: "Trạng thái", value: "available", width: 100},
    {text: "Hành động", value: "actions", width: 300}, // (Tăng chiều rộng)
]

const fetchData = async () => {
    loading.value = true
    try {
        const params = {
            page: serverOptions.value.page - 1,
            size: serverOptions.value.rowsPerPage,
            name: searchQuery.value || null,
            categoryId: selectedCategory.value || null,
        }
        const response = await getProducts(params)
        items.value = response.data.content
        serverItemsLength.value = response.data.totalElements
    } catch (error) {
        toast.error('Lỗi khi tải danh sách sản phẩm')
    } finally {
        loading.value = false
    }
}
const fetchCategories = async () => {
    try {
        const response = await getAllCategories()
        categories.value = response.data
    } catch (error) {
        toast.error('Lỗi khi tải danh mục')
    }
}
const debouncedSearch = () => {
    clearTimeout(searchTimer)
    searchTimer = setTimeout(() => {
        serverOptions.value.page = 1
        fetchData()
    }, 500)
}

const openCreateModal = () => {
    selectedProduct.value = null
    formModalVisible.value = true
}

const openEditModal = (product) => {
    const matchingCategory = categories.value.find(c => c.name === product.categoryName)
    selectedProduct.value = {
        ...product,
        categoryId: matchingCategory ? matchingCategory.id : null
    }
    formModalVisible.value = true
}

const openDetailModal = (id) => {
    selectedProductId.value = id
    detailModalVisible.value = true
}

// (MỚI) Mở modal công thức
const openRecipeModal = (product) => {
    selectedProductForRecipe.value = product
    recipeModalVisible.value = true
}

const handleDelete = async (id) => {
    try {
        await deleteProduct(id)
        toast.success('Xóa sản phẩm thành công!')
        await fetchData()
    } catch (error) {
        const msg = error.response?.data?.message || 'Lỗi khi xóa sản phẩm'
        toast.error(msg)
    }
}
const handleToggleAvailability = async (id, currentStatus) => {
    try {
        await toggleProductAvailability(id)
        toast.success(currentStatus ? 'Đã ẩn sản phẩm' : 'Đã hiện sản phẩm')
        await fetchData()
    } catch (error) {
        toast.error('Lỗi khi cập nhật trạng thái')
    }
}
const handleModalSuccess = () => {
    fetchData()
}
watch(serverOptions, (newValue, oldValue) => {
    fetchData()
}, {deep: true})

onMounted(() => {
    fetchCategories()
    fetchData()
})

onBeforeUnmount(() => {
    // Close all modals when navigating away
    formModalVisible.value = false
    detailModalVisible.value = false
    recipeModalVisible.value = false
    if (searchTimer) {
        clearTimeout(searchTimer)
    }
})
</script>

<style scoped>
.app-page-container {
    padding: 20px;
}

.page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 24px;
}

.page-subtitle {
    margin: 0;
    font-size: 14px;
    color: #909399;
    letter-spacing: 0.5px;
    text-transform: uppercase;
}

.page-title {
    margin: 4px 0 0;
    font-size: 28px;
    font-weight: 700;
    color: #2c3e50;
}

.overview-section {
    margin-bottom: 24px;
}

.metric-card {
    background: linear-gradient(145deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.7));
    border-radius: 14px;
    padding: 20px;
    box-shadow: 0 12px 30px rgba(44, 62, 80, 0.08);
    backdrop-filter: blur(4px);
    border: 1px solid rgba(255, 255, 255, 0.6);
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.metric-card__title {
    margin: 0;
    font-size: 14px;
    letter-spacing: 0.3px;
    color: #636e72;
}

.metric-card__value {
    margin: 0;
    font-size: 26px;
    font-weight: 700;
    color: #34495e;
}

.metric-card__hint {
    margin: 0;
    font-size: 12px;
    color: #95a5a6;
}

.featured-section {
    margin-bottom: 24px;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 16px;
}

.section-title {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: #2c3e50;
}

.section-description {
    margin: 4px 0 0;
    font-size: 13px;
    color: #7f8c8d;
}

.featured-grid {
    display: grid;
    gap: 18px;
    grid-template-columns: repeat(4, 1fr);
}

.featured-card {
    border-radius: 18px;
    padding: 18px;
    box-shadow: 0 14px 32px rgba(52, 73, 94, 0.08);
    display: flex;
    flex-direction: column;
    gap: 12px;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    border: 1px solid rgba(255, 255, 255, 0.65);
}

.featured-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 18px 40px rgba(52, 73, 94, 0.12);
}

.featured-card__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    color: #636e72;
}

.featured-card__category {
    font-weight: 600;
    letter-spacing: 0.4px;
    text-transform: uppercase;
}

.featured-card__title {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    color: #2c3e50;
}

.featured-card__code {
    margin: 0;
    font-size: 12px;
    color: #7f8c8d;
    letter-spacing: 0.5px;
}

.featured-card__prices {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
}

.featured-card__price-block {
    display: flex;
    flex-direction: column;
    font-size: 13px;
    color: #636e72;
}

.featured-card__price-block strong {
    font-size: 16px;
    color: #2c3e50;
    font-weight: 700;
}

.featured-card__margin {
    font-size: 13px;
    color: #636e72;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.featured-card__margin strong {
    font-size: 16px;
    color: #2c3e50;
    font-weight: 700;
}

.featured-card__margin small {
    font-size: 12px;
    color: #7f8c8d;
    margin-left: 4px;
}

.featured-card__meta {
    font-size: 12px;
    color: #7f8c8d;
}

.featured-card__actions {
    display: flex;
    gap: 8px;
}

.filter-card {
    margin-bottom: 20px;
    border-radius: 16px;
    box-shadow: 0 12px 28px rgba(44, 62, 80, 0.06);
}

.data-table {
    --easy-table-header-font-size: 14px;
    --easy-table-header-font-weight: 600;
    --easy-table-body-row-font-size: 14px;
}

.product-table-image {
    width: 50px;
    height: 50px;
    border-radius: 4px;
    object-fit: cover;
    cursor: pointer;
}

.image-slot {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 50px;
    height: 50px;
    background: var(--el-fill-color-light);
    color: var(--el-text-color-secondary);
    font-size: 24px;
}

@media (max-width: 768px) {
    .page-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
    }

    .featured-card__actions {
        flex-wrap: wrap;
    }
}
</style>
