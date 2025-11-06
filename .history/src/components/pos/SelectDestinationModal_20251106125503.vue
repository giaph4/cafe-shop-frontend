<template>
    <div v-if="show" class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <div class="bg-white p-6 rounded-lg shadow-xl w-96">
            <h3 class="text-lg font-semibold mb-4">Tạo Đơn Hàng Mới</h3>

            <div class="space-y-3">
                <button @click="selectTakeAway" class="w-full p-3 bg-blue-500 text-white rounded hover:bg-blue-600">
                    Mang Về (Take Away)
                </button>
                <button @click="showTableSelect" class="w-full p-3 bg-green-500 text-white rounded hover:bg-green-600">
                    Tại Bàn (At Table)
                </button>
                <button @click="closeModal" class="w-full p-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 mt-2">
                    Hủy
                </button>
            </div>

            <SelectTableModal v-model:show="showSelectTableModal" @table-selected="selectTableAt" />
        </div>
    </div>
</template>

<script setup>
import { ref, defineProps, defineEmits } from 'vue';
import SelectTableModal from './SelectTableModal.vue';

const props = defineProps({
    show: Boolean
});

const emit = defineEmits(['update:show', 'create-order']);

const showSelectTableModal = ref(false);

const closeModal = () => {
    emit('update:show', false);
};

// Luồng 1 - A: Mang về
const selectTakeAway = () => {
    emit('create-order', { type: 'TAKE_AWAY' });
};

// Mở modal chọn bàn
const showTableSelect = () => {
    showSelectTableModal.value = true;
};

// Luồng 1 - B: Tại bàn
const selectTableAt = (tableId) => {
    emit('create-order', { type: 'AT_TABLE', tableId: tableId });
    showSelectTableModal.value = false; // Đóng modal con
};
</script>