<template>
    <el-drawer
        :model-value="posStore.isModalOpen"
        @update:model-value="posStore.closePosModal()"
        :title="modalTitle"
        direction="rtl"
        size="95%"
        :close-on-click-modal="false"
        class="order-editor-drawer">
        <div v-loading="posStore.isLoading">
            <el-row :gutter="20">
                <el-col :span="10">
                    <el-card class="menu-card" shadow="hover">
                        <template #header>
                            <div class="menu-card-header">
                                <span class="section-title">🍝 Menu</span>
                                <el-tag type="info" size="small">{{ filteredProducts.length }} món</el-tag>
                            </div>
                        </template>
                        <div class="menu-header">
                            <el-input v-model="productSearch" placeholder="Tìm món..." :prefix-icon="Search" clearable/>
                            <el-select v-model="selectedCategory" placeholder="Danh mục" clearable class="w-100"
                                       style="margin-top: 12px;">
                                <el-option label="Tất cả" :value="null"/>
                                <el-option v-for="cat in categories" :key="cat.id" :label="cat.name" :value="cat.id"/>
                            </el-select>
                        </div>
                        <div class="product-list">
                            <div v-for="product in filteredProducts" :key="product.id"
                                 class="product-item hover-lift"
                                 @click="onProductClick(product)">
                                <el-badge :value="'+1'" class="item-badge" type="success">
                                    <el-image :src="product.imageUrl" fit="cover" class="product-item-img">
                                        <template #error>
                                            <div class="image-slot-small">
                                                <Picture/>
                                            </div>
                                        </template>
                                    </el-image>
                                </el-badge>
                                <div class="product-item-info">
                                    <div class="product-item-name">{{ product.name }}</div>
                                    <div class="product-item-price">{{ formatCurrency(product.price) }}</div>
                                </div>
                            </div>
                        </div>
                    </el-card>
                </el-col>

                <el-col :span="14">
                    <el-card class="box-card cart-card" shadow="hover">
                        <template #header>
                            <div class="cart-card-header">
                                <span class="section-title">🛒 Đơn hàng</span>
                                <el-tag :type="posStore.orderItems.length > 0 ? 'success' : 'info'" size="small">
                                    {{ posStore.orderItems.length }} món
                                </el-tag>
                            </div>
                        </template>
                        <el-tabs v-model="activeTab" class="order-tabs">
                            <el-tab-pane label="Chi tiết Đơn hàng" name="cart">
                                <div class="item-list">
                                    <div v-if="posStore.orderItems.length === 0" class="empty-cart">
                                        <el-empty description="Chưa có món nào. Vui lòng chọn món bên trái."/>
                                    </div>

                                    <div v-else class="cart-item" v-for="(item, index) in posStore.orderItems"
                                         :key="item.id">
                                        <div class="cart-item-index">{{ index + 1 }}</div>
                                        <div class="cart-item-info">
                                            <div class="cart-item-name">
                                                <el-icon class="item-icon">
                                                    <Picture/>
                                                </el-icon>
                                                {{ item.productName }}
                                            </div>
                                            <div class="cart-item-price">{{ formatCurrency(item.priceAtOrder) }} x
                                                {{ item.quantity }}
                                            </div>
                                            <el-input :model-value="item.notes" placeholder="📝 Ghi chú..." size="small"
                                                      @input="(newNote) => onNoteChange(item.id, newNote)"
                                                      class="cart-item-notes mb-3"/>
                                        </div>
                                        <div class="cart-item-actions">
                                            <el-input-number :model-value="item.quantity"
                                                             @change="(newQty) => onQuantityChange(item.id, newQty)"
                                                             :min="1" size="small"
                                                             class="cart-item-qty"/>
                                            <el-button type="danger" plain circle :icon="Trash2" size="small"
                                                       @click="posStore.removeItem(item.id)" class="delete-btn"/>
                                        </div>
                                    </div>
                                </div>
                                <div class="order-actions-bottom">
                                    <el-button v-if="posStore.isQuickOrder && posStore.orderItems.length > 0"
                                               type="primary" @click="activeTab = 'selectTable'">
                                        Tiếp theo: Chọn bàn
                                    </el-button>
                                    <el-button v-if="posStore.isEditing" type="danger" plain
                                               @click="posStore.cancelOrder()">
                                        Hủy Đơn
                                    </el-button>
                                    <el-button v-if="posStore.isEditing" type="success" plain
                                               @click="generateBillPreviewForStaff()">
                                        In bill cho pha chế
                                    </el-button>
                                    <el-button v-if="posStore.isEditing" type="primary"
                                               @click="onConfirmOrderDetails()">
                                        Xác nhận
                                    </el-button>
                                </div>
                            </el-tab-pane>

                            <el-tab-pane v-if="posStore.isQuickOrder" label="Chọn bàn" name="selectTable"
                                         :disabled="posStore.orderItems.length === 0">
                                <div class="table-selection">
                                    <el-alert type="info" :closable="false" style="margin-bottom: 20px;">
                                        <template #title>
                                            Bạn đã chọn {{ posStore.orderItems.length }} món. Vui lòng chọn bàn để tạo
                                            đơn hàng.
                                        </template>
                                    </el-alert>
                                    <div class="table-grid-modal">
                                        <el-card v-for="table in filteredTables" :key="table.id"
                                                 class="table-card-modal"
                                                 :class="getTableClass(table.status)" shadow="hover"
                                                 @click="onSelectTable(table)">
                                            <div class="table-name">{{ table.name }}</div>
                                            <div class="table-status">{{ getStatusText(table.status) }}</div>
                                            <div class="table-capacity">{{ table.capacity }} chỗ</div>
                                        </el-card>
                                    </div>
                                </div>
                            </el-tab-pane>

                            <el-tab-pane label="Thanh toán" name="payment" :disabled="posStore.orderItems.length === 0">
                                <div class="payment-tab">
                                    <el-form-item label="Tìm khách hàng (theo SĐT hoặc Tên)">
                                        <el-select v-model="selectedCustomerId" filterable remote reserve-keyword
                                                   placeholder="Nhập SĐT hoặc tên..." :remote-method="searchCustomers"
                                                   :loading="customerSearchLoading" clearable class="w-100">
                                            <el-option v-for="item in customers" :key="item.id"
                                                       :label="`${item.fullName} - ${item.phone}`"
                                                       :value="item.id"/>
                                        </el-select>
                                    </el-form-item>

                                    <el-form-item label="Mã giảm giá">
                                        <el-input v-model="voucherInput" placeholder="Nhập mã voucher"
                                                  :disabled="!!posStore.voucher">
                                            <template #append>
                                                <el-button v-if="!posStore.voucher" :icon="Ticket"
                                                           @click="posStore.applyVoucher(voucherInput)">
                                                    Áp dụng
                                                </el-button>
                                                <el-button v-else :icon="Close" type="danger" plain
                                                           @click="posStore.removeVoucher()">
                                                    Gỡ bỏ
                                                </el-button>
                                            </template>
                                        </el-input>
                                    </el-form-item>

                                    <el-form-item label="Chọn phương thức thanh toán">
                                    </el-form-item>
                                    <el-form-item label="">
                                        <div class="payment-methods">
                                            <el-button size="large" @click="selectedPaymentMethod = 'CASH'"
                                                       :icon="DollarSign"
                                                       :type="selectedPaymentMethod === 'CASH' ? 'primary' : ''">Tiền
                                                mặt (CASH)
                                            </el-button>
                                            <el-button size="large" @click="selectedPaymentMethod = 'TRANSFER'"
                                                       :icon="Landmark"
                                                       :type="selectedPaymentMethod === 'TRANSFER' ? 'primary' : ''">
                                                Chuyển khoản
                                                (TRANSFER)
                                            </el-button>
                                            <el-button size="large" @click="selectedPaymentMethod = 'CARD'"
                                                       :icon="CreditCard"
                                                       :type="selectedPaymentMethod === 'CARD' ? 'primary' : ''">Thẻ
                                                (CARD)
                                            </el-button>
                                        </div>
                                    </el-form-item>
                                </div>
                                <div class="payment-actions-bottom">
                                    <el-button type="info" plain size="large" @click="generateBillPreview()">
                                        🧪 Test Bill
                                    </el-button>
                                    <el-button type="primary" size="large" :disabled="!selectedPaymentMethod"
                                               @click="onPay(selectedPaymentMethod)">
                                        💳 Thanh Toán & In Bill
                                    </el-button>
                                </div>
                            </el-tab-pane>
                        </el-tabs>

                        <div class="cart-summary">
                            <div class="summary-gradient">
                                <div class="total-row">
                                    <span>💵 Tạm tính:</span>
                                    <span>{{ formatCurrency(posStore.subTotal) }}</span>
                                </div>
                                <div class="total-row discount" v-if="posStore.discount > 0">
                                    <span>🎟️ Giảm giá:</span>
                                    <span>- {{ formatCurrency(posStore.discount) }}</span>
                                </div>
                                <div class="total-row final-total">
                                    <span>💰 TỔNG CỘNG:</span>
                                    <span>{{ formatCurrency(posStore.total) }}</span>
                                </div>
                            </div>
                        </div>

                    </el-card>
                </el-col>
            </el-row>
        </div>
    </el-drawer>
