// src/utils/formatters.js

/**
 * Định dạng số thành tiền tệ VND
 * @param {number} value - Số tiền
 * @returns {string} - Chuỗi đã định dạng (ví dụ: "50.000 ₫")
 */
export const formatCurrency = (value) => {
    if (value === null || value === undefined) {
      value = 0;
    }
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0, // Bỏ .00 
    }).format(value);
  };
  
  /**
   * Định dạng đối tượng Date hoặc chuỗi ngày thành "YYYY-MM-DD"
   * @param {string | Date} date - Ngày cần định dạng
   * @returns {string} - Chuỗi "YYYY-MM-DD"
   */
  export const formatDateISO = (date) => {
    if (!date) return '';
    try {
      const d = new Date(date);
      const year = d.getFullYear();
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const day = d.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error("Invalid date for formatDateISO:", date, error);
      return '';
    }
  };