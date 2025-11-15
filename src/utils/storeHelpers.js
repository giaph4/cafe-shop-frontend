import { computed, ref } from 'vue'

/**
 * Create a shared async task manager for Pinia stores.
 * Provides reactive loading state, last error, and a runTask helper.
 */
export const createTaskManager = ({ toast } = {}) => {
    const loadingAction = ref(null)
    const lastError = ref(null)
    const isLoading = computed(() => loadingAction.value !== null)

    const runTask = async (actionName, handler, { notify = true, fallbackMessage } = {}) => {
        loadingAction.value = actionName
        lastError.value = null

        try {
            return await handler()
        } catch (error) {
            const message = error.response?.data?.message || error.message || fallbackMessage || 'Đã xảy ra lỗi'
            lastError.value = message

            if (notify && message && toast) {
                toast.error(message)
            }

            throw error
        } finally {
            loadingAction.value = null
        }
    }

    return { loadingAction, lastError, isLoading, runTask }
}
