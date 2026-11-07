import { useEffect, useState } from 'react'
import { describeError } from '../api/client'
import { profileApi } from '../api/profile'
import LoadError from '../components/LoadError'
import PageHeader from '../components/PageHeader'
import NameForm from '../components/profile/NameForm'
import SalaryForm from '../components/profile/SalaryForm'
import Spinner from '../components/Spinner'
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
        <div className="mx-auto max-w-3xl space-y-6">
            <PageHeader title="Profile" description="Your account details and salary reminder." />

            {loading && <Spinner label="Loading your profile..." />}

            {!loading && error && <LoadError message={error} onRetry={retry} />}

            {!loading && profile && (
                <>
                    <NameForm initialName={profile.name} email={profile.email} onSaved={handleNameSaved} />
                    <SalaryForm salary={profile.salary} onSaved={handleSalarySaved} />
                </>
            )}
        </div>
    )
}