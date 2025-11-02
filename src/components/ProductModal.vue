<template>
    <el-dialog :model-value="visible" @update:model-value="$emit('update:visible', $event)"
        :title="isEditMode ? 'Chỉnh sửa Sản phẩm' : 'Thêm Sản phẩm mới'" width="600px" @close="onClose">
        <el-form ref="formRef" :model="formData" :rules="formRules" label-position="top" v-loading="loading">
            <el-row :gutter="20">
                <el-col :span="14">
                    <el-form-item label="Tên Sản phẩm" prop="name">
                        <el-input v-model="formData.name" placeholder="Cà phê sữa" />
                    </el-form-item>

                    <el-form-item label="Mã Sản phẩm (Code)" prop="code">
                        <el-input v-model="formData.code" placeholder="CF-SUA" />
                    </el-form-item>

                    <el-form-item label="Danh mục" prop="categoryId">
                        <el-select v-model="formData.categoryId" placeholder="Chọn danh mục" class="w-100">
                            <el-option v-for="category in categories" :key="category.id" :label="category.name"
                                :value="category.id" />
                        </el-select>
                    </el-form-item>

                    <el-row :gutter="20">
                        <el-col :span="12">
                            <el-form-item label="Giá bán (VND)" prop="price">
                                <el-input-number v-model="formData.price" :min="0" :step="1000" class="w-100" />
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item label="Giá vốn (VND)" prop="cost">
                                <el-input-number v-model="formData.cost" :min="0" :step="1000" class="w-100" />
                            </el-form-item>
                        </el-col>
                    </el-row>
                </el-col>

                <el-col :span="10">
                    <el-form-item label="Hình ảnh" prop="imageUrl">
                        <el-upload class="product-uploader" action="#" :show-file-list="false" :auto-upload="false"
                            :on-change="handleImageChange" accept="image/png, image/jpeg, image/webp">
                            <img v-if="imagePreviewUrl" :src="imagePreviewUrl" class="product-image" alt="Preview" />
                            <el-icon v-else class="uploader-icon">
                                <Plus />
                            </el-icon>
                        </el-upload>
                        <el-button v-if="imagePreviewUrl" type="danger" plain @click.stop="removeImage" class="w-100"
                            style="margin-top: 10px;">
                            Xóa ảnh
                        </el-button>
                    </el-form-item>
                </el-col>
            </el-row>

            <el-form-item label="Mô tả" prop="description">
                <el-input v-model="formData.description" type="textarea" :rows="3"
                    placeholder="Mô tả ngắn về sản phẩm..." />
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
import { ref, watch, computed, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue' // Import icon cho El-Upload
import { useToast } from 'vue-toastification'
import { getAllCategories } from '@/api/categoryService'
import { createProduct, updateProduct } from '@/api/productService'

const props = defineProps({
    visible: Boolean, // Trạng thái đóng/mở
    product: Object, // Dữ liệu sản phẩm (nếu là edit)
})

const emit = defineEmits(['update:visible', 'success'])

const toast = useToast()
const formRef = ref(null) // Tham chiếu đến form
const loading = ref(false)
const categories = ref([]) // Danh sách danh mục

// --- State cho Form ---
const defaultFormData = {
    name: '',
    code: '',
    price: 0,
    cost: 0,
    description: '',
    categoryId: null,
    imageUrl: null, // Lưu URL ảnh hiện tại (khi edit)
}
const formData = ref({ ...defaultFormData })
const imageFile = ref(null) // File ảnh (nếu user chọn)
const imagePreviewUrl = ref(null) // URL để preview ảnh

// --- Kiểm tra Chế độ (Thêm mới / Chỉnh sửa) ---
const isEditMode = computed(() => !!props.product)

// --- Validation Rules ---
const formRules = {
    name: [{ required: true, message: 'Tên sản phẩm là bắt buộc', trigger: 'blur' }],
    code: [{ required: true, message: 'Mã sản phẩm là bắt buộc', trigger: 'blur' }],
    price: [{ required: true, message: 'Giá bán là bắt buộc', trigger: 'blur' }],
    categoryId: [{ required: true, message: 'Danh mục là bắt buộc', trigger: 'change' }],
}

// --- Xử lý Ảnh ---
const handleImageChange = (file) => {
    // file.raw là đối tượng File thực sự
    imageFile.value = file.raw
    // Tạo URL tạm thời để preview
    imagePreviewUrl.value = URL.createObjectURL(file.raw)
}

const removeImage = () => {
    imageFile.value = null
    imagePreviewUrl.value = null
    formData.value.imageUrl = null // Xóa cả ảnh hiện tại (nếu đang edit)
}

// --- Xử lý Form ---
const submitForm = async () => {
    if (!formRef.value) return

    // Validate form
    await formRef.value.validate(async (valid) => {
        if (valid) {
            loading.value = true
            try {
                // Tạo object dữ liệu JSON để gửi đi
                const productData = {
                    name: formData.value.name,
                    code: formData.value.code,
                    price: formData.value.price,
                    cost: formData.value.cost,
                    description: formData.value.description,
                    categoryId: formData.value.categoryId,
                    // Nếu xóa ảnh, gửi null
                    imageUrl: formData.value.imageUrl
                }

                if (isEditMode.value) {
                    // --- Chế độ Sửa ---
                    await updateProduct(props.product.id, productData, imageFile.value)
                    toast.success('Cập nhật sản phẩm thành công!')
                } else {
                    // --- Chế độ Thêm mới ---
                    await createProduct(productData, imageFile.value)
                    toast.success('Tạo sản phẩm mới thành công!')
                }

                // Báo cho trang cha (Products.vue) biết là đã thành công
                emit('success')
                // Đóng modal
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
    imageFile.value = null
    imagePreviewUrl.value = null
    formRef.value?.resetFields()
}

// --- Theo dõi khi props.product thay đổi (khi user bấm nút Edit) ---
watch(() => props.product, (newProduct) => {
    if (newProduct) {
        // Đang Edit: Đổ dữ liệu vào form
        formData.value = {
            name: newProduct.name,
            code: newProduct.code,
            price: newProduct.price,
            cost: newProduct.cost,
            description: newProduct.description,
            categoryId: newProduct.categoryId, // Backend cần trả về categoryId
            imageUrl: newProduct.imageUrl,
        }
        // Hiển thị ảnh preview (nếu có)
        imagePreviewUrl.value = newProduct.imageUrl || null
    } else {
        // Đang Thêm mới: Reset form
        onClose()
    }
})

// --- Tải danh sách danh mục khi modal được tạo ---
onMounted(async () => {
    try {
        const response = await getAllCategories()
        categories.value = response.data
    } catch (error) {
        toast.error('Không thể tải danh sách danh mục')
    }
})
</script>

<style scoped>
/* CSS cho Upload Ảnh */
.product-uploader .el-upload {
    border: 1px dashed var(--el-border-color);
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: var(--el-transition-duration-fast);
    width: 100%;
    aspect-ratio: 1 / 1;
    /* Đảm bảo ô upload luôn vuông */
    display: flex;
    justify-content: center;
    align-items: center;
}

.product-uploader .el-upload:hover {
    border-color: var(--el-color-primary);
}

.uploader-icon {
    font-size: 28px;
    color: #8c939d;
}

.product-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
</style>