const STYLES = {
    error: 'bg-negative-soft text-negative',
    success: 'bg-positive-soft text-positive-ink',
}

// Renders nothing when there is no message
export default function Alert({ type = 'error', children }) {
    if (!children) return null
    return (
        <div
            role={type === 'error' ? 'alert' : 'status'}
            className={`rounded-lg px-4 py-3 text-sm ${STYLES[type]}`}
        >
            {children}
        </div>
    )
}