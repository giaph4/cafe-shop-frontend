<template>
    <el-tag
        :type="badgeType"
        :size="size"
        :effect="effect"
        class="status-badge">
        <span class="status-dot" :class="`dot-${status.toLowerCase()}`"></span>
        <span class="status-text">{{ statusText }}</span>
    </el-tag>
</template>

<script setup>
import {computed} from 'vue'

const props = defineProps({
    status: {
        type: String,
        required: true
    },
    size: {
        type: String,
        default: 'default'
    },
    effect: {
        type: String,
        default: 'light'
    }
})

const statusConfig = {
    // Order statuses
    PENDING: {type: 'warning', text: 'Đang chờ'},
    PAID: {type: 'success', text: 'Đã thanh toán'},
    CANCELLED: {type: 'danger', text: 'Đã hủy'},
    COMPLETED: {type: 'success', text: 'Hoàn thành'},

    // Table statuses
    EMPTY: {type: 'success', text: 'Trống'},
    SERVING: {type: 'danger', text: 'Đang phục vụ'},
    RESERVED: {type: 'warning', text: 'Đã đặt'},

    // Purchase Order statuses
    DRAFT: {type: 'info', text: 'Nháp'},
    ORDERED: {type: 'warning', text: 'Đã đặt'},
    RECEIVED: {type: 'success', text: 'Đã nhận'},

    // User statuses
    ACTIVE: {type: 'success', text: 'Hoạt động'},
    INACTIVE: {type: 'danger', text: 'Không hoạt động'},

    // Payment statuses
    CASH: {type: 'success', text: 'Tiền mặt'},
    TRANSFER: {type: 'primary', text: 'Chuyển khoản'},
    CARD: {type: 'warning', text: 'Thẻ'}
}

const config = computed(() =>
    statusConfig[props.status] || {type: 'info', text: props.status}
)

const badgeType = computed(() => config.value.type)
const statusText = computed(() => config.value.text)
</script>

<style scoped>
.status-badge {
    font-weight: var(--font-semibold);
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-1) var(--space-3);
    border-radius: var(--radius-full);
}

.status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    display: inline-block;
    animation: pulse 2s infinite;
}

/* Order statuses */
.dot-pending {
    background: var(--warning-500);
}

.dot-paid {
    background: var(--success-500);
}

.dot-cancelled {
    background: var(--danger-500);
}

.dot-completed {
    background: var(--success-500);
}

/* Table statuses */
.dot-empty {
    background: var(--success-500);
}

.dot-serving {
    background: var(--danger-500);
}

.dot-reserved {
    background: var(--warning-500);
}

/* Purchase Order statuses */
.dot-draft {
    background: var(--info-500);
}

.dot-ordered {
    background: var(--warning-500);
}

.dot-received {
    background: var(--success-500);
}

/* User statuses */
.dot-active {
    background: var(--success-500);
}

.dot-inactive {
    background: var(--danger-500);
}

/* Payment statuses */
.dot-cash {
    background: var(--success-500);
}

.dot-transfer {
    background: var(--primary-500);
}

.dot-card {
    background: var(--warning-500);
}

@keyframes pulse {
    0%, 100% {
        opacity: 1;
    }
    50% {
        opacity: 0.5;
    }
}
</style>
