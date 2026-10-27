import { useEffect, useRef, useState } from 'react'
import { describeError } from '../api/client'
import { notificationsApi } from '../api/notifications'
import { useReminders } from '../context/RemindersContext'
import { formatDateTime } from '../utils/format'

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
                className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="h-6 w-6"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
                    />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
                )}
            </button>

            {open && (
                <div className="fixed inset-x-4 top-[4.25rem] z-20 rounded-xl bg-white shadow-lg ring-1 ring-slate-200 sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-80">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                        <h2 className="text-sm font-semibold text-slate-900">Notifications</h2>
                        <label className="flex items-center gap-2 text-xs text-slate-600">
                            <input
                                type="checkbox"
                                checked={unreadOnly}
                                onChange={handleFilterChange}
                                className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600"
                            />
                            Unread only
                        </label>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {loading && <p className="px-4 py-6 text-center text-sm text-slate-500">Loading...</p>}

                        {!loading && error && (
                            <p role="alert" className="px-4 py-4 text-sm text-red-700">
                                {error}
                            </p>
                        )}

                        {!loading && !error && items.length === 0 && (
                            <p className="px-4 py-6 text-center text-sm text-slate-500">
                                {unreadOnly ? 'No unread notifications.' : 'No notifications yet.'}
                            </p>
                        )}

                        {!loading && items.length > 0 && (
                            <ul className="divide-y divide-slate-100">
                                {items.map((item) => (
                                    <li key={item.id}>
                                        <button
                                            onClick={() => handleItemClick(item)}
                                            className={`flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-slate-50 ${
                                                item.read ? 'cursor-default' : ''
                                            }`}
                                        >
                      <span
                          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                              item.read ? 'bg-transparent' : 'bg-indigo-600'
                          }`}
                          aria-hidden="true"
                      />
                                            <span className="min-w-0">
                        <span
                            className={`block text-sm ${
                                item.read ? 'text-slate-600' : 'font-semibold text-slate-900'
                            }`}
                        >
                          {item.message}
                        </span>
                        <span className="mt-0.5 block text-xs text-slate-400">
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