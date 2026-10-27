import { api } from './client'

export const groupExpensesApi = {
    // Every filter is optional; empty ones are left out of the URL
    list: (groupId, { from, to, paidByMemberId } = {}) => {
        const params = new URLSearchParams()
        if (from) params.set('from', from)
        if (to) params.set('to', to)
        if (paidByMemberId) params.set('paidByMemberId', paidByMemberId)
        const query = params.toString()
        return api.get(`/groups/${groupId}/expenses${query ? `?${query}` : ''}`)
    },
    create: (groupId, data) => api.post(`/groups/${groupId}/expenses`, data),
    update: (groupId, expenseId, data) => api.put(`/groups/${groupId}/expenses/${expenseId}`, data),
    remove: (groupId, expenseId) => api.delete(`/groups/${groupId}/expenses/${expenseId}`),
}