<template>
    <footer class="app-footer">
        <div class="footer-hero">
            <div class="hero-info">
                <div class="hero-icon">
                    <Coffee size="24" />
                </div>
                <div class="hero-text">
                    <h2 class="hero-title">Coffee Siu Admin</h2>
                    <p class="hero-subtitle">Nền tảng quản lý toàn diện giúp đồng bộ mọi hoạt động trong quán cà phê của bạn.</p>
                </div>
            </div>

            <div class="hero-highlights">
                <div class="highlight-card">
                    <Sparkles size="18" />
                    <div>
                        <span class="highlight-title">Trải nghiệm trực quan</span>
                        <p>Cập nhật thời gian thực, thao tác mượt mà trên mọi thiết bị.</p>
                    </div>
                </div>
                <div class="highlight-card">
                    <Users size="18" />
                    <div>
                        <span class="highlight-title">20+ nhân sự tin dùng</span>
                        <p>Phối hợp chặt giữa barista, thu ngân và quản lý ca.</p>
                    </div>
                </div>
            </div>
        </div>

        <div class="footer-grid">
            <div class="footer-column">
                <h4>Điều hướng nhanh</h4>
                <nav>
                    <a href="/">Trang tổng quan</a>
                    <a href="/pos">Điểm bán (POS)</a>
                    <a href="/reports">Báo cáo nâng cao</a>
                    <a href="/inventory">Quản lý kho</a>
                    <a href="/users">Nhân viên & phân quyền</a>
                </nav>
            </div>

            <div class="footer-column">
                <h4>Vận hành quán</h4>
                <ul>
                    <li>
                        <Clock size="17" />
                        <span>Giờ mở cửa: 06:00 - 22:00 mỗi ngày</span>
                    </li>
                    <li>
                        <MapPin size="17" />
                        <span>40 Trần Quốc Toản, Hải Châu, Đà Nẵng</span>
                    </li>
                    <li>
                        <Phone size="17" />
                        <a href="tel:+840123456789">Hotline: 0123 456 789</a>
                    </li>
                    <li>
                        <MessageCircle size="17" />
                        <a href="https://zalo.me/0123456789" target="_blank" rel="noopener">Zalo hỗ trợ: @coffeesiu</a>
                    </li>
                </ul>
            </div>

            <div class="footer-column">
                <h4>Hỗ trợ & Tài liệu</h4>
                <ul>
                    <li>
                        <BookOpen size="17" />
                        <a href="/guides">Hướng dẫn sử dụng</a>
                    </li>
                    <li>
                        <ShieldCheck size="17" />
                        <a href="/policies">Chính sách bảo mật</a>
                    </li>
                    <li>
                        <Headphones size="17" />
                        <a href="mailto:support@coffeesiu.vn">support@coffeesiu.vn</a>
                    </li>
                </ul>
            </div>

            <div class="footer-column newsletter">
                <h4>Bản tin & Cập nhật</h4>
                <p class="newsletter-text">Nhận mẹo vận hành, ưu đãi phần mềm và câu chuyện thành công mỗi tuần.</p>
                <form class="newsletter-form" @submit.prevent>
                    <label class="sr-only" for="newsletter-email">Email nhận bản tin</label>
                    <input id="newsletter-email" type="email" placeholder="Nhập email của bạn" />
                    <button type="submit">Đăng ký</button>
                </form>
                <span class="newsletter-note">* Chúng tôi chỉ gửi tối đa 2 email mỗi tuần.</span>
            </div>
        </div>

        <div class="footer-bottom">
            <div class="footer-bottom-left">
                <span>© {{ currentYear }} Huỳnh Gia Pho · Coffee Siu Admin</span>
                <small>Made with ☕ &nbsp;tại Việt Nam</small>
            </div>
            <div class="footer-bottom-right">
                <div class="footer-social">
                    <a href="https://github.com/giaph4" target="_blank" rel="noopener" aria-label="GitHub">
                        <Github size="18" />
                    </a>
                    <a href="https://www.instagram.com" target="_blank" rel="noopener" aria-label="Instagram">
                        <Instagram size="18" />
                    </a>
                </div>
            </div>
        </div>
    </footer>
</template>

<script setup>
import { computed } from 'vue'
import {
    Coffee,
    Github,
    Phone,
    MapPin,
    Instagram,
    Clock,
    Sparkles,
    Users,
    MessageCircle,
    BookOpen,
    ShieldCheck,
    Headphones
} from 'lucide-vue-next'

const currentYear = computed(() => new Date().getFullYear())
</script>

<style scoped>
.app-footer {
    margin-top: 28px;
    border-radius: 20px;
    background: linear-gradient(160deg, rgba(255, 250, 240, 0.92), rgba(240, 226, 205, 0.92));
    border: 1px solid rgba(139, 115, 85, 0.22);
    box-shadow: 0 18px 36px rgba(111, 91, 69, 0.14);
    color: #3e2d1c;
    overflow: hidden;
}

