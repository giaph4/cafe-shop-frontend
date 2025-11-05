<template>
    <div class="temporary-cart">
        <div class="cart-header">
            <h4 class="cart-title">Giỏ hàng tạm</h4>
            <el-button type="danger" :icon="Delete" @click="handleClearCart" v-if="cart.length > 0" circle plain />
        </div>

        <el-scrollbar class="cart-items-container">
            <div v-if="cart.length === 0" class="cart-empty">
                <el-empty description="Chưa có sản phẩm" :image-size="80" />
            </div>

            <div v-else class="cart-items-list">
                <div v-for="item in cart" :key="item.productId" class="cart-item">
                    <div class="item-info">
                        <span class="item-name">{{ item.name }}</span>
                        <span class="item-price">{{ formatCurrency(item.price) }} x {{ item.quantity }}</span>
                    </div>
                    <div class="item-actions">
                        <el-input-number :model-value="item.quantity"
                            @change="(quantity) => updateQuantity(item.productId, quantity)" :min="0" :max="99"
                            size="small" controls-position="right" class="item-quantity" />
                    </div>
                </div>
            </div>
        </el-scrollbar>

        <div class="cart-footer">
            <el-divider />
            <div class="cart-total">
                <span>Tổng cộng:</span>
                <span class="total-amount">{{ formatCurrency(total) }}</span>
            </div>
            <el-button type="success" @click="handleTakeaway" :disabled="cart.length === 0 || isLoading"
                :loading="isLoading" size="large" class="btn-takeaway">
                Tạo đơn Mang về
            </el-button>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { usePosStore } from '@/store/posStore';
import { storeToRefs } from 'pinia';
import { formatCurrency } from '@/utils/formatters';
import { Delete } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';

// Khởi tạo store
const posStore = usePosStore();

// Lấy state và getters (dùng storeToRefs)
const { currentCart, currentCartTotal, isLoading } = storeToRefs(posStore);

// Lấy actions
const {
    updateCartItemQuantity,
    removeItemFromCart,
    createTakeawayOrder,
    clearCart
} = posStore;

// Gán computed properties
const cart = computed(() => currentCart.value);
const total = computed(() => currentCartTotal.value);

// Cập nhật số lượng (khi quantity về 0, store sẽ tự xóa)
const updateQuantity = (productId, quantity) => {
    updateCartItemQuantity(productId, quantity);
};

// Xử lý nút "Mang về"
const handleTakeaway = () => {
    ElMessageBox.confirm(
        'Xác nhận tạo đơn hàng mang về?',
        'Xác nhận',
        {
            confirmButtonText: 'Đồng ý',
            cancelButtonText: 'Hủy',
            type: 'warning',
        }
    ).then(() => {
        // Action này sẽ tạo đơn PENDING (tableId = null)
        // và tự động gán nó vào selectedOrder
        createTakeawayOrder();
        ElMessage.success('Đã tạo đơn mang về, vui lòng thanh toán.');
    }).catch(() => {
        // Bị hủy
    });
};

// Xử lý xóa giỏ hàng
const handleClearCart = () => {
    ElMessageBox.confirm(
        'Bạn có chắc muốn xóa toàn bộ giỏ hàng tạm?',
        'Xác nhận',
        {
            confirmButtonText: 'Xóa',
            cancelButtonText: 'Hủy',
            type: 'danger',
        }
    ).then(() => {
        clearCart();
    }).catch(() => { });
};
</script>

<style scoped>
.temporary-cart {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 16px;
    background-color: #fcfcfc;
    border-left: 1px solid #e9e9e9;
}

.cart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
}

.cart-title {
    margin-top: 0;
    margin-bottom: 10px;
    font-size: 1.2rem;
}

.cart-items-container {
    flex-grow: 1;
}

.cart-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;
    border-bottom: 1px dashed #e0e0e0;
}

.item-info {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    margin-right: 10px;
}

.item-name {
    font-weight: 500;
}

.item-price {
    font-size: 0.9rem;
    color: #888;
}

.item-actions {
    flex-shrink: 0;
}

.item-quantity {
    width: 90px;
}

.cart-footer {
    flex-shrink: 0;
    margin-top: auto;
}

.cart-total {
    display: flex;
    justify-content: space-between;
    font-size: 1.2rem;
    font-weight: 600;
    margin: 10px 0;
}

.total-amount {
    color: var(--el-color-primary);
}

.btn-takeaway {
    width: 100%;
}
</style>