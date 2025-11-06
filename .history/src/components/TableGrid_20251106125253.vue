<template>
    <div class="p-4">
        <h2 class="text-xl font-semibold mb-4">Sơ Đồ Bàn</h2>
        <input v-model="searchQuery" type="text" placeholder="Tìm kiếm bàn..." class="w-full p-2 border rounded mb-4" />
        <div v-if="isLoadingTables" class="text-center p-8">
            <p>Đang tải sơ đồ bàn...</p>
        </div>
        <div v-else class="grid grid-cols-3 md:grid-cols-4 gap-3">
            <div v-for="table in filteredTables" :key="table.id" @click="onTableSelect(table)"
                :class="tableClass(table.status)"
                class="h-20 flex items-center justify-center font-semibold rounded-lg cursor-pointer transition-all">
                {{ table.name }}
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useStore } from 'vuex';

const store = useStore();
const searchQuery = ref('');

const tables = computed(() => store.state.pos.tables);
const isLoadingTables = computed(() => store.state.pos.isLoadingTables);
const selectedTableId = computed(() => store.state.pos.selectedTableId);

const filteredTables = computed(() => {
    if (!searchQuery.value) {
        return tables.value;
    }
    return tables.value.filter(table =>
        table.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
});

// Luồng 2: Chọn bàn
const onTableSelect = (table) => {
    if (table.status === 'SERVING') {
        store.dispatch('pos/selectTable', table.id);
    } else {
        // Nếu bấm vào bàn EMPTY, chúng ta xóa active order (nếu có)
        // Việc chọn bàn EMPTY sẽ được xử lý ở Luồng 1 (khi tạo đơn)
        store.dispatch('pos/unselectActiveOrder');
    }
};

const tableClass = (status) => {
    switch (status) {
        case 'SERVING':
            return 'bg-red-500 text-white hover:bg-red-600';
        case 'EMPTY':
            return 'bg-green-100 text-green-800 hover:bg-green-200';
        default:
            return 'bg-gray-200 text-gray-700 hover:bg-gray-300';
    }
};
</script>