<template>
    <el-dialog :model-value="visible" @update:model-value="$emit('update:visible', $event)"
        :title="isEditMode ? 'Chỉnh sửa Chi phí' : 'Ghi nhận Chi phí mới'" width="500px" @close="onClose"
        :close-on-click-modal="false">
        <el-form ref="formRef" :model="formData" :rules="formRules" label-position="top" v-loading="loading">
            <el-row :gutter="20">
                <el-col :span="12">
                    <el-form-item label="Loại chi phí" prop="category">
                        <el-select v-model="formData.category" placeholder="Chọn loại chi phí" class="w-100">
                            <el-option label="Tiện ích (Điện, nước...)" value="UTILITY" />
                            <el-option label="Trả lương" value="SALARY" />
                            <el-option label="Thuê mặt bằng" value="RENT" />
                            <el-option label="Marketing" value="MARKETING" />
                            <el-option label="Nhập nguyên vật liệu" value="INGREDIENT_PURCHASE" />
                            <el-option label="Khác" value="OTHER" />
                        </el-select>
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="Ngày chi" prop="expenseDate">
                        <el-date-picker v-model="formData.expenseDate" type="date" placeholder="Chọn ngày" class="w-100"
                            format="YYYY-MM-DD" value-format="YYYY-MM-DD" />
                    </el-form-item>
                </el-col>
            </el-row>

            <el-form-item label="Số tiền (VND)" prop="amount">
                <el-input-number v-model="formData.amount" :min="0" :step="10000" class="w-100" />
            </el-form-item>

            <el-form-item label="Mô tả chi tiết" prop="description">
                <el-input v-model="formData.description" type="textarea" :rows="3"
                    placeholder="Ví dụ: Tiền điện tháng 10" />
            </el-form-item>

        </el-form>

        <template #footer>
            <span class-="dialog-footer">
                <el-button @click="$emit('update:visible', false)">Hủy</el-button>
                <el-button type="primary" @click="submitForm" :loading="loading">
                    {{ isEditMode ? 'Lưu thay đổi' : 'Ghi nhận' }}
                </el-button>
            </span>
        </template>
    </el-dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useToast } from 'vue-toastification'
import { createExpense, updateExpense } from '@/api/expenseService'
import { formatDateISO } from '@/utils/formatters' // Dùng để format ngày

const props = defineProps({
    visible: Boolean,
    expense: Object, // Dữ liệu (nếu là edit)
})

const emit = defineEmits(['update:visible', 'success'])

const toast = useToast()
const formRef = ref(null)
const loading = ref(false)

// --- State cho Form ---
const defaultFormData = {
    category: null,
    amount: 0,
    description: '',
    expenseDate: formatDateISO(new Date()), // Mặc định là hôm nay
}
const formData = ref({ ...defaultFormData })

// --- Kiểm tra Chế độ (Thêm mới / Chỉnh sửa) ---
const isEditMode = computed(() => !!props.expense)

// --- Validation Rules ---
// Dựa trên ExpenseDTO.java
const formRules = {
    category: [{ required: true, message: 'Loại chi phí là bắt buộc', trigger: 'change' }],
    amount: [
        { required: true, message: 'Số tiền là bắt buộc', trigger: 'blur' },
        { type: 'number', min: 1, message: 'Số tiền phải > 0', trigger: 'blur' }
    ],
    expenseDate: [{ required: true, message: 'Ngày chi là bắt buộc', trigger: 'change' }],
}

// --- Xử lý Form ---
const submitForm = async () => {
    if (!formRef.value) return

    await formRef.value.validate(async (valid) => {
        if (valid) {
            loading.value = true
            try {
                const expenseData = {
                    category: formData.value.category,
                    amount: formData.value.amount,
                    description: formData.value.description,
                    expenseDate: formData.value.expenseDate,
                }

                if (isEditMode.value) {
                    // --- Chế độ Sửa ---
                    await updateExpense(props.expense.id, expenseData)
                    toast.success('Cập nhật chi phí thành công!')
                } else {
                    // --- Chế độ Thêm mới ---
                    await createExpense(expenseData)
                    toast.success('Ghi nhận chi phí mới thành công!')
                }

                emit('success')
                emit('update:visible', false)

            } catch (error) {
                const msg = error.response?.data?.message || (isEditMode.value ? 'Lỗi khi cập nhật' : 'Lỗi khi tạo mới')
                toast.error(msg)
            } finally {
                loading.value = false
            }
        }
    })
}

// --- Reset Form khi đóng ---
const onClose = () => {
    formData.value = { ...defaultFormData }
    formRef.value?.resetFields()
}

// --- Theo dõi khi props.expense thay đổi ---
watch(() => props.expense, (newExpense) => {
    if (newExpense) {
        // Đang Edit: Đổ dữ liệu vào form
        formData.value = {
            category: newExpense.category,
            amount: newExpense.amount,
            description: newExpense.description,
            expenseDate: newExpense.expenseDate, // DTO dùng LocalDate (string "YYYY-MM-DD")
        }
    } else {
        // Đang Thêm mới: Reset form
        onClose()
    }
})
</script>

<style scoped>
.w-100 {
    width: 100%;
}
</style>