import { useState } from 'react'
import { describeError } from '../../api/client'
import { profileApi } from '../../api/profile'
import { formatMoney, ordinal } from '../../utils/format'
import Alert from '../Alert'
import Card from '../Card'
import FormField from '../FormField'

// salary is null until the user saves settings for the first time
export default function SalaryForm({ salary, onSaved }) {
    const [form, setForm] = useState({
        amount: salary ? String(salary.amount) : '',
        creditDay: salary ? String(salary.creditDay) : '',
        active: salary ? salary.active : true,
    })
    const [error, setError] = useState('')
    const [fieldErrors, setFieldErrors] = useState({})
    const [success, setSuccess] = useState('')
    const [saving, setSaving] = useState(false)

    function handleChange(e) {
        const { name, type, checked, value } = e.target
        setForm({ ...form, [name]: type === 'checkbox' ? checked : value })
    }

    async function handleSubmit(e) {
        e.preventDefault()
        setError('')
        setFieldErrors({})
        setSuccess('')

        // Blank fields are caught here; every other rule comes from the backend
        const missing = {}
        if (form.amount.trim() === '') missing.amount = 'Salary amount is required'
        if (form.creditDay.trim() === '') missing.creditDay = 'Credit day is required'
        if (Object.keys(missing).length > 0) {
            setFieldErrors(missing)
            return
        }

        setSaving(true)
        try {
            const saved = await profileApi.saveSalary({
                amount: Number(form.amount),
                creditDay: Number(form.creditDay),
                active: form.active,
            })
            onSaved(saved)
            setSuccess('Salary settings saved.')
        } catch (err) {
            const described = describeError(err)
            setError(described.message)
            setFieldErrors(described.fieldErrors)
        } finally {
            setSaving(false)
        }
    }

    const hasFieldErrors = Object.keys(fieldErrors).length > 0

    return (
        <Card
            title="Salary"
            description="Tell SplitLedger your monthly salary and the day it is credited."
        >
            <div className="mb-4 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700">
                {salary ? (
                    <>
                        {formatMoney(salary.amount)} on the {ordinal(salary.creditDay)} of every month
                        {' · '}
                        <span className={salary.active ? 'text-green-700' : 'text-amber-700'}>
              {salary.active ? 'Active' : 'Paused'}
            </span>
                    </>
                ) : (
                    'No salary settings saved yet.'
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <Alert type="error">{!hasFieldErrors && error}</Alert>
                <Alert type="success">{success}</Alert>

                <FormField
                    label="Monthly salary (INR)"
                    name="amount"
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    value={form.amount}
                    onChange={handleChange}
                    error={fieldErrors.amount}
                />
                <FormField
                    label="Credit day of the month (1 to 31)"
                    name="creditDay"
                    type="number"
                    inputMode="numeric"
                    value={form.creditDay}
                    onChange={handleChange}
                    error={fieldErrors.creditDay}
                />

                <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                        type="checkbox"
                        name="active"
                        checked={form.active}
                        onChange={handleChange}
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                    />
                    Active (untick to pause salary reminders)
                </label>

                <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                    {saving ? 'Saving...' : 'Save salary settings'}
                </button>
            </form>
        </Card>
    )
}