const TONES = {
    neutral: 'text-ink',
    positive: 'text-positive-ink',
    negative: 'text-negative',
}

export default function StatCard({ label, value, tone = 'neutral' }) {
    return (
        <div className="rounded-2xl bg-surface p-5 shadow-sm ring-1 ring-line">
            <p className="text-sm font-medium text-muted">{label}</p>
            <p className={`mt-2 text-2xl font-bold ${TONES[tone]}`}>{value}</p>
        </div>
    )
}