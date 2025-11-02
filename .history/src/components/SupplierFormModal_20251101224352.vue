<template>
    <el-dialog
      :model-value="visible"
      @update:model-value="$emit('update:visible', $event)"
      :title="isEditMode ? 'Chỉnh sửa Nhà cung cấp' : 'Thêm Nhà cung cấp mới'"
      width="500px"
      @close="onClose"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-position="top"
        v-loading="loading"
      >
        <el-form-item label="Tên Nhà cung cấp" prop="name">
          <el-input v-model="formData.name" placeholder="Ví dụ: Nông trại Cà phê Ban Mê" />
        </el-form-item>
  
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Người liên hệ" prop="contactPerson">
              <el-input v-model="formData.contactPerson" placeholder="Ví dụ: Anh Tuấn" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Số điện thoại" prop="phone">
              <el-input v-model="formData.phone" placeholder="Ví dụ: 0905123456" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="Email" prop="email">
          <el-input v-model="formData.email" placeholder="Ví dụ: info@banme.com (Không bắt buộc)" />
        </el-form-item>
  
        <el-form-item label="Địa chỉ" prop="address">
          <el-input
            v-model="formData.address"
            type="textarea"
            :rows="2"
            placeholder="Ví dụ: 123 Nguyễn Huệ, Q1, TP. HCM"
          />
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
  import { createSupplier, updateSupplier } from '@/api/supplierService'
  
  const props = defineProps({
    visible: Boolean,
    supplier: Object, // Dữ liệu (nếu là edit)
  })
  
  const emit = defineEmits(['update:visible', 'success'])
  
  const toast = useToast()
  const formRef = ref(null)
  const loading = ref(false)
  
  // --- State cho Form ---
  const defaultFormData = {
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
  }
  const formData = ref({ ...defaultFormData })
  
  // --- Kiểm tra Chế độ (Thêm mới / Chỉnh sửa) ---
  const isEditMode = computed(() => !!props.supplier)
  
  // --- Validation Rules ---
  // (Sử dụng regex SĐT giống Customer để đảm bảo UX)
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
    name: [{ required: true, message: 'Tên nhà cung cấp là bắt buộc', trigger: 'blur' }],
    phone: [{ required: true, validator: validatePhone, trigger: 'blur' }],
    email: [{ type: 'email', message: 'Định dạng email không hợp lệ', trigger: 'blur' }],
  }
  
  // --- Xử lý Form ---
  const submitForm = async () => {
    if (!formRef.value) return
    
    await formRef.value.validate(async (valid) => {
      if (valid) {
        loading.value = true
        try {
          const supplierData = {
            name: formData.value.name,
            contactPerson: formData.value.contactPerson,
            phone: formData.value.phone,
            email: formData.value.email || null, // Gửi null nếu rỗng
            address: formData.value.address,
          }
          
          if (isEditMode.value) {
            // --- Chế độ Sửa ---
            await updateSupplier(props.supplier.id, supplierData)
            toast.success('Cập nhật nhà cung cấp thành công!')
          } else {
            // --- Chế độ Thêm mới ---
            await createSupplier(supplierData)
            toast.success('Tạo nhà cung cấp mới thành công!')
          }
          
          emit('success')
          emit('update:visible', false)
          
        } catch (error) {
          // Bắt lỗi 400 (IllegalArgumentException) nếu Tên/SĐT trùng
          //
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
  
  // --- Theo dõi khi props.supplier thay đổi ---
  watch(() => props.supplier, (newSupplier) => {
    if (newSupplier) {
      // Đang Edit: Đổ dữ liệu vào form
      formData.value = {
        name: newSupplier.name,
        contactPerson: newSupplier.contactPerson,
        phone: newSupplier.phone,
        email: newSupplier.email,
        address: newSupplier.address,
      }
    } else {
      // Đang Thêm mới: Reset form
      onClose()
    }
  })
  </script>