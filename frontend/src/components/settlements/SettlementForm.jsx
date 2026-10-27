import { useState } from 'react'
import { describeError } from '../../api/client'
import { settlementsApi } from '../../api/settlements'
import { todayIso } from '../../utils/format'
import Alert from '../Alert'
import FormField from '../FormField'
import SelectField from '../SelectField'

// initial is null, or { fromMemberId, toMemberId, amount } as text (from a suggestion)
function startingForm(initial) {
    return {
        fromMemberId: initial?.fromMemberId ?? '',
        toMemberId: initial?.toMemberId ?? '',
        amount: initial?.amount ?? '',
        settledOn: todayIso(),
    }
}

export default function SettlementForm({ groupId, members, initial, onSaved, onStale }) {
    const [form, setForm] = useState(() => startingForm(initial))
    const [error, setError] = useState('')
    const [fieldErrors, setFieldErrors] = useState({})
    const [submitting, setSubmitting] = useState(false)

    // If a chosen member disappeared meanwhile, fall back to "Choose a member"
    const validMember = (value) => (members.some((m) => String(m.id) === value) ? value : '')
    const fromValue = validMember(form.fromMemberId)
    const toValue = validMember(form.toMemberId)

    async function handleSubmit(e) {
        e.preventDefault()
        setError('')
        setFieldErrors({})

        // Blank fields and "same member" are caught here; every other rule comes from the backend
        const missing = {}
        if (fromValue === '') missing.fromMemberId = 'Payer is required'
        if (toValue === '') missing.toMemberId = 'Receiver is required'
        if (form.amount.trim() === '') missing.amount = 'Amount is required'
        if (fromValue !== '' && toValue !== '' && fromValue === toValue) {
            missing.toMemberId = 'The payer and the receiver must be different members'
        }
        if (Object.keys(missing).length > 0) {
            setFieldErrors(missing)
            return
        }

        setSubmitting(true)
        try {
            const saved = await settlementsApi.create(groupId, {
                fromMemberId: Number(fromValue),
                toMemberId: Number(toValue),
                amount: Number(form.amount),
                // An empty date is saved by the backend as today
                settledOn: form.settledOn === '' ? null : form.settledOn,
            })
            onSaved(saved)
            setForm(startingForm(null))
        } catch (err) {
            const described = describeError(err)
            if (err.status === 404) {
                onStale(described.message)
            } else {
                setError(described.message)
                setFieldErrors(described.fieldErrors)
            }
        } finally {
            setSubmitting(false)
        }
    }

    const hasFieldErrors = Object.keys(fieldErrors).length > 0

    return (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Alert type="error">{!hasFieldErrors && error}</Alert>

            <div className="grid gap-4 sm:grid-cols-2">
                <SelectField
                    label="Paid by (handed over the money)"
                    name="settlement-from"
                    value={fromValue}
                    onChange={(e) => setForm({ ...form, fromMemberId: e.target.value })}
                    error={fieldErrors.fromMemberId}
                >
                    <option value="">Choose a member</option>
                    {members.map((m) => (
                        <option key={m.id} value={m.id}>
                            {m.displayName}
                        </option>
                    ))}
                </SelectField>

                <SelectField
                    label="Received by"
                    name="settlement-to"
                    value={toValue}
                    onChange={(e) => setForm({ ...form, toMemberId: e.target.value })}
                    error={fieldErrors.toMemberId}
                >
                    <option value="">Choose a member</option>
                    {members.map((m) => (
                        <option key={m.id} value={m.id}>
                            {m.displayName}
                        </option>
                    ))}
                </SelectField>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                    label="Amount (INR)"
                    name="settlement-amount"
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    error={fieldErrors.amount}
                />
                <FormField
                    label="Date (optional, today if empty)"
                    name="settlement-date"
                    type="date"
                    value={form.settledOn}
                    onChange={(e) => setForm({ ...form, settledOn: e.target.value })}
                    error={fieldErrors.settledOn}
                />
            </div>

            <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
                {submitting ? 'Recording...' : 'Record settlement'}
            </button>
        </form>
    )
}