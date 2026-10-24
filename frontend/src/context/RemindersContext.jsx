import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { notificationsApi } from '../api/notifications'
import { salaryApi } from '../api/salary'

const POLL_INTERVAL_MS = 60_000

const RemindersContext = createContext(null)

export function RemindersProvider({ children }) {
    const [pendingCycles, setPendingCycles] = useState([])
    const [unreadCount, setUnreadCount] = useState(0)

    // Reloads both values. A failed load keeps the old values; the next poll tries again.
    const refresh = useCallback(async () => {
        try {
            const [pending, unread] = await Promise.all([
                salaryApi.pending(),
                notificationsApi.unreadCount(),
            ])
            setPendingCycles(pending)
            setUnreadCount(unread.count)
        } catch {
            // ignore
        }
    }, [])

    useEffect(() => {
        refresh()
        const timer = setInterval(refresh, POLL_INTERVAL_MS)

        // Also refresh when the user returns to this browser tab
        function handleVisibility() {
            if (document.visibilityState === 'visible') refresh()
        }
        document.addEventListener('visibilitychange', handleVisibility)

        return () => {
            clearInterval(timer)
            document.removeEventListener('visibilitychange', handleVisibility)
        }
    }, [refresh])

    const value = useMemo(
        () => ({ pendingCycles, unreadCount, refresh }),
        [pendingCycles, unreadCount, refresh],
    )

    return <RemindersContext.Provider value={value}>{children}</RemindersContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useReminders() {
    const context = useContext(RemindersContext)
    if (!context) throw new Error('useReminders must be used inside <RemindersProvider>')
    return context
}