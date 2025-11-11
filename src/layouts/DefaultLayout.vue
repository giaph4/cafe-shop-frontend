<template>
    <el-container class="app-layout" :class="{ 'sidebar-collapsed': isSidebarCollapsed }">
        <Sidebar/>

        <el-container class="main-container" direction="vertical">
            <Navbar/>

            <el-main ref="mainContent" class="app-main">
                <div class="app-content">
                    <router-view v-slot="{ Component }">
                        <transition name="fade" mode="out-in">
                            <component :is="Component"/>
                        </transition>
                    </router-view>

                    <transition name="footer-fade">
                        <AppFooter
                            v-if="showFooter"
                            ref="footerRef"
                            class="footer-container"
                        />
                    </transition>
                </div>
            </el-main>
        </el-container>
    </el-container>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import Sidebar from '@/components/Sidebar.vue'
import Navbar from '@/components/Navbar.vue'
import AppFooter from '@/components/AppFooter.vue'
import { useSidebarStore } from '@/store/sidebar'

const sidebarStore = useSidebarStore()
const isSidebarCollapsed = computed(() => sidebarStore.isCollapsed)
const showFooter = ref(false)
const mainContent = ref(null)

const footerRef = ref(null)
const footerHeight = ref(240)

const FOOTER_SHOW_THRESHOLD = 200
const FOOTER_HIDE_THRESHOLD = 420

let scrollElement = null

const updateFooterHeight = () => {
    const footerEl = footerRef.value?.$el ?? footerRef.value
    footerHeight.value = footerEl?.offsetHeight ?? footerHeight.value
}

const handleScroll = () => {
    if (!scrollElement) {
        showFooter.value = false
        return
    }

    const rawDistance =
        scrollElement.scrollHeight - (scrollElement.scrollTop + scrollElement.clientHeight)
    const adjustedDistance = showFooter.value
        ? Math.max(rawDistance - footerHeight.value, 0)
        : rawDistance

    if (!showFooter.value && adjustedDistance <= FOOTER_SHOW_THRESHOLD) {
        showFooter.value = true
        nextTick(updateFooterHeight)
    } else if (showFooter.value && adjustedDistance > FOOTER_HIDE_THRESHOLD) {
        showFooter.value = false
    }
}

onMounted(() => {
    scrollElement = mainContent.value?.$el ?? mainContent.value
    scrollElement?.addEventListener('scroll', handleScroll)
    window.addEventListener('resize', handleScroll)
    handleScroll()
})

onBeforeUnmount(() => {
    scrollElement?.removeEventListener('scroll', handleScroll)
    window.removeEventListener('resize', handleScroll)
    scrollElement = null
})
</script>

<style scoped>
.app-layout {
    height: 100vh;
    background: var(--app-bg-color);
    transition: background-color 0.3s ease;
}

.app-layout.sidebar-collapsed .main-container {
    transition: margin-left 0.25s ease;
}

.main-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: var(--app-bg-color);
    transition: margin-left 0.25s ease, background-color 0.3s ease;
}

.app-main {
    flex: 1;
    background: transparent;
    padding: 24px;
    box-sizing: border-box;
    overflow-y: auto;
}

.app-content {
    display: flex;
    flex-direction: column;
    gap: 24px;
    min-height: 100%;
    padding-bottom: 24px;
}

.app-main::-webkit-scrollbar {
    width: 8px;
}

.app-main::-webkit-scrollbar-track {
    background: var(--scrollbar-track);
    border-radius: 10px;
}

.app-main::-webkit-scrollbar-thumb {
    background: var(--scrollbar-thumb);
    border-radius: 10px;
    transition: background 0.2s;
}

.app-main::-webkit-scrollbar-thumb:hover {
    background: var(--scrollbar-thumb-hover);
}



/* --- Hiệu ứng chuyển trang --- */
.fade-enter-active,
.fade-leave-active {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-enter-from {
    opacity: 0;
    transform: translateY(10px);
}

.fade-leave-to {
    opacity: 0;
    transform: translateY(-10px);
}

@media (max-width: 768px) {
    .app-main {
        padding: 16px;
    }
}
</style>