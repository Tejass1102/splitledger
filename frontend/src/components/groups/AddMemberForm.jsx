import { useState } from 'react'
import { describeError } from '../../api/client'
import { groupsApi } from '../../api/groups'
import Alert from '../Alert'
import FormField from '../FormField'

const NAME_MAX = 100

const MODES = [
    { key: 'email', label: 'Registered user' },
    { key: 'name', label: 'Guest' },
]

// onAdded(member) hands the new member to the page; onRefresh() reloads the group quietly
export default function AddMemberForm({ groupId, onAdded, onRefresh }) {
    const [mode, setMode] = useState('email') // 'email' = registered user, 'name' = guest
    const [value, setValue] = useState('')
    const [error, setError] = useState('')
    const [fieldErrors, setFieldErrors] = useState({})
    const [submitting, setSubmitting] = useState(false)

    function switchMode(next) {
        if (next === mode) return
        setMode(next)
        setValue('')
        setError('')
        setFieldErrors({})
    }

    async function handleSubmit(e) {
        e.preventDefault()
        setError('')
        setFieldErrors({})

        const trimmed = value.trim()
        if (trimmed === '') {
            setFieldErrors({ [mode]: mode === 'email' ? 'Email is required' : 'Name is required' })
            return
        }

        setSubmitting(true)
        try {
            // Only the field for the chosen mode is sent
            const added = await groupsApi.addMember(groupId, { [mode]: trimmed })
            onAdded(added)
            setValue('')
        } catch (err) {
            const described = describeError(err)
            setError(described.message)
            setFieldErrors(described.fieldErrors)
            // 404 can also mean the group is gone: reload quietly so the page corrects itself
            if (err.status === 404) onRefresh()
        } finally {
            setSubmitting(false)
        }
    }

    const fieldError = fieldErrors[mode]
    const hasFieldErrors = Object.keys(fieldErrors).length > 0

    return (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <h3 className="text-sm font-semibold text-slate-900">Add a member</h3>

            <div className="inline-flex rounded-lg bg-slate-100 p-1" role="tablist">
                {MODES.map((m) => (
                    <button
                        key={m.key}
                        type="button"
                        role="tab"
                        aria-selected={mode === m.key}
                        onClick={() => switchMode(m.key)}
                        className={`rounded-md px-4 py-1.5 text-sm font-medium ${
                            mode === m.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                        }`}
                    >
                        {m.label}
                    </button>
                ))}
            </div>

            <p className="text-sm text-slate-500">
                {mode === 'email'
                    ? 'They need a SplitLedger account. You can add them by the email they signed up with.'
                    : 'Add someone without an account. You can link them to an account later.'}
            </p>

            <Alert type="error">{!hasFieldErrors && error}</Alert>

            <div className="flex flex-wrap items-start gap-3">
                <div className="min-w-0 flex-1 basis-56">
                    <FormField
                        label={mode === 'email' ? 'Email of a registered user' : 'Guest name'}
                        name="memberValue"
                        type={mode === 'email' ? 'email' : 'text'}
                        placeholder={mode === 'email' ? 'friend@example.com' : 'e.g. Rahul'}
                        autoComplete="off"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        error={fieldError}
                    />
                    {mode === 'name' && (
                        <p
                            className={`mt-1 text-right text-xs ${
                                value.length > NAME_MAX ? 'text-red-600' : 'text-slate-400'
                            }`}
                        >
                            {value.length}/{NAME_MAX}
                        </p>
                    )}
                </div>
                <button
                    type="submit"
                    disabled={submitting}
                    className="mt-6 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                    {submitting ? 'Adding...' : 'Add member'}
                </button>
            </div>
        </form>
    )
}