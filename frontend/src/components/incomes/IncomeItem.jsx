import { useState } from 'react'
import { describeError } from '../../api/client'
import { incomesApi } from '../../api/incomes'
import { formatDate, formatMoney } from '../../utils/format'
import Button, { IconButton } from '../Button'
import { ArrowDownLeftIcon, LockIcon, PencilIcon, TrashIcon } from '../icons'
import IncomeForm from './IncomeForm'

export default function IncomeItem({ income, categories, onSaved, onDeleted, onStale }) {
    const [mode, setMode] = useState('view') // 'view' | 'edit' | 'confirmDelete'
    const [error, setError] = useState('')
    const [busy, setBusy] = useState(false)

    const isSalary = income.sourceType === 'SALARY'

    async function handleDelete() {
        setError('')
        setBusy(true)
        try {
            await incomesApi.remove(income.id)
            onDeleted(income.id)
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
                    <IncomeForm
                        income={income}
                        categories={categories}
                        idPrefix={`edit-${income.id}-`}
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

    const description = `income of ${formatMoney(income.amount)} on ${formatDate(income.incomeDate)}`

    return (
        <li className="px-1 py-3">
            <div className="flex items-start gap-3">
                <span
                    aria-hidden="true"
                    className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-positive-soft text-positive"
                >
                    <ArrowDownLeftIcon size={18} />
                </span>

                <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-ink">
                        <span className="truncate">{income.categoryName ?? 'No category'}</span>
                        {isSalary && (
                            <span className="rounded-full bg-positive-soft px-2.5 py-0.5 text-xs font-medium text-positive-ink">
                                Salary
                            </span>
                        )}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">{formatDate(income.incomeDate)}</p>
                    {income.note && <p className="mt-1 break-words text-sm text-muted">{income.note}</p>}
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1">
                    <p className="text-sm font-semibold text-positive-ink">{formatMoney(income.amount)}</p>
                    {isSalary ? (
                        <span className="flex items-center gap-1 text-xs text-muted">
                            <LockIcon size={12} />
                            Managed by salary confirmation
                        </span>
                    ) : (
                        mode === 'view' && (
                            <div className="flex gap-0.5">
                                <IconButton
                                    label={`Edit ${description}`}
                                    onClick={() => {
                                        setError('')
                                        setMode('edit')
                                    }}
                                >
                                    <PencilIcon size={16} />
                                </IconButton>
                                <IconButton
                                    tone="danger"
                                    label={`Delete ${description}`}
                                    onClick={() => {
                                        setError('')
                                        setMode('confirmDelete')
                                    }}
                                >
                                    <TrashIcon size={16} />
                                </IconButton>
                            </div>
                        )
                    )}
                </div>
            </div>

            {!isSalary && mode === 'confirmDelete' && (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-negative-soft px-3 py-2">
                    <span className="text-sm font-medium text-ink">Delete this income?</span>
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