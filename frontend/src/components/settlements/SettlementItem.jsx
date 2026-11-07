import { useState } from 'react'
import { describeError } from '../../api/client'
import { settlementsApi } from '../../api/settlements'
import { formatDate, formatMoney } from '../../utils/format'
import Button, { IconButton } from '../Button'
import { ArrowRightIcon, TrashIcon } from '../icons'

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

    const sentence = `${fromYou ? 'You' : settlement.fromName} paid ${toYou ? 'you' : settlement.toName}`

    return (
        <li className="px-1 py-3">
            <div className="flex items-start gap-3">
                <span
                    aria-hidden="true"
                    className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-positive-soft text-positive"
                >
                    <ArrowRightIcon size={18} />
                </span>

                <div className="min-w-0 flex-1">
                    <p className="break-words text-sm font-medium text-ink">{sentence}</p>
                    <p className="mt-0.5 text-xs text-muted">{formatDate(settlement.settledOn)}</p>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1">
                    <p className="text-sm font-semibold text-ink">{formatMoney(settlement.amount)}</p>
                    {canDelete && !confirming && (
                        <IconButton
                            tone="danger"
                            label={`Delete settlement: ${sentence}, ${formatMoney(settlement.amount)}`}
                            onClick={() => {
                                setError('')
                                setConfirming(true)
                            }}
                        >
                            <TrashIcon size={16} />
                        </IconButton>
                    )}
                </div>
            </div>

            {canDelete && confirming && (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-negative-soft px-3 py-2">
                    <span className="text-sm font-medium text-ink">Delete this settlement?</span>
                    <div className="flex gap-2">
                        <Button variant="danger" size="sm" onClick={handleDelete} disabled={busy}>
                            {busy ? 'Deleting...' : 'Yes, delete'}
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => setConfirming(false)} disabled={busy}>
                            Cancel
                        </Button>
                    </div>
                </div>
            )}

            {error && (
                <p role="alert" className="mt-2 text-sm text-negative">
                    {error}
                </p>
            )}
        </li>
    )
}