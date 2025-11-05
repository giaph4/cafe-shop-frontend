// src/store/posModule.js
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

export const posModule = {
    namespaced: true, // Quan trọng: Bật namespace

    state: {
        tables: [],
        products: [],
        categories: [],
        currentCart: [], // Giỏ hàng tạm
        selectedOrder: null, // Đơn hàng đang xem
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
            const itemIndex = state.currentCart.findIndex(
                (item) => item.productId === productId
            );
            if (itemIndex !== -1) {
                state.currentCart.splice(itemIndex, 1);
            }
        },
        UPDATE_CART_ITEM_QUANTITY(state, { productId, quantity }) {
            const itemIndex = state.currentCart.findIndex(
                (item) => item.productId === productId
            );
            if (itemIndex !== -1) {
                if (quantity <= 0) {
                    state.currentCart.splice(itemIndex, 1);
                } else {
                    state.currentCart[itemIndex].quantity = quantity;
                }
            }
        },
        CLEAR_CART(state) {
            state.currentCart = [];
        },
        CLEAR_SELECTED_ORDER(state) {
            state.selectedOrder = null;
        },
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
        async initializePOS({ commit, dispatch }) {
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
        async fetchTables({ commit }) {
            try {
                const response = await getAllTables();
                commit('SET_TABLES', response.data);
            } catch (error) {
                commit('SET_ERROR', 'Không thể tải danh sách bàn.');
            }
        },
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
        addItemToCart({ commit }, product) {
            commit('ADD_ITEM_TO_CART', product);
        },
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
                commit('SET_SELECTED_ORDER', response.data);
                await dispatch('fetchTables');
            } catch (error) {
                commit('SET_ERROR', 'Lỗi khi tạo đơn hàng cho bàn.');
            } finally {
                commit('SET_LOADING', false);
            }
        },
        async createTakeawayOrder({ commit, state }) {
            if (state.currentCart.length === 0) return;
            commit('SET_LOADING', true);
            const orderData = {
                tableId: null,
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
                commit('SET_SELECTED_ORDER', response.data);
            } catch (error) {
                commit('SET_ERROR', 'Lỗi khi tạo đơn mang về.');
            } finally {
                commit('SET_LOADING', false);
            }
        },
        async selectOrder({ commit }, orderId) {
            commit('SET_LOADING', true);
            commit('CLEAR_CART');
            try {
                const response = await getOrderById(orderId);
                commit('SET_SELECTED_ORDER', response.data);
            } catch (error) {
                commit('SET_ERROR', 'Không thể tải chi tiết đơn hàng.');
            } finally {
                commit('SET_LOADING', false);
            }
        },
        clearSelectedOrder({ commit }) {
            commit('CLEAR_SELECTED_ORDER');
        },
        async processPayment({ commit, state, dispatch }, paymentData) {
            if (!state.selectedOrder) return;
            commit('SET_LOADING', true);
            try {
                await payOrder(state.selectedOrder.id, paymentData);
                commit('CLEAR_SELECTED_ORDER');
                await dispatch('fetchTables');
            } catch (error) {
                commit('SET_ERROR', 'Thanh toán thất bại.');
            } finally {
                commit('SET_LOADING', false);
            }
        },
        async addMoreItemsToOrder({ commit, state }, product) {
            if (!state.selectedOrder) return;
            const itemData = {
                productId: product.id,
                quantity: 1,
                price: product.price,
            };
            try {
                const response = await addOrderDetail(state.selectedOrder.id, itemData);
                commit('ADD_SELECTED_ORDER_ITEM', response.data);
            } catch (error) {
                commit('SET_ERROR', 'Lỗi khi thêm món vào đơn.');
            }
        },
        async updateOrderItemQuantity({ commit, state }, { detailId, quantity }) {
            if (!state.selectedOrder) return;
            // Cho phép quantity = 0 để xóa
            if (quantity < 0) return;

            if (quantity === 0) {
                // Nếu số lượng về 0, gọi action xóa
                await dispatch('removeOrderItem', detailId);
            } else {
                try {
                    const response = await updateOrderDetail(
                        state.selectedOrder.id,
                        detailId,
                        { quantity }
                    );
                    commit('UPDATE_SELECTED_ORDER_ITEM', response.data);
                } catch (error) {
                    commit('SET_ERROR', 'Lỗi khi cập nhật số lượng.');
                }
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
        currentCartTotal: (state) => {
            return state.currentCart.reduce(
                (total, item) => total + item.price * item.quantity,
                0
            );
        },
        selectedOrderTotal: (state) => {
            if (!state.selectedOrder) return 0;
            return state.selectedOrder.orderDetails.reduce(
                (total, item) => total + item.price * item.quantity,
                0
            );
        },
    },
};