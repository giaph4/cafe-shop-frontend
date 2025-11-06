<template>
    <div class="p-4">
        <h2 class="text-xl font-semibold mb-4">Menu Sản Phẩm</h2>

        <div class="mb-4 space-y-3">
            <input v-model="filters.search" type="text" placeholder="Tìm kiếm sản phẩm..."
                class="w-full p-2 border rounded" />
            <select v-model="filters.categoryId" class="w-full p-2 border rounded">
                <option value="">Tất cả danh mục</option>
                <option v-for="category in categories" :key="category.id" :value="category.id">
                    {{ category.name }}
                </option>
            </select>

            <div>
                <label class="block text-sm font-medium text-gray-700">Lọc giá: 0 - {{ filters.maxPrice }}K</label>
                <input type="range" min="0" max="200" step="5" v-model="filters.maxPrice"
                    class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
            </div>
        </div>

        <div v-if="isLoadingProducts" class="text-center p-8">
            <p>Đang tải menu...</p>
        </div>
        <div v-else class="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div v-for="product in filteredProducts" :key="product.id" @click="onProductSelect(product)"
                class="border rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow">
                <img :src="product.imageUrl || 'https://via.placeholder.com/150'" alt="product"
                    class="w-full h-24 object-cover rounded mb-2" />
                <h3 class="font-semibold truncate">{{ product.name }}</h3>
                <p class="text-sm text-green-600">{{ formatCurrency(product.price) }}</p>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, reactive, watch, ref } from 'vue';
import { useStore } from 'vuex';
import { formatCurrency } from '@/utils/formatters'; // Import hàm format tiền

const store = useStore();

const categories = computed(() => store.state.pos.categories);
const products = computed(() => store.state.pos.products);
const isLoadingProducts = computed(() => store.state.pos.isLoadingProducts);

const filters = reactive({
    search: '',
    categoryId: '',
    maxPrice: 200, // Giá trị max của thanh trượt (K VNĐ)
});

// Sử dụng debounce để tránh gọi API liên tục khi gõ
let debounceTimer = null;
watch(filters, (newFilters) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        // Tạo params cho API
        const apiParams = {
            search: newFilters.search || undefined,
            categoryId: newFilters.categoryId || undefined,
            // API không có lọc giá, chúng ta sẽ lọc ở client
        };
        store.dispatch('pos/fetchProducts', apiParams);
    }, 300);
});

// Lọc sản phẩm (Client-side cho giá, vì API không hỗ trợ)
const filteredProducts = computed(() => {
    const maxPriceValue = filters.maxPrice * 1000;
    return products.value.filter(p => p.price <= maxPriceValue);
});

// Luồng 1: Chọn sản phẩm
const onProductSelect = (product) => {
    store.dispatch('pos/selectProduct', product);
};
</script>
<style scoped>
.app-page-container {
    padding: 20px;
}

.table-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 20px;
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
</style>