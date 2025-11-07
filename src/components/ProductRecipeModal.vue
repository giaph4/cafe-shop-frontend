<template>
    <el-dialog 
        :model-value="visible" 
        @update:model-value="$emit('update:visible', $event)"
        :title="`Công thức cho: ${productName}`" 
        width="1100px" 
        @open="onOpen" 
        @close="onClose"
        :close-on-click-modal="false"
        destroy-on-close
        :append-to-body="true">
        <div v-loading="loading" class="recipe-editor">
            <el-table :data="recipeItems" style="width: 100%" border>
                <el-table-column label="NGUYÊN VẬT LIỆU" min-width="400">
                    <template #default="scope">
                        <el-select v-model="scope.row.ingredientId" placeholder="Chọn nguyên vật liệu" class="w-100"
                            filterable @change="(id) => onIngredientSelect(scope.row, id)">
                            <el-option v-for="ing in allIngredients" :key="ing.id" :label="`${ing.name} (${ing.unit})`"
                                :value="ing.id" :disabled="isIngredientSelected(ing.id, scope.row.ingredientId)" />
                        </el-select>
                    </template>
                </el-table-column>

                <el-table-column label="SỐ LƯỢNG" width="200" align="center">
                    <template #default="scope">
                        <el-input-number v-model="scope.row.quantityNeeded" :min="0.004" :precision="3" />
                    </template>
                </el-table-column>

                <el-table-column label="ĐƠN VỊ" width="180" align="center">
                    <template #default="scope">
                        <span style="color: #606266; font-weight: 500;">{{ scope.row.ingredientUnit || 'N/A' }}</span>
                    </template>
                </el-table-column>

                <el-table-column label="XÓA" width="150" align="center">
                    <template #default="scope">
                        <el-button type="danger" plain :icon="Trash2" @click="removeRow(scope.$index)">Xóa</el-button>
                    </template>
                </el-table-column>
            </el-table>

            <el-button class="w-100" style="margin-top: 15px;" @click="addRow" :icon="Plus">
                Thêm Nguyên vật liệu
            </el-button>
        </div>

        <template #footer>
            <span class="dialog-footer">
                <el-button @click="$emit('update:visible', false)">Hủy</el-button>
                <el-button type="primary" @click="submitRecipe" :loading="loading">
                    Lưu Công thức
                </el-button>
            </span>
        </template>
    </el-dialog>
</template>

<script setup>
import { ref } from 'vue'
import { useToast } from 'vue-toastification'
import { Plus, Delete as Trash2 } from '@element-plus/icons-vue'
import { getProductRecipe, setProductRecipe } from '@/api/productService.js'
import { getAllIngredientsSimple } from '@/api/ingredientService.js'

const props = defineProps({
    visible: Boolean,
    productId: Number,
    productName: String,
})

const emit = defineEmits(['update:visible', 'success'])

const toast = useToast()
const loading = ref(false)
const allIngredients = ref([]) // Danh sách tất cả NVL (cho dropdown)
const recipeItems = ref([]) // Danh sách NVL trong công thức

const onOpen = async () => {
    if (!props.productId) return
    loading.value = true
    try {
        // Tải song song công thức hiện tại VÀ danh sách nguyên vật liệu
        const [recipeRes, ingredientsRes] = await Promise.all([
            getProductRecipe(props.productId),
            getAllIngredientsSimple()
        ])

        // DTO trả về là List<ProductIngredientDTO>
        recipeItems.value = recipeRes.data.map(item => ({
            ingredientId: item.ingredientId,
            ingredientName: item.ingredientName,
            ingredientUnit: item.ingredientUnit,
            quantityNeeded: item.quantityNeeded,
        }))

        // DTO trả về Page<IngredientResponseDTO>
        allIngredients.value = ingredientsRes.data.content

    } catch (error) {
        toast.error('Lỗi khi tải công thức hoặc nguyên vật liệu.')
    } finally {
        loading.value = false
    }
}

const addRow = () => {
    recipeItems.value.push({
        ingredientId: null,
        ingredientName: '',
        ingredientUnit: '',
        quantityNeeded: 0.1, // Giá trị mặc định
    })
}

const removeRow = (index) => {
    recipeItems.value.splice(index, 1)
}

// Khi chọn 1 NVL từ dropdown, tự động điền Đơn vị
const onIngredientSelect = (row, selectedId) => {
    const selectedIngredient = allIngredients.value.find(ing => ing.id === selectedId)
    if (selectedIngredient) {
        row.ingredientName = selectedIngredient.name
        row.ingredientUnit = selectedIngredient.unit
    }
}

// Kiểm tra để vô hiệu hóa NVL đã được chọn
const isIngredientSelected = (optionId, currentId) => {
    if (optionId === currentId) return false // Cho phép chọn chính nó
    return recipeItems.value.some(item => item.ingredientId === optionId)
}

const submitRecipe = async () => {
    loading.value = true

    // 1. Validate (Kiểm tra dòng trống hoặc số lượng = 0)
    for (const item of recipeItems.value) {
        if (!item.ingredientId || !item.quantityNeeded || item.quantityNeeded <= 0) {
            toast.error('Vui lòng điền đầy đủ thông tin (chọn NVL và số lượng > 0) cho tất cả các dòng.')
            loading.value = false
            return
        }
    }

    // 2. Format DTO gửi đi
    // API yêu cầu { ingredients: [...] }
    const recipeData = {
        ingredients: recipeItems.value.map(item => ({
            ingredientId: item.ingredientId,
            quantityNeeded: item.quantityNeeded
        }))
    }

    try {
        // 3. Gọi API PUT (Ghi đè)
        await setProductRecipe(props.productId, recipeData)
        toast.success(`Cập nhật công thức cho '${props.productName}' thành công!`)
        emit('success')
        emit('update:visible', false)
    } catch (error) {
        const msg = error.response?.data?.message || 'Lỗi khi lưu công thức'
        toast.error(msg)
    } finally {
        loading.value = false
    }
}

const onClose = () => {
    recipeItems.value = []
    // (Không cần clear allIngredients)
}
</script>

<style scoped>
.w-100 {
    width: 100%;
}

.recipe-editor {
    /* Đảm bảo modal có thể cuộn nếu có quá nhiều dòng */
    max-height: 60vh;
    overflow-y: auto;
    padding: 5px;
}
</style>
