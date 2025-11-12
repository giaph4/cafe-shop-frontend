<template>
    <el-dialog
        :model-value="visible"
        @update:model-value="emitVisible"
        :title="isEditMode ? 'Cập nhật phân công' : 'Phân công nhân viên'
        "
        width="640px"
        destroy-on-close
        :close-on-click-modal="false"
        :append-to-body="true"
        @close="resetForm"
    >
        <el-form
            ref="formRef"
            :model="formData"
            :rules="formRules"
            label-position="top"
            v-loading="loading"
        >
            <el-row :gutter="20">
                <el-col :span="24">
                    <el-form-item label="Nhân viên" prop="userId">
                        <el-select
                            v-model="formData.userId"
                            placeholder="Chọn nhân viên"
                            class="w-100"
                            filterable
                            :disabled="isEditMode"
                        >
                            <el-option
                                v-for="staff in staffOptions"
                                :key="staff.value"
                                :label="staff.label"
                                :value="staff.value"
                            >
                                <div class="select-option">
                                    <span class="name">{{ staff.label }}</span>
                                    <small class="roles">{{ staff.roles?.join(', ') }}</small>
                                </div>
                            </el-option>
                        </el-select>
                    </el-form-item>
                </el-col>

                <el-col :span="12">
                    <el-form-item label="Vai trò" prop="roleName">
                        <el-select
                            v-model="formData.roleName"
                            placeholder="Chọn vai trò"
                            class="w-100"
                            filterable
                        >
                            <el-option
                                v-for="role in roleOptions"
                                :key="role.value"
                                :label="role.label"
                                :value="role.value"
                            />
                        </el-select>
                    </el-form-item>
                </el-col>

                <el-col :span="12">
                    <el-form-item label="Giờ bắt đầu kế hoạch" prop="plannedStart">
                        <el-time-select
                            v-model="formData.plannedStart"
                            start="00:00"
                            step="00:15"
                            end="23:45"
                            placeholder="08:00"
                            format="HH:mm"
                        />
                    </el-form-item>
                </el-col>

                <el-col :span="12">
                    <el-form-item label="Giờ kết thúc kế hoạch" prop="plannedEnd">
                        <el-time-select
                            v-model="formData.plannedEnd"
                            start="00:00"
                            step="00:15"
                            end="23:45"
                            placeholder="12:00"
                            format="HH:mm"
                        />
                    </el-form-item>
                </el-col>

                <el-col :span="12">
                    <el-form-item label="Tổng phút dự kiến" prop="plannedMinutes">
                        <el-input-number
                            v-model="formData.plannedMinutes"
                            :min="0"
                            :step="15"
                            class="w-100"
                        />
                    </el-form-item>
                </el-col>

                <el-col :span="12">
                    <el-form-item label="Lương giờ (VND)" prop="hourlyRate">
                        <el-input-number
                            v-model="formData.hourlyRate"
                            :min="0"
                            :step="1000"
                            class="w-100"
                        />
                    </el-form-item>
                </el-col>

                <el-col :span="12">
                    <el-form-item label="Phụ cấp cố định (VND)" prop="fixedAllowance">
                        <el-input-number
                            v-model="formData.fixedAllowance"
                            :min="0"
                            :step="1000"
                            class="w-100"
                        />
                    </el-form-item>
                </el-col>

                <el-col :span="24">
                    <el-form-item label="Ghi chú" prop="notes">
                        <el-input
                            v-model="formData.notes"
                            type="textarea"
                            :rows="3"
                            maxlength="255"
                            show-word-limit
                            placeholder="Thông tin bổ sung cho nhân viên"
                        />
                    </el-form-item>
                </el-col>
            </el-row>
        </el-form>

        <template #footer>
            <div class="dialog-footer">
                <el-button @click="emitVisible(false)" :disabled="loading">Đóng</el-button>
                <el-button type="primary" @click="handleSubmit" :loading="loading">
                    {{ isEditMode ? 'Cập nhật' : 'Tạo phân công' }}
                </el-button>
            </div>
        </template>
    </el-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import {
    createShiftAssignment,
    updateShiftAssignment
} from '@/api/shiftManagementService.js'
import { calculateMinutesBetween } from '@/utils/timeHelpers.js'

const props = defineProps({
    visible: {
        type: Boolean,
        default: false
    },
    assignment: {
        type: Object,
        default: null
    },
    shift: {
        type: Object,
        default: null
    },
    staffOptions: {
        type: Array,
        default: () => []
    },
    roleOptions: {
        type: Array,
        default: () => []
    }
})

const emit = defineEmits(['update:visible', 'success'])