.footer-hero {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 24px;
    padding: 32px 36px 20px;
    background: rgba(255, 255, 255, 0.6);
}

.hero-info {
    display: flex;
    gap: 18px;
    align-items: center;
    min-width: 260px;
}

.hero-icon {
    width: 52px;
    height: 52px;
    border-radius: 16px;
    background: rgba(111, 91, 69, 0.16);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #6f4f2c;
}

.hero-text {
    max-width: 340px;
}

.hero-title {
    margin: 0;
    font-size: 1.3rem;
    font-weight: 700;
}

.hero-subtitle {
    margin: 8px 0 0;
    font-size: 0.92rem;
    color: rgba(62, 45, 28, 0.78);
}

.hero-highlights {
    display: flex;
    gap: 18px;
    flex-wrap: wrap;
    justify-content: flex-end;
}

.highlight-card {
    display: flex;
    gap: 12px;
    padding: 16px 20px;
    background: rgba(255, 255, 255, 0.82);
    border-radius: 16px;
    box-shadow: 0 12px 22px rgba(111, 91, 69, 0.12);
    max-width: 240px;
}

.highlight-card svg {
    color: #b77942;
    flex-shrink: 0;
}

.highlight-title {
    font-weight: 600;
    font-size: 0.95rem;
    color: #3e2d1c;
}

.highlight-card p {
    margin: 6px 0 0;
    font-size: 0.82rem;
    color: rgba(62, 45, 28, 0.7);
}

.footer-grid {
    display: grid;
    gap: 30px;
    padding: 16px 36px 32px;
    background: rgba(255, 255, 255, 0.78);
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.footer-column h4 {
    margin: 0 0 14px;
    font-size: 0.95rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: rgba(62, 45, 28, 0.68);
}

.footer-column nav,
.footer-column ul {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;
}

.footer-column a {
    color: #3e2d1c;
    text-decoration: none;
    font-size: 0.88rem;
    transition: color 0.2s ease;
}

.footer-column a:hover {
    color: #b77942;
}

.footer-column li {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    font-size: 0.88rem;
    color: #3e2d1c;
}

.footer-column li svg {
    margin-top: 2px;
    color: #b77942;
}

.newsletter-text {
    margin: 0 0 12px;
    font-size: 0.88rem;
    color: rgba(62, 45, 28, 0.75);
}

.newsletter-form {
    display: flex;
    gap: 8px;
    margin-bottom: 8px;
}

.newsletter-form input {
    flex: 1;
    padding: 10px 12px;
    border-radius: 10px;
    border: 1px solid rgba(111, 91, 69, 0.25);
    background: rgba(255, 255, 255, 0.95);
    color: #3e2d1c;
    font-size: 0.88rem;
}

.newsletter-form input:focus {
    outline: none;
    border-color: #b77942;
    box-shadow: 0 0 0 3px rgba(183, 121, 66, 0.25);
}

.newsletter-form button {
    padding: 10px 16px;
    border-radius: 10px;
    border: none;
    background: linear-gradient(135deg, #c68b45, #9c6230);
    color: #fff;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.newsletter-form button:hover {
    transform: translateY(-1px);
    box-shadow: 0 12px 20px rgba(156, 98, 48, 0.28);
}

.newsletter-note {
    font-size: 0.78rem;
    color: rgba(62, 45, 28, 0.6);
}

.sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
}

.footer-bottom {
    border-top: 1px solid rgba(139, 115, 85, 0.18);
    padding: 16px 36px 24px;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 14px;
    align-items: center;
    font-size: 0.82rem;
    background: rgba(248, 242, 233, 0.9);
}

.footer-bottom-left {
    display: flex;
    flex-direction: column;
    gap: 4px;
    color: rgba(62, 45, 28, 0.75);
}

.footer-bottom-right {
    display: flex;
    align-items: center;
    gap: 12px;
}

.footer-social {
    display: inline-flex;
    gap: 12px;
}

.footer-social a {
    color: #3e2d1c;
    display: inline-flex;
    padding: 8px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.72);
    transition: background 0.2s ease, transform 0.2s ease;
}

.footer-social a:hover {
    background: rgba(183, 121, 66, 0.22);
    transform: translateY(-1px);
}

@media (max-width: 1024px) {
    .footer-hero {
        padding: 28px;
    }

    .hero-text {
        max-width: 100%;
    }

    .hero-highlights {
        justify-content: flex-start;
    }

    .footer-grid {
        padding: 16px 28px 28px;
    }
}

@media (max-width: 768px) {
    .footer-hero {
        padding: 24px;
    }

    .footer-grid {
        padding: 16px 24px 28px;
    }

    .newsletter-form {
        flex-direction: column;
        align-items: stretch;
    }

    .newsletter-form button {
        width: 100%;
    }

    .footer-bottom {
        padding: 16px 24px 22px;
    }
}
</style>
