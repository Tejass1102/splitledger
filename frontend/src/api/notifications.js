import { api } from './client'

export const notificationsApi = {
    list: (unreadOnly = false) => api.get(`/notifications?unreadOnly=${unreadOnly}`),
    // quiet: polled in the background (see RemindersContext)
    unreadCount: () => api.get('/notifications/unread-count', { quiet: true }),
    markRead: (id) => api.patch(`/notifications/${id}/read`),
}