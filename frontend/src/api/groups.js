import { api } from './client'

export const groupsApi = {
    list: () => api.get('/groups'),
    get: (id) => api.get(`/groups/${id}`),
    create: (name) => api.post('/groups', { name }),
    rename: (id, name) => api.put(`/groups/${id}`, { name }),
    remove: (id) => api.delete(`/groups/${id}`),

    // data is { email } for a registered user or { name } for a guest (exactly one of them)
    addMember: (groupId, data) => api.post(`/groups/${groupId}/members`, data),
    removeMember: (groupId, memberId) => api.delete(`/groups/${groupId}/members/${memberId}`),
    // Attaches a registered account to a guest member
    linkMember: (groupId, memberId, email) =>
        api.post(`/groups/${groupId}/members/${memberId}/link`, { email }),
}