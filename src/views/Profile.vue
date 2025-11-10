<template>
    <div class="profile-page animate__animated animate__fadeInUp stagger-item">
        <div class="profile-hero" v-if="user">
            <div class="hero-left">
                <el-avatar :size="120" :src="avatarUrl" class="hero-avatar"/>
                <div class="hero-info">
                    <h1>{{ user.fullName || user.username }}</h1>
                    <p>{{ user.email }}</p>
                    <div class="hero-tags">
                        <el-tag type="success" effect="dark" round>
                            {{ statusText }}
                        </el-tag>
                        <el-tag v-for="role in user.roles" :key="role.id" effect="plain" round>
                            {{ formatRole(role.name) }}
                        </el-tag>
                    </div>
                </div>
            </div>
            <div class="hero-right">
                <div class="stat-card">
                    <span class="stat-label">Tên đăng nhập</span>
                    <span class="stat-value">{{ user.username }}</span>
                </div>
                <div class="stat-card">
                    <span class="stat-label">Số điện thoại</span>
                    <span class="stat-value">{{ user.phone || '—' }}</span>
                </div>
                <div class="stat-card">
                    <span class="stat-label">Ngày tham gia</span>
                    <span class="stat-value">{{ formattedCreatedAt }}</span>
                </div>
            </div>
        </div>

        <div v-else class="profile-loading">
            <el-skeleton animated :rows="4"/>
        </div>

        <el-row :gutter="20" v-if="user">
            <el-col :span="16">
                <el-card class="detail-card" shadow="never">
                    <template #header>
                        <div class="card-header">
                            <h2>Chi tiết tài khoản</h2>
                            <el-tag type="info" round>{{ user.id ? `ID #${user.id}` : 'Tài khoản nội bộ' }}</el-tag>
                        </div>
                    </template>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="detail-label">Tên đăng nhập</span>
                            <span class="detail-value">{{ user.username }}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Họ và tên</span>
                            <span class="detail-value">{{ user.fullName || 'Chưa cập nhật' }}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Email</span>
                            <span class="detail-value">
                                <el-link :href="`mailto:${user.email}`" type="primary" v-if="user.email">
                                    {{ user.email }}
                                </el-link>
                                <span v-else>Chưa cập nhật</span>
                            </span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Số điện thoại</span>
                            <span class="detail-value">{{ user.phone || 'Chưa cập nhật' }}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Trạng thái</span>
                            <span class="detail-value">
                                <el-tag :type="user.status === 'ACTIVE' ? 'success' : 'info'" effect="plain">
                                    {{ user.status }}
                                </el-tag>
                            </span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Quyền truy cập</span>
                            <span class="detail-value roles">
                                <el-tag v-for="role in user.roles" :key="role.id" effect="dark" round>
                                    {{ formatRole(role.name) }}
                                </el-tag>
                            </span>
                        </div>
                    </div>
                </el-card>
            </el-col>

            <el-col :span="8">
                <el-card class="side-card" shadow="never">
                    <template #header>
                        <h2>Thao tác nhanh</h2>
                    </template>
                    <p class="side-text">Cập nhật thông tin tài khoản hoặc đổi mật khẩu để đảm bảo an toàn cho dữ liệu của bạn.</p>
                    <div class="action-group">
                        <el-button class="action-btn action-btn--primary" size="large" @click="openEditProfileModal">
                            Chỉnh sửa thông tin
                        </el-button>
                        <el-button class="action-btn action-btn--secondary" size="large" @click="openChangePasswordModal">
                            Đổi mật khẩu
                        </el-button>
                    </div>
                </el-card>

                <el-card class="side-card" shadow="never">
                    <template #header>
                        <h2>Thông tin thiết bị</h2>
                    </template>
                    <ul class="device-list">
                        <li>
                            <span class="device-label">Trình duyệt: </span>
                            <span class="device-value">{{ browserInfo.name }}</span>
                        </li>
                        <li>
                            <span class="device-label">Phiên bản: </span>
                            <span class="device-value">{{ browserInfo.version }}</span>
                        </li>
                        <li>
                            <span class="device-label">Hệ điều hành: </span>
                            <span class="device-value">{{ browserInfo.os }}</span>
                        </li>
                        <li>
                            <span class="device-label">IP: </span>
                            <span class="device-value">{{ browserInfo.ip || 'Đang xác định...' }}</span>
                        </li>
                    </ul>
                </el-card>
            </el-col>
        </el-row>

        <!-- Modal chỉnh sửa -->
        <EditProfileModal v-if="isEditProfileModalOpen" @close="handleEditProfileClose"/>

        <!-- Modal đổi mật khẩu -->
        <ChangePasswordModal v-if="isChangePasswordModalOpen" @close="isChangePasswordModalOpen = false"/>
    </div>
</template>

<script setup>
import {ref, onMounted, computed} from 'vue'
import {useAuthStore} from '@/store/auth'
import EditProfileModal from '@/components/EditProfileModal.vue'
import ChangePasswordModal from '@/components/ChangePasswordModal.vue'
import {getUserById} from '@/api/userService'

