import { useState } from 'react'
import { formatMoney } from '../../utils/format'
import Badge from '../groups/Badge'

// Whole paise, so zero is exactly zero
const toMinor = (value) => Math.round(Number(value) * 100)

function describeNet(minor) {
    if (minor > 0) return { text: `is owed ${formatMoney(minor / 100)}`, tone: 'text-green-700' }
    if (minor < 0) return { text: `owes ${formatMoney(-minor / 100)}`, tone: 'text-red-700' }
    return { text: 'is settled up', tone: 'text-slate-500' }
}

// balances is a GroupBalanceResponse { groupId, settledUp, members: [...] }
export default function BalanceList({ balances, members, currentUserId }) {
    const [showDetails, setShowDetails] = useState(false)
    const userIdOf = (memberId) => members.find((m) => m.id === memberId)?.userId

    return (
        <div className="space-y-3">
            {balances.settledUp && (
                <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
                    Everyone is settled up.
                </p>
            )}

            <ul className="divide-y divide-slate-100">
                {balances.members.map((m) => {
                    const net = describeNet(toMinor(m.net))
                    return (
                        <li key={m.memberId} className="py-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-sm font-medium text-slate-900">{m.displayName}</span>
                                    {userIdOf(m.memberId) === currentUserId && <Badge tone="indigo">You</Badge>}
                                    {m.guest && <Badge tone="amber">Guest</Badge>}
                                </div>
                                <span className={`text-sm font-semibold ${net.tone}`}>{net.text}</span>
                            </div>

                            {showDetails && (
                                <p className="mt-1 text-xs text-slate-500">
                                    Paid {formatMoney(m.paid)} · Share {formatMoney(m.share)} · Settlements paid{' '}
                                    {formatMoney(m.settlementsPaid)} · received {formatMoney(m.settlementsReceived)}
                                </p>
                            )}
                        </li>
                    )
                })}
            </ul>

            <button
                onClick={() => setShowDetails((open) => !open)}
                aria-expanded={showDetails}
                className="text-xs font-medium text-indigo-700 hover:underline"
            >
                {showDetails ? 'Hide breakdown' : 'Show breakdown'}
            </button>
        </div>
    )
}