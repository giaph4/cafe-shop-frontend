const FALLBACK_MESSAGE = 'Không thể thanh toán, vui lòng thử lại.'

export function mapPaymentError(error) {
    const status = error.response?.status
    const message = error.response?.data?.message

    if (!status) {
        return message || FALLBACK_MESSAGE
    }

    switch (status) {
        case 404:
            return 'Đơn hàng không tồn tại hoặc đã bị xoá.'
        case 409:
            return message || 'Xung đột dữ liệu. Kiểm tra lại thông tin khách hàng/voucher.'
        case 400:
            if (message?.includes('Cannot pay order with status')) {
                return 'Đơn đã được thanh toán hoặc không khả dụng.'
            }
            if (message?.includes('Invalid payment method')) {
                return 'Phương thức thanh toán không hợp lệ.'
            }
            if (message?.includes('Not enough stock for ingredient')) {
                return 'Kho không đủ nguyên liệu, vui lòng thử lại sau.'
            }
            return message || FALLBACK_MESSAGE
        default:
            return message || FALLBACK_MESSAGE
    }
}
