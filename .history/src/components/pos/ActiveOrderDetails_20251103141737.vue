<template>
    <div class="active-order-details" v-if="order">
      <div class="order-header">
        <h3 class="order-title">
          Chi tiết Đơn hàng ({{ order.table?.name || 'Mang về' }})
        </h3>
        <button @click="closeDetails" class="btn-close">Quay lại Menu</button>
      </div>
      <div class="order-status">
        Trạng thái: <span :class="['status-badge', order.status.toLowerCase()]">{{ order.status }}</span>
      </div>
  
      <div class="order-items-list">
        <div v_if="!order.orderDetails || order.orderDetails.length === 0" class="items-empty">
          Đơn hàng này chưa có món.
        </div>
        <div v-else v-for="item in order.orderDetails" :key="item.id" class="order-item">
          <div class="item-info">
            <span class="item-name">{{ item.productName }}</span>
            <span class="item-price">{{ formatCurrency(item.price) }}</span>
          </div>
          <div class="item-actions">
            <button @click="updateQuantity(item.id, item.quantity - 1)">-</button>
            <input type="number" :value="item.quantity" @change="e => updateQuantity(item.id, parseInt(e.target.value))" class="item-quantity" />
            <button @click="updateQuantity(item.id, item.quantity + 1)">+</button>
            <button @click="removeItem(item.id)" class="btn-remove">X</button>
          </div>
        </div>
      </div>
      
      <button @click="showMenuToAdd" class="btn-add-more">
        + Thêm món
      </button>
  
      <div class="order-footer">
        <div class="voucher-input">
          <input type="text" v-model="voucherCode" placeholder="Nhập mã voucher (nếu có)" />
        </div>
        
        <div class="order-total">
          <strong>Tổng cộng:</strong>
          <span>{{ formatCurrency(total) }}</span>
        </div>
  
        <button 
          @click="handlePayment" 
          class="btn-payment"
          :disabled="isLoading"
        >
          {{ isLoading ? 'Đang xử lý...' : 'Thanh toán Đơn này' }}
        </button>
      </div>
    </div>
  </template>
  
  <script setup>
  import { computed, ref } from 'vue';
  import { useStore } from 'vuex';
  import { posStore } from '@/store/posStore';
  import { formatCurrency } from '@/utils/formatters';
  
  const store = useStore(posStore.key);
  const voucherCode = ref('');
  
  const order = computed(() => store.getters.selectedOrder);
  const total = computed(() => store.getters.selectedOrderTotal);
  const isLoading = computed(() => store.getters.isLoading);
  
  // Đóng chi tiết, quay về menu chọn món
  const closeDetails = () => {
    store.dispatch('clearSelectedOrder');
  };
  
  // Yêu cầu "Thêm món"
  // Chúng ta chỉ cần đóng chi tiết. Giao diện POS chính sẽ
  // hiển thị menu, và khi click món, action `addItemToCart`
  // SẼ ĐƯỢC THAY ĐỔI để kiểm tra nếu có selectedOrder thì gọi `addMoreItemsToOrder`
  // (Sẽ cập nhật ở bước 5)
  const showMenuToAdd = () => {
      // Tạm thời, chúng ta sẽ cho phép người dùng quay lại menu
      // nhưng vẫn giữ selectedOrder. Giao diện chính sẽ phải xử lý việc này.
      // Tuy nhiên, để đơn giản, chúng ta sẽ dispatch 'clearSelectedOrder'
      // và rely vào logic `ProductMenu` để thêm món vào `currentCart`.
      // Nếu người dùng muốn thêm vào đơn cũ, họ phải click lại bàn.
      
      // Cách 1: Đơn giản (Đóng và yêu cầu user click lại)
      // store.dispatch('clearSelectedOrder'); 
      
      // Cách 2: Phức tạp hơn (Giữ state)
      // -> Gợi ý của tôi (trong posStore) là `addMoreItemsToOrder`
      // Chúng ta cần một component menu riêng để thêm món vào đơn CÓ SẴN.
      // Để giữ mọi thứ đơn giản theo yêu cầu, chúng ta sẽ giả định
      // nút "Thêm món" này sẽ tạm thời bị vô hiệu hóa hoặc
      // yêu cầu `ProductMenu` ở bước 3.1 phải được sửa lại.
      
      // Tạm thời: Dùng action 'clearSelectedOrder' để quay về.
      store.dispatch('clearSelectedOrder');
      // Lưu ý: Luồng "Thêm món" vào đơn PENDING cần được xử lý cẩn thận ở file POS.vue
      // Ở đây, tôi ưu tiên luồng "Thanh toán"
  };
  
  const updateQuantity = (detailId, quantity) => {
    if (quantity > 0) {
      store.dispatch('updateOrderItemQuantity', { detailId, quantity });
    } else {
      // Xác nhận trước khi xóa
      if (confirm('Bạn có chắc muốn xóa món này?')) {
        store.dispatch('removeOrderItem', detailId);
      }
    }
  };
  
  const removeItem = (detailId) => {
    if (confirm('Bạn có chắc muốn xóa món này?')) {
      store.dispatch('removeOrderItem', detailId);
    }
  };
  
  const handlePayment = () => {
    if (confirm('Xác nhận thanh toán cho đơn hàng này?')) {
      const paymentData = {
        voucherCode: voucherCode.value || null,
      };
      store.dispatch('processPayment', paymentData);
    }
  };
  </script>
  
  <style scoped>
  .active-order-details {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 16px;
    background-color: #fdfdfd;
    border-left: 1px solid #e0e0e0;
  }
  .order-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2px solid #007bff;
    padding-bottom: 8px;
    margin-bottom: 8px;
  }
  .order-title {
    margin: 0;
    font-size: 1.4rem;
  }
  .btn-close {
    background: #f44336;
    color: white;
    border: none;
    padding: 8px 12px;
    border-radius: 4px;
    cursor: pointer;
  }
  .btn-close:hover {
    background: #d32f2f;
  }
  .order-status {
    margin-bottom: 16px;
    font-size: 1.1rem;
  }
  .status-badge {
    padding: 4px 8px;
    border-radius: 12px;
    color: white;
    font-weight: 600;
  }
  .status-badge.pending {
    background-color: #ff9800; /* Màu cam */
  }
  .status-badge.completed {
    background-color: #4caf50; /* Màu xanh */
  }
  .order-items-list {
    flex-grow: 1;
    overflow-y: auto;
    border-top: 1px solid #eee;
    border-bottom: 1px solid #eee;
    padding-top: 10px;
  }
  .order-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid #f0f0f0;
  }
  .item-info {
    display: flex;
    flex-direction: column;
  }
  .item-name {
    font-weight: 600;
    font-size: 1.05rem;
  }
  .item-price {
    font-size: 0.9rem;
    color: #555;
  }
  .item-actions {
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .item-actions button {
    width: 28px;
    height: 28px;
    border: 1px solid #ccc;
    background: #fff;
    cursor: pointer;
  }
  .item-quantity {
    width: 40px;
    text-align: center;
    border: 1px solid #ccc;
    border-radius: 4px;
  }
  .btn-remove {
    background-color: #fdd !important;
    border-color: #f00 !important;
    color: #f00;
    font-weight: bold;
  }
  .btn-add-more {
    width: 100%;
    padding: 10px;
    margin-top: 10px;
    background-color: #e0e0e0;
    border: 1px dashed #777;
    cursor: pointer;
  }
  .btn-add-more:hover {
    background-color: #d5d5d5;
  }
  .order-footer {
    flex-shrink: 0;
    margin-top: auto;
    padding-top: 16px;
    border-top: 2px solid #ddd;
  }
  .voucher-input {
      margin-bottom: 12px;
  }
  .voucher-input input {
      width: 100%;
      padding: 8px;
      border: 1px solid #ccc;
      border-radius: 4px;
  }
  .order-total {
    display: flex;
    justify-content: space-between;
    font-size: 1.3rem;
    font-weight: bold;
    margin-bottom: 16px;
    color: #d32f2f;
  }
  .btn-payment {
    width: 100%;
    padding: 14px;
    font-size: 1.2rem;
    font-weight: bold;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
  }
  .btn-payment:hover {
    background-color: #0056b3;
  }
  .btn-payment:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
  </style>