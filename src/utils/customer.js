export const normalizeCustomer = (raw = {}) => {
    const id = raw.id ?? raw.customerId
    if (!id) return null

    return {
        id,
        fullName: raw.fullName || raw.name || raw.customerName || 'Khách hàng',
        phone: raw.phone || raw.customerPhone || '',
    }
}

export const mapCustomers = (list) => {
    if (!Array.isArray(list)) return []
    return list
        .map(normalizeCustomer)
        .filter(Boolean)
}

export const upsertCustomerOption = (listRef, raw) => {
    if (!listRef || typeof listRef !== 'object' || !('value' in listRef)) return
    const normalized = normalizeCustomer(raw)
    if (!normalized) return
    const existingIndex = listRef.value.findIndex((item) => item.id === normalized.id)
    if (existingIndex === -1) {
        listRef.value.push(normalized)
    } else {
        listRef.value.splice(existingIndex, 1, normalized)
    }
}
