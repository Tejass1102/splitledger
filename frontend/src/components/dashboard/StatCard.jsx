import { ArrowDownIcon, ArrowUpIcon } from '../icons'

const TONES = {
    neutral: 'text-ink',
    positive: 'text-positive-ink',
    negative: 'text-negative',
}

const ACCENTS = {
    brand: 'bg-brand-soft text-brand',
    positive: 'bg-positive-soft text-positive',
    negative: 'bg-negative-soft text-negative-ink',
}

// change: percent vs last month, or null/undefined to hide it.
// goodDirection: 'up' when a rise is good news (income, net), 'down' when a fall is (expenses).
function TrendPill({ change, goodDirection }) {
    if (change === null || change === undefined || !Number.isFinite(change)) return null

    const rounded = Math.round(Math.abs(change) * 10) / 10
    if (rounded === 0) {
        return <p className="mt-3 text-xs font-medium text-muted">No change vs last month</p>
    }

    const isUp = change > 0
    const isGood = isUp === (goodDirection === 'up')
    const Arrow = isUp ? ArrowUpIcon : ArrowDownIcon

    return (
        <p className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-muted">
            <span
                className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 font-semibold ${
                    isGood ? 'bg-positive-soft text-positive-ink' : 'bg-negative-soft text-negative-ink'
                }`}
            >
                <Arrow size={12} />
                <span className="sr-only">{isUp ? 'Up ' : 'Down '}</span>
                {rounded.toFixed(1)}%
            </span>
            <span>vs last month</span>
        </p>
    )
}

export default function StatCard({
                                     label,
                                     value,
                                     tone = 'neutral',
                                     icon: Icon,
                                     accent = 'brand',
                                     change,
                                     goodDirection = 'up',
                                 }) {
    return (
        <div className="rounded-2xl bg-surface p-5 shadow-sm ring-1 ring-line">
            <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-muted">{label}</p>
                {Icon && (
                    <span
                        aria-hidden="true"
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${ACCENTS[accent]}`}
                    >
                        <Icon size={18} />
                    </span>
                )}
            </div>
            <p className={`mt-2 break-words text-2xl font-bold ${TONES[tone]}`}>{value}</p>
            <TrendPill change={change} goodDirection={goodDirection} />
        </div>
    )
}