<template>
    <el-dialog :model-value="visible" @update:model-value="$emit('update:visible', $event)"
        :title="isEditMode ? 'Chỉnh sửa Bàn' : 'Thêm Bàn mới'" width="400px" @close="onClose"
        :close-on-click-modal="false">
        <el-form ref="formRef" :model="formData" :rules="formRules" label-position="top" v-loading="loading">
            <el-form-item label="Tên Bàn" prop="name">
                <el-input v-model="formData.name" placeholder="Ví dụ: Bàn A1, Tầng 2" />
            </el-form-item>

            <el-form-item label="Sức chứa (số người)" prop="capacity">
                <el-input-number v-model="formData.capacity" :min="1" class="w-100" />
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
import { createTable, updateTable } from '@/api/tableService'

const props = defineProps({
    visible: Boolean,
    table: Object, // Dữ liệu bàn (nếu là edit)
})

const emit = defineEmits(['update:visible', 'success'])

const toast = useToast()
const formRef = ref(null)
const loading = ref(false)

const defaultFormData = {
    name: '',
    capacity: 2,
}
const formData = ref({ ...defaultFormData })

const isEditMode = computed(() => !!props.table)

const formRules = {
    name: [{ required: true, message: 'Tên bàn là bắt buộc', trigger: 'blur' }],
    capacity: [
        { required: true, message: 'Sức chứa là bắt buộc', trigger: 'blur' },
        // Kiểm tra validation từ DTO (Min(1))
        { type: 'number', min: 1, message: 'Sức chứa phải ít nhất là 1', trigger: 'blur' }
    ],
}

const submitForm = async () => {
    if (!formRef.value) return

    await formRef.value.validate(async (valid) => {
        if (valid) {
            loading.value = true
            try {
                const tableData = {
                    name: formData.value.name,
                    capacity: formData.value.capacity,
                }

                if (isEditMode.value) {
                                        await updateTable(props.table.id, tableData)
                    toast.success('Cập nhật bàn thành công!')
                } else {
                                        await createTable(tableData)
                    toast.success('Tạo bàn mới thành công!')
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

watch(() => props.table, (newTable) => {
    if (newTable) {
        // Đang Edit: Đổ dữ liệu vào form
        formData.value = {
            name: newTable.name,
            capacity: newTable.capacity,
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
