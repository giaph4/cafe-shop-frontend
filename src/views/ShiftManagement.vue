<template>
    <div class="app-page-container animate__animated animate__fadeInUp stagger-item">
        <div class="page-header">
            <div>
                <p class="page-subtitle">Vận hành ca làm việc</p>
                <h1 class="page-title">Quản lý Ca &amp; Chấm công</h1>
            </div>
            <el-space wrap>
                <el-button type="primary" @click="openTemplateForm()">
                    <el-icon style="margin-right: 8px">
                        <Plus />
                    </el-icon>
                    Thêm ca mẫu
                </el-button>
                <el-button type="success" @click="openInstanceForm()">
                    <el-icon style="margin-right: 8px">
                        <Calendar />
                    </el-icon>
                    Lên lịch ca
                </el-button>
            </el-space>
        </div>

        <section class="overview-section">
            <el-row :gutter="20">
                <el-col :xs="12" :md="6">
                    <div class="metric-card">
                        <p class="metric-card__title">Ca mẫu</p>
                        <p class="metric-card__value">{{ templateMetrics.total }}</p>
                        <p class="metric-card__hint">Ca đang khả dụng</p>
                    </div>
                </el-col>
                <el-col :xs="12" :md="6">
                    <div class="metric-card">
                        <p class="metric-card__title">Ca hôm nay</p>
                        <p class="metric-card__value">{{ instanceMetrics.today }}</p>
                        <p class="metric-card__hint">Theo ngày hiện tại</p>
                    </div>
                </el-col>
                <el-col :xs="12" :md="6">
                    <div class="metric-card">
                        <p class="metric-card__title">Ca đang diễn ra</p>
                        <p class="metric-card__value">{{ instanceMetrics.inProgress }}</p>
                        <p class="metric-card__hint">Đang ở trạng thái IN_PROGRESS</p>
                    </div>
                </el-col>
                <el-col :xs="12" :md="6">
                    <div class="metric-card">
                        <p class="metric-card__title">Phân công</p>
                        <p class="metric-card__value">{{ assignmentMetrics.total }}</p>
                        <p class="metric-card__hint">Tổng phân công trong danh sách</p>
                    </div>
                </el-col>
            </el-row>
        </section>

        <el-tabs v-model="activeTab" class="shift-tabs">
            <el-tab-pane label="Ca mẫu" name="templates">
                <el-card class="box-card filter-card">
                    <el-row :gutter="20">
                        <el-col :xs="24" :md="10">
                            <el-input
                                v-model="templateSearch"
                                placeholder="Tìm theo tên ca..."
                                clearable
                                @clear="refreshTemplates"
                            >
                                <template #prefix>
                                    <el-icon><Search /></el-icon>
                                </template>
                            </el-input>
                        </el-col>
                        <el-col :xs="24" :md="8">
                            <el-select
                                v-model="templateRoleFilter"
                                placeholder="Lọc theo vai trò"
                                clearable
                                filterable
                                class="w-100"
                            >
                                <el-option
                                    v-for="role in roleOptions"
                                    :key="role.value"
                                    :label="role.label"
                                    :value="role.value"
                                />
                            </el-select>
                        </el-col>
                    </el-row>
                </el-card>

                <EasyDataTable
                    v-model:server-options="templateServerOptions"
                    :server-items-length="templateTotal"
                    :headers="templateHeaders"
                    :items="templates"
                    :loading="templateLoading"
                    table-class-name="data-table"
                    theme-color="#8B7355"
                    buttons-pagination
                    show-index
                >
                    <template #item-time="{ startTime, endTime }">
                        {{ formatTimeRangeLocal(startTime, endTime) }}
                    </template>

                    <template #item-requiredRoles="{ requiredRoles }">
                        <el-space wrap>
                            <el-tag
                                v-for="role in requiredRoles"
                                :key="role"
                                size="small"
                                :type="getRoleTagType(role)"
                            >
                                {{ translateRole(role) }}
                            </el-tag>
                        </el-space>
                    </template>

                    <template #item-defaultHourlyRate="{ defaultHourlyRate }">
                        {{ formatCurrency(defaultHourlyRate || 0) }}
                    </template>

                    <template #item-defaultFixedAllowance="{ defaultFixedAllowance }">
                        {{ formatCurrency(defaultFixedAllowance || 0) }}
                    </template>

                    <template #item-updatedAt="{ updatedAt }">
                        {{ formatDateTime(updatedAt) }}
                    </template>

                    <template #item-actions="row">
                        <el-space>
                            <el-button size="small" @click="openTemplateForm(row)">Sửa</el-button>
                            <el-popconfirm
                                title="Xoá ca mẫu này?"
                                confirm-button-text="Xoá"
                                cancel-button-text="Huỷ"
                                confirm-button-type="danger"
                                @confirm="handleDeleteTemplate(row)"
                            >
                                <template #reference>
                                    <el-button size="small" type="danger" plain>Xoá</el-button>
                                </template>
                            </el-popconfirm>
                        </el-space>
                    </template>
                </EasyDataTable>
            </el-tab-pane>

            <el-tab-pane label="Ca cụ thể" name="instances">
                <el-card class="box-card filter-card">
                    <el-row :gutter="16" class="mb-2">
                        <el-col :xs="24" :md="8">
                            <el-date-picker
                                v-model="instanceDateRange"
                                type="daterange"
                                unlink-panels
                                range-separator="Đến"
                                start-placeholder="Từ ngày"
                                end-placeholder="Đến ngày"
                                value-format="YYYY-MM-DD"
                                class="w-100"
                                clearable
                            />
                        </el-col>
                        <el-col :xs="24" :md="6">
                            <el-select
                                v-model="instanceStatusFilter"
                                placeholder="Trạng thái"
                                clearable
                                class="w-100"
                            >
                                <el-option
                                    v-for="status in SHIFT_STATUS_OPTIONS"
                                    :key="status.value"
                                    :label="status.label"
                                    :value="status.value"
                                />
                            </el-select>
                        </el-col>
                        <el-col :xs="24" :md="6">
                            <el-select
                                v-model="instanceTemplateFilter"
                                placeholder="Ca mẫu"
                                clearable
                                filterable
                                class="w-100"
                            >
                                <el-option
                                    v-for="template in allTemplates"
                                    :key="template.id"
                                    :label="template.name"
                                    :value="template.id"
                                />
                            </el-select>
                        </el-col>
                        <el-col :xs="24" :md="4">
                            <el-button type="primary" class="w-100" @click="openInstanceForm()">
                                <el-icon style="margin-right: 6px"><Calendar /></el-icon>
                                Sinh ca
                            </el-button>
                        </el-col>
                    </el-row>
                    <el-row :gutter="16">
                        <el-col v-for="stat in instanceStatusSummary" :key="stat.value" :xs="12" :md="6">
                            <div class="status-chip" :class="`status-chip--${stat.value.toLowerCase()}`">
                                <span class="status-chip__label">{{ stat.label }}</span>
                                <strong class="status-chip__value">{{ formatNumber(stat.count) }}</strong>
                            </div>
                        </el-col>
                    </el-row>
                </el-card>

                <EasyDataTable
                    v-model:server-options="instanceServerOptions"
                    :server-items-length="instanceTotal"
                    :headers="instanceHeaders"
                    :items="instances"
                    :loading="instanceLoading"
                    table-class-name="data-table"
                    theme-color="#8B7355"
                    buttons-pagination
                    show-index
                >
                    <template #item-shiftDate="{ shiftDate }">
                        {{ formatDate(shiftDate) }}
                    </template>

                    <template #item-time="{ startTime, endTime }">
                        {{ formatTimeRangeLocal(startTime, endTime) }}
                    </template>

                    <template #item-status="row">
                        <el-dropdown trigger="click" @command="(value) => handleChangeInstanceStatus(row, value)">
                            <span class="status-dropdown">
                                <el-tag :type="getStatusTagType(row.status)">
                                    {{ translateShiftStatus(row.status) }}
                                </el-tag>
                                <el-icon class="status-dropdown__icon"><ArrowDown /></el-icon>
                            </span>
                            <template #dropdown>
                                <el-dropdown-menu>
                                    <el-dropdown-item
                                        v-for="status in SHIFT_STATUS_OPTIONS"
                                        :key="status.value"
                                        :disabled="status.value === row.status"
                                        :command="status.value"
                                    >
                                        {{ status.label }}
                                    </el-dropdown-item>
                                </el-dropdown-menu>
                            </template>
                        </el-dropdown>
                    </template>

                    <template #item-assignments="{ assignments }">
                        <el-tag type="info">{{ formatNumber((assignments || []).length) }}</el-tag>
                    </template>

                    <template #item-notes="{ notes }">
                        <span class="text-muted">{{ notes || '—' }}</span>
                    </template>

                    <template #item-actions="row">
                        <el-space wrap>
                            <el-button size="small" type="primary" @click="openAssignmentsDrawer(row)">
                                Phân công
                            </el-button>
                            <el-button size="small" @click="openInstanceForm(row)">Sửa</el-button>
                            <el-popconfirm
                                title="Xoá ca này?"
                                confirm-button-text="Xoá"
                                cancel-button-text="Huỷ"
                                confirm-button-type="danger"
                                @confirm="handleDeleteInstance(row)"
                            >
                                <template #reference>
                                    <el-button size="small" type="danger" plain>Xoá</el-button>
                                </template>
                            </el-popconfirm>
                        </el-space>
                    </template>
                </EasyDataTable>
            </el-tab-pane>
        </el-tabs>

        <ShiftTemplateForm
            v-model:visible="templateFormVisible"
            :template="editingTemplate"
            :role-options="roleOptions"
            @success="refreshTemplates"
        />

        <ShiftInstanceForm
            v-model:visible="instanceFormVisible"
            :instance="editingInstance"
            :template-options="allTemplates"
            @success="refreshInstances"
        />

        <ShiftAssignmentForm
            v-model:visible="assignmentFormVisible"
            :assignment="editingAssignment"
            :shift="activeShift"
            :staff-options="staffOptions"
            :role-options="roleOptions"
            @success="handleAssignmentSaved"
        />

        <ShiftAdjustmentForm
            v-model:visible="adjustmentFormVisible"
            :assignment-id="adjustmentAssignmentId"
            :default-type="adjustmentDefaultType"
            @success="handleAdjustmentSaved"
        />

        <el-drawer
            v-model="assignmentsDrawerVisible"
            size="60%"
            :title="drawerTitle"
            destroy-on-close
        >
            <template v-if="activeShift">
                <div class="drawer-header">
                    <div class="drawer-meta">
                        <p class="drawer-meta__title">{{ activeShift.templateName }}</p>
                        <p class="drawer-meta__subtitle">
                            {{ formatDate(activeShift.shiftDate) }} ·
                            {{ formatTimeRangeLocal(activeShift.startTime, activeShift.endTime) }}
                        </p>
                        <el-space wrap>
                            <el-tag :type="getStatusTagType(activeShift.status)">
                                {{ translateShiftStatus(activeShift.status) }}
                            </el-tag>
                            <el-tag type="info">{{ activeShift.notes || 'Không có ghi chú' }}</el-tag>
                        </el-space>
                    </div>
                    <el-button type="primary" @click="openAssignmentForm()">
                        <el-icon style="margin-right: 6px"><Plus /></el-icon>
                        Phân công nhân viên
                    </el-button>
                </div>

                <div class="assignment-stats">
                    <div class="stat" v-for="stat in assignmentStats" :key="stat.label">
                        <p class="stat__label">{{ stat.label }}</p>
                        <p class="stat__value">{{ stat.value }}</p>
                        <p class="stat__hint">{{ stat.hint }}</p>
                    </div>
                </div>

                <EasyDataTable
                    :headers="assignmentTableHeaders"
                    :items="assignments"
                    :loading="assignmentsLoading"
                    table-class-name="assignment-table"
                    theme-color="#8B7355"
                    show-index
                >
                    <template #item-user="{ fullName, username }">
                        <div class="assignment-user">
                            <strong>{{ fullName || username }}</strong>
                            <small>@{{ username }}</small>
                        </div>
                    </template>

                    <template #item-role="{ roleName }">
                        <el-tag :type="getRoleTagType(roleName)" size="small">
                            {{ translateRole(roleName) }}
                        </el-tag>
                    </template>

                    <template #item-time="{ plannedStart, plannedEnd }">
                        {{ formatTimeRangeLocal(plannedStart, plannedEnd) }}
                    </template>

                    <template #item-status="assignment">
                        <el-dropdown
                            trigger="click"
                            @command="(value) => handleChangeAssignmentStatus(assignment, value)"
                        >
                            <span class="status-dropdown">
                                <el-tag :type="getAssignmentStatusTagType(assignment.status)">
                                    {{ translateAssignmentStatus(assignment.status) }}
                                </el-tag>
                                <el-icon class="status-dropdown__icon"><ArrowDown /></el-icon>
                            </span>
                            <template #dropdown>
                                <el-dropdown-menu>
                                    <el-dropdown-item
                                        v-for="status in SHIFT_ASSIGNMENT_STATUS_OPTIONS"
                                        :key="status.value"
                                        :disabled="status.value === assignment.status"
                                        :command="status.value"
                                    >
                                        {{ status.label }}
                                    </el-dropdown-item>
                                </el-dropdown-menu>
                            </template>
                        </el-dropdown>
                    </template>

                    <template #item-basePayroll="{ basePayroll }">
                        {{ formatCurrency(basePayroll || 0) }}
                    </template>

                    <template #item-adjustment="{ adjustmentTotal }">
                        <span :class="(adjustmentTotal || 0) >= 0 ? 'text-success' : 'text-danger'">
                            {{ formatCurrency(adjustmentTotal || 0) }}
                        </span>
                    </template>

                    <template #item-totalPayroll="{ calculatedPayroll }">
                        {{ formatCurrency(calculatedPayroll || 0) }}
                    </template>

                    <template #item-actions="assignment">
                        <el-space wrap>
                            <el-button size="small" @click="openAssignmentForm(assignment)">Sửa</el-button>
                            <el-button size="small" type="success" plain @click="handleManualCheckIn(assignment)">
                                Check-in
                            </el-button>
                            <el-button size="small" type="warning" plain @click="handleManualCheckOut(assignment)">
                                Check-out
                            </el-button>
                            <el-dropdown @command="(command) => handleAssignmentCommand(command, assignment)">
                                <el-button size="small" type="primary">
                                    Khác
                                    <el-icon><ArrowDown /></el-icon>
                                </el-button>
                                <template #dropdown>
                                    <el-dropdown-menu>
                                        <el-dropdown-item command="detail">Xem chi tiết</el-dropdown-item>
                                        <el-dropdown-item command="bonus">Thưởng</el-dropdown-item>
                                        <el-dropdown-item command="penalty">Phạt</el-dropdown-item>
                                        <el-dropdown-item command="delete" class="text-danger">
                                            Xoá phân công
                                        </el-dropdown-item>
                                    </el-dropdown-menu>
                                </template>
                            </el-dropdown>
                        </el-space>
                    </template>
                </EasyDataTable>
            </template>
            <template v-else>
                <el-empty description="Chưa chọn ca làm" />
            </template>
        </el-drawer>

        <el-dialog
            v-model="assignmentDetailVisible"
            :title="detailTitle"
            width="720px"
            destroy-on-close
        >
            <template v-if="activeAssignmentDetail">
                <el-descriptions :column="2" border size="small" class="mb-3">
                    <el-descriptions-item label="Nhân viên">
                        <strong>{{ activeAssignmentDetail.fullName || activeAssignmentDetail.username }}</strong>
                    </el-descriptions-item>
                    <el-descriptions-item label="Vai trò">
                        {{ translateRole(activeAssignmentDetail.roleName) }}
                    </el-descriptions-item>
                    <el-descriptions-item label="Ca làm">
                        {{ activeShift?.templateName }}
                    </el-descriptions-item>
                    <el-descriptions-item label="Khung giờ">
                        {{ formatTimeRangeLocal(activeAssignmentDetail.plannedStart, activeAssignmentDetail.plannedEnd) }}
                    </el-descriptions-item>
                    <el-descriptions-item label="Lương chuẩn">
                        {{ formatCurrency(activeAssignmentDetail.basePayroll || 0) }}
                    </el-descriptions-item>
                    <el-descriptions-item label="Điều chỉnh">
                        {{ formatCurrency(activeAssignmentDetail.adjustmentTotal || 0) }}
                    </el-descriptions-item>
                </el-descriptions>

                <el-tabs v-model="assignmentDetailTab">
                    <el-tab-pane label="Chấm công" name="attendance">
                        <div v-loading="attendanceLoading">
                            <el-timeline v-if="attendanceRecords.length" class="attendance-timeline">
                                <el-timeline-item
                                    v-for="record in attendanceRecords"
                                    :key="record.id"
                                    :timestamp="formatDateTime(record.createdAt)"
                                    :type="record.checkOutAt ? 'success' : 'primary'"
                                >
                                    <div class="attendance-item">
                                        <p>
                                            <strong>Check-in:</strong> {{ formatDateTime(record.checkInAt) }}
                                        </p>
                                        <p>
                                            <strong>Check-out:</strong> {{ formatDateTime(record.checkOutAt) || 'Chưa ghi nhận' }}
                                        </p>
                                        <p>
                                            Nguồn: {{ translateAttendanceSource(record.source) }} ·
                                            {{ record.note || 'Không ghi chú' }}
                                        </p>
                                        <p>
                                            Trễ: {{ formatNumber(record.lateMinutes || 0) }} phút · Về sớm:
                                            {{ formatNumber(record.earlyLeaveMinutes || 0) }} phút
                                        </p>
                                    </div>
                                </el-timeline-item>
                            </el-timeline>
                            <el-empty v-else description="Chưa có dữ liệu chấm công" />
                        </div>
                    </el-tab-pane>

                    <el-tab-pane label="Thưởng / Phạt" name="adjustments">
                        <el-table :data="adjustments" v-loading="adjustmentsLoading" border>
                            <el-table-column type="index" width="50" />
                            <el-table-column label="Loại" width="120">
                                <template #default="{ row }">
                                    <el-tag :type="row.type === 'BONUS' ? 'success' : 'danger'">
                                        {{ row.type === 'BONUS' ? 'Thưởng' : 'Phạt' }}
                                    </el-tag>
                                </template>
                            </el-table-column>
                            <el-table-column label="Số tiền" min-width="140" align="right">
                                <template #default="{ row }">
                                    {{ formatCurrency(row.amount || 0) }}
                                </template>
                            </el-table-column>
                            <el-table-column label="Hiệu lực" min-width="160">
                                <template #default="{ row }">
                                    {{ formatDateTime(row.effectiveAt) }}
                                </template>
                            </el-table-column>
                            <el-table-column label="Trạng thái" min-width="120">
                                <template #default="{ row }">
                                    <el-tag :type="row.revoked ? 'info' : 'success'">
                                        {{ row.revoked ? 'Đã thu hồi' : 'Hiệu lực' }}
                                    </el-tag>
                                </template>
                            </el-table-column>
                            <el-table-column label="Hành động" fixed="right" width="180">
                                <template #default="{ row }">
                                    <el-space>
                                        <el-button
                                            size="small"
                                            type="warning"
                                            plain
                                            :disabled="row.revoked"
                                            @click="handleRevokeAdjustment(row)"
                                        >
                                            Thu hồi
                                        </el-button>
                                        <el-button
                                            size="small"
                                            type="danger"
                                            plain
                                            @click="handleDeleteAdjustment(row)"
                                        >
                                            Xoá
                                        </el-button>
                                    </el-space>
                                </template>
                            </el-table-column>
                        </el-table>
                    </el-tab-pane>
                </el-tabs>
            </template>
            <template v-else>
                <el-empty description="Chưa chọn phân công" />
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import EasyDataTable from 'vue3-easy-data-table'
import 'vue3-easy-data-table/dist/style.css'
import { useToast } from 'vue-toastification'
import { ElMessageBox } from 'element-plus'
import {
    getShiftTemplates,
    deleteShiftTemplate,
    getShiftInstances,
    deleteShiftInstance,
    updateShiftInstanceStatus,
    getAssignmentsByShift,
    deleteShiftAssignment,
    updateShiftAssignmentStatus,
    checkInAttendance,
    checkOutAttendance,
    getAttendanceByAssignment,
    getAdjustmentsByAssignment,
    revokeShiftAdjustment,
    deleteShiftAdjustment
} from '@/api/shiftManagementService.js'
import { getUsers } from '@/api/userService.js'
import {
    SHIFT_STATUS_OPTIONS,
    SHIFT_ASSIGNMENT_STATUS_OPTIONS,
    ATTENDANCE_SOURCE_OPTIONS
} from '@/constants/shift.js'
import { formatCurrency } from '@/utils/formatters.js'
import { formatTimeRange } from '@/utils/timeHelpers.js'
import ShiftTemplateForm from '@/components/shifts/ShiftTemplateForm.vue'
import ShiftInstanceForm from '@/components/shifts/ShiftInstanceForm.vue'
import ShiftAssignmentForm from '@/components/shifts/ShiftAssignmentForm.vue'
import ShiftAdjustmentForm from '@/components/shifts/ShiftAdjustmentForm.vue'
import { Plus, Search, Calendar, ArrowDown } from '@element-plus/icons-vue'

