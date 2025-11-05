<template>
    <div class="temporary-cart">
        <h4 class="cart-title">Giỏ hàng tạm</h4>

        <div v-if="cart.length === 0" class="cart-empty">
            <p>Chưa có sản phẩm nào.</p>
            <p>Click vào menu để chọn món.</p>
        </div>

        <div v-else class="cart-content">
            <div class="cart-items">
                <div v-for="item in cart" :key="item.productId" class="cart-item">
                    <div class="item-info">
                        <span class="item-name">{{ item.name }}</span>
                        <span class="item-price">{{ formatCurrency(item.price) }}</span>
                    </div>
                    <div class="item-actions">
                        <button @click="updateQuantity(item.productId, item.quantity - 1)">-</button>
                        <input type="number" :value="item.quantity"
                            @change="e => updateQuantity(item.productId, parseInt(e.target.value))"
                            class="item-quantity" />
                        <button @click="updateQuantity(item.productId, item.quantity + 1)">+</button>
                        <button @click="removeItem(item.productId)" class="btn-remove">X</button>
                    </div>
                </div>
            </div>

            <div class="cart-footer">
                <div class="cart-total">
                    <strong>Tổng cộng:</strong>
                    <span>{{ formatCurrency(total) }}</span>
                </div>
                <button @click="handleTakeaway" class="btn-takeaway" :disabled="isLoading">
                    {{ isLoading ? 'Đang xử lý...' : 'Thanh toán Mang về' }}
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex'; // <-- Import useStore gốc
import { formatCurrency } from '@/utils/formatters';

const store = useStore(); // <-- Lấy store gốc

const cart = computed(() => store.getters['pos/currentCart']);
const total = computed(() => store.getters['pos/currentCartTotal']);
const isLoading = computed(() => store.getters['pos/isLoading']);

const updateQuantity = (productId, quantity) => {
    // Commit với namespace 'pos/...'
    store.commit('pos/UPDATE_CART_ITEM_QUANTITY', { productId, quantity });
};

const removeItem = (productId) => {
    // Commit với namespace 'pos/...'
    store.commit('pos/REMOVE_ITEM_FROM_CART', productId);
};

const handleTakeaway = () => {
    // Dispatch với namespace 'pos/...'
    store.dispatch('pos/createTakeawayOrder');
};
</script>

<style scoped>
/* (Giữ nguyên style của bạn) */
.temporary-cart {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 16px;
    background-color: #f9f9f9;
    border-left: 1px solid #e0e0e0;
}

.cart-title {
    margin-top: 0;
    margin-bottom: 16px;
    border-bottom: 1px solid #ddd;
    padding-bottom: 8px;
}

.cart-empty {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    color: #777;
}

.cart-content {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.cart-items {
    flex-grow: 1;
    overflow-y: auto;
}

.cart-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid #eee;
}

.item-info {
    display: flex;
    flex-direction: column;
}

.item-name {
    font-weight: 600;
}

.item-price {
    font-size: 0.9rem;
    color: #555;
}

.item-actions {
    display: flex;
    align-items: center;
    gap: 5px;
}

.item-actions button {
    width: 28px;
    height: 28px;
    border: 1px solid #ccc;
    background: #fff;
    cursor: pointer;
}

.item-quantity {
    width: 40px;
    text-align: center;
    border: 1px solid #ccc;
    border-radius: 4px;
}

.btn-remove {
    background-color: #fdd !important;
    border-color: #f00 !important;
    color: #f00;
    font-weight: bold;
}

.cart-footer {
    flex-shrink: 0;
    margin-top: auto;
    padding-top: 16px;
    border-top: 2px solid #ddd;
}

.cart-total {
    display: flex;
    justify-content: space-between;
    font-size: 1.2rem;
    margin-bottom: 16px;
}

.btn-takeaway {
    width: 100%;
    padding: 12px;
    font-size: 1.1rem;
    background-color: #28a745;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
}

.btn-takeaway:hover {
    background-color: #218838;
}

.btn-takeaway:disabled {
    background-color: #ccc;
    cursor: not-allowed;
}
</style>