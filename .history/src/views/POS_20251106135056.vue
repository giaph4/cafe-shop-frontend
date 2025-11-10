<template>
    <div class="pos-view">
        <div class="pos-container">

            <div class="left-column">
                <div class="tabs">
                    <button :class="{ active: activeTab === 'tables' }" @click="activeTab = 'tables'">
                        Sơ đồ Bàn
                    </button>
                    <button :class="{ active: activeTab === 'orders' }" @click="activeTab = 'orders'">
                        Đơn hàng (Lịch sử)
                    </button>
                </div>

                <div class="tab-content">
                    <div v-if="activeTab === 'tables'" class="table-map">
                        <CafeTable v-for="table in tables" :key="table.id" :table="table"
                            :is-selected="selectedTable && selectedTable.id === table.id"
                            @table-click="handleTableClick" />
                    </div>

                    <div v-if="activeTab === 'orders'" class="order-history">
                        <OrderHistoryList />
                    </div>
                </div>
            </div>

            <div class="right-column">
                <ActiveOrderDetails v-if="selectedOrder" />

                <div v-else class="default-view">
                    <div class="menu-container">
                        <ProductMenu />
                    </div>
                    <div class="cart-container">
                        <TemporaryCart :selected-table="selectedTable" @clear-selected-table="selectedTable = null" />
                    </div>
                </div>
            </div>

        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
// SỬA: Bỏ Vuex, dùng Pinia
import { usePosStore } from '@/store/posStore';
import { storeToRefs } from 'pinia';
import { ElMessage, ElMessageBox } from 'element-plus'; // Import ElMessageBox

// Import các component con
import CafeTable from '@/components/pos/CafeTable.vue';
import ProductMenu from '@/components/ProductMenu.vue';
import TemporaryCart from '@/components/pos/TemporaryCart.vue';
import ActiveOrderDetails from '@/components/pos/ActiveOrderDetails.vue';
import OrderHistoryList from '@/components/pos/OrderHistoryList.vue';

// SỬA: Khởi tạo Pinia store
const posStore = usePosStore();
const activeTab = ref('tables');

// SỬA: Lấy state từ Pinia store
const { tables, currentCart, selectedOrder } = storeToRefs(posStore);
// Lấy actions (chúng ta sẽ cần dùng chúng)
const {
    fetchTables,
    fetchProductsAndCategories,
    selectOrder,
    assignCartToTable,
    clearSelectedOrder,
} = posStore;

// THÊM: State để theo dõi bàn đang được chọn (cho luồng "chọn bàn trước")
const selectedTable = ref(null);

// Tải dữ liệu ban đầu
onMounted(() => {
    fetchTables();
    fetchProductsAndCategories();
});

// SỬA: Xử lý logic cốt lõi khi click vào bàn
const handleTableClick = (table) => {

    // Nếu đang xem chi tiết đơn (ActiveOrderDetails), bấm bàn lần nữa để quay lại
    if (selectedOrder.value) {
        clearSelectedOrder();
        selectedTable.value = null; // Đảm bảo bàn không còn được chọn
    }

    // --- Logic chính ---

    // 1. Nếu có hàng trong giỏ tạm (CHỌN MÓN TRƯỚC)
    if (currentCart.value.length > 0) {
        if (table.status === 'AVAILABLE') {
            // 1a. Click bàn TRỐNG -> Gán đơn vào bàn
            ElMessageBox.confirm(`Gán đơn hàng hiện tại cho ${table.name}?`, 'Xác nhận', {
                confirmButtonText: 'Đồng ý',
                cancelButtonText: 'Hủy',
                type: 'info',
            }).then(() => {
                // Action này (từ posStore) sẽ tạo đơn và tự xóa giỏ hàng
                assignCartToTable(table.id);
                selectedTable.value = null; // Xóa trạng thái chọn bàn
            }).catch(() => { }); // Bị hủy
        } else {
            // 1b. Click bàn CÓ KHÁCH -> Cảnh báo
            ElMessage.warning('Vui lòng xử lý giỏ hàng tạm trước khi xem/sửa đơn của bàn khác.');
        }
        return;
    }

    // 2. Nếu giỏ hàng rỗng (BẮT ĐẦU LUỒNG MỚI)
    if (currentCart.value.length === 0) {
        // Đảm bảo clear đơn cũ nếu có (ví dụ sau khi thanh toán)
        if (selectedOrder.value) clearSelectedOrder();

        if (table.status === 'AVAILABLE') {
            // 2a. Click bàn TRỐNG -> "CHỌN BÀN TRƯỚC"
            selectedTable.value = table;
            ElMessage.success(`Đã chọn ${table.name}. Vui lòng chọn món.`);
        } else if (table.status === 'PENDING' || table.status === 'OCCUPIED') {
            // 2b. Click bàn CÓ KHÁCH -> XEM/SỬA ĐƠN
            // Backend cần trả về 'pendingOrderId' trong object 'table'
            if (table.pendingOrderId) {
                selectOrder(table.pendingOrderId);
                selectedTable.value = null; // Không còn là "chọn" nữa, mà là "xem"
            } else {
                console.warn('Backend không trả về pendingOrderId, logic có thể lỗi');
                ElMessage.error('Lỗi: Không tìm thấy ID đơn hàng cho bàn này.');
            }
        }
        return;
    }
};
</script>

<style scoped>
/* (Giữ nguyên style của bạn) */
.pos-view {
    height: calc(100vh - 60px);
    overflow: hidden;
}

.pos-container {
    display: flex;
    flex-direction: row;
    height: 100%;
}

.left-column {
    width: 40%;
    max-width: 500px;
    display: flex;
    flex-direction: column;
    background-color: #f4f6f8;
    border-right: 1px solid #dcdcdc;
}

.tabs {
    display: flex;
    flex-shrink: 0;
}

.tabs button {
    flex-grow: 1;
    padding: 16px;
    font-size: 1.1rem;
    font-weight: 600;
    border: none;
    background-color: #e9ecef;
    cursor: pointer;
    border-bottom: 3px solid transparent;
}

.tabs button.active {
    background-color: #fff;
    border-bottom: 3px solid #007bff;
}

.tab-content {
    flex-grow: 1;
    overflow-y: auto;
    padding: 16px;
}

.table-map {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 16px;
}

.order-history {
    height: 100%;
}

.right-column {
    width: 60%;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
}

.default-view {
    display: flex;
    flex-direction: row;
    height: 100%;
}

.menu-container {
    flex-grow: 1;
    width: 65%;
    height: 100%;
    overflow-y: auto;
    padding: 16px;
}

.cart-container {
    width: 35%;
    max-width: 450px;
    height: 100%;
    overflow-y: auto;
}
</style>