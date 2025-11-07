<template>
  <div class="enhanced-table-wrapper">
    <!-- Filter Card -->
    <el-card class="box-card filter-card" v-if="showFilters">
      <el-row :gutter="20">
        <!-- Search Input -->
        <el-col :span="8" v-if="showSearch">
          <el-input 
            v-model="localSearch" 
            :placeholder="searchPlaceholder"
            :prefix-icon="Search"
            clearable
            @input="handleSearch">
          </el-input>
        </el-col>
        
        <!-- Custom Filters Slot -->
        <slot name="filters"></slot>
      </el-row>
    </el-card>
    
    <!-- Table -->
    <EasyDataTable 
      v-model:server-options="localServerOptions"
      :server-items-length="serverItemsLength"
      :headers="headers"
      :items="items"
      :loading="loading"
      table-class-name="data-table"
      theme-color="#8B7355"
      buttons-pagination
      show-index>
      <!-- Pass through all slots -->
      <template v-for="(_, name) in $slots" v-slot:[name]="slotData">
        <slot :name="name" v-bind="slotData || {}"></slot>
      </template>
    </EasyDataTable>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import EasyDataTable from 'vue3-easy-data-table'
import 'vue3-easy-data-table/dist/style.css'
import { Search } from '@element-plus/icons-vue'

const props = defineProps({
  headers: {
    type: Array,
    required: true
  },
  items: {
    type: Array,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  },
  serverOptions: {
    type: Object,
    default: () => ({})
  },
  serverItemsLength: {
    type: Number,
    default: 0
  },
  showFilters: {
    type: Boolean,
    default: true
  },
  showSearch: {
    type: Boolean,
    default: true
  },
  searchPlaceholder: {
    type: String,
    default: 'Tìm kiếm...'
  }
})

const emit = defineEmits(['search', 'update:serverOptions'])

const localSearch = ref('')
const localServerOptions = ref(props.serverOptions)

const handleSearch = () => {
  emit('search', localSearch.value)
}

watch(() => props.serverOptions, (newVal) => {
  localServerOptions.value = newVal
}, { deep: true })

watch(localServerOptions, (newVal) => {
  emit('update:serverOptions', newVal)
}, { deep: true })
</script>

<style scoped>
.enhanced-table-wrapper {
  width: 100%;
}

.filter-card {
  margin-bottom: var(--space-6);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

/* Override EasyDataTable styles */
:deep(.data-table) {
  border-radius: var(--radius-lg);
  overflow: hidden;
}

:deep(.data-table th) {
  background-color: var(--primary-50) !important;
  color: var(--primary-700) !important;
  font-weight: var(--font-bold) !important;
  padding: var(--space-4) !important;
}

:deep(.data-table td) {
  padding: var(--space-3) !important;
}

:deep(.data-table tr:hover) {
  background-color: var(--primary-50) !important;
}
</style>
