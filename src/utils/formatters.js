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

const EXPENSE_COLORS = {
    UTILITY: 'rgba(255, 99, 132, 0.7)',
    SALARY: 'rgba(54, 162, 235, 0.7)',
    RENT: 'rgba(255, 206, 86, 0.7)',
    MARKETING: 'rgba(75, 192, 192, 0.7)',
    INGREDIENT_PURCHASE: 'rgba(153, 102, 255, 0.7)',
    OTHER: 'rgba(201, 203, 207, 0.7)',
};
const DEFAULT_COLOR = 'rgba(100, 100, 100, 0.7)';

/**
 *  Chuyển đổi dữ liệu API chi phí sang định dạng Stacked Bar Chart
 * @param {object} apiData - Dữ liệu từ API (ví dụ: {"2025-11-01": {"SALARY": 500}})
 * @returns {object} - Dữ liệu cho Chart.js (labels, datasets)
 */
export const formatStackedBarChartData = (apiData) => {
    const labels = Object.keys(apiData); // ['2025-11-01', '2025-11-02', ...]
    const categories = new Set(); // Set các loại chi phí (SALARY, RENT, ...)

    // Lấy tất cả các loại chi phí
    labels.forEach(date => {
        Object.keys(apiData[date]).forEach(category => {
            categories.add(category);
        });
    });

    const datasets = Array.from(categories).map(category => {
        // Tạo dataset cho mỗi loại (ví dụ: { label: 'SALARY', data: [...] })
        return {
            label: category,
            backgroundColor: EXPENSE_COLORS[category] || DEFAULT_COLOR,
            data: labels.map(date => apiData[date][category] || 0) // Lấy data cho mỗi ngày, nếu không có thì là 0
        };
    });

    return { labels, datasets };
};
