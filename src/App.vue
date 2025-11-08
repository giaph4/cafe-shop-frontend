<template>
  <div id="app" class="modern-app">
      <router-view :key="route.fullPath"/>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const isLoading = ref(false)

const onBeforeEnter = () => {
  isLoading.value = true
}

const onAfterEnter = () => {
  setTimeout(() => {
    isLoading.value = false
  }, 300)
}

// Show loading on route change
router.beforeEach((to, from, next) => {
  isLoading.value = true
  next()
})

router.afterEach(() => {
  setTimeout(() => {
    isLoading.value = false
  }, 500)
})
</script>

<style>
@import '@/assets/main.css';

.modern-app {
  background: #F8F9FA;
  min-height: 100vh;
}

body {
  margin: 0;
  padding: 0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #F8F9FA;
}

/* Override CSS Variables cho vue3-easy-data-table */
html:root,
:root {
  --easy-table-header-background-color: #8B7355 !important;
  --easy-table-header-font-color: #FFFFFF !important;
}

.vue3-easy-data-table,
.data-table {
  --easy-table-header-background-color: #8B7355 !important;
  --easy-table-header-font-color: #FFFFFF !important;
}

/* Table Header màu nâu cafe */
.vue3-easy-data-table thead,
.data-table thead {
  background: linear-gradient(135deg, #8B7355 0%, #6F5B45 100%) !important;
}

.vue3-easy-data-table thead tr,
.data-table thead tr {
  background: transparent !important;
}

.vue3-easy-data-table th,
.data-table th {
  background: transparent !important;
  color: #FFFFFF !important;
  font-weight: 700 !important;
  font-size: 0.875rem !important;
  text-transform: uppercase !important;
  letter-spacing: 0.05em !important;
  padding: 18px 20px !important;
  border: none !important;
}

.vue3-easy-data-table .header-text,
.data-table .header-text {
  color: #FFFFFF !important;
  font-weight: 700 !important;
}

.vue3-easy-data-table .sortType-icon,
.data-table .sortType-icon {
  color: #FFFFFF !important;
}

/* Pagination */
.vue3-easy-data-table .buttons-pagination button.pagination__active-button,
.data-table .buttons-pagination button.pagination__active-button {
  background: linear-gradient(135deg, #8B7355 0%, #6F5B45 100%) !important;
  border-color: #8B7355 !important;
  color: #FFFFFF !important;
  font-weight: 700 !important;
}

.vue3-easy-data-table .buttons-pagination button:hover:not(.pagination__active-button),
.data-table .buttons-pagination button:hover:not(.pagination__active-button) {
  background: #F5F0EB !important;
  border-color: #8B7355 !important;
  color: #8B7355 !important;
}

/* Element Plus Table Override */
.el-table__header-wrapper {
  background: linear-gradient(135deg, #8B7355 0%, #6F5B45 100%) !important;
}

.el-table__header th {
  background: transparent !important;
  color: #FFFFFF !important;
  font-weight: 700 !important;
}

.el-table__header th .cell {
  color: #FFFFFF !important;
  font-weight: 700 !important;
}

/* Page Transitions */
.fade-slide-enter-active {
  animation: fadeSlideIn 0.4s ease-out;
}

.fade-slide-leave-active {
  animation: fadeSlideOut 0.3s ease-in;
}

@keyframes fadeSlideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeSlideOut {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-10px);
  }
}

.el-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.el-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important;
}

.el-button {
  transition: all 0.2s ease;
}

.el-button:hover {
  transform: translateY(-1px);
}

.el-button:active {
  transform: translateY(0);
}

.el-table tbody tr {
  transition: background-color 0.2s ease;
}


.el-dialog,
.el-drawer {
  animation: modalIn 0.3s ease-out;
}

@keyframes modalIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.el-loading-mask {
  backdrop-filter: blur(2px);
  transition: all 0.3s ease;
}

/* Smooth Scrollbar */
* {
  scroll-behavior: smooth;
}

::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #8B7355;
  border-radius: 4px;
  transition: background 0.3s ease;
}

::-webkit-scrollbar-thumb:hover {
  background: #6F5B45;
}


</style>