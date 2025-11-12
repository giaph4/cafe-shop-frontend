<template>
    <el-dialog
        :model-value="visible"
        @update:model-value="emitVisible"
        :title="isEditMode ? 'Chỉnh sửa ca mẫu' : 'Tạo ca mẫu mới'"
        width="560px"
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
                    <el-form-item label="Tên ca" prop="name">
                        <el-input v-model="formData.name" placeholder="Ca sáng" maxlength="100" show-word-limit />
                    </el-form-item>
                </el-col>

                <el-col :span="24">
                    <el-form-item label="Mô tả" prop="description">
                        <el-input
                            v-model="formData.description"
                            type="textarea"
                            :rows="3"
                            placeholder="Mô tả ngắn gọn nhiệm vụ của ca..."
                            maxlength="255"
                            show-word-limit
                        />
                    </el-form-item>
                </el-col>

                <el-col :span="12">
                    <el-form-item label="Giờ bắt đầu" prop="startTime">
                        <el-time-select
                            v-model="formData.startTime"
                            start="00:00"
                            step="00:15"
                            end="23:45"
                            placeholder="07:00"
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
                            placeholder="11:00"
                            format="HH:mm"
                        />
                    </el-form-item>
                </el-col>

                <el-col :span="24">
                    <el-form-item label="Vai trò yêu cầu" prop="requiredRoles">
                        <el-select
                            v-model="formData.requiredRoles"
                            placeholder="Chọn vai trò phù hợp"
                            class="w-100"
                            multiple
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
                    <el-form-item label="Lương giờ mặc định (VND)" prop="defaultHourlyRate">
                        <el-input-number
                            v-model="formData.defaultHourlyRate"
                            :min="0"
                            :step="1000"
                            class="w-100"
                            controls-position="right"
                        />
                    </el-form-item>
                </el-col>

                <el-col :span="12">
                    <el-form-item label="Phụ cấp cố định (VND)" prop="defaultFixedAllowance">
                        <el-input-number
                            v-model="formData.defaultFixedAllowance"
                            :min="0"
                            :step="1000"
                            class="w-100"
                            controls-position="right"
                        />
                    </el-form-item>
                </el-col>
            </el-row>
        </el-form>

        <template #footer>
            <div class="dialog-footer">
                <el-button @click="emitVisible(false)" :disabled="loading">Đóng</el-button>
                <el-button type="primary" @click="handleSubmit" :loading="loading">
                    {{ isEditMode ? 'Lưu thay đổi' : 'Tạo mới' }}
                </el-button>
            </div>
        </template>
    </el-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import {
    createShiftTemplate,
    updateShiftTemplate
} from '@/api/shiftManagementService.js'

const props = defineProps({
    visible: {
        type: Boolean,
        default: false
    },
    template: {
        type: Object,
        default: null
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
    name: '',
    description: '',
    startTime: '08:00',
    endTime: '12:00',
    requiredRoles: [],
    defaultHourlyRate: 0,
    defaultFixedAllowance: 0
})

const formData = reactive(defaultForm())

const formRules = {
    name: [{ required: true, message: 'Vui lòng nhập tên ca', trigger: 'blur' }],
    startTime: [{ required: true, message: 'Chọn giờ bắt đầu', trigger: 'change' }],
    endTime: [{ required: true, message: 'Chọn giờ kết thúc', trigger: 'change' }],
    requiredRoles: [{ type: 'array', required: true, message: 'Chọn ít nhất 1 vai trò', trigger: 'change' }]
}

const isEditMode = computed(() => Boolean(props.template?.id))

const emitVisible = (value) => {
    emit('update:visible', value)
}

const resetForm = () => {
    Object.assign(formData, defaultForm())
    formRef.value?.clearValidate()
}

const populateForm = (template) => {
    if (!template) {
        resetForm()
        return
    }

    Object.assign(formData, {
        id: template.id ?? null,
        name: template.name ?? '',
        description: template.description ?? '',
        startTime: template.startTime?.slice(0,5) ?? '08:00',
        endTime: template.endTime?.slice(0,5) ?? '12:00',
        requiredRoles: Array.isArray(template.requiredRoles) ? [...template.requiredRoles] : [],
        defaultHourlyRate: template.defaultHourlyRate ?? 0,
        defaultFixedAllowance: template.defaultFixedAllowance ?? 0
    })
}

watch(
    () => props.template,
    (value) => {
        populateForm(value)
    },
    { immediate: true }
)

const handleSubmit = () => {
    if (!formRef.value) return

    formRef.value.validate(async (valid) => {
        if (!valid) return
        loading.value = true

        const payload = {
            name: formData.name,
            description: formData.description,
            startTime: appendSeconds(formData.startTime),
            endTime: appendSeconds(formData.endTime),
            requiredRoles: formData.requiredRoles,
            defaultHourlyRate: formData.defaultHourlyRate,
            defaultFixedAllowance: formData.defaultFixedAllowance
        }

        try {
            if (isEditMode.value && formData.id) {
                await updateShiftTemplate(formData.id, payload)
                toast.success('Đã cập nhật ca mẫu thành công')
            } else {
                await createShiftTemplate(payload)
                toast.success('Đã tạo ca mẫu mới')
            }
            emit('success')
            emitVisible(false)
        } catch (error) {
            const message =
                error.response?.data?.message ||
                (isEditMode.value ? 'Không thể cập nhật ca mẫu' : 'Không thể tạo ca mẫu')
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
