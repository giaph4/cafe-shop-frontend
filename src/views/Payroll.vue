<template>
    <div class="app-page-container animate__animated animate__fadeInUp stagger-item payroll-page">
        <div class="page-header">
            <div>
                <p class="page-subtitle">Quản lý lương nhân viên</p>
                <h1 class="page-title">Bảng lương</h1>
            </div>
            <div class="page-actions">
                <el-button
                    type="primary"
                    :icon="Plus"
                    @click="openCreateCycle"
                >
                    Tạo chu kỳ
                </el-button>
                <el-button
                    type="warning"
                    plain
                    :icon="RefreshRight"
                    :disabled="!activeCycleDetail || cycleActionLoading"
                    :loading="cycleActionLoading && regenerateTarget === activeCycleDetail?.id"
                    @click="handleRegenerateCycle()"
                >
                    Gom dữ liệu
                </el-button>
            </div>
        </div>

        <el-row :gutter="16" class="overview-cards">
            <el-col :xs="24" :md="8" :lg="6" v-for="metric in summaryHighlights" :key="metric.label">
                <div class="overview-card">
                    <p class="overview-card__label">{{ metric.label }}</p>
                    <p class="overview-card__value">{{ metric.value }}</p>
                    <p class="overview-card__hint">{{ metric.hint }}</p>
                </div>
            </el-col>
        </el-row>

        <el-card class="box-card filter-card">
            <el-row :gutter="16">
                <el-col :xs="24" :md="8">
                    <el-select
                        v-model="cycleStatusFilter"
                        clearable
                        placeholder="Lọc theo trạng thái"
                        class="w-100"
                        @change="handleCycleFilterChanged"
                    >
                        <el-option
                            v-for="option in statusOptions"
                            :key="option.value"
                            :label="option.label"
                            :value="option.value"
                        />
                    </el-select>
                </el-col>
                <el-col :xs="24" :md="10">
                    <el-date-picker
                        v-model="cycleDateRange"
                        type="daterange"
                        unlink-panels
                        range-separator="Đến"
                        start-placeholder="Từ ngày"
                        end-placeholder="Đến ngày"
                        value-format="YYYY-MM-DD"
                        class="w-100"
                        clearable
                        @change="handleCycleFilterChanged"
                    />
                </el-col>
            </el-row>
        </el-card>

        <el-card shadow="never" class="box-card">
            <EasyDataTable
                v-model:server-options="cycleServerOptions"
                :server-items-length="cycleTotal"
                :headers="cycleHeaders"
                :items="cycles"
                :loading="cycleLoading"
                table-class-name="data-table"
                theme-color="#8B7355"
                buttons-pagination
                show-index
            >
                <template #item-name="{ name, status }">
                    <div class="table-cell-title">
                        <span>{{ name }}</span>
                        <el-tag v-if="activeCycleDetail?.status === status" size="small" type="success" effect="plain">
                            Chu kỳ đang xem
                        </el-tag>
                    </div>
                </template>

                <template #item-period="{ startDate, endDate }">
                    <span>{{ formatDateDisplay(startDate) }} · {{ formatDateDisplay(endDate) }}</span>
                </template>

                <template #item-status="row">
                    <el-tag :type="statusTagMap[row.status]?.type || 'info'">
                        {{ statusTagMap[row.status]?.label || row.status }}
                    </el-tag>
                </template>

                <template #item-updatedAt="{ updatedAt }">
                    {{ formatDateTimeDisplay(updatedAt) }}
                </template>

                <template #item-actions="row">
                    <el-space wrap>
                        <el-button
                            size="small"
                            type="primary"
                            plain
                            @click="handleCycleSelected(row)"
                        >
                            Xem chi tiết
                        </el-button>
                        <el-button size="small" @click="openEditCycle(row)">Chỉnh sửa</el-button>
                        <el-popconfirm
                            title="Gom lại dữ liệu cho chu kỳ này?"
                            confirm-button-text="Đồng ý"
                            cancel-button-text="Hủy"
                            width="260"
                            @confirm="handleRegenerateCycle(row)"
                        >
                            <template #reference>
                                <el-button
                                    size="small"
                                    type="warning"
                                    plain
                                    :loading="cycleActionLoading && regenerateTarget === row.id"
                                >
                                    Gom dữ liệu
                                </el-button>
                            </template>
                        </el-popconfirm>
                        <el-dropdown
                            trigger="click"
                            @command="(command) => handleCycleStatusCommand(command, row)"
                        >
                            <el-button size="small" type="info" plain>
                                Trạng thái
                                <el-icon class="ml-1"><ArrowDown /></el-icon>
                            </el-button>
                            <template #dropdown>
                                <el-dropdown-menu>
                                    <el-dropdown-item
                                        v-for="option in statusOptions"
                                        :key="option.value"
                                        :disabled="option.value === row.status"
                                        :command="{ nextStatus: option.value, cycle: row }"
                                    >
                                        {{ option.label }}
                                    </el-dropdown-item>
                                </el-dropdown-menu>
                            </template>
                        </el-dropdown>
                    </el-space>
                </template>
            </EasyDataTable>
        </el-card>

        <el-row :gutter="20" class="detail-section">
            <el-col :xs="24" :lg="10">
                <el-card class="box-card" :body-style="{ padding: '20px' }" v-loading="cycleDetailLoading">
                    <template #header>
                        <div class="card-header">
                            <h3>Thông tin chu kỳ</h3>
                            <el-space wrap>
                                <el-button size="small" @click="openEditCycle(activeCycleDetail)" :disabled="!activeCycleDetail">
                                    Chỉnh sửa
                                </el-button>
                                <el-dropdown
                                    trigger="click"
                                    @command="(command) => handleCycleStatusCommand(command)
                                    "
                                >
                                    <el-button size="small" type="primary" plain :disabled="!activeCycleDetail">
                                        Cập nhật trạng thái
                                        <el-icon class="ml-1"><ArrowDown /></el-icon>
                                    </el-button>
                                    <template #dropdown>
                                        <el-dropdown-menu>
                                            <el-dropdown-item
                                                v-for="option in statusOptions"
                                                :key="option.value"
                                                :disabled="!activeCycleDetail || option.value === activeCycleDetail.status"
                                                :command="{ nextStatus: option.value, cycle: activeCycleDetail }"
                                            >
                                                {{ option.label }}
                                            </el-dropdown-item>
                                        </el-dropdown-menu>
                                    </template>
                                </el-dropdown>
                            </el-space>
                        </div>
                    </template>

                    <div v-if="!activeCycleDetail" class="empty-placeholder">
                        <el-empty description="Chọn một chu kỳ để xem chi tiết" />
                    </div>
                    <div v-else class="cycle-details">
                        <div class="detail-row">
                            <span class="detail-label">Mã chu kỳ</span>
                            <strong class="detail-value">{{ activeCycleDetail.code }}</strong>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Tên chu kỳ</span>
                            <strong class="detail-value">{{ activeCycleDetail.name }}</strong>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Khoảng thời gian</span>
                            <span class="detail-value">
                                {{ formatDateDisplay(activeCycleDetail.startDate) }} -
                                {{ formatDateDisplay(activeCycleDetail.endDate) }}
                            </span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Trạng thái</span>
                            <el-tag :type="statusTagMap[activeCycleDetail.status]?.type || 'info'">
                                {{ statusTagMap[activeCycleDetail.status]?.label || activeCycleDetail.status }}
                            </el-tag>
                        </div>
                        <div class="detail-row" v-if="activeCycleDetail.notes">
                            <span class="detail-label">Ghi chú</span>
                            <span class="detail-value">{{ activeCycleDetail.notes }}</span>
                        </div>
                        <el-divider content-position="left">Dấu vết cập nhật</el-divider>
                        <div class="audit-grid">
                            <div>
                                <p class="audit-label">Người tạo</p>
                                <p class="audit-value">{{ activeCycleDetail.createdBy || '—' }}</p>
                                <small class="audit-hint">{{ formatDateTimeDisplay(activeCycleDetail.createdAt) }}</small>
                            </div>
                            <div>
                                <p class="audit-label">Người cập nhật</p>
                                <p class="audit-value">{{ activeCycleDetail.updatedBy || '—' }}</p>
                                <small class="audit-hint">{{ formatDateTimeDisplay(activeCycleDetail.updatedAt) }}</small>
                            </div>
                            <div>
                                <p class="audit-label">Người duyệt</p>
                                <p class="audit-value">{{ activeCycleDetail.approvedBy || '—' }}</p>
                                <small class="audit-hint">{{ formatDateTimeDisplay(activeCycleDetail.approvedAt) }}</small>
                            </div>
                        </div>
                    </div>
                </el-card>
            </el-col>

            <el-col :xs="24" :lg="14">
                <el-card class="box-card" :body-style="{ padding: '20px' }">
                    <template #header>
                        <div class="card-header">
                            <h3>Bảng tổng hợp lương</h3>
                            <el-space wrap>
                                <el-input
                                    v-model="summarySearch"
                                    placeholder="Tìm theo tên hoặc username..."
                                    clearable
                                    :prefix-icon="Search"
                                    @input="handleSummarySearchInput"
                                    @clear="handleSummarySearchInput"
                                    size="small"
                                    class="summary-search"
                                />
                                <el-button
                                    size="small"
                                    type="primary"
                                    plain
                                    :disabled="summaryLoading || !activeCycleDetail"
                                    :loading="summaryLoading"
                                    @click="loadSummaries"
                                >
                                    Làm mới
                                </el-button>
                            </el-space>
                        </div>
                    </template>

                    <div v-if="!activeCycleDetail" class="empty-placeholder">
                        <el-empty description="Chọn chu kỳ để xem dữ liệu lương" />
                    </div>
                    <div v-else>
                        <div class="summary-stat-grid">
                            <div class="summary-stat" v-for="stat in summaryCards" :key="stat.label">
                                <p class="summary-stat__label">{{ stat.label }}</p>
                                <p class="summary-stat__value">{{ stat.value }}</p>
                                <p class="summary-stat__hint">{{ stat.hint }}</p>
                            </div>
                        </div>

                        <EasyDataTable
                            v-model:server-options="summaryServerOptions"
                            :server-items-length="summaryTotal"
                            :headers="summaryHeaders"
                            :items="summaries"
                            :loading="summaryLoading"
                            table-class-name="data-table"
                            theme-color="#8B7355"
                            buttons-pagination
                            show-index
                        >
                            <template #item-employee="{ fullName, username }">
                                <div class="employee-cell">
                                    <strong>{{ fullName || username }}</strong>
                                    <small v-if="username">@{{ username }}</small>
                                </div>
                            </template>

                            <template #item-totalRevenue="{ totalRevenue }">
                                {{ formatCurrency(totalRevenue) }}
                            </template>

                            <template #item-totalBasePayroll="{ totalBasePayroll }">
                                {{ formatCurrency(totalBasePayroll) }}
                            </template>

                            <template #item-totalBonus="{ totalBonus }">
                                {{ formatCurrency(totalBonus) }}
                            </template>

                            <template #item-totalPenalty="{ totalPenalty }">
                                {{ formatCurrency(totalPenalty) }}
                            </template>

                            <template #item-totalAdjustment="{ totalAdjustment }">
                                {{ formatCurrency(totalAdjustment) }}
                            </template>

                            <template #item-totalNetPayroll="{ totalNetPayroll }">
                                <strong>{{ formatCurrency(totalNetPayroll) }}</strong>
                            </template>

                            <template #item-notes="{ notes }">
                                <span class="text-muted">{{ notes || '—' }}</span>
                            </template>
                        </EasyDataTable>
                    </div>
                </el-card>
            </el-col>
        </el-row>

        <PayrollCycleForm
            v-model:visible="cycleFormVisible"
            :cycle="editingCycle"
            @success="handleCycleFormSuccess"
        />
    </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import { ElMessageBox } from 'element-plus'
