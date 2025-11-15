<template>
    <div class="product-card" @click="emit('add', product)">
        <el-image :src="product.imageUrl" fit="cover" class="product-image">
            <template #error>
                <div class="image-placeholder">
                    <el-icon>
                        <Image />
                    </el-icon>
                </div>
            </template>
        </el-image>
        <div class="product-info">
            <h4 class="product-name">{{ product.name }}</h4>
            <div class="product-meta">
                <span class="product-category">{{ product.categoryName || 'Chưa phân loại' }}</span>
                <span class="product-price">{{ formattedPrice }}</span>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { Image } from '@/components/icons'
import { formatCurrency } from '@/utils/formatters.js'

const props = defineProps({
    product: {
        type: Object,
        required: true,
    },
})

const emit = defineEmits(['add'])

const formattedPrice = computed(() => formatCurrency(props.product.price))
</script>

<style scoped>
.product-card {
    display: flex;
    flex-direction: column;
    background: #ffffff;
    border-radius: 16px;
    overflow: hidden;
    border: 1px solid #f0e9ff;
    box-shadow: 0 10px 22px rgba(83, 70, 155, 0.1);
    cursor: pointer;
    transition: transform 0.18s ease, box-shadow 0.18s ease;
    gap: 10px;
}

.product-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 18px 30px rgba(83, 70, 155, 0.18);
}

.product-image {
    width: 100%;
    height: 140px;
}

.image-placeholder {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #f7f7fb 0%, #ece7ff 100%);
    color: #b7a8f2;
    font-size: 28px;
}

.product-info {
    padding: 0 14px 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.product-name {
    margin: 0;
    font-weight: 600;
    font-size: 0.95rem;
    color: #2f2c40;
    line-height: 1.35;
    min-height: 44px;
}

.product-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.85rem;
    color: #6b7280;
}

.product-price {
    font-weight: 600;
    color: #4338ca;
}
</style>
