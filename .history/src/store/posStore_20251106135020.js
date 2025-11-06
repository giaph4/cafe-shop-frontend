// src/store/posStore.js
import { defineStore } from 'pinia';
import { getAllTables } from '@/api/tableService';
import { getAllProducts } from '@/api/productService';
import { getAllCategories } from '@/api/categoryService';
import {
    createOrder,
    getOrderById,
    payOrder,
    cancelOrder, // Thêm API Hủy đơn
    addItemToOrder, // Sửa tên (thay vì addOrderDetail)
    updateItemInOrder, // Sửa tên (thay vì updateOrderDetail)
    removeItemFromOrder, // Sửa tên (thay vì removeOrderDetail)
} from '@/api/orderService';
import { ElMessage } from 'element-plus';

export const usePosStore = defineStore('pos', {
    state: () => ({
        tables: [],
        products: [],
        categories: [],
        currentCart: [], // Giỏ hàng tạm
        selectedOrder: null, // Đơn hàng đang xem
        isLoading: false,
        error: null,
    }),

    getters: {
        isLoading: (state) => state.isLoading,
        currentCart: (state) => state.currentCart,
        selectedOrder: (state) => state.selectedOrder,
        tables: (state) => state.tables,
        products: (state) => state.products,
        categories: (state) => state.categories,
        currentCartTotal: (state) => {
            return state.currentCart.reduce(
                (total, item) => total + item.price * item.quantity,
                0
            );
        },
        selectedOrderTotal: (state) => {
            if (!state.selectedOrder) return 0;
            // Đảm bảo orderDetails tồn tại trước khi reduce
            if (!state.selectedOrder.orderDetails) return 0;
            return state.selectedOrder.orderDetails.reduce(
                (total, item) => total + item.price * item.quantity,
                0
            );
        },
    },

    actions: {
        // --- ACTIONS TẢI DỮ LIỆU ---
        async fetchTables() {
            try {
                const response = await getAllTables();
                this.tables = response.data;
            } catch (error) {
                this.error = 'Không thể tải danh sách bàn.';
                ElMessage.error(this.error);
            }
        },
        async fetchProductsAndCategories() {
            try {
                const [productsRes, categoriesRes] = await Promise.all([
                    getAllProducts(),
                    getAllCategories(),
                ]);
                this.products = productsRes.data;
                this.categories = categoriesRes.data;
            } catch (error) {
                this.error = 'Không thể tải menu.';
                ElMessage.error(this.error);
            }
        },

        // --- ACTIONS GIỎ HÀNG TẠM (TemporaryCart) ---
        addItemToCart(product) {
            const existingItem = this.currentCart.find(
                (item) => item.productId === product.id
            );
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                this.currentCart.push({
                    productId: product.id,
                    name: product.name,
                    price: product.price,
                    quantity: 1,
                    // Thêm các trường khác nếu cần (ví dụ: notes)
                });
            }
        },
        updateCartItemQuantity(productId, quantity) {
            const itemIndex = this.currentCart.findIndex(
                (item) => item.productId === productId
            );
            if (itemIndex !== -1) {
                if (quantity <= 0) {
                    this.currentCart.splice(itemIndex, 1);
                } else {
                    this.currentCart[itemIndex].quantity = quantity;
                }
            }
        },
        clearCart() {
            this.currentCart = [];
        },

        // --- ACTIONS TẠO ĐƠN HÀNG (Từ giỏ hàng tạm) ---
        async assignCartToTable(tableId) {
            if (this.currentCart.length === 0) return;
            this.isLoading = true;
            const orderData = {
                tableId: tableId,
                status: 'PENDING', // Mặc định là PENDING
                items: this.currentCart.map((item) => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    price: item.price,
                })),
            };
            try {
                const response = await createOrder(orderData);
                this.clearCart();
                this.selectedOrder = response.data; // Chọn đơn vừa tạo
                await this.fetchTables(); // Refresh lại bàn
            } catch (error) {
                this.error = 'Lỗi khi tạo đơn hàng cho bàn.';
                ElMessage.error(this.error);
            } finally {
                this.isLoading = false;
            }
        },
        async createTakeawayOrder() {
            if (this.currentCart.length === 0) return;
            this.isLoading = true;
            const orderData = {
                tableId: null, // Không có bàn
                status: 'PENDING',
                items: this.currentCart.map((item) => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    price: item.price,
                })),
            };
            try {
                const response = await createOrder(orderData);
                this.clearCart();
                this.selectedOrder = response.data; // Chọn đơn mang về vừa tạo
                // Không cần fetchTables vì đơn này không gắn vào bàn
            } catch (error) {
                this.error = 'Lỗi khi tạo đơn mang về.';
                ElMessage.error(this.error);
            } finally {
                this.isLoading = false;
            }
        },

        // --- ACTIONS QUẢN LÝ ĐƠN HÀNG ĐÃ CHỌN (ActiveOrderDetails) ---
        async selectOrder(orderId) {
            this.isLoading = true;
            this.clearCart(); // Xóa giỏ hàng tạm khi xem đơn
            try {
                const response = await getOrderById(orderId);
                this.selectedOrder = response.data;
            } catch (error) {
                this.error = 'Không thể tải chi tiết đơn hàng.';
                ElMessage.error(this.error);
            } finally {
                this.isLoading = false;
            }
        },
        clearSelectedOrder() {
            this.selectedOrder = null;
        },
        async processPayment(paymentData) {
            if (!this.selectedOrder) return;
            this.isLoading = true;
            try {
                // API payOrder(orderId, paymentData)
                await payOrder(this.selectedOrder.id, paymentData);
                this.clearSelectedOrder();
                await this.fetchTables(); // Refresh bàn
            } catch (error) {
                this.error = 'Thanh toán thất bại.';
                ElMessage.error(this.error);
            } finally {
                this.isLoading = false;
            }
        },
        async cancelCurrentOrder() {
            if (!this.selectedOrder) return;
            this.isLoading = true;
            try {
                // API cancelOrder(orderId)
                await cancelOrder(this.selectedOrder.id);
                this.clearSelectedOrder();
                await this.fetchTables(); // Refresh bàn
            } catch (error) {
                this.error = 'Hủy đơn thất bại.';
                ElMessage.error(this.error);
            } finally {
                this.isLoading = false;
            }
        },

        // --- ACTIONS CẬP NHẬT MÓN TRONG ĐƠN ĐÃ CHỌN ---
        async addMoreItemsToOrder(product) {
            if (!this.selectedOrder) return;

            // Tạm thời fix: API của bạn yêu cầu giá, nhưng product có thể không có
            // Tốt nhất là backend tự lấy giá từ productId
            const itemData = {
                productId: product.id,
                quantity: 1,
                price: product.price, // Giả định product object có giá
                notes: "" // Thêm notes nếu cần
            };

            try {
                // SỬA: Dùng đúng tên API: addItemToOrder
                const response = await addItemToOrder(this.selectedOrder.id, itemData);
                // Cập nhật state (đẩy item mới vào)
                this.selectedOrder.orderDetails.push(response.data);
            } catch (error) {
                this.error = 'Lỗi khi thêm món vào đơn.';
                ElMessage.error(this.error);
            }
        },
        async updateSelectedItemQuantity(detailId, quantity) {
            if (!this.selectedOrder) return;

            if (quantity <= 0) {
                // Nếu số lượng về 0, gọi action xóa
                await this.removeSelectedItem(detailId);
            } else {
                try {
                    // SỬA: Dùng đúng tên API: updateItemInOrder
                    const response = await updateItemInOrder(
                        this.selectedOrder.id,
                        detailId,
                        { quantity } // API chỉ cần số lượng
                    );
                    // Cập nhật state (thay thế item cũ)
                    const index = this.selectedOrder.orderDetails.findIndex(
                        (d) => d.id === detailId
                    );
                    if (index !== -1) {
                        this.selectedOrder.orderDetails[index] = response.data;
                    }
                } catch (error) {
                    this.error = 'Lỗi khi cập nhật số lượng.';
                    ElMessage.error(this.error);
                }
            }
        },
        async removeSelectedItem(detailId) {
            if (!this.selectedOrder) return;
            try {
                // SỬA: Dùng đúng tên API: removeItemFromOrder
                await removeItemFromOrder(this.selectedOrder.id, detailId);
                // Cập nhật state (lọc item ra)
                this.selectedOrder.orderDetails =
                    this.selectedOrder.orderDetails.filter((d) => d.id !== detailId);
            } catch (error) {
                this.error = 'Lỗi khi xóa món.';
                ElMessage.error(this.error);
            }
        },
    },
});