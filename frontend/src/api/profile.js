import { api } from './client'

export const profileApi = {
    get: () => api.get('/profile'),
    updateName: (name) => api.put('/profile', { name }),
    saveSalary: (data) => api.put('/profile/salary', data),
}