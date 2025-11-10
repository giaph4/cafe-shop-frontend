<template>
    <div class="app-page-container po-create-page animate__animated animate__fadeInUp stagger-item">
        <div class="page-header">
            <h1 class="page-title">
                <el-icon style="margin-right: 8px; font-size: 1.5rem;"><DocumentAdd /></el-icon>
                Tạo Phiếu Nhập hàng mới
            </h1>
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

            <el-card class=" w-100" style="margin-top: 20px;">
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

                <div class="w-100">
                    <EasyDataTable
                        :headers="headers"
                        :items="tableItems"
                        :loading="false"
                        :rows-per-page="1000"
                        :hide-footer="true"
                        :hide-header="false"
                        theme-color="#8B7355"
                        table-class-name="purchase-order-table"
                        header-class-name="purchase-order-header"
                        body-class-name="purchase-order-body"
                        class="w-100"
                    >
                    <template #item-ingredientId="{ index }">
                        <el-form-item :prop="'items.' + index + '.ingredientId'" :rules="rules.ingredientId">
                            <el-select v-model="form.items[index].ingredientId" placeholder="Chọn nguyên vật liệu"
                                class="w-100" filterable @change="() => calculateTotal()">
                                <el-option v-for="ing in ingredients" :key="ing.id"
                                    :label="`${ing.name} (${ing.unit})`" :value="ing.id" />
                            </el-select>
                        </el-form-item>
                    </template>

                    <template #item-quantity="{ index }">
                        <el-form-item :prop="'items.' + index + '.quantity'" :rules="rules.quantity">
                            <el-input-number v-model="form.items[index].quantity" :min="2" :precision="3"
                                @change="() => calculateTotal()" />
                        </el-form-item>
                    </template>

                    <template #item-unitPrice="{ index }">
                        <el-form-item :prop="'items.' + index + '.unitPrice'" :rules="rules.unitPrice">
                            <el-input-number v-model="form.items[index].unitPrice" :min="0" :step="1000"
                                @change="() => calculateTotal()" />
                        </el-form-item>
                    </template>

                    <template #item-total="{ index }">
                        <span class="total-cell">{{ formatCurrency(form.items[index].quantity * form.items[index].unitPrice) }}</span>
                    </template>

                    <template #item-actions="{ index }">
                        <el-button
                            type="danger"
                            plain
                            :icon="Delete"
                            @click="removeItem(index)"
                            class="hover-scale"
                        >
                            Xóa
                        </el-button>
                    </template>
                </EasyDataTable>
                </div>

                <div class="total-summary">
                    <el-icon style="margin-right: 8px; font-size: 1.2rem;"><Money /></el-icon>
                    <h3>Tổng cộng: <span class="total-amount">{{ formatCurrency(totalAmount) }}</span></h3>
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
import { Back, Plus, Delete, Money, DocumentAdd } from '@element-plus/icons-vue'
import { getAllSuppliers } from '@/api/supplierService'
import { getAllIngredientsSimple } from '@/api/ingredientService'
import { createPurchaseOrder } from '@/api/purchaseOrderService'
import { formatCurrency } from '@/utils/formatters'
import EasyDataTable from 'vue3-easy-data-table'

const router = useRouter()
const toast = useToast()
const formRef = ref(null)
const submitLoading = ref(false)

const suppliers = ref([])
const ingredients = ref([])

const form = ref({
    supplierId: null,
    expectedDate: null,
    items: [
        { ingredientId: null, quantity: 1, unitPrice: 0 }
    ]
})

const totalAmount = ref(0)

const headers = [
    { text: 'NGUYÊN VẬT LIỆU', value: 'ingredientId', width: 200 },
    { text: 'SỐ LƯỢNG', value: 'quantity', width: 180, sortable: false },
    { text: 'ĐƠN GIÁ (VND)', value: 'unitPrice', width: 200, sortable: false },
    { text: 'THÀNH TIỀN', value: 'total', width: 180, sortable: false },
    { text: 'XÓA', value: 'actions', width: 100, sortable: false }
]

// Computed items with index for EasyDataTable
const tableItems = computed(() => {
    return form.value.items.map((item, index) => ({
        ...item,
        index
    }))
})

const rules = {
    supplierId: [{ required: true, message: 'Nhà cung cấp là bắt buộc', trigger: 'change' }],
    ingredientId: [{ required: true, message: 'Nguyên vật liệu là bắt buộc', trigger: 'change' }],
    quantity: [{ required: true, type: 'number', min: 0.001, message: 'Số lượng phải > 0', trigger: 'blur' }],
    unitPrice: [{ required: true, type: 'number', min: 0, message: 'Đơn giá phải >= 0', trigger: 'blur' }],
}

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

const calculateTotal = () => {
    totalAmount.value = form.value.items.reduce((sum, item) => {
        return sum + (item.quantity * item.unitPrice)
    }, 0)
}

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
    height: 105vh;
}

.w-100 {
    width: 100%;
}

.total-summary {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    margin-top: 20px;
    padding: 20px;
    background: linear-gradient(135deg, #F8F6F3 0%, #F5F3F0 100%);
    border-radius: 12px;
    border: 2px solid #8B7355;
}

.total-summary h3 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
    color: #212121;
}

.total-amount {
    color: #8B7355;
    font-size: 1.8rem;
    font-weight: 800;
}

.total-cell {
    font-weight: 600;
    color: #8B7355;
    font-size: 1rem;
}

.el-table .el-form-item {
    margin-bottom: 0;
}

.total-cell {
    font-weight: 600;
    color: #606266;
}

/* EasyDataTable custom styles */
.purchase-order-table {
    border: 1px solid #ebeef5;
    border-radius: 8px;
    overflow: hidden;
    width: 100% !important;
}

.purchase-order-table > div {
    width: 100% !important;
}

.purchase-order-header {
    background: linear-gradient(135deg, #8B7355 0%, #A0886B 100%);
    color: white;
    font-weight: 600;
    text-align: center;
}

.purchase-order-header th {
    border-right: 1px solid rgba(255, 255, 255, 0.2);
    padding: 12px 8px;
}

.purchase-order-header th:last-child {
    border-right: none;
}

.purchase-order-body td {
    padding: 8px;
    border-bottom: 1px solid #f5f5f5;
    text-align: center;
}

.purchase-order-body td:first-child {
    text-align: left;
}

.purchase-order-body td:last-child {
    text-align: center;
}

.purchase-order-body tr:hover {
    background-color: #f9f9f9;
}

.hover-scale:hover {
    transform: scale(1.05);
    transition: transform 0.2s ease;
}
</style>
