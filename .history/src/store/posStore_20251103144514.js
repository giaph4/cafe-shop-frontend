import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getAllTables } from '@/api/tableService'
import { getAllProducts } from '@/api/productService'
import { getAllCategories } from '@/api/categoryService'
import {
    createOrder,
    getOrderById,
    payOrder,
    addOrderDetail,
    updateOrderDetail,
    removeOrderDetail,
} from '@/api/orderService'

// Định nghĩa store mới
export const usePosStore = defineStore('pos', () => {

    // --- STATE ---
    // Dữ liệu nền
    const tables = ref([])
    const products = ref([])
    const categories = ref([])

    // Trạng thái thao tác
    const currentCart = ref([]) // Giỏ hàng tạm (chọn món trước)
    const selectedOrder = ref(null) // Đơn hàng đang xem chi tiết (cột phải)

    // Trạng thái UI
    const isLoading = ref(false)
    const error = ref(null)

    // --- GETTERS (Computed) ---

    // Tổng tiền giỏ hàng tạm
    const currentCartTotal = computed(() => {
        return currentCart.value.reduce(
            (total, item) => total + item.price * item.quantity,
            0
        )
    })

    // Tổng tiền đơn hàng đang chọn (selectedOrder)
    const selectedOrderTotal = computed(() => {
        if (!selectedOrder.value || !selectedOrder.value.orderDetails) return 0
        return selectedOrder.value.orderDetails.reduce(
            (total, item) => total + item.price * item.quantity,
            0
        )
    })

    // --- ACTIONS (Functions) ---

    // Tải dữ liệu ban đầu
    async function fetchTables() {
        try {
            const response = await getAllTables()
            tables.value = response.data
        } catch (err) {
            error.value = 'Không thể tải danh sách bàn.'
        }
    }

    async function fetchMenuData() {
        try {
            const [productsRes, categoriesRes] = await Promise.all([
                getAllProducts(),
                getAllCategories(),
            ])
            products.value = productsRes.data
            categories.value = categoriesRes.data
        } catch (err) {
            error.value = 'Không thể tải menu.'
        }
    }

    // Xóa giỏ hàng tạm và chi tiết đơn
    function clearCart() {
        currentCart.value = []
    }

    function clearSelectedOrder() {
        selectedOrder.value = null
    }

    // 1. Thao tác với Giỏ hàng tạm (currentCart)
    function addItemToCart(product) {
        const existingItem = currentCart.value.find(
            (item) => item.productId === product.id
        )
        if (existingItem) {
            existingItem.quantity += 1
        } else {
            currentCart.value.push({
                productId: product.id,
                name: product.name,
                price: product.price,
                quantity: 1,
            })
        }
    }

    function updateCartItemQuantity(productId, quantity) {
        const item = currentCart.value.find(item => item.productId === productId)
        if (item) {
            if (quantity <= 0) {
                removeItemFromCart(productId);
            } else {
                item.quantity = quantity;
            }
        }
    }

    function removeItemFromCart(productId) {
        currentCart.value = currentCart.value.filter(
            (item) => item.productId !== productId
        )
    }

    // 2. Action chính: Gán giỏ hàng vào bàn (Tình huống 1)
    async function assignCartToTable(tableId) {
        if (currentCart.value.length === 0) return

        isLoading.value = true
        const orderData = {
            tableId: tableId,
            status: 'PENDING',
            items: currentCart.value.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.price,
            })),
        }

        try {
            const response = await createOrder(orderData) // Gọi API
            clearCart() // Xóa giỏ hàng tạm
            selectedOrder.value = response.data // Hiển thị chi tiết đơn vừa tạo
            await fetchTables() // Cập nhật trạng thái bàn
        } catch (err) {
            error.value = 'Lỗi khi tạo đơn hàng cho bàn.'
        } finally {
            isLoading.value = false
        }
    }

    // 3. Action: Tạo đơn mang về (Tình huống 2)
    async function createTakeawayOrder() {
        if (currentCart.value.length === 0) return

        isLoading.value = true
        const orderData = {
            tableId: null, // Mang về
            status: 'PENDING',
            items: currentCart.value.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.price,
            })),
        }

        try {
            const response = await createOrder(orderData)
            clearCart()
            selectedOrder.value = response.data // Hiển thị chi tiết để chuẩn bị thanh toán
        } catch (err) {
            error.value = 'Lỗi khi tạo đơn mang về.'
        } finally {
            isLoading.value = false
        }
    }

    // 4. Action: Chọn xem chi tiết 1 đơn (Tình huống 3, 4)
    async function selectOrder(orderId) {
        isLoading.value = true
        clearCart() // Xóa giỏ hàng tạm (nếu có)
        try {
            const response = await getOrderById(orderId)
            selectedOrder.value = response.data
        } catch (err) {
            error.value = 'Không thể tải chi tiết đơn hàng.'
            selectedOrder.value = null
        } finally {
            isLoading.value = false
        }
    }

    // 5. Action: Thanh toán (Tình huống 3, 4)
    async function processPayment(paymentData) {
        if (!selectedOrder.value) return

        isLoading.value = true
        try {
            await payOrder(selectedOrder.value.id, paymentData)
            clearSelectedOrder() // Xóa chi tiết đơn (quay về menu)
            await fetchTables() // Cập nhật trạng thái bàn (thành TRỐNG)
        } catch (err) {
            error.value = 'Thanh toán thất bại.'
        } finally {
            isLoading.value = false
        }
    }

    // 6. Thao tác với Đơn hàng đang chọn (selectedOrder)
    async function updateSelectedItemQuantity(detailId, quantity) {
        if (!selectedOrder.value) return;

        if (quantity <= 0) {
            await removeSelectedItem(detailId);
            return;
        }

        try {
            const response = await updateOrderDetail(selectedOrder.value.id, detailId, { quantity });
            // Cập nhật lại item trong selectedOrder
            const index = selectedOrder.value.orderDetails.findIndex(d => d.id === detailId);
            if (index !== -1) {
                selectedOrder.value.orderDetails[index] = response.data;
            }
        } catch (err) {
            error.value = 'Lỗi khi cập nhật số lượng món.';
        }
    }

    async function removeSelectedItem(detailId) {
        if (!selectedOrder.value) return;

        try {
            await removeOrderDetail(selectedOrder.value.id, detailId);
            // Xóa item khỏi selectedOrder
            selectedOrder.value.orderDetails = selectedOrder.value.orderDetails.filter(d => d.id !== detailId);
        } catch (err) {
            error.value = 'Lỗi khi xóa món.';
        }
    }

    // Trả về state, getters, và actions
    return {
        // State
        tables,
        products,
        categories,
        currentCart,
        selectedOrder,
        isLoading,
        error,
        // Getters
        currentCartTotal,
        selectedOrderTotal,
        // Actions
        fetchTables,
        fetchMenuData,
        clearCart,
        clearSelectedOrder,
        addItemToCart,
        updateCartItemQuantity,
        removeItemFromCart,
        assignCartToTable,
        createTakeawayOrder,
        selectOrder,
        processPayment,
        updateSelectedItemQuantity,
        removeSelectedItem
    }
})