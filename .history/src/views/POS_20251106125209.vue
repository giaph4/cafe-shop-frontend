<template>
    <div class="flex h-[calc(100vh-64px)] bg-gray-100">
      <div class="w-2/5 border-r border-gray-200 bg-white overflow-y-auto">
        <ProductMenu />
      </div>
  
      <div class="w-1/3 border-r border-gray-200 bg-gray-50 overflow-y-auto">
        <TableGrid />
      </div>
  
      <div class="w-1/4 bg-white shadow-lg overflow-y-auto">
        <ActiveOrderDetails v-if="rightColumnMode === 'ACTIVE_ORDER'" />
        
        <TemporaryCart v-else-if="rightColumnMode === 'TEMP_CART'" />
        
        <div v-else class="flex items-center justify-center h-full">
          <div class="text-center text-gray-400 p-4">
            <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
            <p class="mt-2">Chọn sản phẩm hoặc bàn để bắt đầu</p>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { computed, onMounted } from 'vue';
  import { useStore } from 'vuex';
  import ProductMenu from '@/components/ProductMenu.vue';
  import TableGrid from '@/components/pos/TableGrid.vue';
  import TemporaryCart from '@/components/pos/TemporaryCart.vue';
  import ActiveOrderDetails from '@/components/pos/ActiveOrderDetails.vue';
  
  const store = useStore();
  
  const rightColumnMode = computed(() => store.getters['pos/rightColumnMode']);
  
  // Khi component được tải, fetch dữ liệu ban đầu
  onMounted(() => {
    store.dispatch('pos/fetchInitialData');
  });
  </script>
 
<style scoped>
.app-page-container {
    padding: 20px;
}

.table-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 20px;
}

.table-card {
    cursor: pointer;
    text-align: center;
    transition: all 0.2s ease;
    border: 2px solid transparent;
}

.table-card:hover {
    transform: translateY(-5px);
    box-shadow: var(--el-box-shadow-light);
}

.table-name {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 5px;
}

.table-status {
    font-size: 0.9rem;
    margin-bottom: 10px;
}

.table-capacity {
    font-size: 0.8rem;
    color: #909399;
}

/* --- Màu theo Trạng thái --- */
.table-card.status-empty {
    border-color: var(--el-color-success-light-3);
    background-color: var(--el-color-success-light-9);
}

.table-card.status-empty .table-status {
    color: var(--el-color-success);
}

.table-card.status-serving {
    border-color: var(--el-color-danger-light-3);
    background-color: var(--el-color-danger-light-9);
}

.table-card.status-serving .table-status {
    color: var(--el-color-danger);
}

.table-card.status-reserved {
    border-color: var(--el-color-warning-light-3);
    background-color: var(--el-color-warning-light-9);
}

.table-card.status-reserved .table-status {
    color: var(--el-color-warning);
}
</style>