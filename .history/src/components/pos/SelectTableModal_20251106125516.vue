<template>
    <div v-if="show" class="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-[60]">
      <div class="bg-white p-5 rounded-lg shadow-xl max-w-lg w-full">
        <h3 class="text-lg font-semibold mb-4">Chọn Bàn Trống</h3>
        
        <div class="max-h-64 overflow-y-auto grid grid-cols-4 gap-3 p-2">
          <div 
            v-for="table in emptyTables" 
            :key="table.id"
            @click="selectThisTable(table.id)"
            class="h-16 flex items-center justify-center font-semibold rounded-lg cursor-pointer bg-green-100 text-green-800 hover:bg-green-300"
          >
            {{ table.name }}
          </div>
          <div v-if="emptyTables.length === 0" class="col-span-4 text-center text-gray-500">
            Không còn bàn trống.
          </div>
        </div>
        
        <button @click="closeModal" class="w-full p-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 mt-4">
          Đóng
        </button>
      </div>
    </div>
  </template>
  
  <script setup>
  import { computed, defineProps, defineEmits } from 'vue';
  import { useStore } from 'vuex';
  
  const props = defineProps({
    show: Boolean
  });
  
  const emit = defineEmits(['update:show', 'table-selected']);
  const store = useStore();
  
  const emptyTables = computed(() => store.getters['pos/emptyTables']);
  
  const selectThisTable = (tableId) => {
    emit('table-selected', tableId);
  };
  
  const closeModal = () => {
    emit('update:show', false);
  };
  </script>