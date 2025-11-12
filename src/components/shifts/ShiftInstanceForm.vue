<template>
    <el-dialog
        :model-value="visible"
        @update:model-value="emitVisible"
        :title="isEditMode ? 'Chỉnh sửa ca làm' : 'Lên lịch ca mới'"
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
                    <el-form-item label="Ca mẫu" prop="templateId">
                        <el-select
                            v-model="formData.templateId"
                            placeholder="Chọn ca mẫu"
                            class="w-100"
                            filterable
                            :disabled="isEditMode"
                        >
                            <el-option
                                v-for="template in templateOptions"
                                :key="template.id"
                                :label="template.name"
                                :value="template.id"
                            >
                                <div class="template-option">
                                    <span class="template-name">{{ template.name }}</span>
                                    <small class="template-time">
                                        {{ formatTimeRange(template.startTime, template.endTime) }} ·
                                        {{ (template.requiredRoles || []).join(', ') || 'Không có vai trò' }}
                                    </small>
                                </div>
                            </el-option>
                        </el-select>
                    </el-form-item>
                </el-col>

                <el-col :span="isEditMode ? 12 : 24">
                    <el-form-item :label="isEditMode ? 'Ngày ca' : 'Chọn ngày'" :prop="isEditMode ? 'shiftDate' : 'dates'">
                        <template v-if="isEditMode">
                            <el-date-picker
                                v-model="formData.shiftDate"
                                type="date"
                                format="YYYY-MM-DD"
                                value-format="YYYY-MM-DD"
                                placeholder="Chọn ngày"
                                class="w-100"
                                :disabled="true"
                            />
                        </template>
                        <template v-else>
                            <el-date-picker
                                v-model="formData.dates"
                                type="dates"
                                format="YYYY-MM-DD"
                                value-format="YYYY-MM-DD"
                                placeholder="Chọn nhiều ngày"
                                class="w-100"
                            />
                        </template>
                    </el-form-item>
                </el-col>

                <template v-if="isEditMode">
                    <el-col :span="12">
                        <el-form-item label="Trạng thái hiện tại">
                            <el-tag :type="statusTag.type">{{ statusTag.label }}</el-tag>
                        </el-form-item>
                    </el-col>
                </template>

                <el-col :span="12">
                    <el-form-item label="Giờ bắt đầu" prop="startTime">
                        <el-time-select
                            v-model="formData.startTime"
                            start="00:00"
                            step="00:15"
                            end="23:45"
                            placeholder="08:00"
                            format="HH:mm"
                        />
                    </el-form-item>
                </el-col>

                <el-col :span="12">
                    <el-form-item label="Giờ kết thúc" prop="endTime">
                        <el-time-select
                            v-model="formData.endTime"
                            start="00:00"
                            step="00:15"
                            end="23:45"
                            placeholder="12:00"
                            format="HH:mm"
                        />
                    </el-form-item>
                </el-col>

                <el-col :span="24">
                    <el-form-item label="Ghi chú" prop="notes">
                        <el-input
                            v-model="formData.notes"
                            type="textarea"
                            :rows="3"
                            placeholder="Ghi chú nội bộ, ví dụ: Ca ưu tiên barista có kinh nghiệm"
                            maxlength="255"
                            show-word-limit
                        />
                    </el-form-item>
                </el-col>
            </el-row>
        </el-form>

        <template #footer>
            <div class="dialog-footer">
                <el-button @click="emitVisible(false)" :disabled="loading">Đóng</el-button>
                <el-button type="primary" @click="handleSubmit" :loading="loading">
                    {{ isEditMode ? 'Lưu thay đổi' : 'Lên lịch' }}
                </el-button>
            </div>
        </template>
    </el-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import {
    createShiftInstances,
    updateShiftInstance
} from '@/api/shiftManagementService.js'
import { SHIFT_STATUS_OPTIONS } from '@/constants/shift.js'