import EasyDataTable from 'vue3-easy-data-table'
import 'vue3-easy-data-table/dist/style.css'
import {
    getPayrollCycles,
    getPayrollCycleById,
    updatePayrollCycle,
    regeneratePayrollCycle,
    getPayrollSummaries
} from '@/api/payrollService.js'
import { formatCurrency, formatDateDisplay, formatDateTimeDisplay, formatNumber } from '@/utils/formatters.js'
import { PAYROLL_CYCLE_STATUS_OPTIONS, PAYROLL_CYCLE_STATUS_TAG_MAP } from '@/constants/payroll.js'
import PayrollCycleForm from '@/components/payroll/PayrollCycleForm.vue'
import { Plus, RefreshRight, Search, ArrowDown } from '@element-plus/icons-vue'

const toast = useToast()

const statusOptions = PAYROLL_CYCLE_STATUS_OPTIONS
const statusTagMap = PAYROLL_CYCLE_STATUS_TAG_MAP

const cycles = ref([])
const cycleLoading = ref(false)
const cycleTotal = ref(0)
const cycleServerOptions = ref({
    page: 1,
    rowsPerPage: 10,
    sortBy: 'createdAt',
    sortType: 'desc'
})
const cycleStatusFilter = ref(null)
const cycleDateRange = ref([])