const toast = useToast()

const activeTab = ref('templates')

const templateSearch = ref('')
const templateRoleFilter = ref(null)
const templateServerOptions = ref({
    page: 1,
    rowsPerPage: 10,
    sortBy: 'createdAt',
    sortType: 'desc'
})
const templateLoading = ref(false)
const templateTotal = ref(0)
const templates = ref([])

const instances = ref([])
const instanceTotal = ref(0)
const instanceLoading = ref(false)
const instanceServerOptions = ref({
    page: 1,
    rowsPerPage: 10,
    sortBy: 'shiftDate',
    sortType: 'desc'
})
const instanceDateRange = ref([])
const instanceStatusFilter = ref(null)
const instanceTemplateFilter = ref(null)

const allTemplates = ref([])
const staffOptions = ref([])

const assignmentsDrawerVisible = ref(false)
const assignmentsLoading = ref(false)
const assignments = ref([])
const activeShift = ref(null)

const templateFormVisible = ref(false)
const instanceFormVisible = ref(false)
const assignmentFormVisible = ref(false)
const adjustmentFormVisible = ref(false)

const editingTemplate = ref(null)
const editingInstance = ref(null)
const editingAssignment = ref(null)

const adjustmentAssignmentId = ref(null)
const adjustmentDefaultType = ref('BONUS')

