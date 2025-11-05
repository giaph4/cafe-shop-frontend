import { createStore } from 'vuex';
import { getAllTables } from '@/api/tableService';
import { getAllProducts } from '@/api/productService';
import { getAllCategories } from '@/api/categoryService';
import {
    createOrder,
    getOrderById,
    payOrder,
    addOrderDetail,
    updateOrderDetail,
    removeOrderDetail,
} from '@/api/orderService';

export const posStore = createStore({
    state: {
        tables: [],
        products: [],
        categories: [],
        currentCart: [], // Giỏ hàng tạm (chọn món trước)
        selectedOrder: null, // Đơn hàng đang xem chi tiết (cột phải)
        isLoading: false,
        error: null,
    },
    mutations: {
        SET_TABLES(state, tables) {
            state.tables = tables;
        },
        SET_PRODUCTS(state, products) {
            state.products = products;
        },
        SET_CATEGORIES(state, categories) {
            state.categories = categories;
        },
        SET_LOADING(state, isLoading) {
            state.isLoading = isLoading;
        },
        SET_ERROR(state, error) {
            state.error = error;
        },
        SET_SELECTED_ORDER(state, order) {
            state.selectedOrder = order;
        },
        ADD_ITEM_TO_CART(state, product) {
            const existingItem = state.currentCart.find(
                (item) => item.productId === product.id
            );
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                state.currentCart.push({
                    productId: product.id,
                    name: product.name,
                    price: product.price,
                    quantity: 1,
                });
            }
        },
        REMOVE_ITEM_FROM_CART(state, productId) {
            state.currentCart = state.currentCart.filter(
                (item) => item.productId !== productId
            );
        },
        UPDATE_CART_ITEM_QUANTITY(state, { productId, quantity }) {
            const item = state.currentCart.find(
                (item) => item.productId === productId
            );
            if (item) {
                item.quantity = quantity;
                if (item.quantity <= 0) {
                    this.commit('REMOVE_ITEM_FROM_CART', productId);
                }
            }
        },
        CLEAR_CART(state) {
            state.currentCart = [];
        },
        CLEAR_SELECTED_ORDER(state) {
            state.selectedOrder = null;
        },
        // Các mutation để cập nhật selectedOrder (khi thêm/sửa/xóa món)
        UPDATE_SELECTED_ORDER_ITEM(state, updatedDetail) {
            if (!state.selectedOrder) return;
            const index = state.selectedOrder.orderDetails.findIndex(
                (d) => d.id === updatedDetail.id
            );
            if (index !== -1) {
                state.selectedOrder.orderDetails[index] = updatedDetail;
            }
        },
        ADD_SELECTED_ORDER_ITEM(state, newDetail) {
            if (!state.selectedOrder) return;
            state.selectedOrder.orderDetails.push(newDetail);
        },
        REMOVE_SELECTED_ORDER_ITEM(state, detailId) {
            if (!state.selectedOrder) return;
            state.selectedOrder.orderDetails =
                state.selectedOrder.orderDetails.filter((d) => d.id !== detailId);
        },
    },
    actions: {
        // Tải dữ liệu ban đầu cho màn hình POS
        async initializePOS({ commit }) {
            commit('SET_LOADING', true);
            commit('SET_ERROR', null);
            try {
                await Promise.all([
                    dispatch('fetchTables'),
                    dispatch('fetchProductsAndCategories'),
                ]);
            } catch (error) {
                commit('SET_ERROR', 'Lỗi khi tải dữ liệu POS.');
            } finally {
                commit('SET_LOADING', false);
            }
        },

        // Lấy danh sách và trạng thái bàn
        async fetchTables({ commit }) {
            try {
                const response = await getAllTables();
                commit('SET_TABLES', response.data);
            } catch (error) {
                commit('SET_ERROR', 'Không thể tải danh sách bàn.');
            }
        },

        // Lấy Menu (Sản phẩm và Danh mục)
        async fetchProductsAndCategories({ commit }) {
            try {
                const [productsRes, categoriesRes] = await Promise.all([
                    getAllProducts(),
                    getAllCategories(),
                ]);
                commit('SET_PRODUCTS', productsRes.data);
                commit('SET_CATEGORIES', categoriesRes.data);
            } catch (error) {
                commit('SET_ERROR', 'Không thể tải menu.');
            }
        },

        // Chọn món vào giỏ hàng tạm
        addItemToCart({ commit }, product) {
            commit('ADD_ITEM_TO_CART', product);
        },

        // Gán giỏ hàng tạm vào bàn (Luồng chính)
        async assignCartToTable({ commit, state, dispatch }, tableId) {
            if (state.currentCart.length === 0) return;

            commit('SET_LOADING', true);
            const orderData = {
                tableId: tableId,
                status: 'PENDING',
                items: state.currentCart.map((item) => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    price: item.price,
                })),
            };

            try {
                const response = await createOrder(orderData);
                commit('CLEAR_CART');
                commit('SET_SELECTED_ORDER', response.data); // Hiển thị chi tiết đơn vừa tạo
                await dispatch('fetchTables'); // Cập nhật trạng thái bàn
            } catch (error) {
                commit('SET_ERROR', 'Lỗi khi tạo đơn hàng cho bàn.');
            } finally {
                commit('SET_LOADING', false);
            }
        },

        // Tạo đơn mang về
        async createTakeawayOrder({ commit, state, dispatch }) {
            if (state.currentCart.length === 0) return;

            commit('SET_LOADING', true);
            const orderData = {
                tableId: null, // Mang về
                status: 'PENDING',
                items: state.currentCart.map((item) => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    price: item.price,
                })),
            };

            try {
                const response = await createOrder(orderData);
                commit('CLEAR_CART');
                commit('SET_SELECTED_ORDER', response.data); // Hiển thị chi tiết đơn để chuẩn bị thanh toán
                // Không cần fetchTables() vì không ảnh hưởng bàn
            } catch (error) {
                commit('SET_ERROR', 'Lỗi khi tạo đơn mang về.');
            } finally {
                commit('SET_LOADING', false);
            }
        },

        // Lấy chi tiết đơn hàng (khi click vào bàn PENDING hoặc từ lịch sử)
        async selectOrder({ commit }, orderId) {
            commit('SET_LOADING', true);
            commit('CLEAR_CART'); // Xóa giỏ hàng tạm
            try {
                const response = await getOrderById(orderId);
                commit('SET_SELECTED_ORDER', response.data);
            } catch (error) {
                commit('SET_ERROR', 'Không thể tải chi tiết đơn hàng.');
            } finally {
                commit('SET_LOADING', false);
            }
        },

        // Quay lại màn hình chọn món (ẩn chi tiết đơn hàng)
        clearSelectedOrder({ commit }) {
            commit('CLEAR_SELECTED_ORDER');
        },

        // Thanh toán cho đơn hàng đang chọn (selectedOrder)
        async processPayment({ commit, state, dispatch }, paymentData) {
            if (!state.selectedOrder) return;

            commit('SET_LOADING', true);
            try {
                // Giả sử paymentData chứa { voucherCode: '...' }
                await payOrder(state.selectedOrder.id, paymentData);
                commit('CLEAR_SELECTED_ORDER'); // Xóa chi tiết đơn
                await dispatch('fetchTables'); // Cập nhật trạng thái bàn (thành TRỐNG)
            } catch (error) {
                commit('SET_ERROR', 'Thanh toán thất bại.');
            } finally {
                commit('SET_LOADING', false);
            }
        },

        // --- Các action sửa đơn hàng (selectedOrder) ---

        async addMoreItemsToOrder({ commit, state }, product) {
            if (!state.selectedOrder) return;

            const itemData = {
                productId: product.id,
                quantity: 1,
                price: product.price
            };

            try {
                const response = await addOrderDetail(state.selectedOrder.id, itemData);
                commit('ADD_SELECTED_ORDER_ITEM', response.data);
            } catch (error) {
                commit('SET_ERROR', 'Lỗi khi thêm món vào đơn.');
            }
        },

        async updateOrderItemQuantity({ commit, state }, { detailId, quantity }) {
            if (!state.selectedOrder || quantity <= 0) return;

            try {
                const response = await updateOrderDetail(state.selectedOrder.id, detailId, { quantity });
                commit('UPDATE_SELECTED_ORDER_ITEM', response.data);
            } catch (error) {
                commit('SET_ERROR', 'Lỗi khi cập nhật số lượng.');
            }
        },

        async removeOrderItem({ commit, state }, detailId) {
            if (!state.selectedOrder) return;

            try {
                await removeOrderDetail(state.selectedOrder.id, detailId);
                commit('REMOVE_SELECTED_ORDER_ITEM', detailId);
            } catch (error) {
                commit('SET_ERROR', 'Lỗi khi xóa món.');
            }
        },

    },
    getters: {
        isLoading: (state) => state.isLoading,
        currentCart: (state) => state.currentCart,
        selectedOrder: (state) => state.selectedOrder,
        tables: (state) => state.tables,
        products: (state) => state.products,
        categories: (state) => state.categories,

        // Tính tổng tiền giỏ hàng tạm
        currentCartTotal: (state) => {
            return state.currentCart.reduce(
                (total, item) => total + item.price * item.quantity,
                0
            );
        },

        // Tính tổng tiền đơn hàng đang chọn
        selectedOrderTotal: (state) => {
            if (!state.selectedOrder) return 0;
            // Logic tính toán này nên dựa trên dữ liệu trả về từ selectedOrder
            // Tạm thời tính tổng từ orderDetails
            return state.selectedOrder.orderDetails.reduce(
                (total, item) => total + item.price * item.quantity,
                0
            );
        },
    },
});