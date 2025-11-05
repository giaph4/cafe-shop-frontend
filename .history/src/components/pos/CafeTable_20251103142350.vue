<template>
    <div 
      class="cafe-table" 
      :class="tableClass" 
      @click="$emit('table-click', table)"
    >
      <div class="table-name">{{ table.name }}</div>
      <div class="table-status">{{ statusText }}</div>
    </div>
  </template>
  
  <script setup>
  import { computed } from 'vue';
  
  const props = defineProps({
    table: {
      type: Object,
      required: true,
    },
  });
  
  defineEmits(['table-click']);
  
  // Logic màu sắc và trạng thái
  const tableClass = computed(() => {
    // Giả sử API trả về table.status là 'AVAILABLE' hoặc 'PENDING'
    if (props.table.status === 'PENDING') {
      return 'pending'; // Màu cam
    }
    return 'available'; // Màu xanh
  });
  
  const statusText = computed(() => {
    if (props.table.status === 'PENDING') {
      return 'Đang có đơn';
    }
    return 'Còn trống';
  });
  </script>
  
  <style scoped>
  .cafe-table {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    color: white;
    font-weight: 600;
  }
  
  /* Xanh lá - Bàn trống */
  .cafe-table.available {
    background-color: #4CAF50; /* Green */
    border: 2px solid #388E3C;
  }
  .cafe-table.available:hover {
    background-color: #66BB6A;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
  
  /* Cam - Bàn đang PENDING */
  .cafe-table.pending {
    background-color: #ff9800; /* Orange */
    border: 2px solid #F57C00;
  }
  .cafe-table.pending:hover {
    background-color: #FFA726;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
  
  /* Bạn có thể thêm class 'occupied' (Màu đỏ) nếu backend hỗ trợ */
  .cafe-table.occupied {
    background-color: #f44336; /* Red */
    border: 2px solid #D32F2F;
  }
  
  .table-name {
    font-size: 1.2rem;
  }
  .table-status {
    font-size: 0.85rem;
    opacity: 0.9;
  }
  </style>