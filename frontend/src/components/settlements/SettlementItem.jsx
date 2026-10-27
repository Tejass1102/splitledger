import { useState } from 'react'
import { describeError } from '../../api/client'
import { settlementsApi } from '../../api/settlements'
import { formatDate, formatMoney } from '../../utils/format'

const secondaryButton =
    'rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60'
const dangerButton =
    'rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60'

// onDeleted() and onStale(message) report back to the section
export default function SettlementItem({ settlement, group, currentUserId, onDeleted, onStale }) {
    const [confirming, setConfirming] = useState(false)
    const [error, setError] = useState('')
    const [busy, setBusy] = useState(false)

    const userIdOf = (memberId) => group.members.find((m) => m.id === memberId)?.userId
    const fromYou = userIdOf(settlement.fromMemberId) === currentUserId
    const toYou = userIdOf(settlement.toMemberId) === currentUserId
    // Same rule as the backend: the group creator, or a person involved in the settlement
    const canDelete = group.createdById === currentUserId || fromYou || toYou

    async function handleDelete() {
        setError('')
        setBusy(true)
        try {
            await settlementsApi.remove(group.id, settlement.id)
            onDeleted()
        } catch (err) {
            const message = describeError(err).message
            if (err.status === 404) {
                onStale(message)
            } else {
                setConfirming(false)
                setError(message)
            }
        } finally {
            setBusy(false)
        }
    }

    return (
        <li className="px-1 py-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-sm text-slate-900">
                        {fromYou ? 'You' : settlement.fromName} paid {toYou ? 'you' : settlement.toName}{' '}
                        <span className="font-semibold">{formatMoney(settlement.amount)}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">{formatDate(settlement.settledOn)}</p>
                </div>

                {canDelete &&
                    (confirming ? (
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm text-slate-600">Delete this settlement?</span>
                            <button onClick={handleDelete} disabled={busy} className={dangerButton}>
                                {busy ? 'Deleting...' : 'Yes, delete'}
                            </button>
                            <button onClick={() => setConfirming(false)} disabled={busy} className={secondaryButton}>
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => {
                                setError('')
                                setConfirming(true)
                            }}
                            className={secondaryButton}
                        >
                            Delete
                        </button>
                    ))}
            </div>

            {error && (
                <p role="alert" className="mt-2 text-sm text-red-600">
                    {error}
                </p>
            )}
        </li>
    )
}