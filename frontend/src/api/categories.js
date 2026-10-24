import { api } from './client'

export const categoriesApi = {
    // type is 'EXPENSE' or 'INCOME'; leave it out to get both
    list: (type) => api.get(type ? `/categories?type=${type}` : '/categories'),
    create: (name, type) => api.post('/categories', { name, type }),
    // Only the name can change; the type is fixed once the category exists
    update: (id, name) => api.put(`/categories/${id}`, { name }),
    remove: (id) => api.delete(`/categories/${id}`),
}