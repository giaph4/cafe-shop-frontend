import {
    getProducts,
    getCategories,
  } from '@/api/productService';
  import {
    getTables
  } from '@/api/tableService';
  import * as orderService from '@/api/orderService';
  
  // Hàm helper để tạo thông báo (bạn có thể thay bằng thư viện toast ưa thích)
  const showToast = (message, type = 'success') => {
    // Giả lập toast, thay thế bằng thư viện thực tế (ví dụ: vue-toastification)
    console.log(`[${type.toUpperCase()}] ${message}`);
    alert(`[${type.toUpperCase()}] ${message}`);
  };
  
  export const posModule = {
    namespaced: true,
    state: {
      products: [],
      categories: [],
      tables: [],
      
      // Luồng 1: Giỏ hàng tạm (chưa gửi lên server)
      temporaryCart: [], // { productId, name, price, quantity, notes }
  
      // Luồng 2: Order đang hoạt động (khi bấm vào bàn)
      selectedTableId: null,
      activeOrder: null, // OrderResponseDTO
      
      isLoadingProducts: false,
      isLoadingTables: false,
      isLoadingOrder: false,
    },
    
    mutations: {
      SET_PRODUCTS(state, products) {
        state.products = products;
      },
      SET_CATEGORIES(state, categories) {
        state.categories = categories;
      },
      SET_TABLES(state, tables) {
        state.tables = tables;
      },
      SET_LOADING_PRODUCTS(state, value) {
        state.isLoadingProducts = value;
      },
      SET_LOADING_TABLES(state, value) {
        state.isLoadingTables = value;
      },
      SET_LOADING_ORDER(state, value) {
        state.isLoadingOrder = value;
      },
      
      // Luồng 1: Giỏ hàng tạm
      ADD_TO_TEMP_CART(state, product) {
        const existingItem = state.temporaryCart.find(item => item.productId === product.id);
        if (existingItem) {
          existingItem.quantity++;
        } else {
          state.temporaryCart.push({
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            notes: ''
          });
        }
        // Khi thêm vào giỏ hàng tạm, xóa active order (nếu có) để chuyển sang Luồng 1
        state.activeOrder = null;
        state.selectedTableId = null;
      },
      UPDATE_TEMP_CART_ITEM_QUANTITY(state, { productId, quantity }) {
        const item = state.temporaryCart.find(item => item.productId === productId);
        if (item) {
          if (quantity <= 0) {
            state.temporaryCart = state.temporaryCart.filter(i => i.productId !== productId);
          } else {
            item.quantity = quantity;
          }
        }
      },
      UPDATE_TEMP_CART_ITEM_NOTES(state, { productId, notes }) {
        const item = state.temporaryCart.find(item => item.productId === productId);
        if (item) {
          item.notes = notes;
        }
      },
      REMOVE_FROM_TEMP_CART(state, productId) {
        state.temporaryCart = state.temporaryCart.filter(item => item.productId !== productId);
      },
      CLEAR_TEMP_CART(state) {
        state.temporaryCart = [];
      },
  
      // Luồng 2: Order đang hoạt động
      SET_ACTIVE_ORDER(state, order) {
        state.activeOrder = order;
        state.selectedTableId = order ? order.tableId : null;
        // Khi set active order, xóa giỏ hàng tạm để chuyển sang Luồng 2
        state.temporaryCart = [];
      },
      CLEAR_ACTIVE_ORDER(state) {
        state.activeOrder = null;
        state.selectedTableId = null;
      },
    },
  
    actions: {
      // Tải dữ liệu ban đầu
      async fetchInitialData({ dispatch }) {
        await Promise.all([
          dispatch('fetchProducts'),
          dispatch('fetchCategories'),
          dispatch('fetchTables')
        ]);
      },
      async fetchProducts({ commit }, params = {}) {
        commit('SET_LOADING_PRODUCTS', true);
        try {
          const response = await getProducts(params);
          commit('SET_PRODUCTS', response.data);
        } catch (error) {
          showToast('Lỗi khi tải sản phẩm: ' + (error.response?.data?.message || error.message), 'error');
        } finally {
          commit('SET_LOADING_PRODUCTS', false);
        }
      },
      async fetchCategories({ commit }) {
        try {
          const response = await getCategories();
          commit('SET_CATEGORIES', response.data);
        } catch (error) {
          showToast('Lỗi khi tải danh mục: ' + (error.response?.data?.message || error.message), 'error');
        }
      },
      async fetchTables({ commit }) {
        commit('SET_LOADING_TABLES', true);
        try {
          const response = await getTables();
          // Sắp xếp bàn theo tên
          const sortedTables = response.data.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
          commit('SET_TABLES', sortedTables);
        } catch (error) {
          showToast('Lỗi khi tải danh sách bàn: ' + (error.response?.data?.message || error.message), 'error');
        } finally {
          commit('SET_LOADING_TABLES', false);
        }
      },
  
      // LUỒNG 1: Tạo Order Mới
      selectProduct({ commit }, product) {
        commit('ADD_TO_TEMP_CART', product);
      },
      updateTempCartQuantity({ commit }, payload) {
        commit('UPDATE_TEMP_CART_ITEM_QUANTITY', payload);
      },
      updateTempCartNotes({ commit }, payload) {
        commit('UPDATE_TEMP_CART_ITEM_NOTES', payload);
      },
      removeTempCartItem({ commit }, productId) {
        commit('REMOVE_FROM_TEMP_CART', productId);
      },
      async createNewOrder({ commit, dispatch, state }, { type, tableId = null, customerId = null, voucherCode = null }) {
        if (state.temporaryCart.length === 0) {
          showToast('Giỏ hàng trống, không thể tạo đơn!', 'error');
          return;
        }
        
        const orderDTO = {
          items: state.temporaryCart.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            notes: item.notes
          })),
          type: type, // "TAKE_AWAY" hoặc "AT_TABLE"
          tableId: tableId,
          customerId: customerId,
          voucherCode: voucherCode
        };
  
        try {
          await orderService.createOrder(orderDTO);
          showToast('Tạo đơn hàng thành công!', 'success');
          commit('CLEAR_TEMP_CART');
          // Tải lại danh sách bàn (vì bàn có thể chuyển sang SERVING)
          await dispatch('fetchTables');
        } catch (error) {
          showToast('Lỗi khi tạo đơn hàng: ' + (error.response?.data?.message || error.message), 'error');
        }
      },
      
      // LUỒNG 2: Quản lý Order tại bàn
      async selectTable({ commit, dispatch }, tableId) {
        commit('SET_LOADING_ORDER', true);
        try {
          const response = await orderService.getPendingOrderByTable(tableId);
          commit('SET_ACTIVE_ORDER', response.data);
        } catch (error) {
          // Nếu không tìm thấy order (404), ta set activeOrder là null
          if (error.response && error.response.status === 404) {
            commit('CLEAR_ACTIVE_ORDER');
            // Đây là trường hợp hiếm, bàn SERVING nhưng không có order PENDING
            showToast('Bàn đang bận nhưng không tìm thấy order!', 'error');
            // Có thể cần đồng bộ lại bàn
            await dispatch('fetchTables');
          } else {
            showToast('Lỗi khi lấy thông tin order: ' + (error.response?.data?.message || error.message), 'error');
          }
        } finally {
          commit('SET_LOADING_ORDER', false);
        }
      },
      unselectActiveOrder({ commit }) {
        commit('CLEAR_ACTIVE_ORDER');
      },
  
      // Các hành động trên Active Order (Luồng 2)
      async reloadActiveOrder({ dispatch, state }) {
        if (state.activeOrder && state.activeOrder.tableId) {
          await dispatch('selectTable', state.activeOrder.tableId);
        }
      },
      async addItemToActiveOrder({ dispatch, state }, { productId, quantity, notes }) {
        if (!state.activeOrder) return;
        try {
          const orderDetailDTO = { productId, quantity, notes };
          await orderService.addOrderItem(state.activeOrder.id, orderDetailDTO);
          showToast('Đã thêm món', 'success');
          await dispatch('reloadActiveOrder'); // Tải lại chi tiết order
        } catch (error) {
          showToast('Lỗi khi thêm món: ' + (error.response?.data?.message || error.message), 'error');
        }
      },
      async updateActiveOrderItem({ dispatch, state }, { orderDetailId, quantity, notes }) {
        if (!state.activeOrder) return;
        try {
          const updateDTO = { quantity, notes };
          await orderService.updateOrderItem(state.activeOrder.id, orderDetailId, updateDTO);
          showToast('Đã cập nhật món', 'success');
          await dispatch('reloadActiveOrder');
        } catch (error) {
          showToast('Lỗi khi cập nhật món: ' + (error.response?.data?.message || error.message), 'error');
        }
      },
      async removeActiveOrderItem({ dispatch, state }, orderDetailId) {
        if (!state.activeOrder) return;
        try {
          await orderService.deleteOrderItem(state.activeOrder.id, orderDetailId);
          showToast('Đã xóa món', 'success');
          await dispatch('reloadActiveOrder');
        } catch (error) {
          showToast('Lỗi khi xóa món: ' + (error.response?.data?.message || error.message), 'error');
        }
      },
      async applyVoucherToActiveOrder({ dispatch, state }, voucherCode) {
        if (!state.activeOrder) return;
        try {
          await orderService.applyVoucher(state.activeOrder.id, voucherCode);
          showToast('Đã áp dụng voucher', 'success');
          await dispatch('reloadActiveOrder');
        } catch (error) {
          showToast('Lỗi áp dụng voucher: ' + (error.response?.data?.message || error.message), 'error');
        }
      },
      async removeVoucherFromActiveOrder({ dispatch, state }) {
        if (!state.activeOrder) return;
        try {
          await orderService.deleteVoucher(state.activeOrder.id);
          showToast('Đã xóa voucher', 'success');
          await dispatch('reloadActiveOrder');
        } catch (error) {
          showToast('Lỗi khi xóa voucher: ' + (error.response?.data?.message || error.message), 'error');
        }
      },
  
      // LUỒNG 3: Kết thúc Order
      async processPayment({ dispatch, state }, { paymentMethod }) {
        if (!state.activeOrder) return;
        try {
          const paymentDTO = { paymentMethod };
          await orderService.payOrder(state.activeOrder.id, paymentDTO);
          showToast('Thanh toán thành công!', 'success');
          dispatch('unselectActiveOrder'); // Xóa order khỏi cột chi tiết
          await dispatch('fetchTables'); // Tải lại bàn (bàn sẽ về EMPTY)
        } catch (error) {
          showToast('Lỗi khi thanh toán: ' + (error.response?.data?.message || error.message), 'error');
        }
      },
      async cancelActiveOrder({ dispatch, state }) {
        if (!state.activeOrder) return;
        try {
          await orderService.cancelOrder(state.activeOrder.id);
          showToast('Đã hủy đơn', 'success');
          dispatch('unselectActiveOrder'); // Xóa order khỏi cột chi tiết
          await dispatch('fetchTables'); // Tải lại bàn (bàn sẽ về EMPTY)
        } catch (error) {
          showToast('Lỗi khi hủy đơn: ' + (error.response?.data?.message || error.message), 'error');
        }
      },
    },
    
    getters: {
      // Getter cho Luồng 1
      temporaryCartTotal: (state) => {
        return state.temporaryCart.reduce((total, item) => total + (item.price * item.quantity), 0);
      },
      temporaryCartCount: (state) => {
        return state.temporaryCart.reduce((total, item) => total + item.quantity, 0);
      },
      
      // Getter cho bàn
      emptyTables: (state) => {
        return state.tables.filter(table => table.status === 'EMPTY');
      },
  
      // Getter cho Luồng 2
      hasActiveOrder: (state) => {
        return state.activeOrder !== null;
      },
      hasTemporaryCart: (state) => {
        return state.temporaryCart.length > 0;
      },
      
      // Getter cho hiển thị cột bên phải (Context-aware)
      // Ưu tiên hiển thị ActiveOrder (Luồng 2), nếu không có thì hiển thị TemporaryCart (Luồng 1)
      rightColumnMode: (state) => {
        if (state.activeOrder) {
          return 'ACTIVE_ORDER';
        }
        if (state.temporaryCart.length > 0) {
          return 'TEMP_CART';
        }
        return 'EMPTY'; // Không hiển thị gì
      }
    },
  };