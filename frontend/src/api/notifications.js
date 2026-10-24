import { api } from './client'

export const notificationsApi = {
    list: (unreadOnly = false) => api.get(`/notifications?unreadOnly=${unreadOnly}`),
    unreadCount: () => api.get('/notifications/unread-count'),
    markRead: (id) => api.patch(`/notifications/${id}/read`),
}