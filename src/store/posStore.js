// src/store/posStore.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useToast } from 'vue-toastification'
// Thêm .js cho tất cả các import local
import * as orderService from '@/api/orderService.js'
import { checkVoucher } from '@/api/voucherService.js'

export const usePosStore = defineStore('pos', () => {
    const toast = useToast()

    // --- STATE ---
    const isModalOpen = ref(false)
    const isLoading = ref(false)
    const currentTable = ref(null) // Bàn đang được chọn
    const activeOrder = ref(null) // Đơn hàng PENDING (nếu có)

    // --- GETTERS (Computed) ---
    const isCreating = computed(() => !activeOrder.value && currentTable.value)
    const isEditing = computed(() => !!activeOrder.value)
    const orderItems = computed(() => activeOrder.value?.orderDetails || [])
    const subTotal = computed(() => activeOrder.value?.subTotal || 0)
    const discount = computed(() => activeOrder.value?.discountAmount || 0)
    const total = computed(() => activeOrder.value?.totalAmount || 0)
    const voucher = computed(() => activeOrder.value?.voucherCode || null)

    // --- ACTIONS ---

    /**
     * (Hàm Nội bộ) Tải đơn hàng PENDING hoặc chuẩn bị tạo đơn mới
     */
    async function _loadOrderForTable(table) {
        isLoading.value = true
        activeOrder.value = null

        // Đơn mang đi (không có table.id) sẽ không tải
        if (!table.id) {
            isLoading.value = false
            return;
        }

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
     * [ACTION] Đóng Modal Bán hàng
     */
    function closePosModal() {
        isModalOpen.value = false
        currentTable.value = null
        activeOrder.value = null
    }

    /**
     * (Hàm Nội bộ) Tạo đơn hàng mới trước khi thêm món
     */
    async function _createOrderFirst(itemData, customerId = null) {
        if (!currentTable.value) return;
        isLoading.value = true;
        try {
            const createRequest = {
                type: currentTable.value.id ? 'AT_TABLE' : 'TAKE_AWAY',
                items: [itemData], // Thêm món đầu tiên ngay khi tạo
            }
            
            // Chỉ thêm tableId nếu có (không phải TAKE_AWAY)
            if (currentTable.value.id) {
                createRequest.tableId = currentTable.value.id
            }
            
            // Chỉ thêm customerId nếu có
            if (customerId) {
                createRequest.customerId = customerId
            }
            
            // API: POST /api/v1/orders
            console.log('Creating order with request:', createRequest)
            const response = await orderService.createOrder(createRequest)
            activeOrder.value = response.data
            toast.success(`Đã tạo đơn #${response.data.id} cho ${currentTable.value.name}`)
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Lỗi khi tạo đơn hàng mới'
            toast.error(errorMsg)
            console.error('Create order error:', error.response?.data || error)
            throw error // Ném lỗi để modal biết
        } finally {
            isLoading.value = false
        }
    }

    /**
     * [ACTION] Thêm món (hoặc tạo đơn nếu chưa có)
     */
    async function addItem(itemData, customerId = null) {
        if (isCreating.value) {
            // Nếu là đơn mới, gọi API tạo đơn
            await _createOrderFirst(itemData, customerId)
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
        try {
            isLoading.value = true
            // API: PUT /api/v1/orders/{orderId}/items/{orderDetailId}
            const response = await orderService.updateItemInOrder(activeOrder.value.id, orderDetailId, updateData)
            activeOrder.value = response.data
            // toast.success('Cập nhật số lượng thành công') // (Tắt toast cho mượt)
        } catch (error) {
            toast.error('Lỗi khi cập nhật món')
        } finally {
            isLoading.value = false
        }
    }

    /**
     * [ACTION] Xóa món
     */
    async function removeItem(orderDetailId) {
        try {
            isLoading.value = true
            // API: DELETE /api/v1/orders/{orderId}/items/{orderDetailId}
            const response = await orderService.removeItemFromOrder(activeOrder.value.id, orderDetailId)
            activeOrder.value = response.data
            toast.success('Đã xóa món')

            // Nếu không còn món nào trong đơn, tự động hủy đơn
            if (activeOrder.value.orderDetails.length === 0) {
                await cancelOrder()
                toast.info('Đơn hàng đã được hủy vì không còn món nào.')
            }
        } catch (error) {
            toast.error('Lỗi khi xóa món')
        } finally {
            isLoading.value = false
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
            // 1. Kiểm tra Voucher
            const checkRes = await checkVoucher(code, subTotal.value)
            if (!checkRes.data.isValid) { // DTO dùng 'isValid'
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
            // (Backend của bạn chưa có API gán Customer cho Order PENDING)
            // (Nên chúng ta bỏ qua việc gán customerId ở đây)

            // API: POST /api/v1/orders/{orderId}/payment
            const response = await orderService.payOrder(activeOrder.value.id, { paymentMethod, customerId })
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
                toast.error('Lỗi khi thanh toán: ' + msg)
            }
            return false // Báo thất bại
        } finally {
            isLoading.value = false
        }
    }

    /**
     * [ACTION] Hủy Đơn
     */
    async function cancelOrder() {
        isLoading.value = true
        try {
            // API: POST /api/v1/orders/{orderId}/cancel
            const response = await orderService.cancelOrder(activeOrder.value.id)
            activeOrder.value = response.data // Đơn hàng đã CANCELLED
            toast.success(`Đã hủy đơn #${response.data.id}`)
            closePosModal() // Đóng modal
            return true // Báo thành công
        } catch (error) {
            const msg = error.response?.data?.message || 'Lỗi khi hủy đơn hàng'
            toast.error(msg)
            return false // Báo thất bại
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
            // Tạo request object sạch (không có null values)
            const cleanRequest = {
                type: orderData.type,
                items: orderData.items
            }
            
            // Chỉ thêm tableId nếu có
            if (orderData.tableId) {
                cleanRequest.tableId = orderData.tableId
            }
            
            // Chỉ thêm customerId nếu có
            if (orderData.customerId) {
                cleanRequest.customerId = orderData.customerId
            }
            
            const response = await orderService.createOrder(cleanRequest)
            toast.success(`Đã tạo đơn #${response.data.id}`)
            return response.data
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || 'Lỗi khi tạo đơn hàng'
            console.error('Create order error:', error.response?.data || error)
            toast.error(errorMsg)
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

        openPosModal,
        closePosModal,
        addItem,
        updateItem,
        removeItem,
        applyVoucher,
        removeVoucher,
        pay,
        cancelOrder,
        createOrder,
    }
})