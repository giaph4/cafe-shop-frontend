<template>
    <div class="app-page-container pos-page">
        <div class="page-header">
            <h1 class="page-title">Sơ đồ Bàn (POS)</h1>
            <el-button type="success" size="large" @click="openTakeAwayModal">
                <el-icon style="margin-right: 8px;">
                    <ShoppingCart />
                </el-icon>
                Tạo đơn Mang đi (Take Away)
            </el-button>
        </div>

        <el-card class="box-card">
            <div v-loading="loadingTables">
                <div class="table-grid">
                    <el-card v-for="table in tables" :key="table.id" class="table-card"
                        :class="getTableClass(table.status)" shadow="hover" @click="openOrderModal(table)">
                        <div class="table-name">{{ table.name }}</div>
                        <div class="table-status">{{ getStatusText(table.status) }}</div>
                        <div class="table-capacity">{{ table.capacity }} chỗ</div>
                    </el-card>
                </div>
            </div>
        </el-card>

        <OrderEditorModal v-if="posStore.isModalOpen" />

    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import { ShoppingCart } from '@/components/icons'
import { getAllTables } from '@/api/tableService.js' // Thêm .js
import { usePosStore } from '@/store/posStore.js' // SỬA LỖI Ở ĐÂY (thêm .js)
import OrderEditorModal from '@/components/OrderEditorModal.vue' // Thêm .js

const toast = useToast()
const posStore = usePosStore() // Khởi tạo store

const tables = ref([])
const loadingTables = ref(true)

// --- Tải Sơ đồ bàn ---
const fetchTables = async () => {
    loadingTables.value = true
    try {
        // API: GET /api/v1/tables
        const response = await getAllTables()
        tables.value = response.data
    } catch (error) {
        toast.error('Lỗi khi tải sơ đồ bàn')
    } finally {
        loadingTables.value = false
    }
}

// --- Xử lý Modal ---
const openOrderModal = (table) => {
    // Bàn đang phục vụ hoặc trống đều mở modal
    if (table.status === 'SERVING' || table.status === 'EMPTY') {
        posStore.openPosModal(table)
    } else {
        toast.warning(`Bàn ${table.name} đã được đặt, không thể tạo đơn.`)
    }
}

const openTakeAwayModal = () => {
    // Tạo 1 object "bàn giả" cho đơn mang đi
    const takeAwayTable = {
        id: null, // Không có tableId
        name: 'Đơn Mang đi',
        status: 'EMPTY'
    }
    posStore.openPosModal(takeAwayTable)
}

// --- Helpers ---
const getStatusText = (status) => {
    if (status === 'SERVING') return 'Đang phục vụ'
    if (status === 'RESERVED') return 'Đã đặt'
    return 'Còn trống' // EMPTY
}

const getTableClass = (status) => {
    if (status === 'SERVING') return 'status-serving'
    if (status === 'RESERVED') return 'status-reserved'
    return 'status-empty'
}

// --- Tải dữ liệu khi trang được mở ---
onMounted(() => {
    fetchTables()
})

// (Theo dõi Pinia store để refresh bàn khi modal đóng)
// (Sẽ thêm sau nếu cần)
</script>

<style scoped>
.app-page-container {
    padding: 20px;
}

.table-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 20px;
}

.table-card {
    cursor: pointer;
    text-align: center;
    transition: all 0.2s ease;
    border: 2px solid transparent;
}

.table-card:hover {
    transform: translateY(-5px);
    box-shadow: var(--el-box-shadow-light);
}

.table-name {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 5px;
}

.table-status {
    font-size: 0.9rem;
    margin-bottom: 10px;
}

.table-capacity {
    font-size: 0.8rem;
    color: #909399;
}

/* --- Màu theo Trạng thái --- */
.table-card.status-empty {
    border-color: var(--el-color-success-light-3);
    background-color: var(--el-color-success-light-9);
}

.table-card.status-empty .table-status {
    color: var(--el-color-success);
}

.table-card.status-serving {
    border-color: var(--el-color-danger-light-3);
    background-color: var(--el-color-danger-light-9);
}

.table-card.status-serving .table-status {
    color: var(--el-color-danger);
}

.table-card.status-reserved {
    border-color: var(--el-color-warning-light-3);
    background-color: var(--el-color-warning-light-9);
}

.table-card.status-reserved .table-status {
    color: var(--el-color-warning);
}
</style>