</template>

<script setup>
import {ref, computed, onMounted, watch} from 'vue'
import {usePosStore} from '@/store/posStore.js'
import {getAvailableProducts} from '@/api/productService.js'
import {getAllCategories} from '@/api/categoryService.js'
import {searchCustomersSimple} from '@/api/customerService.js'
import {getAllTables} from '@/api/tableService.js'
import {formatCurrency} from '@/utils/formatters.js'
import { mapCustomers, upsertCustomerOption } from '@/utils/customer.js'
import {useToast} from 'vue-toastification'
import {Search, Trash2, Ticket, DollarSign, Landmark, CreditCard} from '@/components/icons/index.js'
import {Picture, Plus, Close} from '@element-plus/icons-vue'
import {getOrderById} from '@/api/orderService.js'

const posStore = usePosStore()
const toast = useToast()

const activeTab = ref('cart')
const productSearch = ref('')
const selectedCategory = ref(null)
const tableSearch = ref('')
const allProducts = ref([])
const categories = ref([])
const customers = ref([])
const customerSearchLoading = ref(false)
const selectedCustomerId = ref(null)
const voucherInput = ref('')
const selectedPaymentMethod = ref(null)
const availableTables = ref([])

onMounted(async () => {
    try {
        const response = await getAvailableProducts()
        allProducts.value = response.data.content.filter(p => p.available)

        // Fetch categories
        const catResponse = await getAllCategories()
        categories.value = catResponse.data
    } catch (error) {
        toast.error('Lỗi khi tải danh sách món')
    }
})

