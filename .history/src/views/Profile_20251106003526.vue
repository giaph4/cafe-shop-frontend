<template>
  <div class="app-page-container">
    <h1 class="page-title">Thông tin cá nhân</h1>

    <el-card class="box-card profile-card" v-if="user">
      <div class="profile-info">
        <div class="info-item">
          <span class="info-label">Tên đăng nhập:</span>
          <span class="info-value">{{ user.username }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Họ và tên:</span>
          <span class="info-value">{{ user.fullName }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Email:</span>
          <span class="info-value">{{ user.email }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Số điện thoại:</span>
          <span class="info-value">{{ user.phone }}</span>
        </div>

        <div class="info-item">
          <span class="info-label">Trạng thái:</span>
          <span class="info-value">
            <el-tag :type="authStore.user.status === 1 ? 'success' : 'success'">
              {{ user.status }}
            </el-tag>
          </span>
        </div>

        <div class="info-item">
          <span class="info-label">Vai trò:</span>
          <span class="info-value">
            <el-tag v-for="role in user.roles" :key="role.id" class="role-tag">
              {{ role.name }}
            </el-tag>
          </span>
        </div>
      </div>

      <div class="profile-actions">
        <el-button type="primary" @click="openEditProfileModal">Chỉnh sửa thông tin</el-button>
        <el-button type="warning" @click="openChangePasswordModal">Đổi mật khẩu</el-button>
      </div>
    </el-card>

    <el-card class="box-card profile-card" v-else>
      <p>Đang tải thông tin...</p>
    </el-card>

    <EditProfileModal v-if="isEditProfileModalOpen" @close="isEditProfileModalOpen = false" />
    <ChangePasswordModal v-if="isChangePasswordModalOpen" @close="isChangePasswordModalOpen = false" />

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/store/auth'
import EditProfileModal from '@/components/EditProfileModal.vue'
import ChangePasswordModal from '@/components/ChangePasswordModal.vue'
import { getUserById } from '@/api/userService'

const authStore = useAuthStore()
const user = ref(null)

const isEditProfileModalOpen = ref(false)
const isChangePasswordModalOpen = ref(false)

const openEditProfileModal = () => { isEditProfileModalOpen.value = true }
const openChangePasswordModal = () => { isChangePasswordModalOpen.value = true }



onMounted(async () => {
  if (authStore.user?.userId) {
    const res = await getUserById(authStore.user.userId)
    user.value = res.data
  }
})


</script>

<style scoped>
.profile-card {
  max-width: 600px;
  margin: 20px auto;
  padding: 20px;
}

.profile-info .info-item {
  display: flex;
  margin-bottom: 15px;
  font-size: 1rem;
}

.profile-info .info-label {
  font-weight: 600;
  width: 150px;
  color: #606266;
}

.profile-info .info-value {
  flex: 1;
  color: #303133;
}

.role-tag {
  margin-right: 5px;
}

.profile-actions {
  margin-top: 30px;
  text-align: right;
}


</style>