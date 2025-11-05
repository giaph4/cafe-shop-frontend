<template>
    <el-card 
      shadow="hover" 
      class="cafe-table" 
      :class="tableClass" 
      @click="$emit('table-click', table)"
    >
      <div class="table-content">
        <div class="table-name">{{ table.name }}</div>
        <div class="table-status">{{ statusText }}</div>
        <div v-if="table.status === 'PENDING'" class="pending-order">
          (Đơn #{{ table.pendingOrderId }})
        </div>
      </div>
    </el-card>
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
  
  // Logic màu sắc (dựa trên API backend)
  const tableClass = computed(() => {
    // API của bạn trả về: 'AVAILABLE', 'OCCUPIED', 'RESERVED', 'PENDING'
    switch (props.table.status) {
      case 'PENDING':
        return 'pending'; // Cam - Có đơn chờ thanh toán
      case 'OCCUPIED':
        return 'occupied'; // Đỏ - Đang phục vụ (nếu có)
      case 'AVAILABLE':
        return 'available'; // Xanh - Bàn trống
      default:
        return 'default'; // Xám - Trạng thái khác (RESERVED...)
    }
  });
  
  // Logic text
  const statusText = computed(() => {
    switch (props.table.status) {
      case 'PENDING':
        return 'Đang chờ';
      case 'OCCUPIED':
        return 'Đang phục vụ';
      case 'AVAILABLE':
        return 'Còn trống';
      case 'RESERVED':
        return 'Đã đặt';
      default:
        return props.table.status;
    }
  });
  </script>
  
  <style scoped>
  .cafe-table {
    cursor: pointer;
    border-radius: 8px;
    border-width: 2px;
    border-style: solid;
    transition: all 0.2s ease;
    color: #fff;
  }
  
  .table-content {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 90px;
    text-align: center;
    font-weight: 600;
  }
  
  .table-name {
    font-size: 1.1rem;
  }
  .table-status {
    font-size: 0.85rem;
    opacity: 0.9;
  }
  .pending-order {
    font-size: 0.8rem;
    opacity: 0.8;
    margin-top: 4px;
  }
  
  /* --- Màu sắc Trạng thái --- */
  
  /* Xanh - Bàn trống */
  .cafe-table.available {
    background-color: #67C23A;
    border-color: #85ce61;
  }
  .cafe-table.available:hover {
    background-color: #85ce61;
    transform: translateY(-2px);
  }
  
  /* Cam - Đang chờ (PENDING) */
  .cafe-table.pending {
    background-color: #E6A23C;
    border-color: #ebb563;
  }
  .cafe-table.pending:hover {
    background-color: #ebb563;
    transform: translateY(-2px);
  }
  
  /* Đỏ - Đang phục vụ (OCCUPIED) */
  .cafe-table.occupied {
    background-color: #F56C6C;
    border-color: #f78989;
  }
  .cafe-table.occupied:hover {
    background-color: #f78989;
  }
  
  /* Xám - Mặc định (RESERVED, etc.) */
  .cafe-table.default {
    background-color: #909399;
    border-color: #a6a9ad;
  }
  .cafe-table.default:hover {
    background-color: #a6a9ad;
  }
  </style>