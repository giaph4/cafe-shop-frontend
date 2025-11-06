<template>
    <div class="temporary-cart">
        <div class="cart-header">
            <h4 class="cart-title" v-if="selectedTable">
                Đơn cho: <el-tag effect="dark">{{ selectedTable.name }}</el-tag>
            </h4>
            <h4 class="cart-title" v-else>Giỏ hàng tạm</h4>

            <el-button v-if="selectedTable" @click="$emit('clear-selected-table')" type="warning" :icon="Close" circle
                plain title="Hủy chọn bàn" />
            <el-button v-else-if="cart.length > 0" type="danger" :icon="Delete" @click="handleClearCart" circle plain
                title="Xóa giỏ hàng" />

        </div>

        <el-scrollbar class="cart-items-container">
            <div v-if="cart.length === 0" class="cart-empty">
                <el-empty :description="selectedTable ? 'Vui lòng chọn món' : 'Vui lòng chọn bàn hoặc chọn món'"
                    :image-size="80" />
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

            <div v-if="selectedTable">
                <el-button type="primary" @click="handleCreateTableOrder" :disabled="cart.length === 0 || isLoading"
                    :loading="isLoading" size="large" class="btn-action">
                    Xác nhận cho {{ selectedTable.name }}
                </el-button>
            </div>
            <div v-else>
                <el-button type="success" @click="handleTakeaway" :disabled="cart.length === 0 || isLoading"
                    :loading="isLoading" size="large" class="btn-action">
                    Tạo đơn Mang về
                </el-button>
            </div>

        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { usePosStore } from '@/store/posStore';
import { storeToRefs } from 'pinia';
import { formatCurrency } from '@/utils/formatters';
// SỬA: Thêm icon Close
import { Delete, Close } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';

// THÊM: Định nghĩa props và emits
const props = defineProps({
    selectedTable: {
        type: Object,
        default: null
    }
});
const emit = defineEmits(['clear-selected-table']);

// Khởi tạo store
const posStore = usePosStore();

// Lấy state và getters (dùng storeToRefs)
const { currentCart, currentCartTotal, isLoading } = storeToRefs(posStore);

// Lấy actions
const {
    updateCartItemQuantity,
    createTakeawayOrder,
    clearCart,
    assignCartToTable // THÊM: Action mới để gán đơn vào bàn
} = posStore;

// Gán computed properties
const cart = computed(() => currentCart.value);
const total = computed(() => currentCartTotal.value);

// Cập nhật số lượng (khi quantity về 0, store sẽ tự xóa)
const updateQuantity = (productId, quantity) => {
    updateCartItemQuantity(productId, quantity);
};

// Xử lý nút "Mang về" (Giữ nguyên)
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
        createTakeawayOrder();
        ElMessage.success('Đã tạo đơn mang về, vui lòng thanh toán.');
    }).catch(() => { });
};

// THÊM: Xử lý nút "Xác nhận cho bàn"
const handleCreateTableOrder = () => {
    if (!props.selectedTable) return;

    ElMessageBox.confirm(
        `Xác nhận tạo đơn hàng cho ${props.selectedTable.name}?`,
        'Xác nhận',
        {
            confirmButtonText: 'Đồng ý',
            cancelButtonText: 'Hủy',
            type: 'info',
        }
    ).then(() => {
        // Action này (từ posStore) sẽ tạo đơn PENDING (với tableId)
        // và tự động xóa giỏ hàng
        assignCartToTable(props.selectedTable.id);
        ElMessage.success(`Đã tạo đơn cho ${props.selectedTable.name}.`);
        emit('clear-selected-table'); // Báo cho POS.vue biết là đã xong
    }).catch(() => { });
};


// Xử lý xóa giỏ hàng (Giữ nguyên)
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
    display: flex;
    align-items: center;
    gap: 8px;
}

.cart-items-container {
    flex-grow: 1;
}

.cart-empty {
    margin-top: 20px;
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

.btn-action {
    /* SỬA: Đổi tên class */
    width: 100%;
}
</style>