const activeCycleId = ref(null)
const activeCycleDetail = ref(null)
const cycleDetailLoading = ref(false)
const cycleActionLoading = ref(false)
const regenerateTarget = ref(null)

const cycleFormVisible = ref(false)
const editingCycle = ref(null)

const summaries = ref([])
const summaryLoading = ref(false)
const summaryTotal = ref(0)
const summaryServerOptions = ref({
    page: 1,
    rowsPerPage: 20,
    sortBy: 'totalNetPayroll',
    sortType: 'desc'
})
const summarySearch = ref('')
const summaryStats = ref({
    totalAssignments: 0,
    totalAttendance: 0,
    totalRevenue: 0,
    totalBasePayroll: 0,
    totalBonus: 0,
    totalPenalty: 0,
    totalAdjustment: 0,
    totalNetPayroll: 0,
    totalActualMinutes: 0,
    totalOrders: 0
})

let cycleFilterTimer = null
let summarySearchTimer = null

const cycleHeaders = [
    { text: 'Mã chu kỳ', value: 'code', sortable: true, width: 160 },
    { text: 'Tên chu kỳ', value: 'name', sortable: true },
    { text: 'Thời gian', value: 'period', width: 220 },
    { text: 'Trạng thái', value: 'status', width: 140 },
    { text: 'Cập nhật', value: 'updatedAt', width: 180, sortable: true },
    { text: 'Hành động', value: 'actions', width: 340 }
]