const assignmentDetailVisible = ref(false)
const assignmentDetailTab = ref('attendance')
const activeAssignmentDetail = ref(null)
const attendanceRecords = ref([])
const attendanceLoading = ref(false)
const adjustments = ref([])
const adjustmentsLoading = ref(false)

const today = new Date().toISOString().slice(0, 10)

let templateSearchTimer = null
let instanceFilterTimer = null

const formatNumber = (value) => new Intl.NumberFormat('vi-VN').format(value || 0)

const toReadableRole = (role) => {
    if (!role) return ''
    return role
        .toString()
        .replace(/^ROLE_/, '')
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ')
}

const roleOptions = ref([
    { label: 'Barista', value: 'BARISTA' },
    { label: 'Thu ngân', value: 'CASHIER' },
    { label: 'Phục vụ', value: 'SERVER' },
    { label: 'Pha chế', value: 'BREWER' },
    { label: 'Quản lý ca', value: 'SHIFT_LEAD' }
])

const templateHeaders = [
    { text: 'Tên ca', value: 'name', sortable: true },
    { text: 'Khung giờ', value: 'time' },
    { text: 'Vai trò yêu cầu', value: 'requiredRoles' },
    { text: 'Lương giờ', value: 'defaultHourlyRate', sortable: true },
    { text: 'Phụ cấp', value: 'defaultFixedAllowance', sortable: true },
    { text: 'Cập nhật', value: 'updatedAt', sortable: true },
    { text: 'Hành động', value: 'actions', width: 200 }
]

