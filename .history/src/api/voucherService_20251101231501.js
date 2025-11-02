// src/api/voucherService.js
import apiClient from './axios'

/**
 * Kiểm tra mã voucher
 * @param {string} code Mã voucher
 * @param {number} amount Tổng tiền đơn hàng
 */
export const checkVoucher = (code, amount) => {
    return apiClient.get('/api/v1/vouchers/check', {
        params: { code, amount }
    })
}