const summaryHeaders = [
    { text: 'Nhân viên', value: 'employee', width: 220 },
    { text: 'Phân công', value: 'assignmentCount', width: 120, sortable: true },
    { text: 'Chấm công', value: 'attendanceCount', width: 120, sortable: true },
    { text: 'Đơn hàng', value: 'totalOrders', width: 120, sortable: true },
    { text: 'Doanh thu', value: 'totalRevenue', width: 140, sortable: true },
    { text: 'Lương cơ bản', value: 'totalBasePayroll', width: 140, sortable: true },
    { text: 'Thưởng', value: 'totalBonus', width: 120, sortable: true },
    { text: 'Phạt', value: 'totalPenalty', width: 120, sortable: true },
    { text: 'Điều chỉnh', value: 'totalAdjustment', width: 140, sortable: true },
    { text: 'Thực nhận', value: 'totalNetPayroll', width: 160, sortable: true },
    { text: 'Ghi chú', value: 'notes' }
]

const summaryHighlights = computed(() => {
    if (!activeCycleDetail.value) {
        return [
            { label: 'Chu kỳ', value: '—', hint: 'Chưa chọn chu kỳ' },
            { label: 'Tổng nhân sự', value: '—', hint: 'Tổng nhân sự trong chu kỳ' },
            { label: 'Tổng lương thực nhận', value: '—', hint: 'Tổng lương sau điều chỉnh' },
            { label: 'Thưởng / Phạt', value: '—', hint: 'Chênh lệch thưởng phạt' }
        ]
    }

    return [
        {
            label: 'Chu kỳ hiện tại',
            value: activeCycleDetail.value.code || '—',
            hint: activeCycleDetail.value.name || 'Chưa chọn chu kỳ'
        },
        {
            label: 'Tổng nhân sự',
            value: formatNumber(summaryTotal.value),
            hint: 'Nhân viên trong bảng lương'
        },
        {
            label: 'Tổng lương thực nhận',
            value: formatCurrency(summaryStats.value.totalNetPayroll || 0),
            hint: 'Bao gồm thưởng, phạt, điều chỉnh'
        },
        {
            label: 'Thưởng / Phạt',
            value: `${formatCurrency(summaryStats.value.totalBonus || 0)} / ${formatCurrency(summaryStats.value.totalPenalty || 0)}`,
            hint: 'Tổng thưởng và tổng phạt'
        }
    ]
})

