const STYLES = {
    error: 'bg-red-50 text-red-700',
    success: 'bg-green-50 text-green-700',
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