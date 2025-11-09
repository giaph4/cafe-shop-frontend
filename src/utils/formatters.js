import { getChartColors } from './chartColors.js'

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

export const formatStackedBarChartData = (apiData) => {
    const labels = Object.keys(apiData); // ['2025-11-01', '2025-11-02', ...]
    const categories = new Set(); // Set các loại chi phí (SALARY, RENT, ...)

    // Lấy tất cả các loại chi phí
    labels.forEach(date => {
        Object.keys(apiData[date]).forEach(category => {
            categories.add(category);
        });
    });

    const categoryArray = Array.from(categories);
    const colors = getChartColors(categoryArray.length);

    const datasets = categoryArray.map((category, index) => {
        // Tạo dataset cho mỗi loại (ví dụ: { label: 'SALARY', data: [...] })
        return {
            label: category,
            backgroundColor: colors[index],
            data: labels.map(date => apiData[date][category] || 0) // Lấy data cho mỗi ngày, nếu không có thì là 0
        };
    });

    return { labels, datasets };
};