const summaryCards = computed(() => {
    const stats = summaryStats.value
    const totalHours = stats.totalActualMinutes ? stats.totalActualMinutes / 60 : 0
    return [
        {
            label: 'Giờ công thực tế',
            value: `${formatNumber(totalHours, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} giờ`,
            hint: `${formatNumber(stats.totalActualMinutes || 0)} phút`
        },
        {
            label: 'Tổng doanh thu',
            value: formatCurrency(stats.totalRevenue || 0),
            hint: 'Doanh thu từ các đơn hàng'
        },
        {
            label: 'Tổng phân công',
            value: formatNumber(stats.totalAssignments || 0),
            hint: 'Số phân công trong chu kỳ'
        },
        {
            label: 'Tổng đơn hàng',
            value: formatNumber(stats.totalOrders || 0),
            hint: 'Số đơn phục vụ'
        }
    ]
})

const scheduleFetchCycles = () => {
    clearTimeout(cycleFilterTimer)
    cycleFilterTimer = setTimeout(() => {
        if (cycleServerOptions.value.page !== 1) {
            cycleServerOptions.value.page = 1
        } else {
            fetchCycles()
        }
    }, 300)
}

const handleCycleFilterChanged = () => {
    scheduleFetchCycles()
}

const fetchCycles = async () => {
    cycleLoading.value = true
    try {
        const params = {
            page: cycleServerOptions.value.page - 1,
            size: cycleServerOptions.value.rowsPerPage,
            sort: `${cycleServerOptions.value.sortBy},${cycleServerOptions.value.sortType}`
        }

        if (cycleStatusFilter.value) {
            params.status = cycleStatusFilter.value
        }

        if (cycleDateRange.value?.length === 2) {
            params.from = cycleDateRange.value[0]
            params.to = cycleDateRange.value[1]
        }

        const response = await getPayrollCycles(params)
        const data = response.data || {}
        const content = data.content || data.items || []
        cycles.value = content
        cycleTotal.value = data.totalElements ?? content.length

        if (!content.length) {
            activeCycleId.value = null
            activeCycleDetail.value = null
            summaries.value = []
            summaryTotal.value = 0
            summaryStats.value = {
                totalAssignments: 0,
                totalAttendance: 0,
                totalRevenue: 0,
                totalBasePayroll: 0,
                totalBonus: 0,
                totalPenalty: 0,
                totalAdjustment: 0,
                totalNetPayroll: 0,
                totalActualMinutes: 0,
                totalOrders: 0
            }
            return
        }

        const currentId = activeCycleId.value
        const stillExists = currentId && content.some((item) => item.id === currentId)

        if (!stillExists) {
            await handleCycleSelected(content[0])
        } else if (currentId) {
            // Update status in detail if changed
            const refreshed = content.find((item) => item.id === currentId)
            if (refreshed && activeCycleDetail.value) {
                activeCycleDetail.value = {
                    ...activeCycleDetail.value,
                    status: refreshed.status
                }
            }
        }
    } catch (error) {
        toast.error(error.response?.data?.message || 'Không thể tải danh sách chu kỳ lương')
    } finally {
        cycleLoading.value = false
    }
}

const loadCycleDetail = async (cycleId) => {
    if (!cycleId) return
    cycleDetailLoading.value = true
    try {
        const response = await getPayrollCycleById(cycleId)
        activeCycleDetail.value = response.data || null
    } catch (error) {
        toast.error(error.response?.data?.message || 'Không thể tải chi tiết chu kỳ')
        activeCycleDetail.value = null
    } finally {
        cycleDetailLoading.value = false
    }
}