const assignmentTableHeaders = [
    { text: 'Nhân viên', value: 'user', width: 240 },
    { text: 'Vai trò', value: 'role', width: 160 },
    { text: 'Thời gian', value: 'time', width: 180 },
    { text: 'Trạng thái', value: 'status', width: 200 },
    { text: 'Lương dự kiến', value: 'basePayroll', width: 160, align: 'right' },
    { text: 'Thưởng/Phạt', value: 'adjustment', width: 160, align: 'right' },
    { text: 'Tổng lương', value: 'totalPayroll', width: 160, align: 'right' },
    { text: 'Hành động', value: 'actions', width: 300 }
]

const instanceHeaders = [
    { text: 'Ngày', value: 'shiftDate', sortable: true },
    { text: 'Ca mẫu', value: 'templateName', sortable: true },
    { text: 'Khung giờ', value: 'time' },
    { text: 'Trạng thái', value: 'status' },
    { text: 'Phân công', value: 'assignments' },
    { text: 'Ghi chú', value: 'notes' },
    { text: 'Hành động', value: 'actions', width: 280 }
]

const ensureRoleOptions = (roles) => {
    roles.forEach((role) => {
        if (role && !roleOptions.value.some((option) => option.value === role)) {
            roleOptions.value.push({ label: toReadableRole(role), value: role })
        }
    })
}