const modalTitle = computed(() => {
    if (posStore.isQuickOrder && !posStore.activeOrder) {
        return 'Bán hàng nhanh - Chọn món trước'
    }
    const table = posStore.currentTable?.name || 'Đơn hàng'
    const orderId = posStore.activeOrder?.id
    return orderId ? `Đơn hàng #${orderId} - ${table}` : `Đơn hàng mới - ${table}`
})

const filteredProducts = computed(() => {
    let result = allProducts.value

    // Filter by search
    if (productSearch.value) {
        result = result.filter(p =>
            p.name.toLowerCase().includes(productSearch.value.toLowerCase())
        )
    }

    // Filter by category
    if (selectedCategory.value) {
        const selectedCat = categories.value.find(c => c.id === selectedCategory.value)
        if (selectedCat) {
            result = result.filter(p => p.categoryName === selectedCat.name)
        }
    }

    return result
})

const filteredTables = computed(() => {
    if (!tableSearch.value) {
        return availableTables.value
    }
    return availableTables.value.filter(t =>
        t.name.toLowerCase().includes(tableSearch.value.toLowerCase())
    )
})

const onProductClick = (product) => {
    const itemData = {
        productId: product.id,
        quantity: 1,
        notes: ''
    }
    posStore.addItem(itemData)
}