const toast = useToast()
const formRef = ref(null)
const loading = ref(false)

const defaultForm = () => ({
    id: null,
    shiftId: props.shift?.id ?? null,
    userId: null,
    roleName: props.roleOptions?.[0]?.value ?? '',
    plannedStart: props.shift?.startTime?.slice(0, 5) ?? '08:00',
    plannedEnd: props.shift?.endTime?.slice(0, 5) ?? '12:00',
    plannedMinutes: 240,
    hourlyRate: props.shift?.defaultHourlyRate ?? 0,
    fixedAllowance: props.shift?.defaultFixedAllowance ?? 0,
    notes: ''
})

const formData = reactive(defaultForm())

const isEditMode = computed(() => Boolean(props.assignment?.id))

const formRules = {
    userId: [{ required: true, message: 'Chọn nhân viên', trigger: 'change' }],
    roleName: [{ required: true, message: 'Chọn vai trò', trigger: 'change' }],
    plannedStart: [{ required: true, message: 'Chọn giờ bắt đầu', trigger: 'change' }],
    plannedEnd: [{ required: true, message: 'Chọn giờ kết thúc', trigger: 'change' }],
    plannedMinutes: [{ required: true, message: 'Nhập số phút dự kiến', trigger: 'change' }],
    hourlyRate: [{ required: true, message: 'Nhập lương giờ', trigger: 'change' }]
}

const emitVisible = (value) => {
    emit('update:visible', value)
}

const resetForm = () => {
    Object.assign(formData, defaultForm())
    formRef.value?.clearValidate()
}

const populateForm = (assignment) => {
    if (!assignment) {
        resetForm()
        return
    }

    Object.assign(formData, {
        id: assignment.id ?? null,
        shiftId: assignment.shiftId ?? props.shift?.id ?? null,
        userId: assignment.userId ?? null,
        roleName: assignment.roleName ?? '',
        plannedStart: assignment.plannedStart?.slice(0, 5) ?? props.shift?.startTime?.slice(0, 5) ?? '08:00',
        plannedEnd: assignment.plannedEnd?.slice(0, 5) ?? props.shift?.endTime?.slice(0, 5) ?? '12:00',
        plannedMinutes: assignment.plannedMinutes ?? calculateDefaultMinutes(),
        hourlyRate: assignment.hourlyRate ?? props.shift?.defaultHourlyRate ?? 0,
        fixedAllowance: assignment.fixedAllowance ?? props.shift?.defaultFixedAllowance ?? 0,
        notes: assignment.notes ?? ''
    })
}

const calculateDefaultMinutes = () => {
    return calculateMinutesBetween(formData.plannedStart, formData.plannedEnd)
}

watch(
    () => props.assignment,
    (value) => {
        populateForm(value)
    },
    { immediate: true }
)

watch(
    () => props.shift,
    () => {
        if (!isEditMode.value) {
            resetForm()
        }
    }
)

watch(
    () => [formData.plannedStart, formData.plannedEnd],
    () => {
        const minutes = calculateMinutesBetween(formData.plannedStart, formData.plannedEnd)
        if (minutes > 0) {
            formData.plannedMinutes = minutes
        }
    }
)

const appendSeconds = (value) => {
    if (!value) return null
    return value.length === 8 ? value : `${value}:00`
}

const handleSubmit = () => {
    if (!formRef.value) return

    formRef.value.validate(async (valid) => {
        if (!valid) return

        loading.value = true

        const payload = {
            shiftId: formData.shiftId ?? props.shift?.id,
            userId: formData.userId,
            roleName: formData.roleName,
            plannedStart: appendSeconds(formData.plannedStart),
            plannedEnd: appendSeconds(formData.plannedEnd),
            plannedMinutes: formData.plannedMinutes,
            hourlyRate: formData.hourlyRate,
            fixedAllowance: formData.fixedAllowance,
            notes: formData.notes
        }

        try {
            if (isEditMode.value && formData.id) {
                await updateShiftAssignment(formData.id, payload)
                toast.success('Cập nhật phân công thành công')
            } else {
                await createShiftAssignment(payload)
                toast.success('Tạo phân công mới thành công')
            }
            emit('success')
            emitVisible(false)
        } catch (error) {
            const message =
                error.response?.data?.message ||
                (isEditMode.value ? 'Không thể cập nhật phân công' : 'Không thể tạo phân công')
            toast.error(message)
        } finally {
            loading.value = false
        }
    })
}
</script>

<style scoped>
.select-option {
    display: flex;
    flex-direction: column;
}

.select-option .name {
    font-weight: 600;
}

.select-option .roles {
    color: #909399;
}
</style>
