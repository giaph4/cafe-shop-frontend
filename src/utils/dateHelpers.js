/**
 * Date Helper Utilities
 * Centralized date functions to avoid code duplication
 */

/**
 * Get default date range (last N days)
 * @param {number} days - Number of days back (default: 30)
 * @returns {[Date, Date]} [startDate, endDate]
 */
export function getDefaultDateRange(days = 30) {
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - days)
  return [start, end]
}

/**
 * Get date range based on quick filter option
 * @param {string} filter - Filter type: 'today', 'week', 'month'
 * @returns {[Date, Date]} [startDate, endDate]
 */
export function getDateRangeByFilter(filter) {
  const end = new Date()
  const start = new Date()
  
  switch (filter) {
    case 'today':
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
      break
    case 'week':
      start.setDate(end.getDate() - 7)
      break
    case 'month':
      start.setDate(end.getDate() - 30)
      break
    default:
      // Custom - don't modify dates
      return [start, end]
  }
  
  return [start, end]
}

/**
 * Format date to Vietnamese locale
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
export function formatDateVN(date) {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('vi-VN')
}

/**
 * Format datetime to Vietnamese locale
 * @param {Date|string} datetime - Datetime to format
 * @returns {string} Formatted datetime string
 */
export function formatDateTimeVN(datetime) {
  if (!datetime) return 'N/A'
  return new Date(datetime).toLocaleString('vi-VN')
}
