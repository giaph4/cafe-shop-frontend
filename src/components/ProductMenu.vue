<template>
    <div class="product-menu">
        <div class="category-tabs mb-3">
            <button
                @click="selectCategory(null)"
                :class="['tab', { active: !selectedCategory }]"
            >
                Tất cả
            </button>
            <button
                v-for="category in categories"
                :key="category.id"
                @click="selectCategory(category.id)"
                :class="['tab', { active: selectedCategory === category.id }]"
            >
                {{ category.name }}
            </button>
        </div>

        <div class="product-grid">
            <div
                v-for="product in filteredProducts"
                :key="product.id"
                class="product-card"
                @click="handleProductClick(product)"
            >
                <img
                    :src="getProductImageUrl(product.imageUrl)"
                    :alt="product.name"
                    class="product-image"
                />
                <div class="product-info">
                    <h5 class="product-name">{{ product.name }}</h5>
                    <p class="product-description">{{ product.description || 'Mô tả sản phẩm' }}</p>
                    <p class="product-price">{{ formatCurrency(product.price) }}</p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import {ref, computed} from 'vue';
import {useStore} from 'vuex';
import {posStore} from '@/store/posStore.js'; // Import trực tiếp
import {formatCurrency} from '@/utils/formatters.js';

const store = useStore(posStore.key); // Sử dụng store đã import
const selectedCategory = ref(null);

// Lấy dữ liệu từ store
const products = computed(() => store.getters.products);
const categories = computed(() => store.getters.categories);

// Lọc sản phẩm dựa trên category
const filteredProducts = computed(() => {
    if (!selectedCategory.value) {
        return products.value;
    }
    return products.value.filter(
        (p) => p.categoryId === selectedCategory.value
    );
});

// Hàm chọn category
const selectCategory = (categoryId) => {
    selectedCategory.value = categoryId;
};

// Hàm xử lý khi click vào sản phẩm
const handleProductClick = (product) => {
    // Action này thêm vào currentCart (giỏ hàng tạm)
    store.dispatch('addItemToCart', product);
};

// Xử lý ảnh (nếu backend trả về đường dẫn tương đối)
const getProductImageUrl = (imageUrl) => {
    if (!imageUrl) {
        return 'https://via.placeholder.com/150'; // Ảnh mặc định
    }
    // Giả sử API_URL được định nghĩa trong .env
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
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding-bottom: 12px;
    border-bottom: 1px solid #eee;
}

.tab {
    padding: 8px 16px;
    border: 1px solid #ccc;
    border-radius: 20px;
    background-color: #fff;
    cursor: pointer;
}

.tab.active {
    background-color: #007bff;
    color: white;
    border-color: #007bff;
}

.product-grid {
    flex-grow: 1;
    overflow-y: auto;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    padding-top: 12px;
}

.product-card {
    border: 1px solid #ddd;
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
    transition: box-shadow 0.2s;
    display: flex;
    flex-direction: column;
}

.product-card:hover {
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.product-image {
    width: 100%;
    height: 120px;
    object-fit: cover;
}

.product-info {
    padding: 8px;
    flex-grow: 1;
    overflow-y: auto;
}

.product-name {
    font-size: 0.9rem;
    font-weight: 600;
    margin: 0;
}

.product-description {
    font-size: 0.8rem;
    color: #666;
    margin: 4px 0;
}

.product-price {
    font-size: 0.85rem;
    color: #555;
    margin: 4px 0 0;
    font-weight: 500;
}
</style>
