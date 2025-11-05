<template>
  <div class="app-page-container">
    <h1 class="page-title">Thông tin cá nhân</h1>

    <el-card class="box-card profile-card" v-if="authStore.user">
      V

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
import axios from 'axios'

const authStore = useAuthStore()

console.log(authStore.user);

const user = getUserById(authStore.user.userId)



console.log(user);




const isEditProfileModalOpen = ref(false)
const isChangePasswordModalOpen = ref(false)
const openEditProfileModal = () => { isEditProfileModalOpen.value = true }
const openChangePasswordModal = () => { isChangePasswordModalOpen.value = true }

onMounted(() => {

  if (!authStore.user && authStore.token) {
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