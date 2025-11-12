<template>
    <el-dialog
        :model-value="visible"
        @update:model-value="emitVisible"
        title="Thưởng / Phạt"
        width="480px"
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
            <el-form-item label="Loại điều chỉnh" prop="type">
            <el-radio-group v-model="formData.type">
                <el-radio-button label="BONUS">Thưởng</el-radio-button>
                <el-radio-button label="PENALTY">Phạt</el-radio-button>
            </el-radio-group>
        </el-form-item>

            <el-form-item label="Số tiền (VND)" prop="amount">
                <el-input-number
                    v-model="formData.amount"
                    :min="0"
                    :step="1000"
                    class="w-100"
                    controls-position="right"
                />
            </el-form-item>

            <el-form-item label="Lý do" prop="reason">
                <el-input
                    v-model="formData.reason"
                    type="textarea"
                    :rows="3"
                    maxlength="255"
                    show-word-limit
                    placeholder="Ghi rõ lý do thưởng/phạt"
                />
            </el-form-item>
        </el-form>

        <template #footer>
            <div class="dialog-footer">
                <el-button @click="emitVisible(false)" :disabled="loading">Đóng</el-button>
                <el-button type="primary" @click="handleSubmit" :loading="loading">
                    Xác nhận
                </el-button>
            </div>
        </template>
    </el-dialog>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { useToast } from 'vue-toastification'
import { createShiftAdjustment } from '@/api/shiftManagementService.js'

const props = defineProps({
    visible: {
        type: Boolean,
        default: false
    },
    assignmentId: {
        type: Number,
        required: true
    },
    defaultType: {
        type: String,
        default: 'BONUS'
    }
})

const emit = defineEmits(['update:visible', 'success'])

const toast = useToast()
const formRef = ref(null)
const loading = ref(false)

const defaultForm = () => ({
    type: props.defaultType,
    amount: 0,
    reason: ''
})

const formData = reactive(defaultForm())

const formRules = {
    type: [{ required: true, message: 'Chọn loại điều chỉnh', trigger: 'change' }],
    amount: [{ required: true, message: 'Nhập số tiền', trigger: 'change' }],
    reason: [{ required: true, message: 'Nhập lý do', trigger: 'blur' }]
}

const emitVisible = (value) => {
    emit('update:visible', value)
}

const resetForm = () => {
    Object.assign(formData, defaultForm())
    formRef.value?.clearValidate()
}

watch(
    () => props.visible,
    (isVisible) => {
        if (!isVisible) {
            resetForm()
        }
    }
)

const handleSubmit = () => {
    if (!formRef.value) return

    formRef.value.validate(async (valid) => {
        if (!valid) return

        loading.value = true
        try {
            await createShiftAdjustment({
                assignmentId: props.assignmentId,
                type: formData.type,
                amount: formData.amount,
                reason: formData.reason
            })
            toast.success('Thao tác thành công')
            emit('success')
            emitVisible(false)
        } catch (error) {
            const message = error.response?.data?.message || 'Không thể tạo thưởng/phạt'
            toast.error(message)
        } finally {
            loading.value = false
        }
    })
}
</script>
