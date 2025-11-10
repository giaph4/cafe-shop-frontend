<template>
    <div class_name="pos-view">
      <div class="pos-container">
        
        <div class="left-column">
          <div class="tabs">
            <button 
              :class="{ active: activeTab === 'tables' }" 
              @click="activeTab = 'tables'"
            >
              Sơ đồ Bàn
            </button>
            <button 
              :class="{ active: activeTab === 'orders' }" 
              @click="activeTab = 'orders'"
            >
              Đơn hàng (Lịch sử)
            </button>
          </div>
  
          <div class="tab-content">
            <div v-if="activeTab === 'tables'" class="table-map">
              <CafeTable
                v-for="table in tables"
                :key="table.id"
                :table="table"
                @table-click="handleTableClick"
              />
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
              <TemporaryCart />
            </div>
          </div>
        </div>
        
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted } from 'vue';
  import { useStore } from 'vuex'; // <-- Import useStore gốc
  
  // Import các component con
  import CafeTable from '@/components/pos/CafeTable.vue';
  import ProductMenu from '@/components/ProductMenu.vue';
  import TemporaryCart from '@/components/pos/TemporaryCart.vue';
  import ActiveOrderDetails from '@/components/pos/ActiveOrderDetails.vue';
  import OrderHistoryList from '@/components/pos/OrderHistoryList.vue';
  
  const store = useStore(); // <-- Lấy store gốc
  const activeTab = ref('tables');
  
  // Lấy state từ store với namespace 'pos'
  const tables = computed(() => store.getters['pos/tables']);
  const currentCart = computed(() => store.getters['pos/currentCart']);
  const selectedOrder = computed(() => store.getters['pos/selectedOrder']);
  
  // Tải dữ liệu ban đầu
  onMounted(() => {
    store.dispatch('pos/fetchTables');
    store.dispatch('pos/fetchProductsAndCategories');
  });
  
  // Xử lý logic cốt lõi khi click vào bàn
  const handleTableClick = (table) => {
    
    // 1. Nếu có hàng trong giỏ tạm VÀ bàn đang trống -> GÁN ĐƠN
    if (currentCart.value.length > 0 && table.status === 'AVAILABLE') {
      if (confirm(`Gán đơn hàng hiện tại cho ${table.name}?`)) {
        store.dispatch('pos/assignCartToTable', table.id);
      }
      return;
    }
    
    // 2. Nếu không có hàng trong giỏ tạm VÀ bàn đang PENDING -> XEM ĐƠN
    if (currentCart.value.length === 0 && table.status === 'PENDING') {
      // API backend cần trả về 'pendingOrderId' trong object 'table'
      if (table.pendingOrderId) {
        store.dispatch('pos/selectOrder', table.pendingOrderId);
      } else {
        // Fallback: nếu backend không trả về, thử tìm trong order list (kém hiệu quả)
        // Tốt nhất là backend (CafeTableResponse) nên trả về pendingOrderId
        console.warn('Backend không trả về pendingOrderId, logic có thể lỗi');
        alert('Lỗi: Không tìm thấy ID đơn hàng cho bàn này.');
      }
      return;
    }
    
    // 3. Nếu có hàng trong giỏ VÀ click bàn PENDING
    if (currentCart.value.length > 0 && table.status === 'PENDING') {
        alert('Vui lòng xử lý giỏ hàng tạm trước khi xem đơn của bàn khác.');
        return;
    }
    
    // 4. Nếu bàn trống và giỏ hàng rỗng
    if (currentCart.value.length === 0 && table.status === 'AVAILABLE') {
        alert('Bàn trống. Vui lòng chọn món ở cột bên phải để tạo đơn.');
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