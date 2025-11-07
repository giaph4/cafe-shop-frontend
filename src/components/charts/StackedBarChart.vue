<template>
    <Bar :data="chartData" :options="chartOptions" />
</template>

<script setup>
import { Bar } from 'vue-chartjs'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js'

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
)

defineProps({
    chartData: {
        type: Object,
        required: true,
    },
    // Cấu hình mặc định cho biểu đồ CỘT CHỒNG
    chartOptions: {
        type: Object,
        default: () => ({
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    mode: 'index',
                    intersect: false,
                },
            },
            scales: {
                x: {
                    stacked: true, // Quan trọng
                },
                y: {
                    stacked: true, // Quan trọng
                },
            },
        }),
    },
})
</script>
