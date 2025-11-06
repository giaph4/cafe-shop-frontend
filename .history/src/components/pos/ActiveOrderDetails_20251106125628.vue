<template>
    <div class="p-4 h-full flex flex-col" v-if="order">
        <div class="mb-4">
            <h2 class="text-xl font-semibold">Chi tiết Order ({{ order.table?.name || 'Mang về' }})</h2>
            <p class="text-sm text-gray-500">Mã Order: #{{ order.id }}</p>
        </div>

        <div class="flex-grow overflow-y-auto pr-2">
            <div v-if="isLoadingOrder" class="text-center p-8">
                <p>Đang tải chi tiết...</p>
            </div>

            <div v-for="item in order.orderDetails" :key="item.id" class="mb-3 p-2 border rounded">
                <div v-if="editingItemId !== item.id">
                    <div class="flex justify-between items-center mb-1">
                        <span class="font-semibold truncate w-4/5">{{ item.productName }}</span>
                        <span class="text-sm font-medium">{{ formatCurrency(item.price * item.quantity) }}</span>
                    </div>
                    <p class="text-sm text-gray-500">Số lượng: {{ item.quantity }}</p>
                    <p v-if="item.notes" class="text-sm text-blue-600 italic">Ghi chú: {{ item.notes }}</p>
                    <div class="flex justify-end space-x-2 mt-2">
                        <button @click="startEditing(item)" class="text-xs text-blue-500">Sửa</button>
                        <button @click="removeItem(item.id)" class="text-xs text-red-500">Xóa</button>
                    </div>
                </div>

                <div v-else>
                    <p class="font-semibold">{{ item.productName }}</p>
                    <div class="flex items-center my-2">
                        <label class="mr-2">SL:</label>
                        <input type="number" v-model.number="editForm.quantity"
                            class="w-16 border rounded p-1 text-center" />
                    </div>
                    <input type="text" v-model="editForm.notes" placeholder="Ghi chú..."
                        class="w-full text-sm p-1 border rounded" />
                    <div class="flex justify-end space-x-2 mt-2">
                        <button @click="cancelEditing" class="text-xs text-gray-500">Hủy</button>
                        <button @click="confirmUpdate(item.id)" class="text-xs text-green-500">Lưu</button>
                    </div>
                </div>
            </div>

            <button @click="showAddProductModal = true"
                class="w-full mt-2 p-2 border-2 border-dashed rounded text-blue-500 hover:bg-blue-50">
                + Thêm món
            </button>
        </div>

        <div class="mt-auto pt-4 border-t space-y-2">
            <div class="flex items-center" v-if="!order.voucher">
                <input v-model="voucherCodeInput" type="text" placeholder="Nhập mã voucher"
                    class="flex-grow p-2 border rounded-l" />
                <button @click="applyVoucher" class="p-2 bg-gray-200 rounded-r hover:bg-gray-300">Áp dụng</button>
            </div>
            <div v-else class="flex justify-between items-center p-2 bg-green-50 rounded">
                <span class="text-green-700">Đã áp dụng: {{ order.voucher.code }}</span>
                <button @click="removeVoucher" class="text-red-500 text-xl font-bold">&times;</button>
            </div>

            <div class="flex justify-between">
                <span>Tạm tính:</span>
                <span>{{ formatCurrency(order.subTotal) }}</span>
            </div>
            <div class="flex justify-between text-red-600">
                <span>Giảm giá (Voucher):</span>
                <span>- {{ formatCurrency(order.discountAmount) }}</span>
            </div>
            <div class="flex justify-between text-xl font-semibold">
                <span>Tổng cộng:</span>
                <span class="text-blue-600">{{ formatCurrency(order.totalAmount) }}</span>
            </div>

            <div class="flex space-x-2 pt-2">
                <button @click="showCancelModal = true"
                    class="w-1/3 bg-red-500 text-white p-2 rounded-lg font-semibold hover:bg-red-600">
                    Hủy Đơn
                </button>
                <button @click="showPaymentModal = true"
                    class="w-2/3 bg-green-500 text-white p-3 rounded-lg font-semibold hover:bg-green-600">
                    Thanh Toán
                </button>
            </div>
        </div>

        <PaymentModal v-model:show="showPaymentModal" :order-id="order.id" :amount="order.totalAmount"
            @payment-success="handlePaymentSuccess" />
        <ConfirmCancelModal v-model:show="showCancelModal" :order-id="order.id" @cancel-success="handleCancelSuccess" />
        <ProductRecipeModal v-model:show="showAddProductModal" :product-id="null" @item-added="handleAddItem" />

    </div>
</template>

<script setup>
import { computed, ref, reactive } from 'vue';
import { useStore } from 'vuex';
import { formatCurrency } from '@/utils/formatters';
import PaymentModal from './PaymentModal.vue';
import ConfirmCancelModal from './ConfirmCancelModal.vue';
// Tạm dùng modal này, bạn có thể tạo 1 modal chọn sản phẩm riêng
import ProductRecipeModal from '@/components/ProductRecipeModal.vue';

const store = useStore();

const order = computed(() => store.state.pos.activeOrder);
const isLoadingOrder = computed(() => store.state.pos.isLoadingOrder);

const showPaymentModal = ref(false);
const showCancelModal = ref(false);
const showAddProductModal = ref(false);

const voucherCodeInput = ref('');

// Trạng thái sửa item
const editingItemId = ref(null);
const editForm = reactive({
    quantity: 1,
    notes: ''
});

const startEditing = (item) => {
    editingItemId.value = item.id;
    editForm.quantity = item.quantity;
    editForm.notes = item.notes;
};

const cancelEditing = () => {
    editingItemId.value = null;
};

// Gọi API Luồng 2: Sửa món
const confirmUpdate = (orderDetailId) => {
    store.dispatch('pos/updateActiveOrderItem', {
        orderDetailId: orderDetailId,
        quantity: editForm.quantity,
        notes: editForm.notes
    });
    cancelEditing();
};

// Gọi API Luồng 2: Xóa món
const removeItem = (orderDetailId) => {
    if (confirm('Bạn có chắc muốn xóa món này?')) {
        store.dispatch('pos/removeActiveOrderItem', orderDetailId);
    }
};

// Gọi API Luồng 2: Thêm món
const handleAddItem = (itemData) => {
    // itemData từ ProductRecipeModal có thể cần điều chỉnh
    // Giả sử nó trả về { productId, quantity, notes }
    store.dispatch('pos/addItemToActiveOrder', itemData);
    showAddProductModal.value = false;
};

// Gọi API Luồng 2: Áp dụng Voucher
const applyVoucher = () => {
    if (!voucherCodeInput.value) return;
    store.dispatch('pos/applyVoucherToActiveOrder', voucherCodeInput.value);
    voucherCodeInput.value = '';
};

// Gọi API Luồng 2: Xóa Voucher
const removeVoucher = () => {
    store.dispatch('pos/removeVoucherFromActiveOrder');
};

// Xử lý Luồng 3
const handlePaymentSuccess = () => {
    showPaymentModal.value = false;
    // Store đã tự động reload bàn và xóa active order
};

const handleCancelSuccess = () => {
    showCancelModal.value = false;
    // Store đã tự động reload bàn và xóa active order
};
</script>