/**
 * Chart Helper Utilities
 * Reusable functions for creating chart data
 */

import { getChartColors } from './chartColors.js'

/**
 * Create bar chart data with consistent styling
 * @param {Array} labels - Chart labels
 * @param {Array} data - Chart data values
 * @param {string} label - Dataset label (default: 'Dữ liệu')
 * @returns {Object} Chart data object
 */
export function createBarChartData(labels, data, label = 'Dữ liệu') {
  const count = labels.length
  
  return {
    labels,
    datasets: [{
      label,
      backgroundColor: getChartColors(count),
      borderColor: getChartColors(count).map(c => c.replace('0.8)', '1.0)')),
      borderWidth: 2,
      borderRadius: 8,
      data
    }]
  }
}

/**
 * Create pie/doughnut chart data with consistent styling
 * @param {Array} labels - Chart labels
 * @param {Array} data - Chart data values
 * @param {string} label - Dataset label (default: 'Dữ liệu')
 * @returns {Object} Chart data object
 */
export function createPieChartData(labels, data, label = 'Dữ liệu') {
  const count = labels.length
  
  return {
    labels,
    datasets: [{
      label,
      backgroundColor: getChartColors(count),
      borderColor: '#ffffff',
      borderWidth: 3,
      data
    }]
  }
}

/**
 * Create line chart data with consistent styling
 * @param {Array} labels - Chart labels
 * @param {Array} data - Chart data values
 * @param {string} label - Dataset label (default: 'Dữ liệu')
 * @param {Object} options - Additional options (color, fill, etc.)
 * @returns {Object} Chart data object
 */
export function createLineChartData(labels, data, label = 'Dữ liệu', options = {}) {
  const {
    color = 'rgba(139, 115, 85, 0.8)',
    fill = false,
    tension = 0.4
  } = options
  
  return {
    labels,
    datasets: [{
      label,
      backgroundColor: color,
      borderColor: color.replace('0.8)', '1.0)'),
      borderWidth: 3,
      tension,
      fill,
      data,
      pointRadius: 4,
      pointHoverRadius: 6
    }]
  }
}