const onQuantityChange = (orderDetailId, newQuantity) => {
    posStore.updateItem(orderDetailId, {quantity: newQuantity, notes: null})
}

const onNoteChange = (orderDetailId, newNote) => {
    const currentItem = posStore.orderItems.find(item => item.id === orderDetailId)
    if (currentItem) {
        posStore.updateItem(orderDetailId, {quantity: currentItem.quantity, notes: newNote})
    }
}

let customerTimer = null
const searchCustomers = (query) => {
    const keyword = query?.trim?.() || ''
    clearTimeout(customerTimer)
    if (!keyword) {
        customers.value = []
        customerSearchLoading.value = false
        return
    }
    customerSearchLoading.value = true
    customerTimer = setTimeout(async () => {
        try {
            const response = await searchCustomersSimple(keyword)
            const rawList = Array.isArray(response?.data?.content)
                ? response.data.content
                : Array.isArray(response?.data)
                    ? response.data
                    : []
            customers.value = mapCustomers(rawList)
        } catch (e) {
            toast.error('Lỗi tìm khách hàng')
            customers.value = []
        } finally {
            customerSearchLoading.value = false
        }
    }, 400)
}

watch(() => posStore.activeOrder, (order) => {
    if (order?.customerId) {
        selectedCustomerId.value = order.customerId
        upsertCustomerOption(customers, {
            id: order.customerId,
            fullName: order.customerName || order.customer?.fullName,
            phone: order.customerPhone || order.customer?.phone,
        })
    } else {
        selectedCustomerId.value = null
    }
}, { immediate: true })

const onConfirmOrderDetails = () => {
    if (!posStore.currentTable?.id) {
        // Nếu là đơn mang đi, chuyển sang tab thanh toán
        activeTab.value = 'payment'
    } else {
        // Nếu là đơn tại bàn, đóng modal
        posStore.closePosModal()
    }
}

const generateBillPreview = () => {
    try {
        // Create a preview order object
        const previewOrder = {
            id: 'PREVIEW',
            tableName: posStore.currentTable?.name || 'Mang đi',
            type: posStore.currentTable ? 'AT_TABLE' : 'TAKE_AWAY',
            staffUsername: 'Preview Staff',
            customerName: 'Khách hàng test',
            customerPhone: '0123456789',
            paymentMethod: selectedPaymentMethod.value || 'CASH',
            createdAt: new Date(),
            paidAt: new Date(),
            subTotal: posStore.subTotal,
            discountAmount: posStore.discount,
            totalAmount: posStore.total,
            orderDetails: posStore.orderItems.map(item => ({
                productName: item.productName,
                quantity: item.quantity,
                priceAtOrder: item.priceAtOrder,
                lineTotal: item.quantity * item.priceAtOrder,
                notes: item.notes
            }))
        }

        const billContent = generateBillContent(previewOrder)
        downloadBill(billContent, `bill_preview.txt`)
        toast.success('Bill preview đã được tải xuống!')
    } catch (error) {
        console.error('Bill preview error:', error)
        toast.error('Lỗi tạo bill preview: ' + error.message)
    }
}

const generateBillPreviewForStaff = () => {
    try {
        // Create a preview order object
        const previewOrder = {
            id: 'PREVIEW',
            tableName: posStore.currentTable?.name || 'Mang đi',
            type: posStore.currentTable ? 'AT_TABLE' : 'TAKE_AWAY',
            createdAt: new Date(),
            paidAt: new Date(),
            subTotal: posStore.subTotal,
            discountAmount: posStore.discount,
            totalAmount: posStore.total,
            orderDetails: posStore.orderItems.map(item => ({
                productName: item.productName,
                quantity: item.quantity,
                priceAtOrder: item.priceAtOrder,
                lineTotal: item.quantity * item.priceAtOrder,
                notes: item.notes
            }))
        }

        const billContent = generateBillContentForStaff(previewOrder)
        downloadBill(billContent, `bill_preview.txt`)
        toast.success('Bill preview đã được tải xuống!')
    } catch (error) {
        console.error('Bill preview error:', error)
        toast.error('Lỗi tạo bill preview: ' + error.message)
    }
}

