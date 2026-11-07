import { useState } from 'react'
import { describeError } from '../../api/client'
import { groupsApi } from '../../api/groups'
import Alert from '../Alert'
import Button from '../Button'
import FormField from '../FormField'
import SegmentedControl from '../SegmentedControl'

const NAME_MAX = 100

const MODES = [
    { value: 'email', label: 'Registered user' },
    { value: 'name', label: 'Guest' },
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
            <h3 className="text-sm font-semibold text-ink">Add a member</h3>

            <SegmentedControl label="Member type" options={MODES} value={mode} onChange={switchMode} />

            <p className="text-sm text-muted">
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
                                value.length > NAME_MAX ? 'text-negative' : 'text-muted'
                            }`}
                        >
                            {value.length}/{NAME_MAX}
                        </p>
                    )}
                </div>
                <Button type="submit" disabled={submitting} className="mt-6">
                    {submitting ? 'Adding...' : 'Add member'}
                </Button>
            </div>
        </form>
    )
}