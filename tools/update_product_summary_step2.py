import sys
import re
from pathlib import Path

FILE_PATH = Path(r"C:\\CODING\\SpringNghiemTuc\\coffee-shop-frontend\\src\\views\\Reports.vue")

if not FILE_PATH.exists():
    sys.stderr.write(f"Target file not found: {FILE_PATH}\n")
    sys.exit(1)

text = FILE_PATH.read_text(encoding="utf-8")
changed = False

# 1. Ensure getProducts import
import_statement = "import { getProducts } from '@/api/productService.js'\n"
if "getProducts" not in text.split("import {")[1]:
    marker = "import { getChartColors"  # insert before chart colors import
    idx = text.find(marker)
    if idx == -1:
        sys.stderr.write("Could not find chart colors import to insert getProducts.\n")
        sys.exit(1)
    text = text[:idx] + import_statement + text[idx:]
    changed = True

# 2. Remove duplicate show-index from product summary table
old_fragment = (
    '                                :row-class-name="productSummaryRowClass"\n'
    '                                show-index\n'
    '                                alternating\n'
)
new_fragment = (
    '                                :row-class-name="productSummaryRowClass"\n'
    '                                alternating\n'
)
if old_fragment in text:
    text = text.replace(old_fragment, new_fragment, 1)
    changed = True

# 3. Update index slot to display index + 1
old_index_slot = "{{ index }}"
if old_index_slot in text:
    text = text.replace(old_index_slot, "{{ index + 1 }}", 1)
    changed = True

# 4. Replace fetchProductSalesSummary function
start_tag = "const fetchProductSalesSummary = async () => {"
end_tag = "\n\nconst fetchCategorySales"
start_idx = text.find(start_tag)
end_idx = text.find(end_tag, start_idx)
if start_idx == -1 or end_idx == -1:
    sys.stderr.write("Could not locate fetchProductSalesSummary function for replacement.\n")
    sys.exit(1)

new_function = """const fetchProductSalesSummary = async () => {\n    loading.productSummary = true\n    try {\n        const start = formatDateISO(startDate.value)\n        const end = formatDateISO(endDate.value)\n\n        const [summaryResponse, productsResponse] = await Promise.all([\n            getProductSalesSummary(start, end),\n            getProducts({ page: 0, size: 1000 })\n        ])\n\n        const summaryData = summaryResponse.data || {}\n        const summaryProducts = Array.isArray(summaryData.products) ? summaryData.products : []\n        const allProducts = Array.isArray(productsResponse.data?.content) ? productsResponse.data.content : []\n\n        const makeKey = (id, name) => (id != null ? `id:${id}` : `name:${name || ''}`)\n\n        const summaryById = new Map()\n        const summaryByName = new Map()\n        summaryProducts.forEach(item => {\n            if (item.productId != null) summaryById.set(item.productId, item)\n            if (item.productName) summaryByName.set(item.productName, item)\n        })\n\n        const usedSummaryKeys = new Set()\n\n        const mergedProducts = allProducts.map(product => {\n            const summaryItem = summaryById.get(product.id) ?? summaryByName.get(product.name)\n            if (summaryItem) {\n                usedSummaryKeys.add(makeKey(summaryItem.productId, summaryItem.productName))\n            }\n\n            return {\n                productId: product.id,\n                productName: product.name,\n                totalQuantitySold: Number(summaryItem?.totalQuantitySold) || 0,\n                totalRevenueGenerated: Number(summaryItem?.totalRevenueGenerated) || 0\n            }\n        })\n\n        const leftoverProducts = summaryProducts\n            .filter(item => !usedSummaryKeys.has(makeKey(item.productId, item.productName)))\n            .map(item => ({\n                productId: item.productId ?? null,\n                productName: item.productName || 'Không xác định',\n                totalQuantitySold: Number(item.totalQuantitySold) || 0,\n                totalRevenueGenerated: Number(item.totalRevenueGenerated) || 0\n            }))\n\n        const combinedProducts = [...mergedProducts, ...leftoverProducts]\n            .sort((a, b) => {\n                if (b.totalQuantitySold === a.totalQuantitySold) {\n                    return (Number(b.totalRevenueGenerated) || 0) - (Number(a.totalRevenueGenerated) || 0)\n                }\n                return b.totalQuantitySold - a.totalQuantitySold\n            })\n\n        productSalesSummary.value = {\n            products: combinedProducts,\n            totalQuantitySold: Number(summaryData.totalQuantitySold) || 0,\n            totalRevenueGenerated: Number(summaryData.totalRevenueGenerated) || 0\n        }\n\n        chartData.productSummaryRevenue = createBarChartData(\n            combinedProducts.map(item => item.productName),\n            combinedProducts.map(item => Number(item.totalRevenueGenerated) || 0),\n            'Doanh thu'\n        )\n\n        chartData.productSummaryQuantity = createBarChartData(\n            combinedProducts.map(item => item.productName),\n            combinedProducts.map(item => Number(item.totalQuantitySold) || 0),\n            'Số lượng bán'\n        )\n    } catch (error) {\n        console.error('Error fetching product sales summary:', error)\n        toast.error('Lỗi tải thống kê sản phẩm')\n        productSalesSummary.value = {\n            products: [],\n            totalQuantitySold: 0,\n            totalRevenueGenerated: 0\n        }\n        chartData.productSummaryRevenue = { labels: [], datasets: [] }\n        chartData.productSummaryQuantity = { labels: [], datasets: [] }\n    } finally {\n        loading.productSummary = false\n    }\n}\n"""

old_function = text[start_idx:end_idx]
if old_function != new_function:
    text = text[:start_idx] + new_function + text[end_idx:]
    changed = True

if not changed:
    print("No changes applied; content already updated.")
else:
    FILE_PATH.write_text(text, encoding="utf-8")
    print("Reports.vue updated by step2 script.")
