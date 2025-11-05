<template>
    <el-header class="navbar">
        <div class="page-title">
            {{ $route.meta.title || 'Dashboard' }}
        </div>

        <div class="user-menu" v-if="authStore.user">
            <el-dropdown @command="handleCommand">
                <span class="el-dropdown-link">
                    <UserCircle class="user-icon" />

                    <div class="user-info">
                        <span class="user-name">{{ authStore.user.fullName }}</span>
                        <span class="user-role">{{ formattedRoles }}</span>
                    </div>
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
import { computed } from 'vue' // <-- THÊM COMPUTED

const authStore = useAuthStore()
const router = useRouter()

const handleCommand = (command) => {
    if (command === 'logout') {
        authStore.logout()
    } else if (command === 'profile') {
        router.push('/profile')
    }
}

// THÊM COMPUTED ĐỂ FORMAT ROLES
const formattedRoles = computed(() => {
    if (authStore.user && authStore.user.roles) {
        return authStore.user.roles
            .map(role => role.name.replace('ROLE_', '')) // Bỏ prefix 'ROLE_'
            .join(', ') // Nối các role lại, vd: "ADMIN, MANAGER"
    }
    return ''
})
</script>

<style scoped>
.navbar {
    height: 60px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #fff;
    border-bottom: 1px solid #e4e7ed;
    padding: 0 20px;
}

.page-title {
    font-size: 1.2rem;
    font-weight: 600;
    color: #303133;
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
}

.user-icon {
    width: 24px;
    height: 24px;
    margin-right: 8px;
    color: #606266;
}

/* SỬA LẠI user-name VÀ THÊM user-info, user-role */
.user-info {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    margin-right: 5px;
}

.user-name {
    font-weight: 500;
    display: block;
    line-height: 1.2;
}

.user-role {
    font-size: 0.75rem;
    /* 12px */
    color: #909399;
    /* Màu xám nhạt */
    line-height: 1.1;
}

/* KẾT THÚC SỬA CSS */

.arrow-icon {
    width: 16px;
    height: 16px;
}
</style>