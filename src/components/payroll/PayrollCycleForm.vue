<template>
    <el-dialog
        :model-value="visible"
        @update:model-value="emitVisible"
        :title="isEditMode ? 'Cập nhật chu kỳ lương' : 'Tạo chu kỳ lương'"
        width="560px"
        :close-on-click-modal="false"
        destroy-on-close
        @closed="handleClosed"
    >
        <el-form
            ref="formRef"
            :model="formData"
            :rules="formRules"
            label-position="top"
            class="payroll-cycle-form"
            v-loading="loading"
        >
            <el-row :gutter="20">
                <el-col :span="12">
                    <el-form-item label="Mã chu kỳ" prop="code">
                        <el-input
                            v-model="formData.code"
                            placeholder="JAN_2025"
                            maxlength="30"
                            show-word-limit
                        />
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="Tên chu kỳ" prop="name">
                        <el-input
                            v-model="formData.name"
                            placeholder="Lương tháng 01/2025"
                            maxlength="120"
                            show-word-limit
                        />
                    </el-form-item>
                </el-col>

                <el-col :span="24">
                    <el-form-item label="Khoảng thời gian" prop="dateRange">
                        <el-date-picker
                            v-model="formData.dateRange"
                            type="daterange"
                            unlink-panels
                            value-format="YYYY-MM-DD"
                            start-placeholder="Từ ngày"
                            end-placeholder="Đến ngày"
                            class="w-100"
                        />
                    </el-form-item>
                </el-col>

                <el-col :span="12">
                    <el-form-item label="Trạng thái" prop="status">
                        <el-select v-model="formData.status" class="w-100" :disabled="!isEditMode">
                            <el-option
                                v-for="option in statusOptions"
                                :key="option.value"
                                :label="option.label"
                                :value="option.value"
                            />
                        </el-select>
                    </el-form-item>
                </el-col>

                <el-col :span="12" v-if="isEditMode">
                    <el-form-item label="Ghi chú" prop="notes">
                        <el-input
                            v-model="formData.notes"
                            placeholder="Ghi chú tùy chọn"
                            maxlength="255"
                            show-word-limit
                        />
                    </el-form-item>
                </el-col>

                <el-col :span="24" v-else>
                    <el-form-item label="Ghi chú" prop="notes">
                        <el-input
                            v-model="formData.notes"
                            type="textarea"
                            :rows="3"
                            maxlength="255"
                            show-word-limit
                            placeholder="Ghi chú tùy chọn"
                        />
                    </el-form-item>
                </el-col>
            </el-row>
        </el-form>

        <template #footer>
            <div class="dialog-footer">
                <el-button @click="emitVisible(false)" :disabled="loading">Hủy</el-button>
                <el-button type="primary" @click="handleSubmit" :loading="loading">
                    {{ isEditMode ? 'Cập nhật' : 'Tạo mới' }}
                </el-button>
            </div>
        </template>
    </el-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import {
    createPayrollCycle,
    updatePayrollCycle
} from '@/api/payrollService.js'
import { PAYROLL_CYCLE_STATUS_OPTIONS } from '@/constants/payroll.js'

const props = defineProps({
    visible: {
        type: Boolean,
        default: false
    },
    cycle: {
        type: Object,
        default: null
    }
})

const emit = defineEmits(['update:visible', 'success'])

const toast = useToast()
const formRef = ref(null)
const loading = ref(false)

const defaultForm = () => ({
    id: null,
    code: '',
    name: '',
    dateRange: [],
    status: 'DRAFT',
    notes: ''
})

const formData = reactive(defaultForm())

const statusOptions = PAYROLL_CYCLE_STATUS_OPTIONS
const isEditMode = computed(() => Boolean(props.cycle?.id))

const formRules = {
    code: [
        { required: true, message: 'Nhập mã chu kỳ', trigger: 'blur' },
        { min: 3, message: 'Ít nhất 3 ký tự', trigger: 'blur' }
    ],
    name: [
        { required: true, message: 'Nhập tên chu kỳ', trigger: 'blur' }
    ],
    dateRange: [
        { required: true, message: 'Chọn khoảng thời gian', trigger: 'change' },
        {
            validator: (_, value, callback) => {
                if (!value || value.length !== 2) {
                    callback(new Error('Chọn đầy đủ ngày bắt đầu và kết thúc'))
                    return
                }
                if (value[0] > value[1]) {
                    callback(new Error('Ngày bắt đầu phải trước ngày kết thúc'))
                    return
                }
                callback()
            },
            trigger: 'change'
        }
    ],
    status: [
        { required: true, message: 'Chọn trạng thái', trigger: 'change' }
    ]
}

const resetForm = () => {
    Object.assign(formData, defaultForm())
    formRef.value?.clearValidate?.()
}

const populateForm = (cycle) => {
    if (!cycle) {
        resetForm()
        return
    }
    Object.assign(formData, {
        id: cycle.id ?? null,
        code: cycle.code ?? '',
        name: cycle.name ?? '',
        dateRange: [cycle.startDate, cycle.endDate].filter(Boolean),
        status: cycle.status ?? 'DRAFT',
        notes: cycle.notes ?? ''
    })
}

watch(
    () => props.cycle,
    (value) => {
        populateForm(value)
    },
    { immediate: true }
)

const emitVisible = (value) => {
    emit('update:visible', value)
}

const handleClosed = () => {
    resetForm()
}

const buildPayload = () => ({
    code: formData.code?.trim(),
    name: formData.name?.trim(),
    startDate: formData.dateRange?.[0] ?? null,
    endDate: formData.dateRange?.[1] ?? null,
    status: formData.status,
    notes: formData.notes?.trim() || null
})

const handleSubmit = () => {
    if (!formRef.value) return

    formRef.value.validate(async (valid) => {
        if (!valid) return

        loading.value = true
        const payload = buildPayload()

        try {
            if (isEditMode.value && formData.id) {
                await updatePayrollCycle(formData.id, payload)
                toast.success('Cập nhật chu kỳ thành công')
            } else {
                await createPayrollCycle(payload)
                toast.success('Tạo chu kỳ mới thành công')
            }
            emit('success')
            emitVisible(false)
        } catch (error) {
            const message = error.response?.data?.message || 'Không thể lưu chu kỳ lương'
            toast.error(message)
        } finally {
            loading.value = false
        }
    })
}
</script>

<style scoped>
.payroll-cycle-form {
    margin-top: 4px;
}

.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
}
</style>
