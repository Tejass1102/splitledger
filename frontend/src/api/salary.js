import { api } from './client'

export const salaryApi = {
    pending: () => api.get('/salary/pending'),
    // body is {} (use the expected amount) or { amount }
    confirm: (cycleId, body) => api.post(`/salary/cycles/${cycleId}/confirm`, body),
}