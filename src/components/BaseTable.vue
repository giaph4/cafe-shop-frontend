<template>
  <div class="base-table">
    <div v-if="$slots.top" class="mb-3">
      <slot name="top" />
    </div>

    <div class="table-responsive position-relative">
      <div v-if="loading" class="base-table__loading">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>

      <table class="table" :class="tableClasses">
        <thead class="table-light">
          <tr>
            <th
              v-for="column in columns"
              :key="column.key"
              scope="col"
              :class="headerClass(column)"
              :style="column.width ? { width: column.width } : undefined"
              @click="toggleSort(column)"
            >
              <div class="d-flex align-items-center gap-1">
                <span>{{ column.label }}</span>
                <span v-if="column.sortable" class="text-muted small">
                  <i v-if="sortState.key === column.key" :class="sortIcon" />
                  <i v-else class="bi bi-arrow-down-up" />
                </span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <template v-if="visibleRows.length">
            <tr v-for="(row, rowIndex) in visibleRows" :key="rowKey(row, rowIndex)">
              <td v-for="column in columns" :key="`${rowKey(row, rowIndex)}-${column.key}`" :class="column.class">
                <slot :name="`cell-${column.key}`" :row="row" :value="row[column.key]" :row-index="rowIndex">
                  {{ row[column.key] ?? '\u2014' }}
                </slot>
              </td>
            </tr>
          </template>
          <tr v-else>
            <td :colspan="columns.length" class="text-center py-4 text-muted">
              <slot name="empty">Không có dữ liệu.</slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showFooter" class="d-flex flex-column flex-lg-row align-items-center gap-2 mt-3">
      <div class="d-flex align-items-center gap-2">
        <label for="base-table-page-size" class="form-label mb-0 small text-muted">Số dòng mỗi trang</label>
        <select
          id="base-table-page-size"
          class="form-select form-select-sm"
          v-model.number="localPageSize"
        >
          <option v-for="option in pageSizeOptions" :key="option" :value="option">
            {{ option }}
          </option>
        </select>
      </div>

      <nav class="ms-lg-auto" aria-label="Pagination">
        <ul class="pagination pagination-sm mb-0">
          <li class="page-item" :class="{ disabled: localPage === 1 }">
            <button class="page-link" type="button" @click="goToPage(localPage - 1)" :disabled="localPage === 1">
              Trước
            </button>
          </li>
          <li class="page-item disabled">
            <span class="page-link">
              Trang {{ localPage }} / {{ totalPages || 1 }}
            </span>
          </li>
          <li class="page-item" :class="{ disabled: localPage === totalPages || totalPages === 0 }">
            <button class="page-link" type="button" @click="goToPage(localPage + 1)" :disabled="localPage === totalPages || totalPages === 0">
              Sau
            </button>
          </li>
        </ul>
      </nav>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, toRefs, watch } from 'vue'

const props = defineProps({
  columns: {
    type: Array,
    required: true
  },
  rows: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  striped: {
    type: Boolean,
    default: true
  },
  hover: {
    type: Boolean,
    default: true
  },
  bordered: {
    type: Boolean,
    default: false
  },
  compact: {
    type: Boolean,
    default: false
  },
  serverSide: {
    type: Boolean,
    default: false
  },
  totalRows: {
    type: Number,
    default: 0
  },
  pageSizeOptions: {
    type: Array,
    default: () => [10, 20, 50]
  },
  page: {
    type: Number,
    default: 1
  },
  pageSize: {
    type: Number,
    default: 10
  },
  defaultSort: {
    type: Object,
    default: () => ({ key: '', direction: 'asc' })
  },
  rowKeyField: {
    type: String,
    default: 'id'
  }
})

const emit = defineEmits(['update:page', 'update:pageSize', 'sort-change'])

const state = reactive({
  localPage: props.page,
  localPageSize: props.pageSize,
  sortState: {
    key: props.defaultSort.key,
    direction: props.defaultSort.direction
  }
})

