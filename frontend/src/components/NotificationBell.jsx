import { useEffect, useRef, useState } from 'react'
import { describeError } from '../api/client'
import { notificationsApi } from '../api/notifications'
import { useReminders } from '../context/RemindersContext'
import { formatDateTime } from '../utils/format'
import { BellIcon } from './icons'

function newestFirst(list) {
    return [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export default function NotificationBell() {
    const { unreadCount, refresh } = useReminders()
    const [open, setOpen] = useState(false)
    const [unreadOnly, setUnreadOnly] = useState(false)
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const containerRef = useRef(null)

    async function loadList(onlyUnread) {
        setLoading(true)
        setError('')
        try {
            setItems(newestFirst(await notificationsApi.list(onlyUnread)))
        } catch (err) {
            setError(describeError(err).message)
        } finally {
            setLoading(false)
        }
    }

    function toggleOpen() {
        const next = !open
        setOpen(next)
        if (next) loadList(unreadOnly) // always show a fresh list when opening
    }

    function handleFilterChange(e) {
        setUnreadOnly(e.target.checked)
        loadList(e.target.checked)
    }

    async function handleItemClick(item) {
        if (item.read) return
        try {
            const updated = await notificationsApi.markRead(item.id)
            setItems((current) =>
                unreadOnly
                    ? current.filter((n) => n.id !== updated.id)
                    : current.map((n) => (n.id === updated.id ? updated : n)),
            )
            refresh() // updates the badge
        } catch (err) {
            setError(describeError(err).message)
        }
    }

    // Close on outside click or Escape
    useEffect(() => {
        if (!open) return undefined

        function handlePointerDown(e) {
            if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false)
        }
        function handleKeyDown(e) {
            if (e.key === 'Escape') setOpen(false)
        }

        document.addEventListener('mousedown', handlePointerDown)
        document.addEventListener('keydown', handleKeyDown)
        return () => {
            document.removeEventListener('mousedown', handlePointerDown)
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [open])

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={toggleOpen}
                aria-label={`Notifications, ${unreadCount} unread`}
                aria-expanded={open}
                className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-subtle hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
                <BellIcon size={22} />
                {unreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-negative px-1 text-[10px] font-bold leading-none text-on-negative">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="fixed inset-x-4 top-[4.25rem] z-20 rounded-xl bg-elevated shadow-lg ring-1 ring-line sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-80">
                    <div className="flex items-center justify-between border-b border-line px-4 py-3">
                        <h2 className="text-sm font-semibold text-ink">Notifications</h2>
                        <label className="flex items-center gap-2 text-xs text-muted">
                            <input
                                type="checkbox"
                                checked={unreadOnly}
                                onChange={handleFilterChange}
                                className="h-3.5 w-3.5 rounded border-line-strong accent-brand"
                            />
                            Unread only
                        </label>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {loading && (
                            <p className="px-4 py-6 text-center text-sm text-muted">Loading...</p>
                        )}

                        {!loading && error && (
                            <p role="alert" className="px-4 py-4 text-sm text-negative">
                                {error}
                            </p>
                        )}

                        {!loading && !error && items.length === 0 && (
                            <p className="px-4 py-6 text-center text-sm text-muted">
                                {unreadOnly ? 'No unread notifications.' : 'No notifications yet.'}
                            </p>
                        )}

                        {!loading && items.length > 0 && (
                            <ul className="divide-y divide-line">
                                {items.map((item) => (
                                    <li key={item.id}>
                                        <button
                                            onClick={() => handleItemClick(item)}
                                            className={`flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-subtle ${
                                                item.read ? 'cursor-default' : ''
                                            }`}
                                        >
                                            <span
                                                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                                                    item.read ? 'bg-transparent' : 'bg-brand'
                                                }`}
                                                aria-hidden="true"
                                            />
                                            <span className="min-w-0">
                                                <span
                                                    className={`block text-sm ${
                                                        item.read ? 'text-muted' : 'font-semibold text-ink'
                                                    }`}
                                                >
                                                    {item.message}
                                                </span>
                                                <span className="mt-0.5 block text-xs text-muted">
                                                    {formatDateTime(item.createdAt)}
                                                </span>
                                            </span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}