<template>
    <el-dialog 
        :model-value="visible" 
        @update:model-value="$emit('update:visible', $event)" 
        title="Chi tiết Sản phẩm"
        width="800px" 
        @open="fetchProductDetails"
        destroy-on-close
        :append-to-body="true">
        <div v-loading="loading">
            <div v-if="product">
                <el-row :gutter="20">
                    <el-col :span="10">
                        <el-image :src="product.imageUrl" fit="cover" class="detail-image">
                            <template #error>
                                <div class="image-slot-detail">
                                    <el-icon>
                                        <Picture />
                                    </el-icon>
                                    <span>Không có ảnh</span>
                                </div>
                            </template>
                        </el-image>
                    </el-col>

                    <el-col :span="14">
                        <h2 class="product-name">{{ product.name }}</h2>
                        <p class="product-code">Mã SP: {{ product.code }}</p>

                        <el-descriptions :column="2" border>
                            <el-descriptions-item label="Giá bán">
                                <el-tag type="success" size="large">{{ formatCurrency(product.price) }}</el-tag>
                            </el-descriptions-item>
                            <el-descriptions-item label="Giá vốn">
                                <el-tag type="warning" size="large">{{ formatCurrency(product.cost) }}</el-tag>
                            </el-descriptions-item>
                            <el-descriptions-item label="Danh mục">
                                {{ product.categoryName }}
                            </el-descriptions-item>
                            <el-descriptions-item label="Trạng thái">
                                <el-tag :type="product.available ? 'success' : 'danger'">
                                    {{ product.available ? 'Đang bán' : 'Đã ẩn' }}
                                </el-tag>
                            </el-descriptions-item>
                            <el-descriptions-item label="Mô tả" :span="2">
                                {{ product.description || '(Không có mô tả)' }}
                            </el-descriptions-item>
                            <el-descriptions-item label="Tạo lúc" :span="2">
                                {{ new Date(product.createdAt).toLocaleString('vi-VN') }}
                            </el-descriptions-item>
                        </el-descriptions>

                    </el-col>
                </el-row>
            </div>
            <div v-if="!product && !loading" class="empty-state">
                <p>Không thể tải chi tiết sản phẩm.</p>
            </div>
        </div>

        <template #footer>
            <span class="dialog-footer">
                <el-button type="primary" @click="$emit('update:visible', false)">Đóng</el-button>
            </span>
        </template>
    </el-dialog>
</template>

<script setup>
import { ref } from 'vue'
import { getProductById } from '@/api/productService.js'
import { formatCurrency } from '@/utils/formatters.js'
import { Picture } from '@element-plus/icons-vue'
import { useToast } from 'vue-toastification'

const props = defineProps({
    visible: Boolean,
    productId: Number, // Chỉ cần ID
})

const emit = defineEmits(['update:visible'])

const toast = useToast()
const loading = ref(false)
const product = ref(null)

const fetchProductDetails = async () => {
    if (!props.productId) return

    loading.value = true
    product.value = null // Xóa dữ liệu cũ
    try {
        const response = await getProductById(props.productId)
        product.value = response.data
    } catch (error) {
        toast.error('Lỗi khi tải chi tiết sản phẩm.')
    } finally {
        loading.value = false
    }
}
</script>

<style scoped>
.detail-image {
    width: 100%;
    height: 300px;
    border-radius: 8px;
    background-color: #f5f7fa;
}

.image-slot-detail {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    color: #909399;
}

.image-slot-detail .el-icon {
    font-size: 30px;
    margin-bottom: 10px;
}

.product-name {
    font-size: 1.8rem;
    font-weight: 600;
    margin-top: 0;
    margin-bottom: 5px;
}

.product-code {
    font-size: 1rem;
    color: #909399;
    margin-bottom: 20px;
}

.empty-state {
    text-align: center;
    padding: 50px;
    color: #909399;
}
</style>
