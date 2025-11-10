import { defineStore } from 'pinia'

export const useShiftSummaryStore = defineStore('shiftSummary', {
    state: () => ({
        summary: null,
        generatedAt: null,
    }),
    getters: {
        hasSummary: (state) => !!state.summary,
    },
    actions: {
        setSummary(summary, generatedAt = new Date().toISOString()) {
            this.summary = summary
            this.generatedAt = generatedAt
        },
        clearSummary() {
            this.summary = null
            this.generatedAt = null
        },
    },
})
