import { useState } from 'react'
import { describeError } from '../../api/client'
import { expensesApi } from '../../api/expenses'
import { formatDate, formatMoney } from '../../utils/format'
import ExpenseForm from './ExpenseForm'

const secondaryButton =
    'rounded-lg border border-line-strong px-3 py-1.5 text-sm font-medium text-ink hover:bg-subtle disabled:opacity-60'
const dangerButton =
    'rounded-lg bg-negative text-on-negative hover:bg-negative-hover disabled:opacity-60'

export default function ExpenseItem({ expense, categories, onSaved, onDeleted, onStale }) {
    const [mode, setMode] = useState('view') // 'view' | 'edit' | 'confirmDelete'
    const [error, setError] = useState('')
    const [busy, setBusy] = useState(false)

    async function handleDelete() {
        setError('')
        setBusy(true)
        try {
            await expensesApi.remove(expense.id)
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
                    <ExpenseForm
                        expense={expense}
                        categories={categories}
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
                    <p className="text-sm font-semibold text-ink">{formatMoney(expense.amount)}</p>
                    <p className="mt-0.5 text-xs text-muted">
                        {formatDate(expense.expenseDate)} · {expense.categoryName ?? 'No category'}
                    </p>
                    {expense.note && <p className="mt-1 break-words text-sm text-muted">{expense.note}</p>}
                </div>

                {mode === 'confirmDelete' ? (
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm text-muted">Delete this expense?</span>
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
                )}
            </div>

            {error && (
                <p role="alert" className="mt-2 text-sm text-negative">
                    {error}
                </p>
            )}
        </li>
    )
}