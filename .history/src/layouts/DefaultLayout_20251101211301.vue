<template>
    <div class="app-layout">
        <div class="sidebar-placeholder">
            <p>Sidebar</p>
        </div>

        <div class="main-content">
            <div class="navbar-placeholder">
                <p>Navbar</p>
            </div>

            <main class="app-content">
                <router-view />
            </main>
        </div>
    </div>
</template>

<script setup>
// Logic cho layout sẽ ở đây
</script>

<style scoped>
/* CSS cho layout chính (Tạm thời) */
.app-layout {
    display: flex;
    height: 100vh;
}

.sidebar-placeholder {
    width: 250px;
    background: #f4f4f5;
    /* Màu xám nhạt */
    padding: 20px;
    border-right: 1px solid #e4e7ed;
}

.main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
}

.navbar-placeholder {
    height: 60px;
    background: #fff;
    border-bottom: 1px solid #e4e7ed;
    padding: 0 20px;
    display: flex;
    align-items: center;
}

.app-content {
    padding: 20px;
    background: #fafafa;
    flex: 1;
}
</style>