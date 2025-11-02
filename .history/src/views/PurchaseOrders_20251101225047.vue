<template>
    <div class="app-page-container">
        <div class="page-header">
            <h1 class="page-title">Quản lý Nhập hàng</h1>
            <el-button type="primary" @click="goToCreatePage">
                <el-icon style="margin-right: 8px;">
                    <Plus />
                </el-icon>
                Tạo Phiếu nhập
            </el-button>
        </div>

        <el-card class="box-card filter-card mb-3">
            <el-row :gutter="20">
                <el-col :span="6">
                    <el-select v-model="filters.status" placeholder="Lọc theo trạng thái" @change="fetchData" clearable
                        class="w-100">
                        <el-option label="Đang chờ (PENDING)" value="PENDING" />
                        <el-option label="Hoàn thành (COMPLETED)" value="COMPLETED" />
                        <el-option label="Đã hủy (CANCELLED)" value="CANCELLED" />
                    </el-select>
                </el-col>
                <el-col :span="6">
                    <el-select v-model="filters.supplierId" placeholder="Lọc theo nhà cung cấp" @change="fetchData"
                        clearable filterable class="w-100">
                        <el-option v-for="supplier in suppliers" :key="supplier.id" :label="supplier.name"
                            :value="supplier.id" />
                    </el-select>
                </el-col>
                <el-col :span="12">
                    <el-date-picker v-model="filters.dateRange" type="daterange" range-separator="Đến"
                        start-placeholder="Từ ngày" end-placeholder="Đến ngày" @change="fetchData" :clearable="true"
                        class="w-100" />
                </el-col>
            </el-row>
        </el-card>

        <EasyDataTable v-model:server-options="serverOptions" :server-items-length="serverItemsLength"
            :headers="headers" :items="items" :loading="loading" table-class-name="data-table" theme-color="#409EFF"
            buttons-pagination>
            <template #item-id="{ id }">
                <strong>#{{ id }}</strong>
            </template>

            <template #item-orderDate="{ orderDate }">
                {{ new Date(orderDate).toLocaleString('vi-VN') }}
            </template>

            <template #item-status="{ status }">
                <el-tag :type="statusType(status)">{{ status }}</el-tag>
            </template>

            <template #item-totalAmount="{ totalAmount }">
                {{ formatCurrency(totalAmount) }}
            </template>

            <template #item-actions="item">
                <el-button type="info" plain size="small" @click="openDetailModal(item.id)">
                    Xem
                </el-button>

                <template v-if="item.status === 'PENDING'">
                    <el-popconfirm title="Xác nhận hoàn thành phiếu nhập? (Sẽ cập nhật tồn kho)"
                        @confirm="handleComplete(item.id)">
                        <template #reference>
                            <el-button type="success" plain size="small">Hoàn thành</el-button>
                        </template>
                    </el-popconfirm>

                    <el-popconfirm title="Bạn chắc chắn muốn hủy phiếu nhập này?" @confirm="handleCancel(item.id)">
                        <template #reference>
                            <el-button type="danger" plain size="small">Hủy</el-button>
                        </template>
                    </el-popconfirm>
                </template>
            </template>
        </EasyDataTable>

        <PurchaseOrderDetailModal v-model:visible="detailModalVisible" :purchase-order-id="selectedId" />

    </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import EasyDataTable from 'vue3-easy-data-table'
import 'vue3-easy-data-table/dist/style.css'
import { useToast } from 'vue-toastification'
import { Plus } from '@element-plus/icons-vue'
import { formatCurrency, formatDateISO } from '@/utils/formatters'
import { getAllPurchaseOrders, markAsCompleted, cancelPurchaseOrder } from '@/api/purchaseOrderService'
import { getAllSuppliers } from '@/api/supplierService'
import PurchaseOrderDetailModal from '@/components/PurchaseOrderDetailModal.vue'

const toast = useToast()
const router = useRouter()

