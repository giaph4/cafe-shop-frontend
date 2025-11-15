import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useToast } from 'vue-toastification'

import * as orderService from '@/api/orderService.js'
import { checkVoucher } from '@/api/voucherService.js'
import { useAuthStore } from '@/store/auth.js'
import { upsertShiftOrder } from '@/utils/shiftManager.js'
import { createTaskManager } from '@/utils/storeHelpers.js'

export const usePosStore = defineStore('pos', () => {
    const toast = useToast()
    const authStore = useAuthStore()

    const isModalOpen = ref(false)
    const { loadingAction, lastError, isLoading, runTask } = createTaskManager({ toast })
    const currentTable = ref(null) // Bàn đang được chọn
    const activeOrder = ref(null) // Đơn hàng PENDING (nếu có)

    const isCreating = computed(() => !activeOrder.value && currentTable.value)
    const isEditing = computed(() => !!activeOrder.value)
    const orderItems = computed(() => activeOrder.value?.orderDetails || [])
    const subTotal = computed(() => activeOrder.value?.subTotal || 0)
    const discount = computed(() => activeOrder.value?.discountAmount || 0)
    const total = computed(() => activeOrder.value?.totalAmount || 0)
    const voucher = computed(() => activeOrder.value?.voucherCode || null)

    /**
     * (Hàm Nội bộ) Tải đơn hàng PENDING hoặc chuẩn bị tạo đơn mới
     */
    async function _loadOrderForTable(table) {
        activeOrder.value = null

        if (!table?.id) {
            return
        }

        await runTask('load-order', async () => {
            try {
                const response = await orderService.getPendingOrderByTable(table.id)
                activeOrder.value = response.data
                recordShiftOrder(response.data)
            } catch (error) {
                if (error.response?.status !== 404) {
                    toast.error('Lỗi khi tải đơn hàng của bàn.')
                    throw error
                }
            }
        }, { notify: false })
    }

    /**
     * [ACTION] Mở Modal Bán hàng
     */
    async function openPosModal(table) {
        currentTable.value = table
        lastError.value = null
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
        lastError.value = null
    }

    const recordShiftOrder = (order) => {
        const user = authStore.user
        if (!order || !user?.userId) return
        upsertShiftOrder({user, order})
    }

    /**
     * (Hàm Nội bộ) Tạo đơn hàng mới trước khi thêm món
     */
    async function _createOrderFirst(itemData, customerId = null) {
        if (!currentTable.value) return

        await runTask('create-initial-order', async () => {
            const createRequest = {
                type: currentTable.value.id ? 'AT_TABLE' : 'TAKE_AWAY',
                items: [itemData],
                tableId: currentTable.value.id || undefined,
                customerId: customerId || undefined,
            }

            const response = await orderService.createOrder(createRequest)
            activeOrder.value = response.data
            toast.success(`Đã tạo đơn #${response.data.id} cho ${currentTable.value.name || 'Mang đi'}`)
            recordShiftOrder(response.data)
        }, { fallbackMessage: 'Lỗi khi tạo đơn hàng mới' })
    }

    /**
     * [ACTION] Thêm món (hoặc tạo đơn nếu chưa có)
     */
    async function addItem(itemData, customerId = null) {
        if (isCreating.value) {
            await _createOrderFirst(itemData, customerId)
            return
        }

        if (!isEditing.value) return

        await runTask('add-item', async () => {
            const response = await orderService.addItemToOrder(activeOrder.value.id, itemData)
            activeOrder.value = response.data
            recordShiftOrder(response.data)
            toast.success('Đã thêm món')
        }, { fallbackMessage: 'Lỗi khi thêm món' })
    }

    /**
     * [ACTION] Cập nhật món
     */
    async function updateItem(orderDetailId, updateData) {
        await runTask('update-item', async () => {
            const response = await orderService.updateItemInOrder(activeOrder.value.id, orderDetailId, updateData)
            activeOrder.value = response.data
            recordShiftOrder(response.data)
        }, { fallbackMessage: 'Lỗi khi cập nhật món' })
    }

    /**
     * [ACTION] Xóa món
     */
    async function removeItem(orderDetailId) {
        await runTask('remove-item', async () => {
            const response = await orderService.removeItemFromOrder(activeOrder.value.id, orderDetailId)
            activeOrder.value = response.data
            recordShiftOrder(response.data)
            toast.success('Đã xóa món')

            if (activeOrder.value.orderDetails.length === 0) {
                const canceled = await cancelOrder()
                if (canceled) {
                    toast.info('Đơn hàng đã được hủy vì không còn món nào.')
                }
            }
        }, { fallbackMessage: 'Lỗi khi xóa món' })
    }

    /**
     * [ACTION] Áp dụng Voucher
     */
    async function applyVoucher(code) {
        if (!code) {
            toast.error('Vui lòng nhập mã voucher');
            return;
        }
        await runTask('apply-voucher', async () => {
            const checkRes = await checkVoucher(code, subTotal.value)
            if (!checkRes.data.isValid) {
                toast.error(checkRes.data.message || 'Voucher không hợp lệ')
                return
            }

            const response = await orderService.applyVoucher(activeOrder.value.id, code)
            activeOrder.value = response.data
            recordShiftOrder(response.data)
            toast.success(`Áp dụng voucher ${code} thành công!`)
        }, { notify: false })
    }

    /**
     * [ACTION] Gỡ Voucher
     */
    async function removeVoucher() {
        await runTask('remove-voucher', async () => {
            const response = await orderService.removeVoucher(activeOrder.value.id)
            activeOrder.value = response.data
            recordShiftOrder(response.data)
            toast.info('Đã gỡ voucher')
        }, { fallbackMessage: 'Lỗi khi gỡ voucher' })
    }

    /**
     * [ACTION] Thanh toán
     */
    async function pay(paymentMethod, customerId) {
        try {
            await runTask('pay-order', async () => {
                const response = await orderService.payOrder(activeOrder.value.id, { paymentMethod, customerId })
                activeOrder.value = response.data
                recordShiftOrder(response.data)
                toast.success(`Thanh toán thành công đơn #${response.data.id}`)
                closePosModal()
            }, { notify: false })
            return true
        } catch (error) {
            const msg = error.response?.data?.message || 'Lỗi khi thanh toán'
            if (msg.includes('Not enough stock for ingredient')) {
                toast.error(msg)
            } else {
                toast.error(`Lỗi khi thanh toán: ${msg}`)
            }
            return false
        }
    }

    /**
     * [ACTION] Hủy Đơn
     */
    async function cancelOrder() {
        try {
            await runTask('cancel-order', async () => {
                const response = await orderService.cancelOrder(activeOrder.value.id)
                activeOrder.value = response.data
                recordShiftOrder(response.data)
                toast.success(`Đã hủy đơn #${response.data.id}`)
                closePosModal()
            }, { notify: false })
            return true
        } catch (error) {
            const msg = error.response?.data?.message || 'Lỗi khi hủy đơn hàng'
            toast.error(msg)
            return false
        }
    }

    /**
     * [ACTION] Tạo đơn hàng trực tiếp (từ giỏ hàng tạm)
     */
    async function createOrder(orderData) {
        return await runTask('create-order', async () => {
            const response = await orderService.createOrder(orderData)
            toast.success(`Đã tạo đơn #${response.data.id}`)
            recordShiftOrder(response.data)
            return response.data
        }, { fallbackMessage: 'Lỗi khi tạo đơn hàng' })
    }

    async function assignTableAndCreateOrder(table) {
        try {
            const orderData = {
                tableId: table?.id || null,
                customerId: activeOrder.value?.customerId || null,
                type: table?.id ? 'AT_TABLE' : 'TAKE_AWAY',
                items: orderItems.value.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    notes: item.notes || '',
                })),
            }

            const created = await createOrder(orderData)
            activeOrder.value = created
            if (table?.id) {
                currentTable.value = table
            }
            return true
        } catch (error) {
            return false
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
        loadingAction,
        lastError,

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
        assignTableAndCreateOrder,
    }
})
