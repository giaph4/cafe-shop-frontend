<template>
  <div class="empty-state">
    <div class="empty-icon">{{ icon }}</div>
    <div class="empty-title">{{ title }}</div>
    <div class="empty-description" v-if="description">{{ description }}</div>
    <el-button 
      v-if="actionText" 
      :type="actionType" 
      :icon="actionIcon"
      @click="$emit('action')"
      class="empty-action">
      {{ actionText }}
    </el-button>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  icon: {
    type: String,
    default: '📦'
  },
  title: {
    type: String,
    default: 'Không có dữ liệu'
  },
  description: {
    type: String,
    default: ''
  },
  actionText: {
    type: String,
    default: ''
  },
  actionType: {
    type: String,
    default: 'primary'
  },
  actionIcon: {
    type: Object,
    default: null
  }
})

defineEmits(['action'])
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-16) var(--space-8);
  text-align: center;
  min-height: 400px;
}

.empty-icon {
  font-size: 5rem;
  margin-bottom: var(--space-6);
  opacity: 0.5;
  animation: float 3s ease-in-out infinite;
}

.empty-title {
  font-size: var(--font-h4);
  font-weight: var(--font-bold);
  color: var(--gray-700);
  margin-bottom: var(--space-3);
}

.empty-description {
  font-size: var(--font-body);
  color: var(--gray-500);
  margin-bottom: var(--space-6);
  max-width: 400px;
  line-height: 1.6;
}

.empty-action {
  margin-top: var(--space-4);
  padding: var(--space-3) var(--space-6);
  font-weight: var(--font-semibold);
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
}
</style>