const fetchTemplates = async () => {
    templateLoading.value = true
    try {
        const params = {
            page: templateServerOptions.value.page - 1,
            size: templateServerOptions.value.rowsPerPage,
            sort: `${templateServerOptions.value.sortBy},${templateServerOptions.value.sortType}`,
            name: templateSearch.value || undefined,
            requiredRole: templateRoleFilter.value || undefined
        }
        const response = await getShiftTemplates(params)
        templates.value = response.data.content || []
        templateTotal.value = response.data.totalElements || 0
        const roleSet = new Set()
        templates.value.forEach((template) => {
            (template.requiredRoles || []).forEach((role) => roleSet.add(role))
        })
        ensureRoleOptions([...roleSet])
    } catch (error) {
        toast.error('Không thể tải danh sách ca mẫu')
    } finally {
        templateLoading.value = false
    }
}

const refreshTemplates = async () => {
    await Promise.all([fetchTemplates(), loadAllTemplates()])
}

const handleDeleteTemplate = async (template) => {
    try {
        await deleteShiftTemplate(template.id)
        toast.success('Đã xoá ca mẫu')
        await refreshTemplates()
    } catch (error) {
        const message = error.response?.data?.message || 'Không thể xoá ca mẫu'
        toast.error(message)
    }
}

const fetchInstances = async () => {
    instanceLoading.value = true
    try {
        const params = {
            page: instanceServerOptions.value.page - 1,
            size: instanceServerOptions.value.rowsPerPage,
            sort: `${instanceServerOptions.value.sortBy},${instanceServerOptions.value.sortType}`
        }

        if (instanceDateRange.value?.length === 2) {
            params.from = instanceDateRange.value[0]
            params.to = instanceDateRange.value[1]
        }

        if (instanceStatusFilter.value) {
            params.status = instanceStatusFilter.value
        }

        if (instanceTemplateFilter.value) {
            params.templateId = instanceTemplateFilter.value
        }

        const response = await getShiftInstances(params)
        instances.value = response.data.content || []
        instanceTotal.value = response.data.totalElements || 0
    } catch (error) {
        toast.error('Không thể tải danh sách ca cụ thể')
    } finally {
        instanceLoading.value = false
    }
}

const refreshInstances = async () => {
    await fetchInstances()
}

const handleDeleteInstance = async (instance) => {
    try {
        await deleteShiftInstance(instance.id)
        toast.success('Đã xoá ca làm')
        await refreshInstances()
    } catch (error) {
        const message = error.response?.data?.message || 'Không thể xoá ca làm'
        toast.error(message)
    }
}

const handleChangeInstanceStatus = async (instance, nextStatus) => {
    if (instance.status === nextStatus) return
    try {
        await updateShiftInstanceStatus(instance.id, { status: nextStatus })
        toast.success('Đã cập nhật trạng thái ca')
        await refreshInstances()
        if (activeShift.value?.id === instance.id) {
            activeShift.value = { ...activeShift.value, status: nextStatus }
        }
    } catch (error) {
        const message = error.response?.data?.message || 'Không thể cập nhật trạng thái ca'
        toast.error(message)
    }
}

const openAssignmentsDrawer = (shift) => {
    activeShift.value = shift
    assignmentsDrawerVisible.value = true
    assignments.value = []
    loadAssignments(shift.id)
}

const loadAssignments = async (shiftId) => {
    assignmentsLoading.value = true
    try {
        const response = await getAssignmentsByShift(shiftId)
        assignments.value = response.data || []
    } catch (error) {
        toast.error('Không thể tải phân công')
        assignments.value = []
    } finally {
        assignmentsLoading.value = false
    }
}

const handleChangeAssignmentStatus = async (assignment, nextStatus) => {
    if (assignment.status === nextStatus) return
    try {
        await updateShiftAssignmentStatus(assignment.id, { status: nextStatus })
        toast.success('Đã cập nhật trạng thái phân công')
        await loadAssignments(activeShift.value.id)
    } catch (error) {
        const message = error.response?.data?.message || 'Không thể cập nhật trạng thái phân công'
        toast.error(message)
    }
}

const handleDeleteAssignment = async (assignment) => {
    try {
        await ElMessageBox.confirm('Xoá phân công này?', 'Xác nhận', {
            confirmButtonText: 'Xoá',
            cancelButtonText: 'Huỷ',
            type: 'warning'
        })
        await deleteShiftAssignment(assignment.id)
        toast.success('Đã xoá phân công')
        await loadAssignments(activeShift.value.id)
        await refreshInstances()
    } catch (error) {
        if (error === 'cancel' || error === 'close') return
        const message = error.response?.data?.message || 'Không thể xoá phân công'
        toast.error(message)
    }
}

