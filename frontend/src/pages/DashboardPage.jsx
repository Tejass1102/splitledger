import { useState } from 'react'
import { describeError } from '../api/client'
import { usersApi } from '../api/users'
import { useAuth } from '../context/AuthContext'

export default function DashboardPage() {
    const { user, logout } = useAuth()
    const [result, setResult] = useState('')

    async function testProtectedCall() {
        setResult('Loading...')
        try {
            const me = await usersApi.me()
            setResult(JSON.stringify(me, null, 2))
        } catch (err) {
            setResult(describeError(err).message)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
                <h1 className="text-2xl font-bold text-slate-900">Welcome, {user.name}</h1>
                <p className="mt-1 text-sm text-slate-500">{user.email}</p>

                <div className="mt-6 flex gap-3">
                    <button
                        onClick={testProtectedCall}
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                    >
                        Test GET /users/me
                    </button>
                    <button
                        onClick={logout}
                        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        Log out
                    </button>
                </div>

                {result && (
                    <pre className="mt-4 overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-100">
            {result}
          </pre>
                )}
            </div>
        </div>
    )
}