const authStore = useAuthStore()
const user = ref(null)

const isEditProfileModalOpen = ref(false)
const isChangePasswordModalOpen = ref(false)
const browserInfo = ref({name: navigator?.userAgentData?.brands?.[0]?.brand || navigator.userAgent, version: navigator?.userAgentData?.brands?.[0]?.version || '', os: navigator?.userAgentData?.platform || navigator.platform || 'Unknown', ip: ''})

// Hàm load lại dữ liệu user
const loadUser = async () => {
    if (authStore.user?.userId) {
        const res = await getUserById(authStore.user.userId)
        user.value = res.data
    }
}

const avatarUrl = computed(() => {
    if (!user.value) return ''
    const nameSeed = encodeURIComponent(user.value.fullName || user.value.username || 'user')
    return `https://avatar.iran.liara.run/username?username=${nameSeed}`
})

const statusText = computed(() => user.value?.status === 'ACTIVE' ? 'Đang hoạt động' : 'Tạm ngưng')

const formattedCreatedAt = computed(() => {
    if (!user.value?.createdAt) return 'Chưa cập nhật'
    return new Date(user.value.createdAt).toLocaleString('vi-VN')
})

const formatRole = (roleName = '') => roleName.replace('ROLE_', '')

const fetchIp = async () => {
    try {
        const res = await fetch('https://api.ipify.org?format=json')
        if (res.ok) {
            const data = await res.json()
            browserInfo.value.ip = data.ip
        }
    } catch (error) {
        console.warn('Không thể lấy IP', error)
    }
}

onMounted(async () => {
    await loadUser()
    fetchIp()
})

const openEditProfileModal = () => {
    isEditProfileModalOpen.value = true
}

const openChangePasswordModal = () => {
    isChangePasswordModalOpen.value = true
}

// Khi modal đóng -> reload lại thông tin user
const handleEditProfileClose = async () => {
    isEditProfileModalOpen.value = false
    await loadUser()
}
</script>

<style scoped>
.profile-page {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.profile-hero {
    background: linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%);
    padding: 24px;
    border-radius: 24px;
    display: flex;
    justify-content: space-between;
    gap: 24px;
    align-items: center;
    box-shadow: 0 20px 50px rgba(15, 23, 42, 0.1);
}

.hero-left {
    display: flex;
    align-items: center;
    gap: 20px;
}

.hero-avatar {
    border: 4px solid rgba(255, 255, 255, 0.7);
    box-shadow: 0 12px 30px rgba(15, 23, 42, 0.15);
}

.hero-info h1 {
    margin: 0;
    font-size: 1.8rem;
    font-weight: 700;
    color: #1f2937;
}

.hero-info p {
    margin: 4px 0 12px;
    color: #4b5563;
}

.hero-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.hero-right {
    display: grid;
    grid-template-columns: repeat(3, minmax(120px, auto));
    gap: 16px;
}

.stat-card {
    background: #fff;
    border-radius: 16px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
    min-width: 140px;
}

.stat-label {
    font-size: 0.85rem;
    color: #6b7280;
    font-weight: 600;
}

.stat-value {
    font-size: 1.2rem;
    font-weight: 700;
    color: #1f2937;
    word-break: break-word;
}

.detail-card {
    border-radius: 18px;
    padding: 12px 18px 24px;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.detail-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 18px;
}

.detail-item {
    display: flex;
    flex-direction: column;
    gap: 6px;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 14px;
    padding: 14px;
}

.detail-label {
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #6b7280;
    font-weight: 600;
}

.detail-value {
    font-size: 1.05rem;
    color: #111827;
    font-weight: 600;
    word-break: break-word;
}

.detail-value.roles {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.side-card {
    margin-bottom: 20px;
    border-radius: 18px;
    padding: 12px 18px 24px;
}

.side-text {
    color: #4b5563;
    margin-bottom: 16px;
}

.action-group {
    display: flex;
    flex-direction: row;
    gap: 12px;
}

.action-btn {
    border: none;
    border-radius: 14px;
    font-weight: 700;
    color: #fff;
    box-shadow: 0 12px 24px rgba(15, 23, 42, 0.15);
    flex: 1;
    min-height: 48px;
}

.action-btn--primary {
    background: linear-gradient(135deg, #4c1d95 0%, #7c3aed 100%);
}

.action-btn--secondary {
    background: linear-gradient(135deg, #b45309 0%, #f59e0b 100%);
}

.action-btn:hover {
    filter: brightness(1.05);
}

.action-btn:focus {
    box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.25);
}

.device-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.device-label {
    font-weight: 600;
    color: #6b7280;
}

.device-value {
    color: #1f2937;
    font-weight: 600;
}

.profile-loading {
    background: #fff;
    border-radius: 20px;
    padding: 24px;
}

@media (max-width: 992px) {
    .profile-hero {
        flex-direction: column;
        align-items: flex-start;
    }

    .hero-right {
        width: 100%;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    }
}

@media (max-width: 768px) {
    .detail-grid {
        grid-template-columns: 1fr;
    }
}
</style>