watch(
  () => props.page,
  (value) => {
    if (value !== state.localPage) {
      state.localPage = value
    }
  }
)

watch(
  () => props.pageSize,
  (value) => {
    if (value !== state.localPageSize) {
      state.localPageSize = value
    }
  }
)

watch(
  () => props.defaultSort,
  (value) => {
    state.sortState = { ...value }
  },
  { deep: true }
)

watch(
  () => state.localPage,
  (value) => {
    emit('update:page', value)
  }
)

watch(
  () => state.localPageSize,
  (value) => {
    emit('update:pageSize', value)
  }
)

watch(
  () => state.sortState,
  (value) => {
    emit('sort-change', value)
  },
  { deep: true }
)

const tableClasses = computed(() => ({
  'table-striped': props.striped,
  'table-hover': props.hover,
  'table-bordered': props.bordered,
  'table-sm': props.compact
}))

const sortIcon = computed(() => {
  if (state.sortState.direction === 'asc') return 'bi bi-caret-up-fill'
  if (state.sortState.direction === 'desc') return 'bi bi-caret-down-fill'
  return 'bi bi-arrow-down-up'
})

const processedRows = computed(() => {
  if (props.serverSide || !state.sortState.key) {
    return props.rows ?? []
  }

  const sorted = [...(props.rows ?? [])]
  const multiplier = state.sortState.direction === 'desc' ? -1 : 1

  sorted.sort((a, b) => {
    const valueA = a?.[state.sortState.key]
    const valueB = b?.[state.sortState.key]

    if (valueA == null && valueB == null) return 0
    if (valueA == null) return -1 * multiplier
    if (valueB == null) return 1 * multiplier

    if (typeof valueA === 'number' && typeof valueB === 'number') {
      return (valueA - valueB) * multiplier
    }

    return String(valueA).localeCompare(String(valueB), 'vi', { numeric: true }) * multiplier
  })

  return sorted
})

const totalItems = computed(() => {
  if (props.serverSide) {
    return props.totalRows
  }
  return processedRows.value.length
})

const totalPages = computed(() => {
  if (!state.localPageSize) return 0
  return Math.ceil((totalItems.value || 0) / state.localPageSize)
})

const visibleRows = computed(() => {
  if (props.serverSide) {
    return props.rows ?? []
  }

  const start = (state.localPage - 1) * state.localPageSize
  const end = start + state.localPageSize
  return processedRows.value.slice(start, end)
})

const showFooter = computed(() => totalItems.value > state.localPageSize || totalPages.value > 1)

const rowKey = (row, index) => {
  if (row && Object.prototype.hasOwnProperty.call(row, props.rowKeyField)) {
    return `${row[props.rowKeyField]}`
  }
  return index
}

const headerClass = (column) => {
  const classes = []
  if (column.headerClass) classes.push(column.headerClass)
  if (column.align) classes.push(`text-${column.align}`)
  if (column.sortable) classes.push('cursor-pointer user-select-none')
  return classes
}

const toggleSort = (column) => {
  if (!column.sortable) return

  if (state.sortState.key !== column.key) {
    state.sortState = { key: column.key, direction: 'asc' }
    if (!props.serverSide) {
      state.localPage = 1
    }
    return
  }

  const nextDirection = state.sortState.direction === 'asc' ? 'desc' : state.sortState.direction === 'desc' ? '' : 'asc'
  if (!nextDirection) {
    state.sortState = { key: '', direction: 'asc' }
  } else {
    state.sortState = { key: column.key, direction: nextDirection }
  }

  if (!props.serverSide) {
    state.localPage = 1
  }
}

const goToPage = (page) => {
  if (page < 1) return
  if (totalPages.value && page > totalPages.value) return
  state.localPage = page
}

const { localPage, localPageSize, sortState } = toRefs(state)
</script>

<style scoped>
.base-table__loading {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}

.cursor-pointer {
  cursor: pointer;
}
</style>
