import { useState } from 'react'
import { Link } from 'react-router-dom'
import { describeError } from '../api/client'
import AuthLayout from '../components/AuthLayout'
import FormField from '../components/FormField'
import GoogleSignInButton from '../components/GoogleSignInButton'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
    const { login, loginWithGoogle } = useAuth()
    const [form, setForm] = useState({ email: '', password: '' })
    const [error, setError] = useState('')
    const [fieldErrors, setFieldErrors] = useState({})
    const [submitting, setSubmitting] = useState(false)

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

    function showError(err) {
        const { message, fieldErrors } = describeError(err)
        setError(message)
        setFieldErrors(fieldErrors)
    }

    function resetErrors() {
        setError('')
        setFieldErrors({})
    }

    async function handleSubmit(e) {
        e.preventDefault()
        resetErrors()
        setSubmitting(true)
        try {
            await login(form.email, form.password)
            // On success the user is set and PublicRoute redirects automatically
        } catch (err) {
            showError(err)
        } finally {
            setSubmitting(false)
        }
    }

    async function handleGoogle(idToken) {
        resetErrors()
        setSubmitting(true)
        try {
            await loginWithGoogle(idToken)
        } catch (err) {
            showError(err)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <AuthLayout title="Welcome back" subtitle="Log in to track your expenses and groups.">
            {error && (
                <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <FormField
                    label="Email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={handleChange}
                    error={fieldErrors.email}
                />
                <FormField
                    label="Password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    value={form.password}
                    onChange={handleChange}
                    error={fieldErrors.password}
                />
                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                    {submitting ? 'Logging in...' : 'Log in'}
                </button>
            </form>

            <div className="my-6 flex items-center gap-3 text-xs text-slate-400">
                <div className="h-px flex-1 bg-slate-200" />
                OR
                <div className="h-px flex-1 bg-slate-200" />
            </div>

            <GoogleSignInButton onCredential={handleGoogle} onError={setError} disabled={submitting} />

            <p className="mt-6 text-center text-sm text-slate-500">
                New here?{' '}
                <Link to="/register" className="font-medium text-indigo-600 hover:underline">
                    Create an account
                </Link>
            </p>
        </AuthLayout>
    )
}