const computeSummaryStats = (items = []) => {
    return items.reduce(
        (acc, item) => {
            acc.totalAssignments += item.assignmentCount || 0
            acc.totalAttendance += item.attendanceCount || 0
            acc.totalRevenue += item.totalRevenue || 0
            acc.totalBasePayroll += item.totalBasePayroll || 0
            acc.totalBonus += item.totalBonus || 0
            acc.totalPenalty += item.totalPenalty || 0
            acc.totalAdjustment += item.totalAdjustment || 0
            acc.totalNetPayroll += item.totalNetPayroll || 0
            acc.totalActualMinutes += item.totalActualMinutes || 0
            acc.totalOrders += item.totalOrders || 0
            return acc
        },
        {
            totalAssignments: 0,
            totalAttendance: 0,
            totalRevenue: 0,
            totalBasePayroll: 0,
            totalBonus: 0,
            totalPenalty: 0,
            totalAdjustment: 0,
            totalNetPayroll: 0,
            totalActualMinutes: 0,
            totalOrders: 0
        }
    )
}

const loadSummaries = async () => {
    if (!activeCycleId.value) return
    summaryLoading.value = true
    try {
        const params = {
            page: summaryServerOptions.value.page - 1,
            size: summaryServerOptions.value.rowsPerPage,
            sort: `${summaryServerOptions.value.sortBy},${summaryServerOptions.value.sortType}`,
            cycleId: activeCycleId.value
        }

        if (summarySearch.value) {
            params.keyword = summarySearch.value
        }

        const response = await getPayrollSummaries(params)
        const data = response.data || {}
        const content = data.content || data.items || []
        summaries.value = content
        summaryTotal.value = data.totalElements ?? content.length
        summaryStats.value = data.statistics || computeSummaryStats(content)
    } catch (error) {
        toast.error(error.response?.data?.message || 'Không thể tải bảng tổng hợp lương')
        summaries.value = []
        summaryTotal.value = 0
        summaryStats.value = computeSummaryStats([])
    } finally {
        summaryLoading.value = false
    }
}

const handleCycleSelected = async (cycle) => {
    if (!cycle) return
    if (activeCycleId.value === cycle.id && activeCycleDetail.value) {
        return
    }

    activeCycleId.value = cycle.id
    await loadCycleDetail(cycle.id)
    summaryServerOptions.value.page = 1
    await loadSummaries()
}

const openCreateCycle = () => {
    editingCycle.value = null
    cycleFormVisible.value = true
}

const openEditCycle = async (cycle) => {
    if (!cycle) return
    if (!cycle.startDate) {
        cycleDetailLoading.value = true
        try {
            const response = await getPayrollCycleById(cycle.id)
            editingCycle.value = response.data
        } catch (error) {
            toast.error(error.response?.data?.message || 'Không thể tải dữ liệu chu kỳ')
            return
        } finally {
            cycleDetailLoading.value = false
        }
    } else {
        editingCycle.value = cycle
    }
    cycleFormVisible.value = true
}

const handleCycleFormSuccess = async () => {
    cycleFormVisible.value = false
    await fetchCycles()
    if (activeCycleId.value) {
        await loadCycleDetail(activeCycleId.value)
        await loadSummaries()
    }
}

const handleCycleStatusCommand = async (command, overrideCycle) => {
    if (!command) return
    const targetCycle = command.cycle || overrideCycle
    if (!targetCycle) return

    const nextStatus = command.nextStatus
    if (nextStatus === targetCycle.status) return

    try {
        await ElMessageBox.confirm(
            `Bạn chắc chắn muốn chuyển trạng thái chu kỳ sang \"${
                statusTagMap[nextStatus]?.label || nextStatus
            }\"?`,
            'Xác nhận',
            {
                confirmButtonText: 'Đồng ý',
                cancelButtonText: 'Hủy',
                type: 'warning'
            }
        )
    } catch (error) {
        if (error !== 'cancel') {
            toast.error('Hủy cập nhật trạng thái')
        }
        return
    }

    cycleActionLoading.value = true
    try {
        const payload = {
            code: targetCycle.code,
            name: targetCycle.name,
            startDate: targetCycle.startDate,
            endDate: targetCycle.endDate,
            status: nextStatus,
            notes: targetCycle.notes
        }
        await updatePayrollCycle(targetCycle.id, payload)
        toast.success('Đã cập nhật trạng thái chu kỳ')
        await fetchCycles()
        if (targetCycle.id === activeCycleId.value) {
            await loadCycleDetail(targetCycle.id)
            await loadSummaries()
        }
    } catch (error) {
        toast.error(error.response?.data?.message || 'Không thể cập nhật trạng thái chu kỳ')
    } finally {
        cycleActionLoading.value = false
    }
}

