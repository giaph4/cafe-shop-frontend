<template>
    <div class="order-history-list">
        <div class="filters">
            <button :class="{ active: filterStatus === 'PENDING' }" @click="setFilter('PENDING')">
                Đang chờ
            </button>
            <button :class="{ active: filterStatus === 'COMPLETED' }" @click="setFilter('COMPLETED')">
                Hoàn thành
            </button>
            <button :class="{ active: filterStatus === null }" @click="setFilter(null)">
                Tất cả
            </button>
        </div>

        <div class="list-container" v-if="!isLoading">
            <div v-if="filteredOrders.length === 0" class="no-orders">
                Không tìm thấy đơn hàng nào.
            </div>

            <div v-for="order in filteredOrders" :key="order.id" class="order-item-card"
                :class="{ 'pending': order.status === 'PENDING' }" @click="handleOrderClick(order)">
                <div class="card-header">
                    <strong>Đơn #{{ order.id }} - {{ order.table?.name || 'Mang về' }}</strong>
                    <span :class="['status-badge', order.status.toLowerCase()]">
                        {{ order.status }}
                    </span>
                </div>
                <div class="card-body">
                    <p>Tổng tiền: <strong>{{ formatCurrency(order.totalAmount) }}</strong></p>
                    <p>Giờ tạo: {{ formatDateTime(order.createdAt) }}</p>
                </div>

                <button v-if="order.status === 'PENDING'" @click.stop="handlePayClick(order)" class="btn-pay-now">
                    Thanh toán ngay
                </button>
            </div>
        </div>

        <div v-if="isLoading" class="loading">
            Đang tải danh sách...
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { posStore } from '@/store/posStore';
import { getAllOrders, getPendingOrders } from '@/api/orderService'; // Cần hàm mới
import { formatCurrency, formatDateTime } from '@/utils/formatters';

const store = useStore(posStore.key);
const allOrders = ref([]);
const isLoading = ref(false);
const filterStatus = ref('PENDING'); // Mặc định hiển thị đơn PENDING

// Tải dữ liệu
const fetchOrders = async () => {
    isLoading.value = true;
    try {
        // Chúng ta có thể tối ưu bằng cách chỉ gọi API theo filter
        // Nhưng để đơn giản, ta tải tất cả trước
        const response = await getAllOrders();
        allOrders.value = response.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Sắp xếp mới nhất trước
    } catch (error) {
        console.error("Lỗi khi tải lịch sử đơn hàng:", error);
    } finally {
        isLoading.value = false;
    }
};

onMounted(fetchOrders);

// Lọc danh sách
const filteredOrders = computed(() => {
    if (!filterStatus.value) {
        return allOrders.value;
    }
    return allOrders.value.filter(o => o.status === filterStatus.value);
});

const setFilter = (status) => {
    filterStatus.value = status;
};

// Xử lý khi click vào đơn hàng
const handleOrderClick = (order) => {
    // Yêu cầu posStore tải chi tiết đơn hàng này
    // Cột 2 (ActiveOrderDetails) sẽ tự động hiển thị
    store.dispatch('selectOrder', order.id);
};

// Xử lý khi click "Thanh toán ngay"
const handlePayClick = (order) => {
    // Tương tự như click vào đơn hàng
    // 'selectOrder' sẽ tải chi tiết và hiển thị nút thanh toán
    store.dispatch('selectOrder', order.id);
};
</script>

<style scoped>
.order-history-list {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.filters {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
    padding-bottom: 16px;
    border-bottom: 1px solid #eee;
}

.filters button {
    padding: 8px 12px;
    border: 1px solid #ccc;
    border-radius: 4px;
    background-color: #f0f0f0;
    cursor: pointer;
}

.filters button.active {
    background-color: #007bff;
    color: white;
    border-color: #007bff;
}

.list-container {
    flex-grow: 1;
    overflow-y: auto;
}

.order-item-card {
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 5px;
    margin-bottom: 12px;
    cursor: pointer;
    transition: box-shadow 0.2s;
}

.order-item-card:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.order-item-card.pending {
    border-left: 4px solid #ff9800;
    /* Màu cam */
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    border-bottom: 1px solid #eee;
}

.card-body {
    padding: 12px;
}

.card-body p {
    margin: 4px 0;
}

.status-badge {
    padding: 4px 8px;
    border-radius: 12px;
    color: white;
    font-weight: 500;
    font-size: 0.9rem;
}

.status-badge.pending {
    background-color: #ff9800;
}

.status-badge.completed {
    background-color: #4caf50;
}

.btn-pay-now {
    display: block;
    width: calc(100% - 24px);
    margin: 0 12px 12px 12px;
    padding: 10px;
    background-color: #28a745;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 600;
}

.btn-pay-now:hover {
    background-color: #218838;
}

.loading,
.no-orders {
    text-align: center;
    padding: 40px;
    color: #777;
}
</style>