import sys
from pathlib import Path

FILE_PATH = Path(r"C:\\CODING\\SpringNghiemTuc\\coffee-shop-frontend\\src\\views\\Reports.vue")

if not FILE_PATH.exists():
    sys.stderr.write(f"Target file not found: {FILE_PATH}\n")
    sys.exit(1)

text = FILE_PATH.read_text(encoding="utf-8")
changed = False

# 1. Insert product summary section in the products tab template
summary_section = """
                <el-row :gutter="20" style="margin-bottom: 20px;">
                    <el-col :span="24">
                        <el-card class="box-card product-summary-card" v-loading="loading.productSummary">
                            <template #header>
                                <div class="chart-header product-summary-header">
                                    <div class="product-summary-title">
                                        <span>Thống kê bán hàng theo sản phẩm</span>
                                        <el-tag type="primary" size="small">API</el-tag>
                                    </div>
                                    <div class="product-summary-totals">
                                        <div class="summary-pill">
                                            <span class="pill-label">Tổng lượng bán</span>
                                            <span class="pill-value">{{ totalQuantitySoldDisplay }}</span>
                                        </div>
                                        <div class="summary-pill">
                                            <span class="pill-label">Tổng doanh thu</span>
                                            <span class="pill-value">{{ totalRevenueGeneratedDisplay }}</span>
                                        </div>
                                    </div>
                                </div>
                            </template>

                            <div class="product-summary-chart-wrapper">
                                <div class="product-summary-chart-header">
                                    <span>Biểu đồ so sánh</span>
                                    <el-radio-group v-model="productSummaryChartMode" size="small">
                                        <el-radio-button label="revenue">Doanh thu</el-radio-button>
                                        <el-radio-button label="quantity">Số lượng</el-radio-button>
                                    </el-radio-group>
                                </div>

                                <BarChart
                                    v-if="productSummaryChartMode === 'revenue' && chartData.productSummaryRevenue.labels.length"
                                    :chartData="chartData.productSummaryRevenue"
                                />
                                <BarChart
                                    v-if="productSummaryChartMode === 'quantity' && chartData.productSummaryQuantity.labels.length"
                                    :chartData="chartData.productSummaryQuantity"
                                />
                                <el-empty
                                    v-if="!chartData.productSummaryRevenue.labels.length && !chartData.productSummaryQuantity.labels.length"
                                    description="Chưa có dữ liệu"
                                />
                            </div>

                            <EasyDataTable
                                :headers="productSummaryHeaders"
                                :items="productSummaryItems"
                                :loading="loading.productSummary"
                                table-class-name="data-table"
                                :row-class-name="productSummaryRowClass"
                                show-index
                                alternating
                            >
                                <template #item-index="{ index }">
                                    <span>{{ index + 1 }}</span>
                                </template>

                                <template #item-productName="{ productName, productId }">
                                    <div class="product-name-cell">
                                        <span>{{ productName }}</span>
                                        <el-tag
                                            v-if="productRankSets.top.has(productId ?? productName)"
                                            type="success"
                                            size="small"
                                        >Top 5</el-tag>
                                        <el-tag
                                            v-else-if="productRankSets.bottom.has(productId ?? productName)"
                                            type="danger"
                                            size="small"
                                        >Bottom 5</el-tag>
                                    </div>
                                </template>

                                <template #item-totalQuantitySold="{ totalQuantitySold }">
                                    {{ (Number(totalQuantitySold) || 0).toLocaleString('vi-VN') }}
                                </template>

                                <template #item-totalRevenueGenerated="{ totalRevenueGenerated }">
                                    {{ formatCurrency(Number(totalRevenueGenerated) || 0) }}
                                </template>
                            </EasyDataTable>
                        </el-card>
                    </el-col>
                </el-row>
"""

if "box-card product-summary-card" not in text:
    products_tab_marker = '<el-tab-pane label="☕ Sản phẩm" name="products">'
    tab_index = text.find(products_tab_marker)
    if tab_index == -1:
        sys.stderr.write("Could not locate products tab marker.\n")
        sys.exit(1)

    alert_close = "                </el-alert>\n"
    close_index = text.find(alert_close, tab_index)
    if close_index == -1:
        sys.stderr.write("Could not locate products alert closing tag.\n")
        sys.exit(1)

    insert_pos = close_index + len(alert_close)
    text = text[:insert_pos] + summary_section + "\n" + text[insert_pos:]
    changed = True

# 2. Insert productSummaryItems computed property
items_snippet = """

const productSummaryItems = computed(() => {
    const products = Array.isArray(productSalesSummary.value?.products)
        ? productSalesSummary.value.products
        : []

    return products.map(item => ({
        ...item,
        totalQuantitySold: Number(item.totalQuantitySold) || 0,
        totalRevenueGenerated: Number(item.totalRevenueGenerated) || 0
    }))
})
"""

if "const productSummaryItems = computed" not in text:
    chart_data_area_marker = "\nconst chartDataArea = computed(() => {\n"
    marker_index = text.find(chart_data_area_marker)
    if marker_index == -1:
        sys.stderr.write("Could not locate chartDataArea marker.\n")
        sys.exit(1)

    text = text[:marker_index] + items_snippet + chart_data_area_marker + text[marker_index + len(chart_data_area_marker):]
    changed = True

# 3. Append scoped styles for the summary table highlighting
style_snippet = """
.product-summary-card {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.product-summary-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
}

.product-summary-title {
    display: flex;
    align-items: center;
    gap: 12px;
    font-weight: 600;
}

.product-summary-totals {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
}

.summary-pill {
    display: flex;
    flex-direction: column;
    background: rgba(0, 0, 0, 0.04);
    padding: 8px 16px;
    border-radius: 12px;
    min-width: 160px;
}

.pill-label {
    font-size: 0.85rem;
    color: #909399;
}

.pill-value {
    font-size: 1.1rem;
    font-weight: 600;
    color: #303133;
}

.product-summary-chart-wrapper {
    padding: 12px 0 4px;
}

.product-summary-chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}

.product-name-cell {
    display: flex;
    align-items: center;
    gap: 8px;
}

.row-top-product {
    background: rgba(103, 194, 58, 0.12) !important;
}

.row-bottom-product {
    background: rgba(245, 108, 108, 0.12) !important;
}

.row-top-product:hover,
.row-bottom-product:hover {
    filter: brightness(0.98);
}
"""

if ".product-summary-card {" not in text:
    style_marker = "\n</style>"
    style_index = text.rfind(style_marker)
    if style_index == -1:
        sys.stderr.write("Could not locate closing style tag.\n")
        sys.exit(1)

    text = text[:style_index] + style_snippet + style_marker + text[style_index + len(style_marker):]
    changed = True

if not changed:
    print("No changes applied; content already up to date.")
else:
    FILE_PATH.write_text(text, encoding="utf-8")
    print("Reports.vue updated with product summary section.")
