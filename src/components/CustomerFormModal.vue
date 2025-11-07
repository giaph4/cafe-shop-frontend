<template>
    <el-dialog :model-value="visible" @update:model-value="$emit('update:visible', $event)"
        :title="isEditMode ? 'Chỉnh sửa Khách hàng' : 'Thêm Khách hàng mới'" width="500px" @close="onClose"
        :close-on-click-modal="false">
        <el-form ref="formRef" :model="formData" :rules="formRules" label-position="top" v-loading="loading">
            <el-form-item label="Tên Khách hàng" prop="fullName">
                <el-input v-model="formData.fullName" placeholder="Ví dụ: Nguyễn Văn A" />
            </el-form-item>

            <el-form-item label="Số điện thoại" prop="phone">
                <el-input v-model="formData.phone" placeholder="Ví dụ: 0905123456" />
            </el-form-item>

            <el-form-item label="Email" prop="email">
                <el-input v-model="formData.email" placeholder="Ví dụ: email@example.com (Không bắt buộc)" />
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
import { createCustomer, updateCustomer } from '@/api/customerService'

const props = defineProps({
    visible: Boolean,
    customer: Object, // Dữ liệu khách hàng (nếu là edit)
})

const emit = defineEmits(['update:visible', 'success'])

const toast = useToast()
const formRef = ref(null)
const loading = ref(false)

const defaultFormData = {
    fullName: '',
    phone: '',
    email: '',
}
const formData = ref({ ...defaultFormData })

const isEditMode = computed(() => !!props.customer)

// Lấy regex SĐT từ CustomerDTO.java
const validatePhone = (rule, value, callback) => {
    const phoneRegex = /^(\+?84|0)\d{9}$/
    if (!value) {
        callback(new Error('Số điện thoại là bắt buộc'))
    } else if (!phoneRegex.test(value)) {
        callback(new Error('Định dạng SĐT Việt Nam không hợp lệ (0xxxxxxxxx)'))
    } else {
        callback()
    }
}

const formRules = {
    fullName: [{ required: true, message: 'Tên khách hàng là bắt buộc', trigger: 'blur' }],
    phone: [{ required: true, validator: validatePhone, trigger: 'blur' }],
    email: [{ type: 'email', message: 'Định dạng email không hợp lệ', trigger: 'blur' }],
}

const submitForm = async () => {
    if (!formRef.value) return

    await formRef.value.validate(async (valid) => {
        if (valid) {
            loading.value = true
            try {
                const customerData = {
                    fullName: formData.value.fullName,
                    phone: formData.value.phone,
                    // Gửi null nếu email rỗng, thay vì ""
                    email: formData.value.email || null,
                }

                if (isEditMode.value) {
                                        // API backend sẽ kiểm tra SĐT/Email trùng lặp
                    await updateCustomer(props.customer.id, customerData)
                    toast.success('Cập nhật khách hàng thành công!')
                } else {
                                        await createCustomer(customerData)
                    toast.success('Tạo khách hàng mới thành công!')
                }

                emit('success')
                emit('update:visible', false)

            } catch (error) {
                // Bắt lỗi 400 (IllegalArgumentException) nếu SĐT/Email trùng
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

watch(() => props.customer, (newCustomer) => {
    if (newCustomer) {
        // Đang Edit: Đổ dữ liệu vào form
        formData.value = {
            fullName: newCustomer.fullName,
            phone: newCustomer.phone,
            email: newCustomer.email,
        }
    } else {
        // Đang Thêm mới: Reset form
        onClose()
    }
})
</script>
