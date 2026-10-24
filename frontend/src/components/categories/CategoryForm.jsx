import { useState } from 'react'
import { categoriesApi } from '../../api/categories'
import { describeError } from '../../api/client'
import Alert from '../Alert'
import FormField from '../FormField'

const TYPE_LABELS = { EXPENSE: 'expense', INCOME: 'income' }

// The page remounts this form (key={type}) when the tab changes, so it always starts clean
export default function CategoryForm({ type, onCreated }) {
    const [name, setName] = useState('')
    const [error, setError] = useState('')
    const [fieldErrors, setFieldErrors] = useState({})
    const [submitting, setSubmitting] = useState(false)

    async function handleSubmit(e) {
        e.preventDefault()
        setError('')
        setFieldErrors({})
        setSubmitting(true)
        try {
            const created = await categoriesApi.create(name, type)
            onCreated(created)
            setName('')
        } catch (err) {
            const described = describeError(err)
            setError(described.message)
            setFieldErrors(described.fieldErrors)
        } finally {
            setSubmitting(false)
        }
    }

    const hasFieldErrors = Object.keys(fieldErrors).length > 0

    return (
        <form onSubmit={handleSubmit} className="space-y-3" noValidate>
            <Alert type="error">{!hasFieldErrors && error}</Alert>
            <div className="flex flex-wrap items-start gap-3">
                <div className="min-w-0 flex-1 basis-56">
                    <FormField
                        label={`New ${TYPE_LABELS[type]} category`}
                        name="categoryName"
                        type="text"
                        placeholder="e.g. Groceries"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        error={fieldErrors.name}
                    />
                </div>
                <button
                    type="submit"
                    disabled={submitting}
                    className="mt-6 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                    {submitting ? 'Adding...' : 'Add category'}
                </button>
            </div>
        </form>
    )
}