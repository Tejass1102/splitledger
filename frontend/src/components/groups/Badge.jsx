const TONES = {
    indigo: 'bg-brand-soft text-brand',
    slate: 'bg-subtle text-muted',
    amber: 'bg-warning-soft text-warning-ink',
}

export default function Badge({ children, tone = 'slate' }) {
    return (
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${TONES[tone]}`}>
      {children}
    </span>
    )
}