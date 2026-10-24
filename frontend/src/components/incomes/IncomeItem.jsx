import { useState } from 'react'
import { describeError } from '../../api/client'
import { incomesApi } from '../../api/incomes'
import { formatDate, formatMoney } from '../../utils/format'
import IncomeForm from './IncomeForm'

const secondaryButton =
    'rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60'
const dangerButton =
    'rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60'

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
                <div className="rounded-xl bg-slate-50 p-4">
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

    return (
        <li className="px-1 py-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900">
                        {formatMoney(income.amount)}
                        {isSalary && (
                            <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                Salary
              </span>
                        )}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                        {formatDate(income.incomeDate)} · {income.categoryName ?? 'No category'}
                    </p>
                    {income.note && <p className="mt-1 break-words text-sm text-slate-600">{income.note}</p>}
                </div>

                {isSalary ? (
                    <span className="text-xs text-slate-400">Managed by salary confirmation</span>
                ) : mode === 'confirmDelete' ? (
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm text-slate-600">Delete this income?</span>
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
                <p role="alert" className="mt-2 text-sm text-red-600">
                    {error}
                </p>
            )}
        </li>
    )
}