const onPay = async (paymentMethod) => {
    try {
        // Store order ID before payment (since closePosModal clears it)
        const orderId = posStore.activeOrder?.id

        // Use posStore to complete the payment (like Orders.vue does)
        const success = await posStore.pay(paymentMethod, selectedCustomerId.value)

        if (success && orderId) {
            // Fetch updated order data for bill printing (like Orders.vue does)
            const response = await getOrderById(orderId)
            const updatedOrder = response.data


            // Auto-generate bill after payment
            const billContent = generateBillContent(updatedOrder)

            downloadBill(billContent, `bill_${updatedOrder.id}.txt`)

            // Modal closes automatically via posStore.pay()
        } else {
            toast.error('Thanh toán thất bại!')
        }
    } catch (error) {
        console.error('Payment error:', error)
        toast.error('Lỗi thanh toán: ' + error.message)
    }
}

watch(() => posStore.voucher, (newVoucher) => {
    if (newVoucher) {
        voucherInput.value = newVoucher
    } else {
        voucherInput.value = ''
    }
})

watch(() => posStore.isModalOpen, (newValue) => {
    if (!newValue) {
        // Reset selectedPaymentMethod when modal closes
        selectedPaymentMethod.value = null
    } else if (posStore.isQuickOrder) {
        // Load tables when quick order modal opens
        loadTables()
    }
})

const loadTables = async () => {
    try {
        const response = await getAllTables()
        availableTables.value = response.data.filter(t => t.status === 'EMPTY' || t.status === 'SERVING')
    } catch (error) {
        toast.error('Lỗi khi tải danh sách bàn')
    }
}

const getStatusText = (status) => {
    if (status === 'SERVING') return 'Đang phục vụ'
    if (status === 'RESERVED') return 'Đã đặt'
    return 'Còn trống'
}

const getTableClass = (status) => {
    if (status === 'SERVING') return 'status-serving'
    if (status === 'RESERVED') return 'status-reserved'
    return 'status-empty'
}

const onSelectTable = async (table) => {
    if (table.status === 'RESERVED') {
        toast.warning(`Bàn ${table.name} đã được đặt, không thể tạo đơn.`)
        return
    }

    const success = await posStore.assignTableAndCreateOrder(table)
    if (success) {
        activeTab.value = 'payment'
    }
}

const generateBillContentForStaff = (order) => {
    if (!order) throw new Error('Order object is null or undefined')

    // Lấy danh sách từ localStorage để có dữ liệu tạm
    const localDetails = JSON.parse(localStorage.getItem('tempOrderDetails')) || []
    const orderDetails = order.orderDetails?.length ? order.orderDetails : localDetails
    if (orderDetails.length === 0) return 'Không có chi tiết đơn hàng\n'

    const now = new Date().getTime()
    const twoMinutes = 2 * 60 * 1000

    // Lọc món mới trong vòng 2 phút gần nhất
    const filteredItems = orderDetails.filter(item => {
        const addedTime = new Date(item.addedAt || order.createdAt).getTime()
        return now - addedTime <= twoMinutes
    })

    // Nếu không có món mới thì in tất cả (hoặc bạn có thể bỏ trống)
    const itemsToPrint = filteredItems.length > 0 ? filteredItems : orderDetails

    let bill = `
══════════════════════════════════════════
           COFFEE SHOP - HOA BILL
══════════════════════════════════════════


`

    itemsToPrint.forEach((item, index) => {
        bill += `${index + 1}. ${item.productName || 'N/A'}\n`
        bill += `   Số lượng: ${item.quantity || 0}\n`
        bill += `   Đơn giá: ${formatCurrency(item.priceAtOrder || 0)}\n`
        bill += `   Thành tiền: ${formatCurrency(item.priceAtOrder * item.quantity || 0)}\n`
        bill += '\n'
    })

    bill += `══════════════════════════════════════════\n`
    bill += `Thời gian in: ${new Date().toLocaleString('vi-VN')}\n`

    return bill
}



