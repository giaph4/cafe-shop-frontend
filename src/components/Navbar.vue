<template>
    <el-header class="navbar">
        <div class="page-title">
            {{ $route.meta.title || 'Dashboard' }}
        </div>

        <div class="user-menu">
            <el-dropdown @command="handleCommand">
                <span class="el-dropdown-link">
                    <UserCircle class="user-icon" />
                    <span class="user-name">{{ authStore.user.fullName }}</span>
                    <ChevronDown class="arrow-icon" />
                </span>
                <template #dropdown>
                    <el-dropdown-menu>
                        <el-dropdown-item command="profile">
                            Thông tin cá nhân
                        </el-dropdown-item>
                        <el-dropdown-item command="logout" divided>
                            Đăng xuất
                        </el-dropdown-item>
                    </el-dropdown-menu>
                </template>
            </el-dropdown>
        </div>
    </el-header>
</template>

<script setup>
import { useAuthStore } from '@/store/auth'
import { useRouter } from 'vue-router'
import { UserCircle, ChevronDown } from '@/components/icons'

const authStore = useAuthStore()
const router = useRouter()

const handleCommand = (command) => {
    if (command === 'logout') {
        authStore.logout()
    } else if (command === 'profile') {
        router.push('/profile')
    }
}
</script>

<style scoped>
.navbar {
    height: 70px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #FDFCFB;
    border-bottom: 1px solid #E8E6E3;
    padding: 0 32px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.page-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: #212121;
    letter-spacing: -0.5px;
}

.user-menu {
    display: flex;
    align-items: center;
}

.el-dropdown-link {
    cursor: pointer;
    display: flex;
    align-items: center;
    outline: none;
    padding: 8px 16px;
    border-radius: 12px;
    transition: all 0.2s;
    gap: 8px;
}

.el-dropdown-link:hover {
    background: #EAE7E3;
}

.user-icon {
    width: 28px;
    height: 28px;
    color: #8B7355;
}

.user-name {
    font-weight: 600;
    color: #212121;
    font-size: 0.95rem;
}

.arrow-icon {
    width: 18px;
    height: 18px;
    color: #757575;
    transition: transform 0.2s;
}

.el-dropdown-link:hover .arrow-icon {
    transform: rotate(180deg);
}
</style>
