<template>
    <div v-if="show" class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div class="bg-white p-6 rounded-lg shadow-xl w-96">
        <h3 class="text-lg font-semibold mb-2 text-red-600">Hủy Đơn Hàng</h3>
        <p class="text-gray-700 mb-4">Bạn có chắc chắn muốn hủy Order #{{ orderId }}? Bàn sẽ được chuyển về trạng thái TRỐNG.</p>
        
        <div class="flex justify-between space-x-3">
          <button @click="closeModal" class="w-1/2 p-2 bg-gray-200 rounded hover:bg-gray-300">
            Không
          </button>
          <button 
            @click="confirmCancel" 
            class="w-1/2 p-2 bg-red-500 text-white rounded font-semibold hover:bg-red-600"
          >
            Có, Hủy Đơn
          </button>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { defineProps, defineEmits } from 'vue';
  import { useStore } from 'vuex';
  
  const props = defineProps({
    show: Boolean,
    orderId: [Number, String]
  });
  
  const emit = defineEmits(['update:show', 'cancel-success']);
  const store = useStore();
  
  const closeModal = () => {
    emit('update:show', false);
  };
  
  // Gọi API Luồng 3: Hủy đơn
  const confirmCancel = () => {
    store.dispatch('pos/cancelActiveOrder');
    emit('cancel-success');
  };
  </script>