const generateBillContent = (order) => {

    if (!order) {
        throw new Error('Order object is null or undefined')
    }

    const date = new Date(order.createdAt).toLocaleString('vi-VN')
    const paidDate = order.paidAt ? new Date(order.paidAt).toLocaleString('vi-VN') : new Date().toLocaleString('vi-VN')

    let bill = `
══════════════════════════════════════════
           COFFEE SHOP - HOA BILL
══════════════════════════════════════════

Mã đơn: #${order.id || 'N/A'}
Bàn: ${order.tableName || 'Mang đi'}
Loại: ${order.type === 'AT_TABLE' ? 'Tại bàn' : 'Mang đi'}
Nhân viên: ${order.staffUsername || 'N/A'}
Khách hàng: ${order.customerName || 'Khách vãng lai'}
SĐT: ${order.customerPhone || 'N/A'}

Ngày tạo: ${date}
Ngày thanh toán: ${paidDate}
Phương thức: ${order.paymentMethod || 'N/A'}

══════════════════════════════════════════
                 CHI TIẾT ĐƠN HÀNG
══════════════════════════════════════════

`

    if (order.orderDetails && order.orderDetails.length > 0) {
        order.orderDetails.forEach((item, index) => {
            bill += `${index + 1}. ${item.productName || 'N/A'}\n`
            bill += `   Số lượng: ${item.quantity || 0}\n`
            bill += `   Đơn giá: ${formatCurrency(item.priceAtOrder || 0)}\n`
            bill += `   Thành tiền: ${formatCurrency(item.priceAtOrder * item.quantity || 0)}\n`
            if (item.notes) {
                bill += `   Ghi chú: ${item.notes}\n`
            }
            bill += `\n`
        })
    } else {
        bill += 'Không có chi tiết đơn hàng\n\n'
    }

    bill += `══════════════════════════════════════════\n`
    bill += `Tổng tiền: ${formatCurrency(order.subTotal || 0)}\n`
    if (order.discountAmount > 0) {
        bill += `Giảm giá: -${formatCurrency(order.discountAmount)}\n`
    }
    bill += `THÀNH TIỀN: ${formatCurrency(order.totalAmount || 0)}\n`
    bill += `══════════════════════════════════════════\n\n`

    bill += `Cảm ơn quý khách đã ghé thăm!\n`
    bill += `Hẹn gặp lại quý khách lần sau!\n\n`

    bill += `Thời gian in: ${new Date().toLocaleString('vi-VN')}\n`

    return bill
}

const downloadBill = (content, filename) => {
    const blob = new Blob([content], {type: 'text/plain;charset=utf-8'})
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
}
</script>

<style>
:deep(.order-editor-drawer .el-drawer__body) {
    padding: 22px;
    background: #faf9f6;
    overflow-y: auto;
}

:deep(.order-editor-drawer .el-drawer__header) {
    padding: 22px;
    border-bottom: 1px solid #e7dfd3;
    margin-bottom: 0;
    background: #fffdf9;
}

:deep(.order-editor-drawer .el-drawer__title) {
    font-size: 1.45rem;
    font-weight: 700;
    color: #463a2d;
    letter-spacing: 0.01em;
}

