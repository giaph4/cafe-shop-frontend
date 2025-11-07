<template>
    <el-dialog 
        :model-value="visible" 
        @update:model-value="$emit('update:visible', $event)"
        title="Chi tiết Phiếu Nhập hàng" 
        width="1000px" 
        @open="fetchDetails"
        destroy-on-close
        :append-to-body="true">
        <div v-loading="loading">
            <div v-if="po">
                <el-descriptions :column="2" border>
                    <el-descriptions-item label="Mã Phiếu">
                        #{{ po.id }}
                    </el-descriptions-item>
                    <el-descriptions-item label="Trạng thái">
                        <el-tag :type="statusType(po.status)">{{ po.status }}</el-tag>
                    </el-descriptions-item>
                    <el-descriptions-item label="Nhà cung cấp">
                        {{ po.supplierName }}
                    </el-descriptions-item>
                    <el-descriptions-item label="Nhân viên tạo">
                        {{ po.staffUsername }}
                    </el-descriptions-item>
                    <el-descriptions-item label="Ngày tạo phiếu">
                        {{ new Date(po.orderDate).toLocaleString('vi-VN') }}
                    </el-descriptions-item>
                    <el-descriptions-item label="Ngày dự kiến nhận">
                        {{ po.expectedDate ? new Date(po.expectedDate).toLocaleString('vi-VN') : 'N/A' }}
                    </el-descriptions-item>
                </el-descriptions>

                <h3 class="modal-subtitle">Chi tiết Nguyên vật liệu</h3>
                <el-table :data="po.purchaseOrderDetails" style="width: 100%" border>
                    <el-table-column type="index" label="#" width="60" align="center" />
                    <el-table-column prop="ingredientName" label="Tên Nguyên vật liệu" min-width="250" />
                    <el-table-column prop="quantity" label="Số lượng" align="center" width="120" />
                    <el-table-column prop="ingredientUnit" label="Đơn vị" align="center" width="120" />
                    <el-table-column label="Đơn giá" align="right" width="150">
                        <template #default="scope">
                            {{ formatCurrency(scope.row.unitPrice) }}
                        </template>
                    </el-table-column>
                    <el-table-column label="Thành tiền" align="right" width="150">
                        <template #default="scope">
                            {{ formatCurrency(scope.row.lineTotal) }}
                        </template>
                    </el-table-column>
                </el-table>

                <div class="total-summary">
                    <h4>Tổng cộng: {{ formatCurrency(po.totalAmount) }}</h4>
                </div>

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
import { getPurchaseOrderById } from '@/api/purchaseOrderService'
import { formatCurrency } from '@/utils/formatters'
import { useToast } from 'vue-toastification'

const props = defineProps({
    visible: Boolean,
    purchaseOrderId: Number, // Chỉ cần ID
})

const emit = defineEmits(['update:visible'])

const toast = useToast()
const loading = ref(false)
const po = ref(null) // Purchase Order details

// Hàm gọi API khi modal mở
const fetchDetails = async () => {
    if (!props.purchaseOrderId) return

    loading.value = true
    po.value = null
    try {
        // DTO trả về đã có đủ thông tin
        const response = await getPurchaseOrderById(props.purchaseOrderId)
        po.value = response.data
    } catch (error) {
        toast.error('Lỗi khi tải chi tiết phiếu nhập.')
    } finally {
        loading.value = false
    }
}

// Hàm đổi màu tag trạng thái
const statusType = (status) => {
    if (status === 'COMPLETED') return 'success'
    if (status === 'CANCELLED') return 'danger'
    return 'warning' // PENDING
}
</script>

<style scoped>
.modal-subtitle {
    margin-top: 20px;
    margin-bottom: 10px;
    font-weight: 600;
}

.total-summary {
    text-align: right;
    margin-top: 20px;
    font-size: 1.2rem;
    color: var(--el-color-primary);
}
</style>
