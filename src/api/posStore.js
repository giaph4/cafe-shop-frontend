// src/store/posStore.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useToast } from 'vue-toastification'
import * as orderService from '@/api/orderService'
import { checkVoucher } from '@/api/voucherService'

export const usePosStore = defineStore('pos', () => {
    const toast = useToast()

    // --- STATE ---
    const isModalOpen = ref(false)
    const isLoading = ref(false)
    const currentTable = ref(null) // Bàn đang được chọn
    const activeOrder = ref(null) // Đơn hàng PENDING (nếu có)
    const allProducts = ref([]) // Danh sách sản phẩm để chọn
    const allCustomers = ref([]) // Danh sách khách hàng (để tìm)
    const pendingItems = ref([]) // Các món được chọn trước khi chọn bàn
    const isQuickOrder = ref(false) // Chế độ chọn món trước

    // --- GETTERS (Computed) ---
    const isCreating = computed(() => !activeOrder.value && currentTable.value)
    const isEditing = computed(() => !!activeOrder.value)
    const orderItems = computed(() => {
        if (isQuickOrder.value && !activeOrder.value) {
            return pendingItems.value
        }
        return activeOrder.value?.orderDetails || []
    })
    const subTotal = computed(() => {
        if (isQuickOrder.value && !activeOrder.value) {
            return pendingItems.value.reduce((sum, item) => sum + (item.priceAtOrder * item.quantity), 0)
        }
        return activeOrder.value?.subTotal || 0
    })
    const discount = computed(() => activeOrder.value?.discountAmount || 0)
    const total = computed(() => {
        if (isQuickOrder.value && !activeOrder.value) {
            return subTotal.value - discount.value
        }
        return activeOrder.value?.totalAmount || 0
    })
    const voucher = computed(() => activeOrder.value?.voucherCode || null)

    // --- ACTIONS ---

    /**
     * (Hàm Nội bộ) Tải đơn hàng PENDING hoặc chuẩn bị tạo đơn mới
     */
    async function _loadOrderForTable(table) {
        isLoading.value = true
        activeOrder.value = null
        try {
            // API: GET /api/v1/orders/table/{tableId}/pending
            const response = await orderService.getPendingOrderByTable(table.id)
            activeOrder.value = response.data
        } catch (error) {
            if (error.response && error.response.status === 404) {
                // Không tìm thấy đơn PENDING -> Sẵn sàng tạo đơn mới
                console.log(`Bàn ${table.name} chưa có đơn. Sẵn sàng tạo mới.`);
            } else {
                toast.error('Lỗi khi tải đơn hàng của bàn.')
            }
        } finally {
            isLoading.value = false
        }
    }

    /**
     * [ACTION] Mở Modal Bán hàng
     */
    async function openPosModal(table) {
        currentTable.value = table
        isModalOpen.value = true
        await _loadOrderForTable(table)
    }

    /**
     * [ACTION] Mở modal chọn món nhanh (không cần bàn)
     */
    function openQuickOrder() {
        isQuickOrder.value = true
        currentTable.value = null
        activeOrder.value = null
        pendingItems.value = []
        isModalOpen.value = true
    }

    /**
     * [ACTION] Đóng Modal Bán hàng
     */
    function closePosModal() {
        isModalOpen.value = false
        currentTable.value = null
        activeOrder.value = null
        isQuickOrder.value = false
        pendingItems.value = []
    }

    /**
     * (Hàm Nội bộ) Tạo đơn hàng mới trước khi thêm món
     */
    async function _createOrderFirst(itemData) {
        if (!currentTable.value) return;
        isLoading.value = true;
        try {
            const createRequest = {
                tableId: currentTable.value.id,
                type: 'AT_TABLE',
                items: [itemData] // Thêm món đầu tiên ngay khi tạo
            }
            // API: POST /api/v1/orders
            const response = await orderService.createOrder(createRequest)
            activeOrder.value = response.data
            toast.success(`Đã tạo đơn #${response.data.id} cho bàn ${currentTable.value.name}`)
        } catch (error) {
            toast.error('Lỗi khi tạo đơn hàng mới')
            throw error // Ném lỗi để modal biết
        } finally {
            isLoading.value = false
        }
    }

    /**
     * [ACTION] Thêm món (hoặc tạo đơn nếu chưa có)
     */
    async function addItem(itemData, productInfo = null) {
        if (isQuickOrder.value && !activeOrder.value) {
            // Chế độ chọn món nhanh - chưa có bàn
            const newItem = {
                id: Date.now(), // ID tạm thời
                productId: itemData.productId,
                productName: productInfo?.name || 'Sản phẩm',
                quantity: itemData.quantity,
                priceAtOrder: productInfo?.price || 0,
                notes: itemData.notes || ''
            }
            pendingItems.value.push(newItem)
            toast.success('Đã thêm món')
        } else if (isCreating.value) {
            // Nếu là đơn mới, gọi API tạo đơn
            await _createOrderFirst(itemData)
        } else if (isEditing.value) {
            // Nếu là đơn cũ, gọi API thêm món
            try {
                isLoading.value = true
                // API: POST /api/v1/orders/{orderId}/items
                const response = await orderService.addItemToOrder(activeOrder.value.id, itemData)
                activeOrder.value = response.data // Cập nhật lại toàn bộ đơn hàng
                toast.success('Đã thêm món')
            } catch (error) {
                toast.error('Lỗi khi thêm món')
            } finally {
                isLoading.value = false
            }
        }
    }

    /**
     * [ACTION] Cập nhật món
     */
    async function updateItem(orderDetailId, updateData) {
        if (isQuickOrder.value && !activeOrder.value) {
            // Cập nhật món trong pendingItems
            const item = pendingItems.value.find(i => i.id === orderDetailId)
            if (item) {
                if (updateData.quantity > 0) {
                    item.quantity = updateData.quantity
                }
                if (updateData.notes !== null && updateData.notes !== undefined) {
                    item.notes = updateData.notes
                }
                toast.success('Cập nhật số lượng thành công')
            }
        } else {
            try {
                isLoading.value = true
                // API: PUT /api/v1/orders/{orderId}/items/{orderDetailId}
                const response = await orderService.updateItemInOrder(activeOrder.value.id, orderDetailId, updateData)
                activeOrder.value = response.data
                toast.success('Cập nhật số lượng thành công')
            } catch (error) {
                toast.error('Lỗi khi cập nhật món')
            } finally {
                isLoading.value = false
            }
        }
    }

    /**
     * [ACTION] Xóa món
     */
    async function removeItem(orderDetailId) {
        if (isQuickOrder.value && !activeOrder.value) {
            // Xóa món khỏi pendingItems
            const index = pendingItems.value.findIndex(i => i.id === orderDetailId)
            if (index !== -1) {
                pendingItems.value.splice(index, 1)
                toast.success('Đã xóa món')
            }
        } else {
            try {
                isLoading.value = true
                // API: DELETE /api/v1/orders/{orderId}/items/{orderDetailId}
                const response = await orderService.removeItemFromOrder(activeOrder.value.id, orderDetailId)
                activeOrder.value = response.data
                toast.success('Đã xóa món')
            } catch (error) {
                toast.error('Lỗi khi xóa món')
            } finally {
                isLoading.value = false
            }
        }
    }

    /**
     * [ACTION] Áp dụng Voucher
     */
    async function applyVoucher(code) {
        if (!code) {
            toast.error('Vui lòng nhập mã voucher');
            return;
        }
        isLoading.value = true
        try {
            // 1. Kiểm tra Voucher (API backend không bắt buộc, nhưng nên có)
            const checkRes = await checkVoucher(code, subTotal.value)
            if (!checkRes.data.valid) {
                toast.error(checkRes.data.message || 'Voucher không hợp lệ')
                isLoading.value = false
                return;
            }

            // 2. Áp dụng Voucher
            // API: POST /api/v1/orders/{orderId}/voucher
            const response = await orderService.applyVoucher(activeOrder.value.id, code)
            activeOrder.value = response.data
            toast.success(`Áp dụng voucher ${code} thành công!`)
        } catch (error) {
            const msg = error.response?.data?.message || 'Lỗi khi áp dụng voucher'
            toast.error(msg)
        } finally {
            isLoading.value = false
        }
    }

    /**
     * [ACTION] Gỡ Voucher
     */
    async function removeVoucher() {
        isLoading.value = true
        try {
            // API: DELETE /api/v1/orders/{orderId}/voucher
            const response = await orderService.removeVoucher(activeOrder.value.id)
            activeOrder.value = response.data
            toast.info('Đã gỡ voucher')
        } catch (error) {
            toast.error('Lỗi khi gỡ voucher')
        } finally {
            isLoading.value = false
        }
    }

    /**
     * [ACTION] Thanh toán
     */
    async function pay(paymentMethod, customerId) {
        isLoading.value = true
        try {
            // Gắn customerId vào đơn hàng (Backend chưa hỗ trợ API này, 
            // nhưng chúng ta giả định nó sẽ được thêm vào)
            if (customerId) {
                // (Tạm thời bỏ qua vì thiếu API `PUT /api/v1/orders/{id}/customer`)
            }

            // API: POST /api/v1/orders/{orderId}/payment
            const response = await orderService.payOrder(activeOrder.value.id, { paymentMethod })
            activeOrder.value = response.data // Đơn hàng đã PAID
            toast.success(`Thanh toán thành công đơn #${response.data.id}`)
            closePosModal() // Đóng modal
            return true // Báo thành công
        } catch (error) {
            // Bắt lỗi hết hàng từ backend
            const msg = error.response?.data?.message || 'Lỗi khi thanh toán'
            if (msg.includes("Not enough stock for ingredient")) {
                toast.error(msg)
            } else {
                toast.error('Lỗi khi thanh toán')
            }
            return false // Báo thất bại
        } finally {
            isLoading.value = false
        }
    }

    /**
     * [ACTION] Gán bàn cho đơn nhanh và tạo đơn
     */
    async function assignTableAndCreateOrder(table) {
        if (!isQuickOrder.value || pendingItems.value.length === 0) {
            toast.error('Không có món nào để tạo đơn')
            return false
        }

        isLoading.value = true
        try {
            currentTable.value = table
            const items = pendingItems.value.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                notes: item.notes
            }))

            const createRequest = {
                tableId: table.id,
                type: table.id ? 'AT_TABLE' : 'TAKE_AWAY',
                items: items
            }

            // API: POST /api/v1/orders
            const response = await orderService.createOrder(createRequest)
            activeOrder.value = response.data
            isQuickOrder.value = false
            pendingItems.value = []
            toast.success(`Đã tạo đơn #${response.data.id} cho bàn ${table.name}`)
            return true
        } catch (error) {
            toast.error('Lỗi khi tạo đơn hàng')
            return false
        } finally {
            isLoading.value = false
        }
    }

    /**
     * [ACTION] Tạo đơn hàng trực tiếp (từ giỏ hàng tạm)
     */
    async function createOrder(orderData) {
        isLoading.value = true
        try {
            const response = await orderService.createOrder(orderData)
            toast.success(`Đã tạo đơn #${response.data.id}`)
            return response.data
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || 'Lỗi khi tạo đơn hàng'
            console.error('Create order error:', error)
            throw error
        } finally {
            isLoading.value = false
        }
    }

    // Trả về state và actions
    return {
        isModalOpen,
        isLoading,
        currentTable,
        activeOrder,
        isCreating,
        isEditing,
        orderItems,
        subTotal,
        discount,
        total,
        voucher,
        isQuickOrder,
        pendingItems,

        openPosModal,
        openQuickOrder,
        closePosModal,
        addItem,
        updateItem,
        removeItem,
        applyVoucher,
        removeVoucher,
        pay,
        assignTableAndCreateOrder,
        createOrder,
    }
})