.menu-card {
    height: auto;
    min-height: 600px;
    border-radius: 18px;
    overflow: hidden;
    border: 1px solid #f0e4d6;
    background: linear-gradient(180deg, rgba(255, 253, 248, 0.92), #fffaf1);
    box-shadow: 0 12px 26px rgba(137, 98, 51, 0.08);
}

.menu-card-header,
.cart-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.section-title {
    font-size: 1.18rem;
    font-weight: 700;
    color: #4c3a2a;
}

.menu-header {
    padding: 18px;
    background: rgba(255, 255, 255, 0.7);
    border-bottom: 1px solid #f1e6dc;
}

.product-list {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 15px;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    align-content: start;
    max-height: 490px;
}

.product-item {
    display: flex;
    align-items: center;
    border: 1px solid #eadfd1;
    border-radius: 12px;
    padding: 12px 14px;
    cursor: pointer;
    transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
    background: #fffdf8;
    gap: 14px;
}

.product-item:hover {
    box-shadow: 0 10px 22px rgba(137, 98, 51, 0.12);
    border-color: #e0cdb6;
    transform: translateY(-2px);
}

.product-item-img {
    width: 60px;
    height: 60px;
    border-radius: 10px;
    flex-shrink: 0;
    overflow: hidden;
    display: block;
}

:deep(.product-item-img img) {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.image-slot-small {
    width: 60px;
    height: 60px;
    background: linear-gradient(135deg, #F5F5F5 0%, #E0E0E0 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #BDBDBD;
    border-radius: 10px;
}

.product-item-info {
    margin-left: 0;
    overflow: hidden;
    flex: 1;
}

.product-item-name {
    font-weight: 600;
    font-size: 0.95rem;
    color: #212121;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 4px;
}

.product-item-price {
    font-size: 0.9rem;
    font-weight: 600;
    color: #2196F3;
}

.cart-card {
    height: auto;
    min-height: 600px;
    display: flex;
    flex-direction: column;
    border-radius: 18px;
    overflow: hidden;
    border: 1px solid #e8e0d2;
    background: #ffffff;
    box-shadow: 0 16px 30px rgba(70, 62, 45, 0.16);
}

:deep(.cart-card .el-card__body) {
    flex: 1;
    padding: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: #fefcf8;
}

:deep(.el-tabs) {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: hidden;
}

:deep(.el-tabs__header) {
    margin: 0;
    padding: 0 20px;
    background: #fffdf9;
    border-bottom: 1px solid #e8ddcf;
}

:deep(.el-tabs__nav-wrap::after) {
    display: none;
}

:deep(.el-tabs__item) {
    font-size: 0.98rem;
    font-weight: 600;
    color: #6b6256;
    padding: 0 24px;
    height: 50px;
    line-height: 50px;
}

:deep(.el-tabs__item.is-active) {
    color: #433826;
    font-weight: 700;
}

:deep(.el-tabs__active-bar) {
    height: 3px;
    background: linear-gradient(135deg, #8f6b3f 0%, #5d4629 100%);
}

:deep(.el-tabs__content) {
    flex: 1;
    overflow-y: auto;
}

.el-tab-pane {
    padding: 20px;
}

.item-list {
    max-height: 520px;
    overflow-y: auto;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
    gap: 18px;
}



.cart-item {
    display: grid;
    grid-template-columns: 52px minmax(0, 1fr) auto;
    column-gap: 24px;
    align-items: start;
    padding: 22px 30px 24px 40px;
    background: linear-gradient(180deg, rgba(255, 250, 242, 0.72), #ffffff 88%);
    border-radius: 20px;
    transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.cart-item:hover {
    background: linear-gradient(180deg, rgba(255, 245, 229, 0.85), #ffffff 88%);
    box-shadow: 0 18px 34px rgba(110, 74, 45, 0.18);
    transform: translateY(-2px);
}


.cart-item-info {
    flex: 1;
    margin-right: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
}


.cart-item-index {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    background: rgba(137, 98, 51, 0.18);
    color: #6c4c2b;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 0.9rem;
    margin-right: 0;
    margin-left: 4px;
    flex-shrink: 0;
    align-self: start;
    box-shadow: 0 6px 14px rgba(137, 98, 51, 0.14);
}

.cart-item-name {
    font-weight: 700;
    font-size: 1rem;
    color: #2f2c40;
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    gap: 12px;
}

.item-icon {
    color: #8e6a3d;
}

.cart-item-price {
    font-size: 0.95rem;
    font-weight: 600;
    color: #356f4c;
}

.cart-item-notes {
    margin-top: 0;
    width: 100%;
}

:deep(.cart-item-notes .el-input__wrapper) {
    background: #f6f0e6;
    border-color: transparent;
    transition: border-color 0.18s ease;
}

:deep(.cart-item-notes .el-input__wrapper.is-focus) {
    border-color: rgba(137, 98, 51, 0.4);
}

.cart-item-actions {
    display: flex;
    align-items: center;
    gap: 12px;
}

.cart-item-qty {
    width: 100px;
}

.delete-btn {
    transition: all 0.2s ease;
}

.delete-btn:hover {
    transform: scale(1.1);
}

.cart-summary {
    padding: 0;
    margin: var(--space-4);
}

.summary-gradient {
    padding: var(--space-6);
    background: linear-gradient(135deg, var(--primary-50) 0%, var(--primary-100) 100%);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-md);
}

.total-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: var(--space-3);
    font-size: 1.1rem;
    font-weight: var(--font-medium);
    color: var(--gray-700);
}

.total-row span:first-child {
    display: flex;
    align-items: center;
    gap: var(--space-2);
}

.total-row span:last-child {
    font-weight: var(--font-bold);
    color: var(--gray-900);
}

.total-row.discount span {
    color: var(--danger-600);
    font-weight: var(--font-bold);
}

.total-row.final-total {
    font-size: 1.75rem;
    font-weight: var(--font-bold);
    color: var(--success-700);
    border-top: 3px solid var(--success-500);
    padding-top: var(--space-4);
    margin-top: var(--space-4);
    background: rgba(255, 255, 255, 0.7);
    border-radius: var(--radius-lg);
}

.total-row.final-total span:last-child {
    color: var(--success-700);
}


.payment-methods {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    margin-top: 16px;
}

.payment-methods .el-button {
    height: 66px;
    font-size: 1.05rem;
    font-weight: 600;
    border-radius: 14px;
    border: 1px solid #dfd7ca;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    width: 100%;
    white-space: normal;
    padding: 0 20px;
}

.payment-methods .el-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 22px rgba(94, 80, 63, 0.18);
}

.w-100 {
    width: 100%;
}

.order-actions-bottom {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding-top: 20px;
    border-top: 2px solid #E0E0E0;
    margin-top: 20px;
}

.order-actions-bottom .el-button {
    font-size: 1rem;
    font-weight: 700;
    height: 45px;
    padding: 0 32px;
    border-radius: 12px;
}

.payment-actions-bottom {
    display: flex;
    justify-content: flex-end;
    padding-top: 20px;
    border-top: 2px solid #E0E0E0;
    margin-top: 20px;
}

.payment-actions-bottom .el-button {
    font-size: 1.2rem;
    font-weight: 700;
    height: 60px;
    padding: 0 48px;
    border-radius: 12px;
}

.table-selection {
    max-height: 600px;
    overflow-y: auto;
}

.table-grid-modal {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 15px;
}

.table-card-modal {
    cursor: pointer;
    text-align: center;
    transition: all 0.2s ease;
    border: 2px solid transparent;
}

.table-card-modal:hover {
    transform: translateY(-3px);
    box-shadow: var(--el-box-shadow-light);
}

.table-card-modal.status-empty {
    border-color: var(--el-color-success-light-3);
    background-color: var(--el-color-success-light-9);
}

.table-card-modal.status-empty .table-status {
    color: var(--el-color-success);
}

.table-card-modal.status-serving {
    border-color: var(--el-color-danger-light-3);
    background-color: var(--el-color-danger-light-9);
}

.table-card-modal.status-serving .table-status {
    color: var(--el-color-danger);
}

.table-card-modal.status-reserved {
    border-color: var(--el-color-warning-light-3);
    background-color: var(--el-color-warning-light-9);
    opacity: 0.6;
    cursor: not-allowed;
}

.table-card-modal.status-reserved .table-status {
    color: var(--el-color-warning);
}
</style>
