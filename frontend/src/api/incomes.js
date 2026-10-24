import { api } from './client'

export const incomesApi = {
    // Every filter is optional; empty ones are left out of the URL.
    // source is 'SALARY' or 'OTHER'.
    list: ({ from, to, categoryId, source } = {}) => {
        const params = new URLSearchParams()
        if (from) params.set('from', from)
        if (to) params.set('to', to)
        if (categoryId) params.set('categoryId', categoryId)
        if (source) params.set('source', source)
        const query = params.toString()
        return api.get(query ? `/incomes?${query}` : '/incomes')
    },
    create: (data) => api.post('/incomes', data),
    update: (id, data) => api.put(`/incomes/${id}`, data),
    remove: (id) => api.delete(`/incomes/${id}`),
}