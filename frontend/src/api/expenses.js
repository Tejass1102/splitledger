import { api } from './client'

export const expensesApi = {
    // Every filter is optional; empty ones are left out of the URL
    list: ({ from, to, categoryId } = {}) => {
        const params = new URLSearchParams()
        if (from) params.set('from', from)
        if (to) params.set('to', to)
        if (categoryId) params.set('categoryId', categoryId)
        const query = params.toString()
        return api.get(query ? `/expenses?${query}` : '/expenses')
    },
    create: (data) => api.post('/expenses', data),
    update: (id, data) => api.put(`/expenses/${id}`, data),
    remove: (id) => api.delete(`/expenses/${id}`),
}