import { useState } from 'react'
import { describeError } from '../../api/client'
import { groupExpensesApi } from '../../api/groupExpenses'
import { formatDate, formatMoney } from '../../utils/format'
import Button, { IconButton } from '../Button'
import { ChevronDownIcon, PencilIcon, ReceiptIcon, TrashIcon } from '../icons'
import GroupExpenseForm from './GroupExpenseForm'

const SPLIT_LABELS = {
    EQUAL: 'Split equally',
    EXACT: 'Split by amounts',
    PERCENTAGE: 'Split by percentages',
}

export default function GroupExpenseItem({
                                             expense,
                                             group,
                                             currentUserId,
                                             onSaved,
                                             onDeleted,
                                             onStale,
                                         }) {
    const [mode, setMode] = useState('view') // 'view' | 'edit' | 'confirmDelete'
    const [showSplit, setShowSplit] = useState(false)
    const [error, setError] = useState('')
    const [busy, setBusy] = useState(false)

    // Same rule as the backend: whoever added the expense, or the group creator
    const canModify = expense.createdById === currentUserId || group.createdById === currentUserId
    const payer = group.members.find((m) => m.id === expense.paidByMemberId)
    const paidByYou = payer?.userId === currentUserId

    async function handleDelete() {
        setError('')
        setBusy(true)
        try {
            await groupExpensesApi.remove(group.id, expense.id)
            onDeleted(expense.id)
        } catch (err) {
            const message = describeError(err).message
            if (err.status === 404) {
                onStale(message)
            } else {
                setMode('view')
                setError(message)
            }
        } finally {
            setBusy(false)
        }
    }

    if (mode === 'edit') {
        return (
            <li className="py-3">
                <div className="rounded-xl bg-subtle p-4">
                    <GroupExpenseForm
                        groupId={group.id}
                        expense={expense}
                        members={group.members}
                        currentUserId={currentUserId}
                        idPrefix={`edit-${expense.id}-`}
                        onSaved={(saved) => {
                            setMode('view')
                            onSaved(saved, true)
                        }}
                        onCancel={() => setMode('view')}
                        onStale={onStale}
                    />
                </div>
            </li>
        )
    }

    return (
        <li className="px-1 py-3">
            <div className="flex items-start gap-3">
                <span
                    aria-hidden="true"
                    className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand"
                >
                    <ReceiptIcon size={18} />
                </span>

                <div className="min-w-0 flex-1">
                    <p className="break-words text-sm font-medium text-ink">{expense.description}</p>
                    <p className="mt-0.5 text-xs text-muted">
                        {formatDate(expense.expenseDate)} · Paid by {paidByYou ? 'you' : expense.paidByName} ·{' '}
                        {SPLIT_LABELS[expense.splitType]}
                    </p>
                    <button
                        type="button"
                        onClick={() => setShowSplit((open) => !open)}
                        aria-expanded={showSplit}
                        className="mt-1 inline-flex items-center gap-1 rounded text-xs font-medium text-brand hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                    >
                        {showSplit ? 'Hide split' : 'Show split'}
                        <ChevronDownIcon
                            size={14}
                            className={`transition-transform ${showSplit ? 'rotate-180' : ''}`}
                        />
                    </button>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1">
                    <p className="text-sm font-semibold text-ink">{formatMoney(expense.amount)}</p>
                    {canModify && mode === 'view' && (
                        <div className="flex gap-0.5">
                            <IconButton
                                label={`Edit ${expense.description}`}
                                onClick={() => {
                                    setError('')
                                    setMode('edit')
                                }}
                            >
                                <PencilIcon size={16} />
                            </IconButton>
                            <IconButton
                                tone="danger"
                                label={`Delete ${expense.description}`}
                                onClick={() => {
                                    setError('')
                                    setMode('confirmDelete')
                                }}
                            >
                                <TrashIcon size={16} />
                            </IconButton>
                        </div>
                    )}
                </div>
            </div>

            {showSplit && (
                <ul className="mt-3 space-y-1 rounded-lg bg-subtle px-3 py-2">
                    {expense.splits.map((share) => (
                        <li key={share.memberId} className="flex justify-between gap-3 text-sm">
                            <span className="text-ink">{share.memberName}</span>
                            <span className="font-medium text-ink">{formatMoney(share.shareAmount)}</span>
                        </li>
                    ))}
                </ul>
            )}

            {canModify && mode === 'confirmDelete' && (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-negative-soft px-3 py-2">
                    <span className="text-sm font-medium text-ink">Delete this expense?</span>
                    <div className="flex gap-2">
                        <Button variant="danger" size="sm" onClick={handleDelete} disabled={busy}>
                            {busy ? 'Deleting...' : 'Yes, delete'}
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => setMode('view')} disabled={busy}>
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