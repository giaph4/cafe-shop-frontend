<template>
    <footer class="app-footer">
        <div class="footer-wrapper">
            <div class="footer-header">
                <div class="brand-block">
                    <div class="brand-icon">
                        <img class="brand-icon" src="@/assets/logo.png" alt="Coffee Shop Logo"/>
                    </div>
                    <div class="brand-copy">
                        <h2 class="brand-title">Coffee Siu Cafe Management</h2>
                        <p class="brand-subtitle">
                            Giải pháp điều hành quán cafe toàn diện: POS, kho, menu, khách hàng thân thiết.
                        </p>
                    </div>
                </div>
                <a class="cta-button" href="tel:0329463763">Nhấn để gọi tư vấn</a>
            </div>

            <div class="footer-grid">
                <div class="footer-column">
                    <h3 class="footer-title">Liên hệ trực tiếp</h3>
                    <ul class="footer-list">
                        <li>
                            <span class="list-label">Người phụ trách:</span>
                            <span>Huỳnh Gia Pho</span>
                        </li>
                        <li>
                            <span class="list-label">Hotline/Zalo:</span>
                            <a href="tel:0329463763">0329 463 763</a>
                        </li>
                        <li>
                            <span class="list-label">Hình thức làm việc:</span>
                            <span>Hỗ trợ triển khai trực tuyến & trực tiếp theo nhu cầu quán</span>
                        </li>
                    </ul>
                </div>

                <div class="footer-column">
                    <h3 class="footer-title">Kênh trực tuyến</h3>
                    <ul class="footer-links">
                        <li>
                            <a
                                href="https://github.com/giaph4"
                                target="_blank"
                                rel="noopener"
                            >
                                <span class="link-icon">💻</span>
                                GitHub: giaph4
                            </a>
                        </li>
                        <li>
                            <a
                                href="https://www.facebook.com/giapho.huynh.1503"
                                target="_blank"
                                rel="noopener"
                            >
                                <span class="link-icon">🌐</span>
                                Facebook cá nhân
                            </a>
                        </li>
                        <li>
                            <span class="coming-soon">
                                <span class="link-icon">📄</span>
                                Tài liệu triển khai: đang cập nhật
                            </span>
                        </li>
                    </ul>
                </div>

                <div class="footer-column">
                    <h3 class="footer-title">Giải pháp hệ thống</h3>
                    <ul class="footer-list bullets">
                        <li>Quản lý bán hàng theo quầy, bàn và mang đi trong cùng giao diện.</li>
                        <li>Đồng bộ kho nguyên liệu, định lượng pha chế và cảnh báo tồn kho.</li>
                        <li>Báo cáo doanh thu tức thời, phân tích lợi nhuận theo sản phẩm.</li>
                        <li>Chương trình khách hàng thân thiết và voucher linh hoạt.</li>
                    </ul>
                </div>

                <div class="footer-column">
                    <h3 class="footer-title">Quy trình triển khai</h3>
                    <ul class="footer-list">
                        <li>
                            <span class="list-label">1. Khảo sát & tư vấn:</span>
                            <span>Thu thập quy trình phục vụ, menu và mô hình bán hàng.</span>
                        </li>
                        <li>
                            <span class="list-label">2. Thiết lập hệ thống:</span>
                            <span>Cấu hình POS, phân quyền nhân viên, nhập danh mục sản phẩm.</span>
                        </li>
                        <li>
                            <span class="list-label">3. Đào tạo & bàn giao:</span>
                            <span>Hướng dẫn sử dụng chi tiết và theo dõi vận hành trong tuần đầu.</span>
                        </li>
                    </ul>
                </div>
            </div>

            <div class="footer-bottom">
                <span>© {{ currentYear }} Cafe Management System. All rights reserved.</span>
                <div class="footer-meta">
                    <span>Phát triển bởi Huỳnh Gia Pho</span>
                    <span>Cafe Siu Dashboard • Nền tảng quản lý vận hành</span>
                </div>
            </div>
        </div>
    </footer>
</template>

<script setup>
const currentYear = new Date().getFullYear()
</script>

<style scoped>
.app-footer {
    --primary-color: #409eff;
    --text-color-primary: #111827;
    --text-color-secondary: #4b5563;
    --border-color: rgb(234, 234, 207);

    background: linear-gradient(
        135deg,
        rgb(206, 231, 234),
        rgb(255, 255, 255)
    );
    border-top: 1px solid var(--border-color);
    backdrop-filter: blur(6px);
    padding: 32px 24px;
    color: var(--text-color-primary);
    flex-shrink: 0;
    border-radius: 20px;
    box-shadow:  20px 10px 18px rgba(1, 7, 14, 0.25);
}

.footer-wrapper {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 32px;
}

.footer-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
}

.brand-block {
    display: flex;
    align-items: center;
    gap: 16px;
}

.brand-icon {
    width: 56px;
    border-radius: 50%;
    background: rgba(255, 183, 77, 0.18);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
}

.brand-title {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 700;
}

.brand-subtitle {
    margin: 4px 0 0;
    color: var(--text-color-secondary);
    line-height: 1.6;
}

.cta-button {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    border-radius: 999px;
    background: var(--primary-color, #409eff);
    color: #ffffff;
    text-decoration: none;
    font-weight: 600;
    box-shadow: 0 10px 18px rgba(64, 158, 255, 0.25);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.cta-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 14px 24px rgba(64, 158, 255, 0.3);
}

.footer-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 28px;
}

.footer-column {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.footer-title {
    font-size: 1rem;
    font-weight: 600;
    margin: 0;
    color: var(--text-color-primary);
}

.footer-list,
.footer-links {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
    color: var(--text-color-secondary);
}

.footer-list.bullets {
    gap: 12px;
}

.footer-list.bullets li {
    position: relative;
    padding-left: 18px;
    line-height: 1.6;
}

.footer-list.bullets li::before {
    content: '';
    position: absolute;
    top: 10px;
    left: 0;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--primary-color);
    opacity: 0.6;
}

.footer-list li,
.footer-links li {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.list-label {
    font-weight: 600;
    color: var(--text-color-primary);
}

.footer-links a {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: var(--primary-color);
    text-decoration: none;
    font-weight: 500;
}

.footer-links a:hover {
    text-decoration: underline;
}

.link-icon {
    display: inline-flex;
    width: 24px;
    height: 24px;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    background: rgba(64, 158, 255, 0.12);
    font-size: 0.85rem;
}

.coming-soon {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: var(--text-color-secondary, #6b7280);
}

.footer-bottom {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-top: 20px;
    border-top: 1px solid var(--border-color);
    color: var(--text-color-secondary);
    font-size: 0.9rem;
}

.footer-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
}

.footer-meta span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding-right: 12px;
    border-right: 1px solid rgba(19, 84, 197, 0.7);
}

.footer-meta span:last-child {
    border-right: none;
    padding-right: 0;
}

@media (max-width: 768px) {
    .app-footer {
        padding: 28px 18px;
    }

    .footer-wrapper {
        gap: 28px;
    }

    .footer-grid {
        gap: 20px;
    }

    .cta-button {
        width: 100%;
        justify-content: center;
    }

    .footer-meta {
        flex-direction: column;
        align-items: flex-start;
        gap: 6px;
    }

    .footer-meta span {
        border-right: none;
        padding-right: 0;
    }
}
</style>
