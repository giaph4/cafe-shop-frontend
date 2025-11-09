<template>
    <Bar :data="chartData" :options="chartOptions"/>
</template>

<script setup>
import {Bar} from 'vue-chartjs'
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

    // mau sac
    chartColors: {
        default: () => (['#FF6384', '#36A2EB', '#FFCE56'])
    },

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
                    stacked: true,
                },
                y: {
                    stacked: true,
                },
            }
        })
    },
})
</script>
