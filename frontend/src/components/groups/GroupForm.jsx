import { useState } from 'react'
import { describeError } from '../../api/client'
import { groupsApi } from '../../api/groups'
import Alert from '../Alert'
import FormField from '../FormField'

const NAME_MAX = 100

export default function GroupForm({ onCreated }) {
    const [name, setName] = useState('')
    const [error, setError] = useState('')
    const [fieldErrors, setFieldErrors] = useState({})
    const [submitting, setSubmitting] = useState(false)

    async function handleSubmit(e) {
        e.preventDefault()
        setError('')
        setFieldErrors({})

        // Blank is caught here; the length rule comes from the backend
        if (name.trim() === '') {
            setFieldErrors({ name: 'Name is required' })
            return
        }

        setSubmitting(true)
        try {
            const created = await groupsApi.create(name)
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
                        label="Group name"
                        name="groupName"
                        type="text"
                        placeholder="e.g. Goa trip"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        error={fieldErrors.name}
                    />
                    <p
                        className={`mt-1 text-right text-xs ${
                            name.length > NAME_MAX ? 'text-red-600' : 'text-slate-400'
                        }`}
                    >
                        {name.length}/{NAME_MAX}
                    </p>
                </div>
                <button
                    type="submit"
                    disabled={submitting}
                    className="mt-6 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                    {submitting ? 'Creating...' : 'Create group'}
                </button>
            </div>
        </form>
    )
}