const handleManualCheckIn = async (assignment) => {
    try {
        await checkInAttendance({ assignmentId: assignment.id, source: 'MANUAL', note: 'Check-in thủ công' })
        toast.success('Đã ghi nhận check-in')
        await loadAssignments(activeShift.value.id)
        if (assignmentDetailVisible.value && activeAssignmentDetail.value?.id === assignment.id) {
            await loadAttendanceRecords(assignment.id)
        }
    } catch (error) {
        const message = error.response?.data?.message || 'Check-in thất bại'
        toast.error(message)
    }
}

const handleManualCheckOut = async (assignment) => {
    try {
        await checkOutAttendance({ assignmentId: assignment.id, source: 'MANUAL', note: 'Check-out thủ công' })
        toast.success('Đã ghi nhận check-out')
        await loadAssignments(activeShift.value.id)
        if (assignmentDetailVisible.value && activeAssignmentDetail.value?.id === assignment.id) {
            await loadAttendanceRecords(assignment.id)
        }
    } catch (error) {
        const message = error.response?.data?.message || 'Check-out thất bại'
        toast.error(message)
    }
}

const openTemplateForm = (template = null) => {
    editingTemplate.value = template
    templateFormVisible.value = true
}

const openInstanceForm = (instance = null) => {
    editingInstance.value = instance
    instanceFormVisible.value = true
}

const openAssignmentForm = (assignment = null) => {
    if (!activeShift.value) return
    editingAssignment.value = assignment
    assignmentFormVisible.value = true
}

const handleAssignmentSaved = async () => {
    assignmentFormVisible.value = false
    if (activeShift.value) {
        await loadAssignments(activeShift.value.id)
    }
    await refreshInstances()
}

const openAdjustmentForm = (assignment, type = 'BONUS') => {
    adjustmentAssignmentId.value = assignment.id
    adjustmentDefaultType.value = type
    adjustmentFormVisible.value = true
}

const handleAdjustmentSaved = async () => {
    adjustmentFormVisible.value = false
    if (activeShift.value) {
        await loadAssignments(activeShift.value.id)
    }
    if (activeAssignmentDetail.value?.id === adjustmentAssignmentId.value) {
        await loadAdjustmentsList(adjustmentAssignmentId.value)
    }
}

const openAssignmentDetail = async (assignment) => {
    activeAssignmentDetail.value = assignment
    assignmentDetailVisible.value = true
    assignmentDetailTab.value = 'attendance'
    await Promise.all([loadAttendanceRecords(assignment.id), loadAdjustmentsList(assignment.id)])
}

const loadAttendanceRecords = async (assignmentId) => {
    attendanceLoading.value = true
    try {
        const response = await getAttendanceByAssignment(assignmentId)
        attendanceRecords.value = response.data || []
    } catch (error) {
        toast.error('Không thể tải dữ liệu chấm công')
        attendanceRecords.value = []
    } finally {
        attendanceLoading.value = false
    }
}

const loadAdjustmentsList = async (assignmentId) => {
    adjustmentsLoading.value = true
    try {
        const response = await getAdjustmentsByAssignment(assignmentId)
        adjustments.value = response.data || []
    } catch (error) {
        toast.error('Không thể tải thưởng/phạt')
        adjustments.value = []
    } finally {
        adjustmentsLoading.value = false
    }
}

const handleRevokeAdjustment = async (adjustment) => {
    try {
        const { value } = await ElMessageBox.prompt('Nhập lý do thu hồi', 'Thu hồi thưởng/phạt', {
            confirmButtonText: 'Thu hồi',
            cancelButtonText: 'Huỷ',
            inputPlaceholder: 'Nhập lý do...',
            inputValidator: (val) => !!val || 'Vui lòng nhập lý do'
        })
        await revokeShiftAdjustment(adjustment.id, { reason: value })
        toast.success('Đã thu hồi thưởng/phạt')
        if (activeAssignmentDetail.value) {
            await loadAdjustmentsList(activeAssignmentDetail.value.id)
        }
        if (activeShift.value) {
            await loadAssignments(activeShift.value.id)
        }
    } catch (error) {
        if (error === 'cancel' || error === 'close') return
        const message = error.response?.data?.message || 'Không thể thu hồi'
        toast.error(message)
    }
}

const handleDeleteAdjustment = async (adjustment) => {
    try {
        await ElMessageBox.confirm('Xoá thưởng/phạt này?', 'Xác nhận', {
            confirmButtonText: 'Xoá',
            cancelButtonText: 'Huỷ',
            type: 'warning'
        })
        await deleteShiftAdjustment(adjustment.id)
        toast.success('Đã xoá thưởng/phạt')
        if (activeAssignmentDetail.value) {
            await loadAdjustmentsList(activeAssignmentDetail.value.id)
        }
        if (activeShift.value) {
            await loadAssignments(activeShift.value.id)
        }
    } catch (error) {
        if (error === 'cancel' || error === 'close') return
        const message = error.response?.data?.message || 'Không thể xoá'
        toast.error(message)
    }
}

const handleAssignmentCommand = (command, assignment) => {
    if (command === 'detail') {
        openAssignmentDetail(assignment)
    } else if (command === 'bonus') {
        openAdjustmentForm(assignment, 'BONUS')
    } else if (command === 'penalty') {
        openAdjustmentForm(assignment, 'PENALTY')
    } else if (command === 'delete') {
        handleDeleteAssignment(assignment)
    }
}

const loadAllTemplates = async () => {
    try {
        const response = await getShiftTemplates({ page: 0, size: 200, sort: 'name,asc' })
        allTemplates.value = response.data.content || []
        const roleSet = new Set()
        allTemplates.value.forEach((template) => {
            (template.requiredRoles || []).forEach((role) => roleSet.add(role))
        })
        ensureRoleOptions([...roleSet])
    } catch (error) {
        allTemplates.value = []
    }
}

const loadStaffOptions = async () => {
    try {
        const response = await getUsers({ page: 0, size: 200, sort: 'fullName,asc' })
        staffOptions.value = (response.data.content || []).map((user) => ({
            value: user.id,
            label: user.fullName || user.username,
            roles: (user.roles || []).map((role) => toReadableRole(role.name))
        }))
    } catch (error) {
        staffOptions.value = []
    }
}

