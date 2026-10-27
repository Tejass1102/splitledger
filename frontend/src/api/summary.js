import { api } from './client'

// month is "yyyy-MM"; type is 'EXPENSE' or 'INCOME'
export const summaryApi = {
    monthly: (month) => api.get(`/summary/monthly?month=${month}`),
    categories: (month, type) => api.get(`/summary/categories?month=${month}&type=${type}`),
    balance: () => api.get('/summary/balance'),
}