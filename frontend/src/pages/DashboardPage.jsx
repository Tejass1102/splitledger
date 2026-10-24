import { useAuth } from '../context/AuthContext'

export default function DashboardPage() {
    const { user } = useAuth()

    return (
        <div>
            <h1 className="text-2xl font-bold text-slate-900">Welcome, {user.name}</h1>
            <p className="mt-1 text-sm text-slate-500">Your spending summary will appear here soon.</p>
        </div>
    )
}