import { AlertCircleIcon, CheckCircleIcon } from './icons'

const STYLES = {
    error: { box: 'bg-negative-soft text-negative-ink ring-negative/20', Icon: AlertCircleIcon },
    success: { box: 'bg-positive-soft text-positive-ink ring-positive/20', Icon: CheckCircleIcon },
}

// Renders nothing when there is no message
export default function Alert({ type = 'error', children }) {
    if (!children) return null
    const { box, Icon } = STYLES[type]
    return (
        <div
            role={type === 'error' ? 'alert' : 'status'}
            className={`flex items-start gap-3 rounded-lg px-4 py-3 text-sm ring-1 ring-inset ${box}`}
        >
            <Icon size={18} className="mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">{children}</div>
        </div>
    )
}