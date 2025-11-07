// 🎨 CHART COLOR UTILITIES
// Màu sắc đẹp và đa dạng cho charts với transparency

/**
 * Color palette với alpha channel (opacity)
 * Màu coffee-themed nhưng đa dạng và sống động hơn
 */

// Primary palette - Coffee & Warm tones với transparency
export const CHART_COLORS = {
  // Coffee Browns
  espresso: 'rgba(101, 67, 33, 0.8)',      // #654321
  mocha: 'rgba(139, 115, 85, 0.8)',        // #8B7355
  cappuccino: 'rgba(166, 138, 109, 0.8)',  // #A68A6D
  latte: 'rgba(196, 181, 160, 0.8)',       // #C4B5A0
  
  // Complementary colors
  mint: 'rgba(152, 193, 217, 0.8)',        // #98C1D9 - Xanh mint
  coral: 'rgba(238, 108, 77, 0.8)',        // #EE6C4D - Cam coral
  sage: 'rgba(163, 177, 138, 0.8)',        // #A3B18A - Xanh rêu
  rose: 'rgba(219, 112, 147, 0.8)',        // #DB7093 - Hồng
  amber: 'rgba(255, 183, 77, 0.8)',        // #FFB74D - Vàng amber
  lavender: 'rgba(179, 157, 219, 0.8)',    // #B39DDB - Tím nhạt
  
  // Element Plus inspired
  primary: 'rgba(64, 158, 255, 0.8)',      // #409EFF
  success: 'rgba(103, 194, 58, 0.8)',      // #67C23A
  warning: 'rgba(230, 162, 60, 0.8)',      // #E6A23C
  danger: 'rgba(245, 108, 108, 0.8)',      // #F56C6C
  info: 'rgba(144, 147, 153, 0.8)',        // #909399
}

// Array of colors for multi-dataset charts
export const MULTI_COLORS = [
  CHART_COLORS.mocha,
  CHART_COLORS.mint,
  CHART_COLORS.coral,
  CHART_COLORS.sage,
  CHART_COLORS.amber,
  CHART_COLORS.lavender,
  CHART_COLORS.cappuccino,
  CHART_COLORS.rose,
  CHART_COLORS.espresso,
  CHART_COLORS.latte,
]

// Gradient versions (for special charts)
export const GRADIENT_COLORS = {
  coffee: ['rgba(139, 115, 85, 0.9)', 'rgba(139, 115, 85, 0.3)'],
  mint: ['rgba(152, 193, 217, 0.9)', 'rgba(152, 193, 217, 0.3)'],
  sunset: ['rgba(238, 108, 77, 0.9)', 'rgba(255, 183, 77, 0.3)'],
}

/**
 * Tạo màu với custom opacity
 * @param {string} color - Màu từ CHART_COLORS
 * @param {number} alpha - Opacity từ 0-1
 * @returns {string} Color string với alpha mới
 */
export function withOpacity(color, alpha = 0.8) {
  return color.replace(/[\d.]+\)$/g, `${alpha})`)
}

/**
 * Get N màu từ palette
 * @param {number} count - Số lượng màu cần
 * @returns {Array<string>} Array of colors
 */
export function getChartColors(count) {
  const colors = [...MULTI_COLORS]
  
  // Nếu cần nhiều màu hơn palette, lặp lại với opacity khác
  while (colors.length < count) {
    colors.push(...MULTI_COLORS.map(c => withOpacity(c, 0.6)))
  }
  
  return colors.slice(0, count)
}

/**
 * Get border colors (darker, less transparent)
 * @param {number} count - Số lượng màu cần
 * @returns {Array<string>} Array of border colors
 */
export function getChartBorderColors(count) {
  return getChartColors(count).map(c => withOpacity(c, 1.0))
}

/**
 * Chart default options với styling đẹp
 */
export const DEFAULT_CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'bottom',
      labels: {
        padding: 15,
        font: {
          size: 12,
          weight: 'bold'
        },
        usePointStyle: true,
        pointStyle: 'circle'
      }
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: 12,
      titleFont: { size: 14, weight: 'bold' },
      bodyFont: { size: 13 },
      borderColor: 'rgba(255, 255, 255, 0.2)',
      borderWidth: 1,
      displayColors: true,
      boxPadding: 6
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(0, 0, 0, 0.05)',
        drawBorder: false
      },
      ticks: {
        font: { size: 11 }
      }
    },
    x: {
      grid: {
        display: false,
        drawBorder: false
      },
      ticks: {
        font: { size: 11 }
      }
    }
  },
  animation: {
    duration: 1000,
    easing: 'easeInOutQuart'
  }
}

/**
 * Line chart specific options
 */
export const LINE_CHART_OPTIONS = {
  ...DEFAULT_CHART_OPTIONS,
  elements: {
    line: {
      tension: 0.4,  // Smooth curves
      borderWidth: 3
    },
    point: {
      radius: 4,
      hoverRadius: 6,
      hitRadius: 10
    }
  }
}

/**
 * Bar chart specific options
 */
export const BAR_CHART_OPTIONS = {
  ...DEFAULT_CHART_OPTIONS,
  borderRadius: 8,
  borderSkipped: false,
}

/**
 * Pie/Doughnut chart specific options
 */
export const PIE_CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'right',
      labels: {
        padding: 15,
        font: { size: 12, weight: 'bold' },
        usePointStyle: true,
        pointStyle: 'circle',
        generateLabels: (chart) => {
          const data = chart.data
          if (data.labels.length && data.datasets.length) {
            return data.labels.map((label, i) => {
              const value = data.datasets[0].data[i]
              const total = data.datasets[0].data.reduce((a, b) => a + b, 0)
              const percentage = ((value / total) * 100).toFixed(1)
              
              return {
                text: `${label} (${percentage}%)`,
                fillStyle: data.datasets[0].backgroundColor[i],
                hidden: false,
                index: i
              }
            })
          }
          return []
        }
      }
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: 12,
      callbacks: {
        label: (context) => {
          const label = context.label || ''
          const value = context.parsed || 0
          const total = context.dataset.data.reduce((a, b) => a + b, 0)
          const percentage = ((value / total) * 100).toFixed(1)
          return `${label}: ${value.toLocaleString()} (${percentage}%)`
        }
      }
    }
  },
  animation: {
    duration: 1000,
    easing: 'easeInOutQuart'
  }
}