const templateMetrics = computed(() => ({
    total: formatNumber(templateTotal.value)
}))

const instanceMetrics = computed(() => {
    const todayCount = instances.value.filter((item) => item.shiftDate === today).length
    const inProgressCount = instances.value.filter((item) => item.status === 'IN_PROGRESS').length
    return {
        today: formatNumber(todayCount),
        inProgress: formatNumber(inProgressCount)
    }
})

const assignmentMetrics = computed(() => {
    const totalAssignments = instances.value.reduce(
        (sum, item) => sum + ((item.assignments || []).length || 0),
        0
    )
    return {
        total: formatNumber(totalAssignments)
    }
})

const instanceStatusSummary = computed(() => {
    return SHIFT_STATUS_OPTIONS.map((option) => ({
        value: option.value,
        label: option.label,
        count: instances.value.filter((instance) => instance.status === option.value).length
    }))
})

const assignmentStats = computed(() => {
    const totalAssignments = assignments.value.length
    const completed = assignments.value.filter((item) => item.status === 'COMPLETED').length
    const totalPayroll = assignments.value.reduce((sum, item) => sum + (item.calculatedPayroll || 0), 0)
    const avgPayroll = totalAssignments ? totalPayroll / totalAssignments : 0
    return [
        { label: 'Tổng phân công', value: formatNumber(totalAssignments), hint: 'Số lượng nhân sự trong ca' },
        { label: 'Đã hoàn tất', value: formatNumber(completed), hint: 'Trạng thái COMPLETED' },
        { label: 'Tổng lương', value: formatCurrency(totalPayroll), hint: 'Bao gồm thưởng/phạt' },
        { label: 'Lương trung bình', value: formatCurrency(avgPayroll), hint: 'Theo từng phân công' }
    ]
})

const drawerTitle = computed(() => {
    if (!activeShift.value) return 'Phân công'
    return `Phân công • ${activeShift.value.templateName}`
})

const detailTitle = computed(() => {
    if (!activeAssignmentDetail.value) return 'Chi tiết phân công'
    return `Chi tiết • ${activeAssignmentDetail.value.fullName || activeAssignmentDetail.value.username}`
})

const formatDateTime = (value) => {
    if (!value) return '—'
    try {
        return new Date(value).toLocaleString('vi-VN')
    } catch (error) {
        return value
    }
}

const formatDate = (value) => {
    if (!value) return '—'
    try {
        return new Date(value).toLocaleDateString('vi-VN')
    } catch (error) {
        return value
    }
}

const formatTimeRangeLocal = (start, end) => {
    return formatTimeRange(start, end)
}

const translateRole = (role) => {
    const mapping = roleOptions.value.find((item) => item.value === role)
    if (mapping) return mapping.label
    return toReadableRole(role)
}

const translateShiftStatus = (status) => {
    return SHIFT_STATUS_OPTIONS.find((option) => option.value === status)?.label || status || '—'
}

const translateAssignmentStatus = (status) => {
    return (
        SHIFT_ASSIGNMENT_STATUS_OPTIONS.find((option) => option.value === status)?.label || status || '—'
    )
}

const translateAttendanceSource = (source) => {
    return ATTENDANCE_SOURCE_OPTIONS.find((option) => option.value === source)?.label || source || '—'
}

const getRoleTagType = (role) => {
    const mapping = {
        BARISTA: 'success',
        CASHIER: 'info',
        SERVER: 'primary',
        BREWER: 'warning',
        SHIFT_LEAD: 'danger',
        MANAGER: 'warning',
        ADMIN: 'danger'
    }
    return mapping[role] || 'info'
}

const getStatusTagType = (status) => {
    const mapping = {
        PLANNED: 'info',
        LOCKED: 'warning',
        IN_PROGRESS: 'primary',
        DONE: 'success',
        CANCELLED: 'danger'
    }
    return mapping[status] || 'info'
}

const getAssignmentStatusTagType = (status) => {
    const mapping = {
        SCHEDULED: 'info',
        CONFIRMED: 'primary',
        IN_PROGRESS: 'warning',
        COMPLETED: 'success',
        CANCELLED: 'danger'
    }
    return mapping[status] || 'info'
}

watch(
    templateServerOptions,
    () => {
        fetchTemplates()
    },
    { deep: true }
)

watch(
    () => templateSearch.value,
    () => {
        clearTimeout(templateSearchTimer)
        templateSearchTimer = setTimeout(() => {
            templateServerOptions.value.page = 1
            fetchTemplates()
        }, 400)
    }
)

watch(
    () => templateRoleFilter.value,
    () => {
        templateServerOptions.value.page = 1
        fetchTemplates()
    }
)

watch(
    instanceServerOptions,
    () => {
        fetchInstances()
    },
    { deep: true }
)

watch(
    () => [instanceDateRange.value, instanceStatusFilter.value, instanceTemplateFilter.value],
    () => {
        clearTimeout(instanceFilterTimer)
        instanceFilterTimer = setTimeout(() => {
            instanceServerOptions.value.page = 1
            fetchInstances()
        }, 300)
    },
    { deep: true }
)

watch(activeTab, (tab) => {
    if (tab === 'templates') {
        refreshTemplates()
    } else if (tab === 'instances') {
        refreshInstances()
    }
})

watch(assignmentsDrawerVisible, (visible) => {
    if (!visible) {
        assignments.value = []
        activeShift.value = null
        assignmentFormVisible.value = false
        editingAssignment.value = null
    }
})

watch(assignmentFormVisible, (visible) => {
    if (!visible) {
        editingAssignment.value = null
    }
})

watch(templateFormVisible, (visible) => {
    if (!visible) {
        editingTemplate.value = null
    }
})

watch(instanceFormVisible, (visible) => {
    if (!visible) {
        editingInstance.value = null
    }
})

watch(adjustmentFormVisible, (visible) => {
    if (!visible) {
        adjustmentAssignmentId.value = null
        adjustmentDefaultType.value = 'BONUS'
    }
})

watch(assignmentDetailVisible, (visible) => {
    if (!visible) {
        activeAssignmentDetail.value = null
        attendanceRecords.value = []
        adjustments.value = []
    }
})

