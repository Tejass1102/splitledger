const TONES = {
    neutral: 'text-slate-900',
    positive: 'text-green-700',
    negative: 'text-red-700',
}

export default function StatCard({ label, value, tone = 'neutral' }) {
    return (
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className={`mt-2 text-2xl font-bold ${TONES[tone]}`}>{value}</p>
        </div>
    )
}