const props = defineProps({
    visible: {
        type: Boolean,
        default: false
    },
    instance: {
        type: Object,
        default: null
    },
    templateOptions: {
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
    templateId: null,
    dates: [],
    shiftDate: '',
    startTime: '08:00',
    endTime: '12:00',
    notes: '',
    status: 'PLANNED'
})

const formData = reactive(defaultForm())

const formRules = {
    templateId: [{ required: true, message: 'Vui lòng chọn ca mẫu', trigger: 'change' }],
    dates: [
        {
            validator: (rule, value, callback) => {
                if (!isEditMode.value && (!value || !value.length)) {
                    callback(new Error('Chọn ít nhất một ngày'))
                } else {
                    callback()
                }
            },
            trigger: 'change'
        }
    ],
    shiftDate: [
        {
            validator: (rule, value, callback) => {
                if (isEditMode.value && !value) {
                    callback(new Error('Ngày ca không hợp lệ'))
                } else {
                    callback()
                }
            },
            trigger: 'change'
        }
    ],
    startTime: [{ required: true, message: 'Chọn giờ bắt đầu', trigger: 'change' }],
    endTime: [{ required: true, message: 'Chọn giờ kết thúc', trigger: 'change' }]
}

const isEditMode = computed(() => Boolean(props.instance?.id))

const statusTag = computed(() => {
    const mapping = SHIFT_STATUS_OPTIONS.find((option) => option.value === formData.status)
    return mapping || { label: formData.status, type: 'info' }
})

const emitVisible = (value) => {
    emit('update:visible', value)
}

const resetForm = () => {
    Object.assign(formData, defaultForm())
    formRef.value?.clearValidate()
}

const populateForm = (instance) => {
    if (!instance) {
        resetForm()
        return
    }

    Object.assign(formData, {
        id: instance.id ?? null,
        templateId: instance.templateId ?? null,
        shiftDate: instance.shiftDate ?? '',
        startTime: instance.startTime?.slice(0, 5) ?? '08:00',
        endTime: instance.endTime?.slice(0, 5) ?? '12:00',
        notes: instance.notes ?? '',
        status: instance.status ?? 'PLANNED'
    })
}

watch(
    () => props.instance,
    (value) => {
        populateForm(value)
    },
    { immediate: true }
)

const formatTimeRange = (start, end) => {
    if (!start || !end) return 'Chưa đặt giờ'
    return `${start.slice(0,5)} - ${end.slice(0,5)}`
}

const handleSubmit = () => {
    if (!formRef.value) return

    formRef.value.validate(async (valid) => {
        if (!valid) return
        loading.value = true

        try {
            if (isEditMode.value && formData.id) {
                const payload = {
                    templateId: formData.templateId,
                    shiftDate: formData.shiftDate,
                    startTime: appendSeconds(formData.startTime),
                    endTime: appendSeconds(formData.endTime),
                    notes: formData.notes
                }
                await updateShiftInstance(formData.id, payload)
                toast.success('Đã cập nhật ca làm')
            } else {
                const payload = {
                    templateId: formData.templateId,
                    dates: (formData.dates || []).map((date) => date),
                    startTime: appendSeconds(formData.startTime),
                    endTime: appendSeconds(formData.endTime),
                    notes: formData.notes
                }
                await createShiftInstances(payload)
                toast.success('Đã tạo ca mới từ ca mẫu')
            }
            emit('success')
            emitVisible(false)
        } catch (error) {
            const message =
                error.response?.data?.message ||
                (isEditMode.value ? 'Không thể cập nhật ca làm' : 'Không thể tạo ca mới')
            toast.error(message)
        } finally {
            loading.value = false
        }
    })
}

const appendSeconds = (timeString) => {
    if (!timeString) return null
    return timeString.length === 8 ? timeString : `${timeString}:00`
}
</script>

<style scoped>
.template-option {
    display: flex;
    flex-direction: column;
}

.template-name {
    font-weight: 600;
}

.template-time {
    color: #909399;
}
</style>
