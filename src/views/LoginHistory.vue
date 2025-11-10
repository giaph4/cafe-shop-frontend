<template>
    <div class="app-page-container animate__animated animate__fadeInUp stagger-item">
        <div class="page-header">
            <div>
                <h1 class="page-title">Lịch sử đăng nhập</h1>
                <p class="page-subtitle">Theo dõi các lần đăng nhập của toàn bộ nhân viên để đảm bảo bảo mật hệ thống.</p>
            </div>
            <el-button type="info" plain @click="goBackToUsers">
                Quay lại quản lý nhân viên
            </el-button>
        </div>

        <el-card class="box-card filter-card">
            <template #header>
                <span>🔍 Bộ lọc tìm kiếm</span>
            </template>
            <el-row :gutter="20">
                <el-col :span="8">
                    <el-input
                        v-model="filters.username"
                        placeholder="Tìm theo username..."
                        clearable
                        @keyup.enter.native="handleSearch"
                    >
                        <template #prefix>
                            <el-icon><Search /></el-icon>
                        </template>
                    </el-input>
                </el-col>
                <el-col :span="6">
                    <el-select
                        v-model="filters.success"
                        placeholder="Trạng thái đăng nhập"
                        clearable
                        class="w-100"
                    >
                        <el-option label="Thành công" :value="true" />
                        <el-option label="Thất bại" :value="false" />
                    </el-select>
                </el-col>
                <el-col :span="10">
                    <el-date-picker
                        v-model="filters.dateRange"
                        type="datetimerange"
                        start-placeholder="Từ ngày"
                        end-placeholder="Đến ngày"
                        value-format="YYYY-MM-DDTHH:mm:ss"
                        range-separator="Đến"
                        class="w-100"
                        :unlink-panels="true"
                    />
                </el-col>
            </el-row>
            <div class="filter-actions">
                <el-button type="primary" @click="handleSearch">
                    Áp dụng lọc
                </el-button>
                <el-button @click="handleReset">
                    Đặt lại
                </el-button>
            </div>
        </el-card>

        <el-card class="box-card">
            <EasyDataTable
                v-model:server-options="serverOptions"
                :server-items-length="totalItems"
                :headers="headers"
                :items="items"
                :loading="loading"
                table-class-name="data-table"
                theme-color="#8B7355"
                buttons-pagination
                show-index
            >
                <template #item-username="{ fullName, username }">
                    <strong>{{ fullName || 'N/A' }}</strong>
                    <div class="sub-text">@{{ username || 'Không xác định' }}</div>
                </template>

                <template #item-success="{ success }">
                    <el-tag :type="success ? 'success' : 'danger'">
                        {{ success ? 'Thành công' : 'Thất bại' }}
                    </el-tag>
                </template>

                <template #item-loginAt="{ loginAt }">
                    {{ formatDateTime(loginAt) }}
                </template>

                <template #item-userAgent="{ userAgent }">
                    <span class="clamp-text" :title="userAgent">{{ userAgent || '—' }}</span>
                </template>

                <template #item-message="{ message }">
                    <span class="clamp-text" :title="message">{{ message || '—' }}</span>
                </template>
            </EasyDataTable>
        </el-card>
    </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from 'vue'
import EasyDataTable from 'vue3-easy-data-table'
import 'vue3-easy-data-table/dist/style.css'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { Search } from '@element-plus/icons-vue'
import { getLoginHistory } from '@/api/loginHistoryService'

const router = useRouter()
const toast = useToast()

const filters = reactive({
    username: '',
    success: null,
    dateRange: []
})

const serverOptions = ref({
    page: 1,
    rowsPerPage: 10,
    sortBy: 'loginAt',
    sortType: 'desc'
})

const headers = [
    { text: 'Nhân viên', value: 'username', sortable: true },
    { text: 'Thời gian đăng nhập', value: 'loginAt', sortable: true },
    { text: 'Trạng thái', value: 'success', sortable: true },
    { text: 'Địa chỉ IP', value: 'ipAddress', sortable: true },
    { text: 'Thiết bị', value: 'userAgent' },
    { text: 'Ghi chú', value: 'message' }
]

const items = ref([])
const totalItems = ref(0)
const loading = ref(false)

const fetchLoginHistory = async () => {
    loading.value = true
    try {
        const params = {
            page: serverOptions.value.page - 1,
            size: serverOptions.value.rowsPerPage,
            sort: `${serverOptions.value.sortBy},${serverOptions.value.sortType}`
        }

        if (filters.username && filters.username.trim()) {
            params.username = filters.username.trim()
        }

        if (filters.success !== null && filters.success !== undefined) {
            params.success = filters.success
        }

        if (Array.isArray(filters.dateRange) && filters.dateRange.length === 2) {
            const [startDate, endDate] = filters.dateRange
            if (startDate && endDate) {
                params.startDate = startDate
                params.endDate = endDate
            }
        }

        const { data } = await getLoginHistory(params)
        items.value = data?.content || []
        totalItems.value = data?.totalElements || 0
    } catch (error) {
        console.error('Failed to fetch login history', error)
        toast.error('Không thể tải dữ liệu lịch sử đăng nhập')
    } finally {
        loading.value = false
    }
}

const handleSearch = () => {
    serverOptions.value.page = 1
    fetchLoginHistory()
}

const handleReset = () => {
    filters.username = ''
    filters.success = null
    filters.dateRange = []
    serverOptions.value.page = 1
    serverOptions.value.sortBy = 'loginAt'
    serverOptions.value.sortType = 'desc'
    fetchLoginHistory()
}

const goBackToUsers = () => {
    router.push({ name: 'Users' })
}

const formatDateTime = (value) => {
    if (!value) return '—'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleString('vi-VN')
}

watch(serverOptions, () => {
    fetchLoginHistory()
}, { deep: true })

onMounted(() => {
    fetchLoginHistory()
})
</script>

<style scoped>
.app-page-container {
    padding: 20px;
}

.page-subtitle {
    margin: 4px 0 0;
    color: #909399;
    font-size: 0.95rem;
}

.filter-card {
    margin-bottom: 20px;
}

.filter-actions {
    margin-top: 16px;
    display: flex;
    gap: 12px;
}

.sub-text {
    font-size: 0.85rem;
    color: #606266;
}

.clamp-text {
    display: inline-block;
    max-width: 280px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.data-table {
    --easy-table-header-font-size: 14px;
    --easy-table-header-font-weight: 600;
    --easy-table-body-row-font-size: 14px;
}
</style>
