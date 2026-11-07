const TONES = {
    indigo: 'bg-brand-soft text-brand',
    slate: 'bg-subtle text-muted',
    amber: 'bg-warning-soft text-warning-ink',
    green: 'bg-positive-soft text-positive-ink',
}

export default function Badge({ children, tone = 'slate' }) {
    return (
        <span
            className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${TONES[tone]}`}
        >
            {children}
        </span>
    )
}