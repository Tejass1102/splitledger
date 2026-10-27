import { api } from './client'

export const salaryApi = {
    // quiet: this is also polled in the background, so a server error must not pop up a toast
    pending: () => api.get('/salary/pending', { quiet: true }),
    // body is {} (use the expected amount) or { amount }
    confirm: (cycleId, body) => api.post(`/salary/cycles/${cycleId}/confirm`, body),
}