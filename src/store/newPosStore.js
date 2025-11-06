import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useToast } from 'vue-toastification'
import * as orderService from '@/api/orderService'
import * as tableService from '@/api/tableService'
import * as productService from '@/api/productService'

export const useNewPosStore = defineStore('newPos', () => {
    const toast = useToast()

    // ============ STATE ============
    const currentOrder = ref(null) // Đơn hàng hiện tại đang chỉnh sửa
    const cartItems = ref([]) // Giỏ hàng tạm (chưa gửi server)
    const selectedTable = ref(null) // Bàn được chọn (có thể null nếu mang về)
    const allProducts = ref([]) // Danh sách sản phẩm
    const allTables = ref([]) // Danh sách bàn
    const isLoading = ref(false)

    // ============ COMPUTED ============
    const subTotal = computed(() => {
        return cartItems.value.reduce((sum, item) => {
            return sum + (item.price * item.quantity)
        }, 0)
    })

    const totalItems = computed(() => {
        return cartItems.value.reduce((sum, item) => sum + item.quantity, 0)
    })

    const isTableOrder = computed(() => {
        return selectedTable.value !== null
    })

    const canConfirmOrder = computed(() => {
        return cartItems.value.length > 0
    })

    // ============ ACTIONS ============

    /**
     * Tải danh sách sản phẩm
     */
    async function loadProducts() {
        try {
            const response = await productService.getAvailableProducts()
            allProducts.value = response.data.content.filter(p => p.available)
        } catch (error) {
            toast.error('Lỗi khi tải danh sách sản phẩm')
        }
    }

    /**
     * Tải danh sách bàn
     */
    async function loadTables() {
        try {
            const response = await tableService.getAllTables()
            // Convert SERVING thành PENDING (vì frontend không dùng SERVING)
            allTables.value = response.data.map(table => ({
                ...table,
                status: table.status === 'SERVING' ? 'PENDING' : table.status
            }))
        } catch (error) {
            toast.error('Lỗi khi tải danh sách bàn')
        }
    }

    /**
     * Chọn bàn
     */
    async function selectTable(table) {
        selectedTable.value = table
        
        // Nếu bàn có đơn PENDING, load đơn đó lên
        if (table && table.status === 'PENDING') {
            await loadTableOrder(table.id)
        } else {
            // Bàn trống, giữ giỏ hàng hiện tại
            currentOrder.value = null
        }
    }

    /**
     * Bỏ chọn bàn (chuyển sang mang về)
     */
    function unselectTable() {
        selectedTable.value = null
        currentOrder.value = null
        // Giữ nguyên giỏ hàng
    }

    /**
     * Load đơn hàng PENDING của bàn
     */
    async function loadTableOrder(tableId) {
        isLoading.value = true
        try {
            const response = await orderService.getPendingOrderByTable(tableId)
            currentOrder.value = response.data
            
            // Chuyển items từ server vào giỏ hàng
            cartItems.value = response.data.items.map(item => ({
                id: item.id, // orderDetailId
                productId: item.productId,
                productName: item.productName,
                price: item.priceAtOrder,
                quantity: item.quantity,
                notes: item.notes || '',
                imageUrl: item.imageUrl
            }))
            
            toast.info(`Đã load đơn #${response.data.id}`)
        } catch (error) {
            // Không có đơn PENDING cho bàn này
            console.log('Không tìm thấy đơn pending cho bàn:', tableId)
            currentOrder.value = null
            cartItems.value = []
        } finally {
            isLoading.value = false
        }
    }

    /**
     * Thêm sản phẩm vào giỏ
     */
    function addToCart(product) {
        const existingItem = cartItems.value.find(item => item.productId === product.id)
        
        if (existingItem) {
            existingItem.quantity++
        } else {
            cartItems.value.push({
                id: null, // Chưa có orderDetailId
                productId: product.id,
                productName: product.name,
                price: product.price,
                quantity: 1,
                notes: '',
                imageUrl: product.imageUrl
            })
        }
    }

    /**
     * Cập nhật số lượng
     */
    function updateQuantity(productId, quantity) {
        const item = cartItems.value.find(i => i.productId === productId)
        if (item && quantity > 0) {
            item.quantity = quantity
        }
    }

    /**
     * Cập nhật ghi chú
     */
    function updateNotes(productId, notes) {
        const item = cartItems.value.find(i => i.productId === productId)
        if (item) {
            item.notes = notes
        }
    }

    /**
     * Xóa món khỏi giỏ
     */
    function removeFromCart(productId) {
        const index = cartItems.value.findIndex(i => i.productId === productId)
        if (index > -1) {
            cartItems.value.splice(index, 1)
        }
    }

    /**
     * Xóa toàn bộ giỏ hàng
     */
    function clearCart() {
        cartItems.value = []
        currentOrder.value = null
        selectedTable.value = null
    }

    /**
     * Xác nhận đơn hàng (Gửi lên server) - Tạo hoặc cập nhật đơn PENDING
     */
    async function confirmOrder() {
        if (!canConfirmOrder.value) {
            toast.warning('Giỏ hàng trống!')
            return false
        }

        isLoading.value = true
        try {
            if (currentOrder.value) {
                // Đơn đã tồn tại, cập nhật items
                await syncOrderItems()
                toast.success(`Đã cập nhật đơn #${currentOrder.value.id}`)
                
                // Đảm bảo bàn vẫn ở trạng thái PENDING
                if (selectedTable.value && selectedTable.value.status !== 'PENDING') {
                    selectedTable.value.status = 'PENDING'
                    const tableIndex = allTables.value.findIndex(t => t.id === selectedTable.value.id)
                    if (tableIndex !== -1) {
                        allTables.value[tableIndex].status = 'PENDING'
                    }
                }
            } else {
                // Tạo đơn mới (status sẽ là PENDING)
                const orderData = {
                    tableId: selectedTable.value?.id || null,
                    type: selectedTable.value ? 'AT_TABLE' : 'TAKEAWAY',
                    items: cartItems.value.map(item => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        notes: item.notes
                    }))
                }

                const response = await orderService.createOrder(orderData)
                currentOrder.value = response.data
                toast.success(`Đã tạo đơn #${response.data.id}`)
                
                // Reload bàn từ server (SERVING sẽ tự động convert thành PENDING)
                if (selectedTable.value) {
                    await loadTables()
                    // Cập nhật selectedTable với dữ liệu mới
                    selectedTable.value = allTables.value.find(t => t.id === selectedTable.value.id)
                }
            }
            
            return true
        } catch (error) {
            const msg = error.response?.data?.message || 'Lỗi khi xác nhận đơn hàng'
            toast.error(msg)
            return false
        } finally {
            isLoading.value = false
        }
    }

    /**
     * Đồng bộ items với server (cho đơn đã tồn tại)
     */
    async function syncOrderItems() {
        if (!currentOrder.value) return

        const orderId = currentOrder.value.id
        
        // Xóa các món không còn trong giỏ
        const currentItemIds = cartItems.value.map(i => i.id).filter(id => id !== null)
        const serverItemIds = currentOrder.value.items.map(i => i.id)
        
        for (const itemId of serverItemIds) {
            if (!currentItemIds.includes(itemId)) {
                await orderService.removeOrderItem(orderId, itemId)
            }
        }

        // Thêm/Cập nhật các món trong giỏ
        for (const item of cartItems.value) {
            if (item.id) {
                // Món đã tồn tại, cập nhật
                await orderService.updateOrderItem(orderId, item.id, {
                    quantity: item.quantity,
                    notes: item.notes
                })
            } else {
                // Món mới, thêm vào
                await orderService.addOrderItem(orderId, {
                    productId: item.productId,
                    quantity: item.quantity,
                    notes: item.notes
                })
            }
        }

        // Reload đơn hàng
        await loadTableOrder(selectedTable.value.id)
    }

    /**
     * Thanh toán đơn hàng
     */
    async function payOrder(paymentMethod) {
        if (!currentOrder.value) {
            toast.warning('Không có đơn hàng để thanh toán')
            return false
        }

        isLoading.value = true
        try {
            await orderService.payOrder(currentOrder.value.id, { paymentMethod })
            toast.success('Thanh toán thành công!')
            
            // Clear giỏ hàng và reload bàn
            clearCart()
            await loadTables()
            
            return true
        } catch (error) {
            const msg = error.response?.data?.message || 'Lỗi khi thanh toán'
            toast.error(msg)
            return false
        } finally {
            isLoading.value = false
        }
    }

    /**
     * Hủy đơn hàng
     */
    async function cancelOrder() {
        if (!currentOrder.value) {
            toast.warning('Không có đơn hàng để hủy')
            return false
        }

        isLoading.value = true
        try {
            await orderService.cancelOrder(currentOrder.value.id)
            toast.success('Đã hủy đơn hàng')
            
            clearCart()
            await loadTables()
            
            return true
        } catch (error) {
            const msg = error.response?.data?.message || 'Lỗi khi hủy đơn'
            toast.error(msg)
            return false
        } finally {
            isLoading.value = false
        }
    }

    return {
        // State
        currentOrder,
        cartItems,
        selectedTable,
        allProducts,
        allTables,
        isLoading,
        
        // Computed
        subTotal,
        totalItems,
        isTableOrder,
        canConfirmOrder,
        
        // Actions
        loadProducts,
        loadTables,
        selectTable,
        unselectTable,
        loadTableOrder,
        addToCart,
        updateQuantity,
        updateNotes,
        removeFromCart,
        clearCart,
        confirmOrder,
        payOrder,
        cancelOrder
    }
})
