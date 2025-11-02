<template>
    <el-dialog :model-value="visible" @update:model-value="$emit('update:visible', $event)"
        title="Điều chỉnh Tồn kho (Kiểm kho)" width="500px" @close="onClose" :close-on-click-modal="false">
        <el-form ref="formRef" :model="formData" :rules="formRules" label-position="top" v-loading="loading">
            <el-form-item label="Nguyên vật liệu">
                <el-input :value="ingredient ? ingredient.name : ''" disabled />
            </el-form-item>

            <el-row :gutter="20">
                <el-col :span="12">
                    <el-form-item label="Số lượng tồn kho (cũ)">
                        <el-input :value="ingredient ? `${ingredient.quantityOnHand} ${ingredient.unit}` : ''"
                            disabled />
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="Số lượng MỚI (Thực tế)" prop="newQuantityOnHand">
                        <el-input-number v-model="formData.newQuantityOnHand" :min="0" :precision="3" class="w-100" />
                    </el-form-item>
                </el-col>
            </el-row>

            <el-form-item label="Lý do điều chỉnh" prop="reason">
                <el-input v-model="formData.reason" type="textarea" :rows="2"
                    placeholder="Ví dụ: Kiểm kho cuối ngày, Hư hỏng,..." />
            </el-form-item>

        </el-form>

        <template #footer>
            <span class="dialog-footer">
                <el-button @click="$emit('update:visible', false)">Hủy</el-button>
                <el-button type="primary" @click="submitForm" :loading="loading">
                    Xác nhận Điều chỉnh
                </el-button>
            </span>
        </template>
    </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import { adjustInventory } from '@/api/ingredientService'

const props = defineProps({
    visible: Boolean,
    ingredient: Object, // Dữ liệu nguyên vật liệu
})

const emit = defineEmits(['update:visible', 'success'])

const toast = useToast()
const formRef = ref(null)
const loading = ref(false)

// --- State cho Form ---
const defaultFormData = {
    newQuantityOnHand: 0,
    reason: '',
}
const formData = ref({ ...defaultFormData })

// --- Validation Rules ---
const formRules = {
    // DTO Validation
    newQuantityOnHand: [
        { required: true, message: 'Số lượng mới là bắt buộc', trigger: 'blur' },
        { type: 'number', min: 0, message: 'Số lượng phải >= 0', trigger: 'blur' }
    ],
    reason: [{ required: true, message: 'Lý do là bắt buộc', trigger: 'blur' }],
}

// --- Xử lý Form ---
const submitForm = async () => {
    if (!formRef.value) return

    await formRef.value.validate(async (valid) => {
        if (valid) {
            loading.value = true
            try {
                const adjustmentData = {
                    ingredientId: props.ingredient.id,
                    newQuantityOnHand: formData.value.newQuantityOnHand,
                    reason: formData.value.reason,
                }

                await adjustInventory(adjustmentData)
                toast.success(`Đã điều chỉnh tồn kho cho '${props.ingredient.name}'`)

                emit('success')
                emit('update:visible', false)

            } catch (error) {
                const msg = error.response?.data?.message || 'Lỗi khi điều chỉnh tồn kho'
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
        // Đổ số lượng TỒN KHO CŨ vào form
        formData.value = {
            newQuantityOnHand: newIngredient.quantityOnHand, // Mặc định là số lượng cũ
            reason: '',
        }
    } else {
        onClose()
    }
})
</script>

<style scoped>
.w-100 {
    width: 100%;
}
</style>