// --- State cho Bảng ---
const items = ref([])
const loading = ref(true)
const serverItemsLength = ref(0)
const serverOptions = ref({
    page: 1,
    rowsPerPage: 10,
    sortBy: 'orderDate', // Sắp xếp mặc định
    sortType: 'desc',
})

// --- State cho Modal ---
const detailModalVisible = ref(false)
const selectedId = ref(null)

// --- State cho Bộ lọc ---
const filters = ref({
    status: null,
    supplierId: null,
    dateRange: null,
})
const suppliers = ref([]) // Danh sách NCC cho bộ lọc

// --- Định nghĩa Cột cho Bảng ---
const headers = [
    { text: "Mã Phiếu", value: "id", width: 80 },
    { text: "Nhà cung cấp", value: "supplierName", sortable: true },
    { text: "Nhân viên", value: "staffUsername" },
    { text: "Ngày tạo", value: "orderDate", sortable: true },
    { text: "Tổng tiền", value: "totalAmount", sortable: true, align: 'right' },
    { text: "Trạng thái", value: "status", sortable: true, align: 'center' },
    { text: "Hành động", value: "actions", width: 280, align: 'center' },
]

// --- Hàm Tải Dữ liệu Chính ---
const fetchData = async () => {
    loading.value = true
    try {
        const params = {
            page: serverOptions.value.page - 1,
            size: serverOptions.value.rowsPerPage,
            sort: `${serverOptions.value.sortBy},${serverOptions.value.sortType}`,
            // Lọc
            status: filters.value.status || null,
            supplierId: filters.value.supplierId || null,
            startDate: filters.value.dateRange ? formatDateISO(filters.value.dateRange[0]) : null,
            endDate: filters.value.dateRange ? formatDateISO(filters.value.dateRange[1]) : null,
        }

        const response = await getAllPurchaseOrders(params)
        items.value = response.data.content
        serverItemsLength.value = response.data.totalElements

    } catch (error) {
        toast.error('Lỗi khi tải danh sách phiếu nhập')
    } finally {
        loading.value = false
    }
}

// --- Tải Danh sách NCC cho Bộ lọc ---
const fetchSuppliers = async () => {
    try {
        const response = await getAllSuppliers()
        suppliers.value = response.data
    } catch (error) {
        toast.error('Lỗi khi tải danh sách nhà cung cấp')
    }
}

// --- Xử lý Hành động ---
const goToCreatePage = () => {
    router.push({ name: 'PurchaseOrderCreate' }) // Chuyển đến trang tạo mới
}

const openDetailModal = (id) => {
    selectedId.value = id
    detailModalVisible.value = true
}

const handleComplete = async (id) => {
    try {
        await markAsCompleted(id)
        toast.success('Đã hoàn thành phiếu nhập và cập nhật kho!')
        await fetchData()
    } catch (error) {
        const msg = error.response?.data?.message || 'Lỗi khi xác nhận phiếu nhập'
        toast.error(msg)
    }
}

const handleCancel = async (id) => {
    try {
        await cancelPurchaseOrder(id)
        toast.success('Đã hủy phiếu nhập!')
        await fetchData()
    } catch (error) {
        const msg = error.response?.data?.message || 'Lỗi khi hủy phiếu nhập'
        toast.error(msg)
    }
}

// --- Helper ---
const statusType = (status) => {
    if (status === 'COMPLETED') return 'success'
    if (status === 'CANCELLED') return 'danger'
    return 'warning' // PENDING
}

// --- Theo dõi khi phân trang/sort thay đổi ---
watch(serverOptions, (newValue, oldValue) => {
    fetchData()
}, { deep: true })

// --- Tải dữ liệu khi trang được mở ---
onMounted(() => {
    fetchSuppliers()
    fetchData()
})
</script>

<style scoped>
.app-page-container {
    padding: 20px;
}

.filter-card {
    margin-bottom: 20px;
}

.w-100 {
    width: 100%;
}

.data-table {
    --easy-table-header-font-size: 14px;
    --easy-table-header-font-weight: 600;
    --easy-table-body-row-font-size: 14px;
}
</style>