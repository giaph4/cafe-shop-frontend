<template>
    <div class="product-menu">
        <el-tabs v-model="selectedCategoryId" type="card" class="category-tabs">
            <el-tab-pane label="Tất cả" name="all"></el-tab-pane>
            <el-tab-pane v-for="category in categories" :key="category.id" :label="category.name"
                :name="category.id"></el-tab-pane>
        </el-tabs>

        <el-scrollbar class="product-grid-container">
            <div v-if="filteredProducts.length === 0" class="no-products">
                <el-empty description="Không tìm thấy sản phẩm" />
            </div>

            <el-row :gutter="12">
                <el-col v-for="product in filteredProducts" :key="product.id" :xs="12" :sm="8" :md="6">
                    <el-card shadow="hover" class="product-card" :body-style="{ padding: '0px' }"
                        @click="handleProductClick(product)">
                        <img :src="getProductImageUrl(product.imageUrl)" :alt="product.name" class="product-image" />
                        <div class="product-info">
                            <div class="product-name">{{ product.name }}</div>
                            <div class="product-price">{{ formatCurrency(product.price) }}</div>
                        </div>
                    </el-card>
                </el-col>
            </el-row>
        </el-scrollbar>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { usePosStore } from '@/store/posStore';
import { storeToRefs } from 'pinia';
import { formatCurrency } from '@/utils/formatters';

// Khởi tạo Pinia store
const posStore = usePosStore();

// Lấy state và getters từ store (dùng storeToRefs để giữ reactivity)
const { products, categories } = storeToRefs(posStore);

// Lấy action từ store
const { addItemToCart } = posStore;

// State nội bộ
const selectedCategoryId = ref('all'); // Mặc định là 'Tất cả'

// Lọc sản phẩm
const filteredProducts = computed(() => {
    if (selectedCategoryId.value === 'all') {
        return products.value;
    }
    return products.value.filter(
        (p) => p.categoryId === selectedCategoryId.value
    );
});

// Xử lý khi click vào sản phẩm
const handleProductClick = (product) => {
    // Gọi action của Pinia store
    addItemToCart(product);
};

// Xử lý ảnh
const getProductImageUrl = (imageUrl) => {
    if (!imageUrl) {
        return 'https://via.placeholder.com/150?text=No+Image'; // Ảnh mặc định
    }
    // VITE_API_URL được định nghĩa trong file .env
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
    return `${apiUrl}/api/files/products/${imageUrl}`;
};
</script>

<style scoped>
.product-menu {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.category-tabs {
    flex-shrink: 0;
    /* Không co lại */
}

.product-grid-container {
    flex-grow: 1;
    /* Lấp đầy không gian còn lại */
}

.product-card {
    margin-bottom: 12px;
    cursor: pointer;
}

.product-image {
    width: 100%;
    height: 120px;
    object-fit: cover;
    display: block;
}

.product-info {
    padding: 14px;
}

.product-name {
    font-weight: 600;
    font-size: 0.95rem;
    margin-bottom: 5px;
    /* Cắt chữ nếu quá dài */
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.product-price {
    font-size: 0.9rem;
    color: #606266;
}

.no-products {
    margin-top: 50px;
}
</style>