<template>
    <div class="app-page-container po-create-page">
        <div class="page-header">
            <h1 class="page-title">Tạo Phiếu Nhập hàng mới</h1>
            <el-button @click="$router.back()">
                <el-icon style="margin-right: 8px;">
                    <Back />
                </el-icon>
                Quay lại
            </el-button>
        </div>

        <el-form :model="form" :rules="rules" ref="formRef" label-position="top">
            <el-card class="box-card">
                <template #header>
                    <span>Thông tin chung</span>
                </template>

                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="Chọn Nhà cung cấp" prop="supplierId">
                            <el-select v-model="form.supplierId" placeholder="Tìm và chọn nhà cung cấp" class="w-100"
                                filterable>
                                <el-option v-for="supplier in suppliers" :key="supplier.id" :label="supplier.name"
                                    :value="supplier.id" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="Ngày dự kiến nhận hàng" prop="expectedDate">
                            <el-date-picker v-model="form.expectedDate" type="datetime" placeholder="Chọn ngày giờ"
                                class="w-100" />
                        </el-form-item>
                    </el-col>
                </el-row>
            </el-card>

            <el-card class="box-card" style="margin-top: 20px;">
                <template #header>
                    <div class="d-flex justify-content-between align-items-center">
                        <span>Chi tiết Nguyên vật liệu</span>
                        <el-button type="success" plain @click="addItem">
                            <el-icon style="margin-right: 8px;">
                                <Plus />
                            </el-icon>
                            Thêm dòng
                        </el-button>
                    </div>
                </template>

                <el-table :data="form.items" style="width: 100%" border>
                    <el-table-column label="Nguyên vật liệu" min-width="250">
                        <template #default="scope">
                            <el-form-item :prop="'items.' + scope.$index + '.ingredientId'" :rules="rules.ingredientId">
                                <el-select v-model="scope.row.ingredientId" placeholder="Chọn nguyên vật liệu"
                                    class="w-100" filterable @change="() => calculateTotal()">
                                    <el-option v-for="ing in ingredients" :key="ing.id"
                                        :label="`${ing.name} (${ing.unit})`" :value="ing.id" />
                                </el-select>
                            </el-form-item>
                        </template>
                    </el-table-column>

                    <el-table-column label="Số lượng" width="150">
                        <template #default="scope">
                            <el-form-item :prop="'items.' + scope.$index + '.quantity'" :rules="rules.quantity">
                                <el-input-number v-model="scope.row.quantity" :min="0.001" :precision="3"
                                    @change="() => calculateTotal()" />
                            </el-form-item>
                        </template>
                    </el-table-column>

                    <el-table-column label="Đơn giá (VND)" width="200">
                        <template #default="scope">
                            <el-form-item :prop="'items.' + scope.$index + '.unitPrice'" :rules="rules.unitPrice">
                                <el-input-number v-model="scope.row.unitPrice" :min="0" :step="1000"
                                    @change="() => calculateTotal()" />
                            </el-form-item>
                        </template>
                    </el-table-column>

                    <el-table-column label="Thành tiền" width="150" align="right">
                        <template #default="scope">
                            <span class="total-cell">{{ formatCurrency(scope.row.quantity * scope.row.unitPrice)
                                }}</span>
                        </template>
                    </el-table-column>

                    <el-table-column label="Xóa" width="80" align="center">
                        <template #default="scope">
                            <el-button type="danger" plain circle :icon="Delete" @click="removeItem(scope.$index)" />
                        </template>
                    </el-table-column>
                </el-table>

                <div class="total-summary">
                    <h3>Tổng cộng: {{ formatCurrency(totalAmount) }}</h3>
                </div>
            </el-card>

            <div style="margin-top: 20px; text-align: right;">
                <el-button @click="$router.back()">Hủy</el-button>
                <el-button type="primary" @click="submitForm" :loading="submitLoading">
                    Tạo Phiếu Nhập
                </el-button>
            </div>
        </el-form>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { Back, Plus, Delete } from '@element-plus/icons-vue'
