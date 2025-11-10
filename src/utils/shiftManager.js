const STORAGE_KEY_PREFIX = 'posShiftData'

const safeJsonParse = (value) => {
    try {
        return JSON.parse(value)
    } catch (error) {
        console.warn('[shiftManager] Failed to parse JSON:', error)
        return null
    }
}

const getStorage = () => {
    if (typeof window === 'undefined') return null
    try {
        return window.localStorage
    } catch (error) {
        console.error('[shiftManager] localStorage is not accessible:', error)
        return null
    }
}

const getShiftStorageKey = (userId) => `${STORAGE_KEY_PREFIX}_${userId}`

const createEmptySession = (user) => ({
    userId: user.userId,
    username: user.username || null,
    fullName: user.fullName || null,
    loginTime: new Date().toISOString(),
    orders: []
})

const sanitizeOrderDetails = (details = []) => {
    return details.map((item) => {
        const unitPrice = item.priceAtOrder ?? item.unitPrice ?? item.price ?? 0
        const quantity = item.quantity ?? 0
        return {
            id: item.id ?? null,
            productName: item.productName ?? item.name ?? 'Sản phẩm',
            quantity,
            unitPrice,
            totalPrice: unitPrice * quantity,
            notes: item.notes || ''
        }
    })
}

const sanitizeOrder = (order) => ({
    id: order.id,
    code: order.code ?? `#${order.id}`,
    tableName: order.tableName ?? null,
    type: order.type ?? null,
    status: order.status ?? null,
    createdAt: order.createdAt ?? null,
    paidAt: order.paidAt ?? null,
    subTotal: order.subTotal ?? 0,
    discountAmount: order.discountAmount ?? 0,
    totalAmount: order.totalAmount ?? order.total ?? 0,
    paymentMethod: order.paymentMethod ?? null,
    orderDetails: sanitizeOrderDetails(order.orderDetails || [])
})

export const startShiftSession = (user) => {
    if (!user?.userId) return null
    const storage = getStorage()
    if (!storage) return null

    const payload = createEmptySession(user)
    storage.setItem(getShiftStorageKey(user.userId), JSON.stringify(payload))
    return payload
}

export const getShiftSession = (userId) => {
    if (!userId) return null
    const storage = getStorage()
    if (!storage) return null

    const raw = storage.getItem(getShiftStorageKey(userId))
    if (!raw) return null
    return safeJsonParse(raw)
}

export const setShiftSession = (userId, sessionData) => {
    if (!userId) return null
    const storage = getStorage()
    if (!storage) return null
    storage.setItem(getShiftStorageKey(userId), JSON.stringify(sessionData))
    return sessionData
}

export const upsertShiftOrder = ({ user, order }) => {
    if (!order) return null
    const userId = user?.userId
    if (!userId) return null

    const existingSession = getShiftSession(userId) || startShiftSession(user)
    if (!existingSession) return null

    const safeOrders = Array.isArray(existingSession.orders) ? [...existingSession.orders] : []
    const sanitizedOrder = sanitizeOrder(order)

    const existingIndex = safeOrders.findIndex((item) => item.id === sanitizedOrder.id)
    if (existingIndex !== -1) {
        safeOrders[existingIndex] = sanitizedOrder
    } else {
        safeOrders.push(sanitizedOrder)
    }

    const nextSession = {
        ...existingSession,
        orders: safeOrders
    }

    return setShiftSession(userId, nextSession)
}

export const removeShiftOrder = ({ userId, orderId }) => {
    if (!userId || !orderId) return null
    const session = getShiftSession(userId)
    if (!session) return null

    const filteredOrders = (session.orders || []).filter((order) => order.id !== orderId)
    const nextSession = {
        ...session,
        orders: filteredOrders
    }

    return setShiftSession(userId, nextSession)
}

export const clearShiftSession = (userId) => {
    if (!userId) return
    const storage = getStorage()
    if (!storage) return
    storage.removeItem(getShiftStorageKey(userId))
}

export const buildShiftSummary = ({
    userId,
    logoutTime = new Date().toISOString()
}) => {
    if (!userId) return null
    const session = getShiftSession(userId)
    if (!session) return null

    const orders = Array.isArray(session.orders) ? [...session.orders] : []

    const orderedOrders = orders.sort((a, b) => {
        const timeA = new Date(a.paidAt || a.createdAt || 0).getTime()
        const timeB = new Date(b.paidAt || b.createdAt || 0).getTime()
        return timeA - timeB
    })

    const completedOrders = orderedOrders.filter((order) => order.status !== 'CANCELLED')
    const totalRevenue = completedOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0)
    const totalItems = completedOrders.reduce((sum, order) => {
        const itemsTotal = (order.orderDetails || []).reduce((itemSum, item) => itemSum + (item.quantity || 0), 0)
        return sum + itemsTotal
    }, 0)

    return {
        userId: session.userId,
        username: session.username || null,
        fullName: session.fullName || null,
        loginTime: session.loginTime,
        logoutTime,
        totalOrders: completedOrders.length,
        totalRevenue,
        totalItems,
        orders: orderedOrders
    }
}
