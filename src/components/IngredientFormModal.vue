<template>
    <el-dialog :model-value="visible" @update:model-value="$emit('update:visible', $event)"
        :title="isEditMode ? 'Chỉnh sửa Nguyên vật liệu' : 'Thêm Nguyên vật liệu mới'" width="500px" @close="onClose"
        :close-on-click-modal="false">
        <el-form ref="formRef" :model="formData" :rules="formRules" label-position="top" v-loading="loading">
            <el-form-item label="Tên Nguyên vật liệu" prop="name">
                <el-input v-model="formData.name" placeholder="Ví dụ: Hạt cà phê Robusta" />
            </el-form-item>

            <el-row :gutter="20">
                <el-col :span="12">
                    <el-form-item label="Đơn vị tính" prop="unit">
                        <el-input v-model="formData.unit" placeholder="kg, gram, lít, ml, cái..." />
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="Ngưỡng cảnh báo tồn kho" prop="reorderLevel">
                        <el-input-number v-model="formData.reorderLevel" :min="0" class="w-100" />
                    </el-form-item>
                </el-col>
            </el-row>

        </el-form>

        <template #footer>
            <span class="dialog-footer">
                <el-button @click="$emit('update:visible', false)">Hủy</el-button>
                <el-button type="primary" @click="submitForm" :loading="loading">
                    {{ isEditMode ? 'Lưu thay đổi' : 'Tạo mới' }}
                </el-button>
            </span>
        </template>
    </el-dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useToast } from 'vue-toastification'
import { createIngredient, updateIngredient } from '@/api/ingredientService'

const props = defineProps({
    visible: Boolean,
    ingredient: Object, // Dữ liệu (nếu là edit)
})

const emit = defineEmits(['update:visible', 'success'])

const toast = useToast()
const formRef = ref(null)
const loading = ref(false)

// --- State cho Form ---
const defaultFormData = {
    name: '',
    unit: 'kg', // Mặc định
    reorderLevel: 0,
}
const formData = ref({ ...defaultFormData })

// --- Kiểm tra Chế độ (Thêm mới / Chỉnh sửa) ---
const isEditMode = computed(() => !!props.ingredient)

// --- Validation Rules ---
const formRules = {
    name: [{ required: true, message: 'Tên nguyên vật liệu là bắt buộc', trigger: 'blur' }],
    unit: [{ required: true, message: 'Đơn vị tính là bắt buộc', trigger: 'blur' }],
    reorderLevel: [
        { required: true, message: 'Ngưỡng cảnh báo là bắt buộc', trigger: 'blur' },
        // DTO Validation
        { type: 'number', min: 0, message: 'Ngưỡng phải >= 0', trigger: 'blur' }
    ],
}

// --- Xử lý Form ---
const submitForm = async () => {
    if (!formRef.value) return

    await formRef.value.validate(async (valid) => {
        if (valid) {
            loading.value = true
            try {
                const ingredientData = {
                    name: formData.value.name,
                    unit: formData.value.unit,
                    reorderLevel: formData.value.reorderLevel,
                }

                if (isEditMode.value) {
                    // --- Chế độ Sửa ---
                    await updateIngredient(props.ingredient.id, ingredientData)
                    toast.success('Cập nhật thông tin thành công!')
                } else {
                    // --- Chế độ Thêm mới ---
                    await createIngredient(ingredientData)
                    toast.success('Tạo nguyên vật liệu mới thành công!')
                }

                emit('success')
                emit('update:visible', false)

            } catch (error) {
                // Bắt lỗi 400 (IllegalArgumentException) nếu tên trùng
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

// --- Theo dõi khi props.ingredient thay đổi ---
watch(() => props.ingredient, (newIngredient) => {
    if (newIngredient) {
        // Đang Edit: Đổ dữ liệu vào form
        formData.value = {
            name: newIngredient.name,
            unit: newIngredient.unit,
            reorderLevel: newIngredient.reorderLevel,
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