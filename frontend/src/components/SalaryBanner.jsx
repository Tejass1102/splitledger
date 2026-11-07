import { useState } from 'react'
import { describeError } from '../api/client'
import { salaryApi } from '../api/salary'
import { useReminders } from '../context/RemindersContext'
import { formatDate, formatMoney, formatMonth } from '../utils/format'
import Alert from './Alert'
import Button from './Button'
import FormField from './FormField'
import { WalletIcon } from './icons'

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
        <div className="rounded-xl border border-warning/30 bg-warning-soft p-4">
            <div className="flex items-start gap-3">
                <span
                    aria-hidden="true"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface/60 text-warning-ink"
                >
                    <WalletIcon size={18} />
                </span>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-warning-ink">Did your {month} salary arrive?</p>
                    <p className="mt-1 text-sm text-warning-ink">
                        Expected {formatMoney(cycle.expectedAmount)} on {formatDate(cycle.creditDate)}. Confirming
                        records it as income dated today.
                    </p>

                    {error && !hasFieldErrors && (
                        <div className="mt-3">
                            <Alert type="error">{error}</Alert>
                        </div>
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
                                <Button type="submit" disabled={submitting}>
                                    {submitting ? 'Confirming...' : 'Confirm'}
                                </Button>
                                <Button
                                    variant="secondary"
                                    disabled={submitting}
                                    onClick={() => {
                                        setEditing(false)
                                        setError('')
                                        setFieldErrors({})
                                    }}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <div className="mt-3 flex flex-wrap gap-2">
                            <Button onClick={() => confirm(undefined)} disabled={submitting}>
                                {submitting ? 'Confirming...' : 'Yes, it arrived'}
                            </Button>
                            <Button variant="secondary" onClick={() => setEditing(true)} disabled={submitting}>
                                Different amount
                            </Button>
                        </div>
                    )}
                </div>
            </div>
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

    return (
        <div className="mb-6 space-y-3">
            {notice && (
                <Alert type={notice.type}>
                    <div className="flex items-start justify-between gap-3">
                        <span>{notice.text}</span>
                        <button
                            type="button"
                            onClick={() => setNotice(null)}
                            className="shrink-0 rounded font-medium underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                            aria-label="Dismiss message"
                        >
                            Dismiss
                        </button>
                    </div>
                </Alert>
            )}

            {pendingCycles.map((cycle) => (
                <PendingSalaryCard key={cycle.id} cycle={cycle} onDone={handleDone} />
            ))}
        </div>
    )
}