const handleRegenerateCycle = async (cycle) => {
    const target = cycle || activeCycleDetail.value
    if (!target) return

    try {
        await ElMessageBox.confirm(
            'Hệ thống sẽ gom lại dữ liệu lương theo khoảng ngày của chu kỳ. Tiếp tục?',
            'Xác nhận gom dữ liệu',
            {
                confirmButtonText: 'Đồng ý',
                cancelButtonText: 'Hủy',
                type: 'warning'
            }
        )
    } catch (error) {
        if (error !== 'cancel') {
            toast.error('Đã hủy thao tác gom dữ liệu')
        }
        return
    }

    cycleActionLoading.value = true
    regenerateTarget.value = target.id
    try {
        await regeneratePayrollCycle(target.id)
        toast.success('Đã gom lại dữ liệu chu kỳ')
        if (target.id === activeCycleId.value) {
            await loadSummaries()
        }
    } catch (error) {
        toast.error(error.response?.data?.message || 'Không thể gom dữ liệu chu kỳ')
    } finally {
        cycleActionLoading.value = false
        regenerateTarget.value = null
    }
}

const handleSummarySearchInput = () => {
    clearTimeout(summarySearchTimer)
    summarySearchTimer = setTimeout(() => {
        if (summaryServerOptions.value.page !== 1) {
            summaryServerOptions.value.page = 1
        } else {
            loadSummaries()
        }
    }, 300)
}

watch(
    () => cycleServerOptions.value,
    () => {
        fetchCycles()
    },
    { deep: true }
)

watch(
    () => summaryServerOptions.value,
    () => {
        loadSummaries()
    },
    { deep: true }
)

onMounted(() => {
    fetchCycles()
})

onBeforeUnmount(() => {
    clearTimeout(cycleFilterTimer)
    clearTimeout(summarySearchTimer)
})
</script>

<style scoped>
.payroll-page {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.page-actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    align-items: center;
}

.overview-cards {
    margin-bottom: 8px;
}

.overview-card {
    background: var(--neutral-50);
    border-radius: var(--radius-lg);
    padding: 16px 20px;
    box-shadow: var(--shadow-sm);
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.overview-card__label {
    font-size: 0.95rem;
    color: var(--muted-foreground);
    margin: 0;
}

.overview-card__value {
    font-size: 1.4rem;
    font-weight: 700;
    color: var(--primary-700);
    margin: 0;
}

.overview-card__hint {
    font-size: 0.85rem;
    color: var(--muted-foreground);
    margin: 0;
}

.table-cell-title {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.table-cell-title .el-tag {
    align-self: flex-start;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
}

.detail-section {
    margin-top: 8px;
}

.cycle-details {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.detail-row {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
}

.detail-label {
    font-weight: 500;
    color: var(--muted-foreground);
}

.detail-value {
    font-weight: 600;
    color: var(--foreground-color, #2f2f2f);
}

.audit-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 12px;
}

.audit-label {
    font-size: 0.85rem;
    color: var(--muted-foreground);
    margin-bottom: 4px;
}

.audit-value {
    font-weight: 600;
    margin: 0;
}

.audit-hint {
    color: var(--muted-foreground);
}

.empty-placeholder {
    padding: 24px 0;
}

.summary-search {
    width: 240px;
}

.summary-stat-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 16px;
    margin-bottom: 16px;
}

.summary-stat {
    background: var(--neutral-50);
    border-radius: var(--radius-md);
    padding: 14px 16px;
    box-shadow: var(--shadow-xs);
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.summary-stat__label {
    margin: 0;
    font-size: 0.9rem;
    color: var(--muted-foreground);
}

.summary-stat__value {
    margin: 0;
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--primary-700);
}

.summary-stat__hint {
    margin: 0;
    font-size: 0.8rem;
    color: var(--muted-foreground);
}

.employee-cell {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.employee-cell small {
    color: var(--muted-foreground);
}

@media (max-width: 768px) {
    .page-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
    }

    .page-actions {
        width: 100%;
    }

    .page-actions > * {
        flex: 1;
    }

    .summary-search {
        width: 100%;
    }
}
</style>
