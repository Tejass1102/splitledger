import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { setServerErrorHandler } from '../api/client'

const DURATION_MS = 6000
const MAX_TOASTS = 4

const STYLES = {
    error: 'bg-red-50 text-red-800 ring-red-200',
    success: 'bg-green-50 text-green-800 ring-green-200',
    info: 'bg-white text-slate-800 ring-slate-200',
}

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([])
    const nextId = useRef(1)
    const timers = useRef(new Map())

    const dismiss = useCallback((id) => {
        clearTimeout(timers.current.get(id))
        timers.current.delete(id)
        setToasts((current) => current.filter((toast) => toast.id !== id))
    }, [])

    const show = useCallback((type, text) => {
        const id = nextId.current++
        setToasts((current) => {
            // The same message is never shown twice at once (for example several failing requests)
            if (current.some((toast) => toast.type === type && toast.text === text)) return current
            return [...current, { id, type, text }].slice(-MAX_TOASTS)
        })
    }, [])

    // Every new toast disappears by itself after a few seconds
    useEffect(() => {
        toasts.forEach((toast) => {
            if (!timers.current.has(toast.id)) {
                timers.current.set(toast.id, setTimeout(() => dismiss(toast.id), DURATION_MS))
            }
        })
    }, [toasts, dismiss])

    useEffect(() => {
        const pending = timers.current
        return () => pending.forEach((timer) => clearTimeout(timer))
    }, [])

    // The API client calls this for every 5xx answer (except quiet background calls)
    useEffect(() => {
        setServerErrorHandler(() =>
            show('error', 'The server ran into a problem. Please try again in a moment.'),
        )
        return () => setServerErrorHandler(null)
    }, [show])

    const api = useMemo(
        () => ({
            success: (text) => show('success', text),
            error: (text) => show('error', text),
            info: (text) => show('info', text),
            dismiss,
        }),
        [show, dismiss],
    )

    return (
        <ToastContext.Provider value={api}>
            {children}
            <div
                aria-live="polite"
                className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-4 sm:items-end"
            >
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        role={toast.type === 'error' ? 'alert' : 'status'}
                        className={`pointer-events-auto flex w-full max-w-sm items-start justify-between gap-3 rounded-xl px-4 py-3 text-sm shadow-lg ring-1 ${STYLES[toast.type]}`}
                    >
                        <span>{toast.text}</span>
                        <button
                            onClick={() => dismiss(toast.id)}
                            aria-label="Dismiss notification"
                            className="shrink-0 font-medium underline"
                        >
                            Dismiss
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
    const context = useContext(ToastContext)
    if (!context) throw new Error('useToast must be used inside <ToastProvider>')
    return context
}