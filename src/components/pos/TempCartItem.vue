<template>
    <div class="cart-item">
        <div class="item-header">
            <span class="item-name">{{ item.name }}</span>
            <div class="item-actions">
                <el-input-number
                    v-model="quantityProxy"
                    :min="1"
                    size="small"
                    class="qty-input"
                />
                <el-button
                    type="danger"
                    size="small"
                    circle
                    @click="emit('remove')"
                >
                    <el-icon>
                        <X />
                    </el-icon>
                </el-button>
            </div>
        </div>
        <el-input
            v-model="notesProxy"
            placeholder="Ghi chú (ít đá, nhiều đường...)"
            size="small"
            class="note-input"
        />
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { X } from '@/components/icons'

const props = defineProps({
    item: {
        type: Object,
        required: true,
    },
})

const emit = defineEmits(['update:quantity', 'update:notes', 'remove'])

const quantityProxy = computed({
    get: () => props.item.quantity,
    set: (value) => emit('update:quantity', value),
})

const notesProxy = computed({
    get: () => props.item.notes,
    set: (value) => emit('update:notes', value),
})
</script>

<style scoped>
.cart-item {
    border-radius: 16px;
    padding: 16px;
    border: 1px solid #ece2d4;
    background: #ffffff;
    box-shadow: 0 8px 16px rgba(110, 74, 43, 0.08);
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.item-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
}

.item-name {
    font-weight: 600;
    color: #3a2f1f;
}

.item-actions {
    display: flex;
    gap: 10px;
    align-items: center;
}

.qty-input {
    width: 96px;
}

.note-input {
    width: 100%;
}
</style>
