import { useState } from 'react'
import { formatMoney } from '../../utils/format'
import Alert from '../Alert'
import Avatar from '../Avatar'
import Button from '../Button'
import Badge from '../groups/Badge'
import { ChevronDownIcon } from '../icons'

// Whole paise, so zero is exactly zero
const toMinor = (value) => Math.round(Number(value) * 100)

function describeNet(minor) {
    if (minor > 0) return { text: `is owed ${formatMoney(minor / 100)}`, tone: 'text-positive-ink' }
    if (minor < 0) return { text: `owes ${formatMoney(-minor / 100)}`, tone: 'text-negative' }
    return { text: 'is settled up', tone: 'text-muted' }
}

// balances is a GroupBalanceResponse { groupId, settledUp, members: [...] }
export default function BalanceList({ balances, members, currentUserId }) {
    const [showDetails, setShowDetails] = useState(false)
    const userIdOf = (memberId) => members.find((m) => m.id === memberId)?.userId

    return (
        <div className="space-y-3">
            {balances.settledUp && <Alert type="success">Everyone is settled up.</Alert>}

            <ul className="divide-y divide-line">
                {balances.members.map((m) => {
                    const net = describeNet(toMinor(m.net))
                    return (
                        <li key={m.memberId} className="py-3">
                            <div className="flex flex-wrap items-center gap-3">
                                <Avatar name={m.displayName} size="sm" />
                                <div className="flex min-w-0 flex-1 basis-40 flex-wrap items-center gap-2">
                                    <span className="truncate text-sm font-medium text-ink">{m.displayName}</span>
                                    {userIdOf(m.memberId) === currentUserId && <Badge tone="indigo">You</Badge>}
                                    {m.guest && <Badge tone="amber">Guest</Badge>}
                                </div>
                                <span className={`text-sm font-semibold ${net.tone}`}>{net.text}</span>
                            </div>

                            {showDetails && (
                                <p className="mt-2 pl-11 text-xs text-muted">
                                    Paid {formatMoney(m.paid)} · Share {formatMoney(m.share)} · Settlements paid{' '}
                                    {formatMoney(m.settlementsPaid)} · received {formatMoney(m.settlementsReceived)}
                                </p>
                            )}
                        </li>
                    )
                })}
            </ul>

            <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails((open) => !open)}
                aria-expanded={showDetails}
            >
                {showDetails ? 'Hide breakdown' : 'Show breakdown'}
                <ChevronDownIcon
                    size={14}
                    className={`transition-transform ${showDetails ? 'rotate-180' : ''}`}
                />
            </Button>
        </div>
    )
}