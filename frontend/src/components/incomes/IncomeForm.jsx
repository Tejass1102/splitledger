import { useState } from 'react'
import { describeError } from '../../api/client'
import { incomesApi } from '../../api/incomes'
import { todayIso } from '../../utils/format'
import Alert from '../Alert'
import FormField from '../FormField'
import SelectField from '../SelectField'
import TextAreaField from '../TextAreaField'

const NOTE_MAX = 255

// income = null -> add form; income = an IncomeResponse -> edit form.
// idPrefix keeps element ids unique when several forms are on the page.
export default function IncomeForm({ income, categories, idPrefix, onSaved, onCancel, onStale }) {
    const editing = Boolean(income)
    const [form, setForm] = useState({
        amount: income ? String(income.amount) : '',
        incomeDate: income ? income.incomeDate : todayIso(),
        categoryId: income?.categoryId ? String(income.categoryId) : '',
        note: income?.note ?? '',
    })
    const [error, setError] = useState('')
    const [fieldErrors, setFieldErrors] = useState({})
    const [submitting, setSubmitting] = useState(false)

    // If the chosen category was deleted meanwhile, fall back to "No category"
    const categoryValue = categories.some((c) => String(c.id) === form.categoryId)
        ? form.categoryId
        : ''

    async function handleSubmit(e) {
        e.preventDefault()
        setError('')
        setFieldErrors({})

        // Blank fields are caught here; every other rule comes from the backend
        const missing = {}
        if (form.amount.trim() === '') missing.amount = 'Amount is required'
        if (form.incomeDate === '') missing.incomeDate = 'Date is required'
        if (Object.keys(missing).length > 0) {
            setFieldErrors(missing)
            return
        }

        const payload = {
            amount: Number(form.amount),
            incomeDate: form.incomeDate,
            categoryId: categoryValue ? Number(categoryValue) : null,
            note: form.note.trim() === '' ? null : form.note,
        }

        setSubmitting(true)
        try {
            const saved = editing
                ? await incomesApi.update(income.id, payload)
                : await incomesApi.create(payload)
            onSaved(saved, editing)
            if (!editing) {
                // Keep date and category for quick entry of several incomes
                setForm({ ...form, amount: '', note: '' })
            }
        } catch (err) {
            const described = describeError(err)
            if (err.status === 404) {
                // The income (or the chosen category) no longer exists
                onStale(described.message)
            } else {
                // 409 here means the income is a salary income, which cannot be changed
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
                <FormField
                    label="Amount (INR)"
                    name={`${idPrefix}amount`}
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    error={fieldErrors.amount}
                />
                <FormField
                    label="Date"
                    name={`${idPrefix}incomeDate`}
                    type="date"
                    value={form.incomeDate}
                    onChange={(e) => setForm({ ...form, incomeDate: e.target.value })}
                    error={fieldErrors.incomeDate}
                />
            </div>

            <SelectField
                label="Category (optional)"
                name={`${idPrefix}categoryId`}
                value={categoryValue}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                error={fieldErrors.categoryId}
            >
                <option value="">No category</option>
                {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                        {c.name}
                    </option>
                ))}
            </SelectField>

            <TextAreaField
                label="Note (optional)"
                name={`${idPrefix}note`}
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                counter={form.note.length}
                max={NOTE_MAX}
                error={fieldErrors.note}
            />

            <div className="flex gap-2">
                <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                    {submitting ? 'Saving...' : editing ? 'Save changes' : 'Add income'}
                </button>
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={submitting}
                        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                    >
                        Cancel
                    </button>
                )}
            </div>
        </form>
    )
}