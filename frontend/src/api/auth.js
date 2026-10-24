import { request } from './client'

// Auth endpoints are public, so no token is sent (auth: false)
export const authApi = {
    register: (data) => request('/auth/register', { method: 'POST', body: data, auth: false }),
    login: (data) => request('/auth/login', { method: 'POST', body: data, auth: false }),
    google: (idToken) =>
        request('/auth/google', { method: 'POST', body: { idToken }, auth: false }),
}