const handleAssignmentDetailTabChange = async (tab) => {
    if (!activeAssignmentDetail.value) return
    if (tab === 'attendance' && !attendanceRecords.value.length) {
        await loadAttendanceRecords(activeAssignmentDetail.value.id)
    } else if (tab === 'adjustments' && !adjustments.value.length) {
        await loadAdjustmentsList(activeAssignmentDetail.value.id)
    }
}

watch(assignmentDetailTab, (tab) => {
    handleAssignmentDetailTabChange(tab)
})

onMounted(async () => {
    await Promise.all([refreshTemplates(), refreshInstances(), loadStaffOptions()])
})

onBeforeUnmount(() => {
    clearTimeout(templateSearchTimer)
    clearTimeout(instanceFilterTimer)
})
</script>

<style scoped>
.app-page-container {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 16px;
    background: linear-gradient(135deg, #fff7f0 0%, #ffffff 85%);
    border-radius: 18px;
    padding: 18px 24px;
    box-shadow: 0 12px 28px -18px rgba(107, 75, 37, 0.45);
}

.page-subtitle {
    margin: 0;
    font-size: 0.95rem;
    color: #909399;
}

.page-title {
    margin: 4px 0 0;
    font-size: 1.75rem;
    font-weight: 700;
}

.overview-section {
    margin-top: 8px;
    padding: 6px 2px 2px;
}

.metric-card {
    background: linear-gradient(145deg, #ffffff 8%, #f9f2ea 95%);
    border-radius: 18px;
    padding: 22px 24px;
    box-shadow: 0 18px 28px -16px rgba(112, 85, 55, 0.35);
    border: 1px solid rgba(179, 145, 103, 0.15);
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.metric-card__title {
    margin: 0;
    font-size: 0.95rem;
    color: #907a62;
    font-weight: 600;
}

.metric-card__value {
    margin: 6px 0 2px;
    font-size: 2rem;
    font-weight: 700;
    color: #4b351f;
}

.metric-card__hint {
    margin: 0;
    font-size: 0.85rem;
    color: #a7896a;
}

.shift-tabs {
    background: transparent;
    padding: 0 4px;
}

.filter-card {
    margin-bottom: 16px;
    padding: 18px 20px;
    border-radius: 18px;
    border: 1px solid rgba(179, 145, 103, 0.18);
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(248, 242, 234, 0.92));
    box-shadow: 0 16px 30px -20px rgba(107, 84, 53, 0.45);
}

.mb-2 {
    margin-bottom: 12px;
}

.mb-3 {
    margin-bottom: 18px;
}

.status-chip {
    background: rgba(244, 233, 220, 0.72);
    border-radius: 14px;
    padding: 14px 18px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    border: 1px solid rgba(179, 145, 103, 0.2);
    transition: all 0.2s ease;
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.4), 0 10px 22px -20px rgba(100, 80, 50, 0.6);
}

.status-chip__label {
    font-size: 0.85rem;
    color: #8d735a;
    font-weight: 600;
}

.status-chip__value {
    font-size: 1.25rem;
    font-weight: 700;
    color: #4b351f;
}

.status-chip--planned {
    border-color: rgba(144, 147, 153, 0.25);
}

.status-chip--locked {
    border-color: rgba(230, 162, 60, 0.28);
}

.status-chip--in_progress {
    border-color: rgba(64, 158, 255, 0.28);
}

.status-chip--done {
    border-color: rgba(103, 194, 58, 0.28);
}

.status-chip--cancelled {
    border-color: rgba(245, 108, 108, 0.28);
}

.status-dropdown {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
}

.status-dropdown__icon {
    font-size: 12px;
    color: #909399;
}

.drawer-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 16px;
}

.drawer-meta__title {
    margin: 0;
    font-size: 1.35rem;
    font-weight: 700;
}

.drawer-meta__subtitle {
    margin: 4px 0 12px;
    color: #909399;
    font-size: 0.95rem;
}

.assignment-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 12px;
    margin-bottom: 20px;
    padding: 12px 16px;
    background: linear-gradient(120deg, rgba(255, 255, 255, 0.95), rgba(249, 244, 236, 0.92));
    border-radius: 18px;
    border: 1px solid rgba(179, 145, 103, 0.18);
}

.stat {
    padding: 14px;
    border-radius: 12px;
    background: linear-gradient(155deg, #fff9f0 0%, #f3ede5 100%);
    border: 1px solid rgba(178, 146, 103, 0.2);
    box-shadow: 0 14px 24px -18px rgba(107, 84, 53, 0.65);
}

.stat__label {
    margin: 0;
    font-size: 0.9rem;
    color: #8c7a64;
}

.stat__value {
    margin: 4px 0;
    font-size: 1.6rem;
    font-weight: 700;
    color: #4d3822;
}

.stat__hint {
    margin: 0;
    font-size: 0.85rem;
    color: #9c8b78;
}

.assignment-table {
    width: 100%;
    --table-border-radius: 20px;
}

.assignment-user {
    display: flex;
    flex-direction: column;
}

.assignment-user small {
    color: #909399;
}

.attendance-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
    color: #606266;
}

:deep(.assignment-table .easy-data-table__header th) {
    background: linear-gradient(135deg, #8b7355, #6c5233) !important;
    color: #ffffff !important;
    font-weight: 600 !important;
    border-bottom: none !important;
}

:deep(.assignment-table .easy-data-table__body tr:nth-child(even)) {
    background: rgba(248, 241, 233, 0.65) !important;
}

:deep(.assignment-table .easy-data-table__body tr:hover) {
    background: rgba(226, 202, 173, 0.65) !important;
}

:deep(.assignment-table .easy-data-table__footer) {
    border-top: none !important;
}

.text-muted {
    color: #909399;
}

.text-success {
    color: #67c23a;
}

.text-danger {
    color: #f56c6c;
}

@media (max-width: 992px) {
    .assignment-stats {
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    }

    .drawer-header {
        flex-direction: column;
        align-items: stretch;
    }
}

@media (max-width: 768px) {
    .app-page-container {
        padding: 16px;
    }

    .page-title {
        font-size: 1.5rem;
    }
}
</style>
