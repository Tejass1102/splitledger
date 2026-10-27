import { api } from './client'

// Balances, suggested payments and recorded settlements of one group
export const settlementsApi = {
    balances: (groupId) => api.get(`/groups/${groupId}/balances`),
    settleUp: (groupId) => api.get(`/groups/${groupId}/settle-up`),
    list: (groupId) => api.get(`/groups/${groupId}/settlements`),
    // data is { fromMemberId, toMemberId, amount, settledOn }; settledOn may be null (= today)
    create: (groupId, data) => api.post(`/groups/${groupId}/settlements`, data),
    remove: (groupId, settlementId) => api.delete(`/groups/${groupId}/settlements/${settlementId}`),
}