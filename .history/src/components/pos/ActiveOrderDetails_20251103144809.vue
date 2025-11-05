<template>
    <div class="active-order-details" v-if="order">
        <div class="order-header">
            <h3 class="order-title">
                Chi tiết Đơn hàng:
                <el-tag size="large" type="primary" effect="dark" round>
                    {{ order.table?.name || 'Mang về' }} (Đơn #{{ order.id }})
                </el-tag>
            </h3>
            <el-button @click="closeDetails" :icon="CloseBold" circle type="danger" plain />
        </div>

        <div class="order-status-bar">
            <span>Trạng thái:</span>
            <el-tag :type="order.status === 'PENDING' ? 'warning' : 'success'" effect="light">
                {{ order.status }}
            </el-tag>
            <span>Giờ tạo: {{ formatDateTime(order.createdAt) }}</span>
        </div>

        <el-scrollbar class="order-items-list">
            <div v-if="!order.orderDetails || order.orderDetails.length === 0" class="items-empty">
                <el-empty description="Đơn hàng trống" :image-size="80" />
            </div>
            <div v-else v-for="item in order.orderDetails" :key="item.id" class="order-item">
                <div class="item-info">
                    <span class="item-name">{{ item.productName }}</span>
                    <span class="item-price">{{ formatCurrency(item.price) }} x {{ item.quantity }}</span>
                </div>
                <div class="item-actions">
                    <el-input-number :model-value="item.quantity"
                        @change="(quantity) => updateQuantity(item.id, quantity)" :min="0" :max="99" size="small"
                        controls-position="right" class="item-quantity" />
                </div>
            </div>
        </el-scrollbar>

        <div class="order-footer">
            <el-divider />

            <div class="voucher-input">
                <el-input v-model="voucherCode" placeholder="Nhập mã voucher (nếu có)">
                    <template #prepend>Voucher</template>
                </el-input>
            </div>

            <div class="order-total">
                <span>Tổng cộng:</span>
                <span class="total-amount">{{ formatCurrency(total) }}</span>
            </div>

            <el-button type="primary" @click="handlePayment" :disabled="isLoading" :loading="isLoading" size="large"
                class="btn-payment">
                Xác nhận Thanh toán
            </el-button>
        </div>
    </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { usePosStore } from '@/store/posStore';
import { storeToRefs } from 'pinia';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import { CloseBold } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';

// Khởi tạo store
const posStore = usePosStore();

// Lấy state và getters (dùng storeToRefs)
const { selectedOrder, selectedOrderTotal, isLoading } = storeToRefs(posStore);

// Lấy actions
const {
    clearSelectedOrder,
    processPayment,
    updateSelectedItemQuantity,
    removeSelectedItem
} = posStore;

// State nội bộ
const voucherCode = ref('');

// Computed properties
const order = computed(() => selectedOrder.value);
const total = computed(() => selectedOrderTotal.value);

// Đóng chi tiết, quay về menu chọn món
const closeDetails = () => {
    clearSelectedOrder();
};

// Cập nhật số lượng (khi về 0, store sẽ tự xóa)
const updateQuantity = (detailId, quantity) => {
    updateSelectedItemQuantity(detailId, quantity);
};

// Xử lý thanh toán
const handlePayment = () => {
    ElMessageBox.confirm(
        `Xác nhận thanh toán cho Đơn #${order.value.id}?`,
        'Xác nhận Thanh toán',
        {
            confirmButtonText: 'Đồng ý',
            cancelButtonText: 'Hủy',
            type: 'success',
        }
    ).then(() => {
        const paymentData = {
            voucherCode: voucherCode.value || null,
        };
        processPayment(paymentData);
        ElMessage.success('Thanh toán thành công!');
    }).catch(() => { });
};
</script>

<style scoped>
.active-order-details {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 16px;
    background-color: #fdfdfd;
    border-left: 1px solid #e9e9e9;
}

.order-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
    border-bottom: 2px solid var(--el-color-primary);
    padding-bottom: 10px;
}

.order-title {
    margin: 0;
    font-size: 1.3rem;
    display: flex;
    align-items: center;
    gap: 10px;
}

.order-status-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px;
    background-color: #f4f4f5;
    border-radius: 4px;
    margin: 10px 0;
    font-size: 0.9rem;
    color: #606266;
}

.order-items-list {
    flex-grow: 1;
}

.order-item {
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
    font-size: 1.05rem;
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

.order-footer {
    flex-shrink: 0;
    margin-top: auto;
}

.voucher-input {
    margin: 15px 0;
}

.order-total {
    display: flex;
    justify-content: space-between;
    font-size: 1.3rem;
    font-weight: 600;
    margin: 10px 0 15px 0;
}

.total-amount {
    color: var(--el-color-danger);
}

.btn-payment {
    width: 100%;
}
</style>