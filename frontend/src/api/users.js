import { api } from './client'

export const usersApi = {
    me: () => api.get('/users/me'),
}