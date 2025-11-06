<template>
    <div class="p-4 h-full flex flex-col">
      <h2 class="text-xl font-semibold mb-4">Giỏ Hàng Tạm</h2>
      
      <div class="flex-grow overflow-y-auto pr-2">
        <div v-if="cart.length === 0" class="text-center text-gray-400 pt-10">
          <p>Chọn món ở menu bên trái...</p>
        </div>
        
        <div v-for="item in cart" :key="item.productId" class="mb-3 p-2 border rounded">
          <div class="flex justify-between items-center mb-1">
            <span class="font-semibold truncate w-4/5">{{ item.name }}</span>
            <span class="text-sm font-medium">{{ formatCurrency(item.price * item.quantity) }}</span>
          </div>
          
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center">
              <button @click="updateQuantity(item.productId, item.quantity - 1)" class="px-2 py-0 border rounded">-</button>
              <input 
                type="number" 
                :value="item.quantity"
                @input="updateQuantity(item.productId, parseInt($event.target.value) || 0)"
                class="w-12 text-center mx-1 border-b"
              />
              <button @click="updateQuantity(item.productId, item.quantity + 1)" class="px-2 py-0 border rounded">+</button>
            </div>
            <button @click="removeItem(item.productId)" class="text-red-500 hover:text-red-700 text-sm">Xóa</button>
          </div>
          
          <input 
            type="text" 
            :value="item.notes"
            @input="updateNotes(item.productId, $event.target.value)"
            placeholder="Ghi chú (ít đường...)"
            class="w-full text-sm p-1 border rounded"
          />
        </div>
      </div>
      
      <div class="mt-auto pt-4 border-t">
        <div class="flex justify-between items-center mb-4">
          <span class="text-lg font-semibold">Tổng ({{ cartCount }} món)</span>
          <span class="text-lg font-semibold text-blue-600">{{ formatCurrency(cartTotal) }}</span>
        </div>
        <button 
          @click="showDestinationModal = true"
          class="w-full bg-blue-500 text-white p-3 rounded-lg font-semibold hover:bg-blue-600"
        >
          Tạo Đơn Hàng
        </button>
      </div>
  
      <SelectDestinationModal v-model:show="showDestinationModal" @create-order="handleCreateOrder" />
    </div>
  </template>
  
  <script setup>
  import { computed, ref } from 'vue';
  import { useStore } from 'vuex';
  import { formatCurrency } from '@/utils/formatters';
  import SelectDestinationModal from './SelectDestinationModal.vue'; // Modal mới
  
  const store = useStore();
  const showDestinationModal = ref(false);
  
  const cart = computed(() => store.state.pos.temporaryCart);
  const cartTotal = computed(() => store.getters['pos/temporaryCartTotal']);
  const cartCount = computed(() => store.getters['pos/temporaryCartCount']);
  
  const updateQuantity = (productId, quantity) => {
    store.dispatch('pos/updateTempCartQuantity', { productId, quantity });
  };
  
  const updateNotes = (productId, notes) => {
    store.dispatch('pos/updateTempCartNotes', { productId, notes });
  };
  
  const removeItem = (productId) => {
    store.dispatch('pos/removeTempCartItem', productId);
  };
  
  // Xử lý khi modal `SelectDestinationModal` emit event
  const handleCreateOrder = (payload) => {
    store.dispatch('pos/createNewOrder', payload);
    showDestinationModal.value = false;
  };
  </script>