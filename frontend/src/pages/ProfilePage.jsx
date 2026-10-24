import { useEffect, useState } from 'react'
import { describeError } from '../api/client'
import { profileApi } from '../api/profile'
import Alert from '../components/Alert'
import NameForm from '../components/profile/NameForm'
import SalaryForm from '../components/profile/SalaryForm'
import { useAuth } from '../context/AuthContext'

export default function ProfilePage() {
    const { updateUser } = useAuth()
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [reloadKey, setReloadKey] = useState(0)

    useEffect(() => {
        let cancelled = false

        async function load() {
            try {
                const data = await profileApi.get()
                if (!cancelled) setProfile(data)
            } catch (err) {
                if (!cancelled) setError(describeError(err).message)
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        load()
        return () => {
            cancelled = true
        }
    }, [reloadKey])

    function retry() {
        setLoading(true)
        setError('')
        setReloadKey((key) => key + 1)
    }

    function handleNameSaved(updated) {
        setProfile(updated)
        updateUser({ name: updated.name }) // keeps the navbar in sync
    }

    function handleSalarySaved(salary) {
        setProfile((current) => ({ ...current, salary }))
    }

    return (
        <div className="mx-auto max-w-2xl space-y-6">
            <h1 className="text-2xl font-bold text-slate-900">Profile</h1>

            {loading && <p className="text-sm text-slate-500">Loading your profile...</p>}

            {!loading && error && (
                <div className="space-y-3">
                    <Alert type="error">{error}</Alert>
                    <button
                        onClick={retry}
                        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        Retry
                    </button>
                </div>
            )}

            {!loading && profile && (
                <>
                    <NameForm initialName={profile.name} email={profile.email} onSaved={handleNameSaved} />
                    <SalaryForm salary={profile.salary} onSaved={handleSalarySaved} />
                </>
            )}
        </div>
    )
}