import { getAllSuppliers } from '@/api/supplierService'
import { getAllIngredientsSimple } from '@/api/ingredientService'
import { createPurchaseOrder } from '@/api/purchaseOrderService'
import { formatCurrency } from '@/utils/formatters'

const router = useRouter()
const toast = useToast()
const formRef = ref(null)
const submitLoading = ref(false)

// --- State cho Dropdowns ---
const suppliers = ref([])
const ingredients = ref([])

// --- State cho Form ---
const form = ref({
    supplierId: null,
    expectedDate: null,
    items: [
        // Một dòng mặc định
        { ingredientId: null, quantity: 1, unitPrice: 0 }
    ]
})

// --- State cho Tổng tiền ---
const totalAmount = ref(0)

// --- Validation Rules ---
const rules = {
    supplierId: [{ required: true, message: 'Nhà cung cấp là bắt buộc', trigger: 'change' }],
    ingredientId: [{ required: true, message: 'Nguyên vật liệu là bắt buộc', trigger: 'change' }],
    quantity: [{ required: true, type: 'number', min: 0.001, message: 'Số lượng phải > 0', trigger: 'blur' }],
    unitPrice: [{ required: true, type: 'number', min: 0, message: 'Đơn giá phải >= 0', trigger: 'blur' }],
}

// --- Tải dữ liệu cho Dropdowns ---
const loadInitialData = async () => {
    try {
        const [supplierRes, ingredientRes] = await Promise.all([
            getAllSuppliers(),
            getAllIngredientsSimple()
        ])
        suppliers.value = supplierRes.data
        // Dữ liệu ingredients nằm trong .content
        ingredients.value = ingredientRes.data.content
    } catch (error) {
        toast.error('Lỗi khi tải danh sách nhà cung cấp hoặc nguyên vật liệu')
    }
}

// --- Xử lý Items ---
const addItem = () => {
    form.value.items.push({ ingredientId: null, quantity: 1, unitPrice: 0 })
}

const removeItem = (index) => {
    if (form.value.items.length > 1) { // Luôn giữ ít nhất 1 dòng
        form.value.items.splice(index, 1)
        calculateTotal()
    } else {
        toast.warning('Phiếu nhập phải có ít nhất 1 nguyên vật liệu')
    }
}

// --- Tính tổng tiền ---
const calculateTotal = () => {
    totalAmount.value = form.value.items.reduce((sum, item) => {
        return sum + (item.quantity * item.unitPrice)
    }, 0)
}

// --- Xử lý Submit ---
const submitForm = async () => {
    if (!formRef.value) return

    // Kiểm tra items rỗng
    if (form.value.items.length === 0 || !form.value.items[0].ingredientId) {
        toast.error('Phiếu nhập phải có ít nhất 1 nguyên vật liệu hợp lệ.')
        return
    }

    await formRef.value.validate(async (valid) => {
        if (valid) {
            submitLoading.value = true
            try {
                // DTO backend yêu cầu
                const poData = {
                    supplierId: form.value.supplierId,
                    expectedDate: form.value.expectedDate,
                    items: form.value.items.map(item => ({
                        ingredientId: item.ingredientId,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                    }))
                }

                await createPurchaseOrder(poData)
                toast.success('Tạo phiếu nhập hàng thành công!')
                router.push({ name: 'PurchaseOrders' }) // Quay về trang danh sách

            } catch (error) {
                const msg = error.response?.data?.message || 'Lỗi khi tạo phiếu nhập'
                toast.error(msg)
            } finally {
                submitLoading.value = false
            }
        } else {
            toast.error('Vui lòng kiểm tra lại thông tin đã nhập.')
        }
    })
}

onMounted(() => {
    loadInitialData()
})
</script>

<style scoped>
.app-page-container {
    padding: 20px;
}

.w-100 {
    width: 100%;
}

.total-summary {
    text-align: right;
    margin-top: 20px;
    font-size: 1.5rem;
    font-weight: 600;
}

/* Ẩn thông báo lỗi validation của el-form-item bên trong bảng */
.el-table .el-form-item {
    margin-bottom: 0;
}

.total-cell {
    font-weight: 600;
    color: #606266;
}
</style>