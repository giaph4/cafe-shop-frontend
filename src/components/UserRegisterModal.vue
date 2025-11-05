<template>
    <el-dialog
        v-model="dialogVisible"
        title="Đăng ký Nhân viên Mới"
        width="500px"
        :before-close="handleClose"
    >
        <el-form
            ref="formRef"
            :model="formData"
            :rules="rules"
            label-width="120px"
            @submit.prevent="submitForm"
        >
            <el-form-item label="Tên đăng nhập" prop="username">
                <el-input v-model="formData.username" placeholder="Nhập tên đăng nhập"></el-input>
            </el-form-item>
            <el-form-item label="Mật khẩu" prop="password">
                <el-input type="password" v-model="formData.password" placeholder="Nhập mật khẩu" show-password></el-input>
            </el-form-item>
            <el-form-item label="Họ và tên" prop="fullName">
                <el-input v-model="formData.fullName" placeholder="Nhập họ và tên"></el-input>
            </el-form-item>
            <el-form-item label="Email" prop="email">
                <el-input v-model="formData.email" placeholder="Nhập email"></el-input>
            </el-form-item>
            <el-form-item label="Số điện thoại" prop="phone">
                <el-input v-model="formData.phone" placeholder="Nhập số điện thoại"></el-input>
            </el-form-item>
        </el-form>
        <template #footer>
            <span class="dialog-footer">
                <el-button @click="handleClose">Hủy</el-button>
                <el-button type="primary" @click="submitForm" :loading="loading">
                    Đăng ký
                </el-button>
            </span>
        </template>
    </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import { registerUser } from '@/api/userService'

const props = defineProps({
    visible: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['update:visible', 'success'])

const toast = useToast()
const formRef = ref(null)
const loading = ref(false)

const formData = ref({
    username: '',
    password: '',
    fullName: '',
    email: '',
    phone: ''
})

const rules = ref({
    username: [
        { required: true, message: 'Tên đăng nhập không được để trống', trigger: 'blur' },
        { min: 3, message: 'Tên đăng nhập phải có ít nhất 3 ký tự', trigger: 'blur' }
    ],
    password: [
        { required: true, message: 'Mật khẩu không được để trống', trigger: 'blur' },
        { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự', trigger: 'blur' }
    ],
    fullName: [
        { required: true, message: 'Họ và tên không được để trống', trigger: 'blur' }
    ],
    email: [
        { required: true, message: 'Email không được để trống', trigger: 'blur' },
        { type: 'email', message: 'Email không hợp lệ', trigger: ['blur', 'change'] }
    ],
    phone: [
        { required: true, message: 'Số điện thoại không được để trống', trigger: 'blur' },
        { pattern: /^\d{10,11}$/, message: 'Số điện thoại không hợp lệ', trigger: 'blur' }
    ]
})

const dialogVisible = ref(props.visible)

watch(() => props.visible, (newVal) => {
    dialogVisible.value = newVal
    if (newVal) {
        resetForm()
    }
})

watch(dialogVisible, (newVal) => {
    emit('update:visible', newVal)
})

const handleClose = () => {
    dialogVisible.value = false
    resetForm()
}

const submitForm = async () => {
    if (!formRef.value) return
    await formRef.value.validate(async (valid) => {
        if (valid) {
            loading.value = true
            try {
                await registerUser(formData.value)
                toast.success('Đăng ký nhân viên thành công!')
                emit('success')
                handleClose()
            } catch (error) {
                const errorMessage = error.response?.data?.message || 'Đăng ký nhân viên thất bại.'
                toast.error(errorMessage)
            } finally {
                loading.value = false
            }
        }
    })
}

const resetForm = () => {
    if (formRef.value) {
        formRef.value.resetFields()
    }
    formData.value = {
        username: '',
        password: '',
        fullName: '',
        email: '',
        phone: ''
    }
}
</script>

<style scoped>
/* Có thể thêm style riêng cho modal nếu cần */
</style>
