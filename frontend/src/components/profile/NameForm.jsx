import { useState } from 'react'
import { describeError } from '../../api/client'
import { profileApi } from '../../api/profile'
import Alert from '../Alert'
import Card from '../Card'
import FormField from '../FormField'

export default function NameForm({ initialName, email, onSaved }) {
    const [name, setName] = useState(initialName)
    const [error, setError] = useState('')
    const [fieldErrors, setFieldErrors] = useState({})
    const [success, setSuccess] = useState('')
    const [saving, setSaving] = useState(false)

    async function handleSubmit(e) {
        e.preventDefault()
        setError('')
        setFieldErrors({})
        setSuccess('')
        setSaving(true)
        try {
            const updated = await profileApi.updateName(name)
            setName(updated.name)
            onSaved(updated)
            setSuccess('Name updated.')
        } catch (err) {
            const described = describeError(err)
            setError(described.message)
            setFieldErrors(described.fieldErrors)
        } finally {
            setSaving(false)
        }
    }

    // Field errors show under the input, so the banner is only for general errors
    const hasFieldErrors = Object.keys(fieldErrors).length > 0

    return (
        <Card title="Your details" description="Your email is used to sign in and cannot be changed here.">
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <Alert type="error">{!hasFieldErrors && error}</Alert>
                <Alert type="success">{success}</Alert>

                <div>
                    <p className="mb-1 text-sm font-medium text-slate-700">Email</p>
                    <p className="text-sm text-slate-600">{email}</p>
                </div>

                <FormField
                    label="Name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    error={fieldErrors.name}
                />

                <button
                    type="submit"
                    disabled={saving || name.trim() === initialName}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                    {saving ? 'Saving...' : 'Save name'}
                </button>
            </form>
        </Card>
    )
}