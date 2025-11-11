<template>
    <el-dialog :model-value="visible" @update:model-value="$emit('update:visible', $event)"
        :title="isEditMode ? 'Chỉnh sửa Danh mục' : 'Thêm Danh mục mới'" width="500px" @close="onClose"
        :close-on-click-modal="false">
        <el-form ref="formRef" :model="formData" :rules="formRules" label-position="top" v-loading="loading">
            <el-form-item label="Tên Danh mục" prop="name">
                <el-input v-model="formData.name" placeholder="Ví dụ: Cà Phê Truyền Thống" />
            </el-form-item>

            <el-form-item label="Mô tả" prop="description">
                <el-input v-model="formData.description" type="textarea" :rows="3"
                    placeholder="Mô tả ngắn về danh mục..." />
            </el-form-item>
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
import { createCategory, updateCategory } from '@/api/categoryService'

const props = defineProps({
    visible: Boolean,
    category: Object, // Dữ liệu danh mục (nếu là edit)
})

const emit = defineEmits(['update:visible', 'success'])

const toast = useToast()
const formRef = ref(null)
const loading = ref(false)

const defaultFormData = {
    name: '',
    description: '',
}
const formData = ref({ ...defaultFormData })

const isEditMode = computed(() => !!props.category)

const formRules = {
    name: [{ required: true, message: 'Tên danh mục là bắt buộc', trigger: 'blur' }],
}

const submitForm = async () => {
    if (!formRef.value) return

    await formRef.value.validate(async (valid) => {
        if (valid) {
            loading.value = true
            try {
                const categoryData = {
                    name: formData.value.name,
                    description: formData.value.description,
                }

                if (isEditMode.value) {
                                        await updateCategory(props.category.id, categoryData)
                    toast.success('Cập nhật danh mục thành công!')
                } else {
                                        await createCategory(categoryData)
                    toast.success('Tạo danh mục mới thành công!')
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

const onClose = () => {
    formData.value = { ...defaultFormData }
    formRef.value?.resetFields()
}

watch(() => props.category, (newCategory) => {
    if (newCategory) {
        formData.value = {
            name: newCategory.name,
            description: newCategory.description,
        }
    } else {

        onClose()
    }
})
</script>

<style scoped>
/* Không cần style scoped đặc biệt cho modal này */
</style>
