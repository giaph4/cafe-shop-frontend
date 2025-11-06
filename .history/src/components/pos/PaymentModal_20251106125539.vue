<template>
    <div v-if="show" class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div class="bg-white p-6 rounded-lg shadow-xl w-96">
        <h3 class="text-lg font-semibold mb-2">Xác Nhận Thanh Toán</h3>
        <p class="text-sm text-gray-500 mb-4">Order #{{ orderId }}</p>
        
        <div class="mb-4">
          <span class="text-3xl font-bold text-blue-600">{{ formatCurrency(amount) }}</span>
        </div>
        
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">Phương thức thanh toán:</label>
          <select v-model="paymentMethod" class="w-full p-2 border rounded">
            <option value="CASH">Tiền mặt (CASH)</option>
            <option value="TRANSFER">Chuyển khoản (TRANSFER)</option>
            <option value="CARD">Thẻ (CARD)</option>
          </select>
        </div>
        
        <div class="flex justify-between space-x-3">
          <button @click="closeModal" class="w-1/2 p-2 bg-gray-200 rounded hover:bg-gray-300">
            Hủy
          </button>
          <button 
            @click="confirmPayment" 
            :disabled="!paymentMethod"
            class="w-1/2 p-2 bg-green-500 text-white rounded font-semibold hover:bg-green-600 disabled:bg-gray-400"
          >
            Xác Nhận
          </button>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, defineProps, defineEmits } from 'vue';
  import { useStore } from 'vuex';
  import { formatCurrency } from '@/utils/formatters';
  
  const props = defineProps({
    show: Boolean,
    orderId: [Number, String],
    amount: Number
  });
  
  const emit = defineEmits(['update:show', 'payment-success']);
  const store = useStore();
  
  const paymentMethod = ref('CASH');
  
  const closeModal = () => {
    emit('update:show', false);
  };
  
  // Gọi API Luồng 3: Thanh toán
  const confirmPayment = () => {
    store.dispatch('pos/processPayment', {
      paymentMethod: paymentMethod.value
    });
    emit('payment-success');
  };
  </script>