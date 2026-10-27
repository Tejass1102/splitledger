import { useState } from 'react'
import { describeError } from '../../api/client'
import { groupExpensesApi } from '../../api/groupExpenses'
import { formatDate, formatMoney } from '../../utils/format'
import GroupExpenseForm from './GroupExpenseForm'

const SPLIT_LABELS = {
    EQUAL: 'Split equally',
    EXACT: 'Split by amounts',
    PERCENTAGE: 'Split by percentages',
}

const secondaryButton =
    'rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60'
const dangerButton =
    'rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60'

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
                <div className="rounded-xl bg-slate-50 p-4">
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
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="break-words text-sm font-semibold text-slate-900">{expense.description}</p>
                    <p className="mt-0.5 text-sm font-semibold text-slate-900">
                        {formatMoney(expense.amount)}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                        {formatDate(expense.expenseDate)} · Paid by {paidByYou ? 'you' : expense.paidByName} ·{' '}
                        {SPLIT_LABELS[expense.splitType]}
                    </p>
                    <button
                        onClick={() => setShowSplit((open) => !open)}
                        aria-expanded={showSplit}
                        className="mt-1 text-xs font-medium text-indigo-700 hover:underline"
                    >
                        {showSplit ? 'Hide split' : 'Show split'}
                    </button>
                </div>

                {canModify &&
                    (mode === 'confirmDelete' ? (
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm text-slate-600">Delete this expense?</span>
                            <button onClick={handleDelete} disabled={busy} className={dangerButton}>
                                {busy ? 'Deleting...' : 'Yes, delete'}
                            </button>
                            <button onClick={() => setMode('view')} disabled={busy} className={secondaryButton}>
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    setError('')
                                    setMode('edit')
                                }}
                                className={secondaryButton}
                            >
                                Edit
                            </button>
                            <button
                                onClick={() => {
                                    setError('')
                                    setMode('confirmDelete')
                                }}
                                className={secondaryButton}
                            >
                                Delete
                            </button>
                        </div>
                    ))}
            </div>

            {showSplit && (
                <ul className="mt-2 space-y-1 rounded-lg bg-slate-50 px-3 py-2">
                    {expense.splits.map((share) => (
                        <li key={share.memberId} className="flex justify-between gap-3 text-sm">
                            <span className="text-slate-700">{share.memberName}</span>
                            <span className="text-slate-900">{formatMoney(share.shareAmount)}</span>
                        </li>
                    ))}
                </ul>
            )}

            {error && (
                <p role="alert" className="mt-2 text-sm text-red-600">
                    {error}
                </p>
            )}
        </li>
    )
}