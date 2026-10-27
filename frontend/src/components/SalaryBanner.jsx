import { useState } from 'react'
import { describeError } from '../api/client'
import { salaryApi } from '../api/salary'
import { useReminders } from '../context/RemindersContext'
import { formatDate, formatMoney, formatMonth } from '../utils/format'
import FormField from './FormField'

// One card per pending salary cycle.
// onDone({ type, text }) tells the banner to show a notice and reload the list.
function PendingSalaryCard({ cycle, onDone }) {
    const [editing, setEditing] = useState(false)
    const [amount, setAmount] = useState(String(cycle.expectedAmount))
    const [error, setError] = useState('')
    const [fieldErrors, setFieldErrors] = useState({})
    const [submitting, setSubmitting] = useState(false)

    const month = formatMonth(cycle.month)

    // customAmount === undefined means "confirm the expected amount"
    async function confirm(customAmount) {
        setError('')
        setFieldErrors({})
        setSubmitting(true)
        try {
            await salaryApi.confirm(cycle.id, customAmount === undefined ? {} : { amount: customAmount })
            const received = customAmount === undefined ? cycle.expectedAmount : customAmount
            await onDone({
                type: 'success',
                text: `${month} salary of ${formatMoney(received)} was recorded as income for today.`,
            })
        } catch (err) {
            const described = describeError(err)
            if (err.status === 404 || err.status === 409) {
                // Already handled elsewhere (or not ours): show the message and drop the stale card
                await onDone({ type: 'error', text: described.message })
            } else {
                setError(described.message)
                setFieldErrors(described.fieldErrors)
            }
        } finally {
            setSubmitting(false)
        }
    }

    function handleCustomSubmit(e) {
        e.preventDefault()
        if (amount.trim() === '') {
            setFieldErrors({ amount: 'Amount is required' })
            return
        }
        confirm(Number(amount))
    }

    const hasFieldErrors = Object.keys(fieldErrors).length > 0

    return (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-900">Did your {month} salary arrive?</p>
            <p className="mt-1 text-sm text-amber-800">
                Expected {formatMoney(cycle.expectedAmount)} on {formatDate(cycle.creditDate)}. Confirming
                records it as income dated today.
            </p>

            {error && !hasFieldErrors && (
                <p role="alert" className="mt-2 text-sm text-red-700">
                    {error}
                </p>
            )}

            {editing ? (
                <form onSubmit={handleCustomSubmit} className="mt-3 max-w-xs space-y-3" noValidate>
                    <FormField
                        label="Amount received (INR)"
                        name={`salary-amount-${cycle.id}`}
                        type="number"
                        step="0.01"
                        inputMode="decimal"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        error={fieldErrors.amount}
                    />
                    <div className="flex gap-2">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                        >
                            {submitting ? 'Confirming...' : 'Confirm'}
                        </button>
                        <button
                            type="button"
                            disabled={submitting}
                            onClick={() => {
                                setEditing(false)
                                setError('')
                                setFieldErrors({})
                            }}
                            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                    <button
                        onClick={() => confirm(undefined)}
                        disabled={submitting}
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                    >
                        {submitting ? 'Confirming...' : 'Yes, it arrived'}
                    </button>
                    <button
                        onClick={() => setEditing(true)}
                        disabled={submitting}
                        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                    >
                        Different amount
                    </button>
                </div>
            )}
        </div>
    )
}

export default function SalaryBanner() {
    const { pendingCycles, refresh, notifyDataChanged } = useReminders()
    const [notice, setNotice] = useState(null) // { type: 'success' | 'error', text }

    async function handleDone(result) {
        setNotice(result)
        // A confirmed salary creates an income, so pages with totals should reload
        if (result.type === 'success') notifyDataChanged()
        await refresh()
    }

    if (!notice && pendingCycles.length === 0) return null

    const noticeStyle =
        notice?.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'

    return (
        <div className="mb-6 space-y-3">
            {notice && (
                <div
                    role={notice.type === 'error' ? 'alert' : 'status'}
                    className={`flex items-start justify-between gap-3 rounded-lg px-4 py-3 text-sm ${noticeStyle}`}
                >
                    <span>{notice.text}</span>
                    <button
                        onClick={() => setNotice(null)}
                        className="shrink-0 font-medium underline"
                        aria-label="Dismiss message"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            {pendingCycles.map((cycle) => (
                <PendingSalaryCard key={cycle.id} cycle={cycle} onDone={handleDone} />
            ))}
        </div>
    )
}