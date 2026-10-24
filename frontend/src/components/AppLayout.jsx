import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Later parts add one entry here for each new page
const NAV_ITEMS = [
    { to: '/', label: 'Dashboard', end: true },
    { to: '/profile', label: 'Profile', end: false },
]

function linkClass({ isActive }) {
    return `rounded-lg px-3 py-2 text-sm font-medium ${
        isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
    }`
}

export default function AppLayout() {
    const { user, logout } = useAuth()

    return (
        <div className="min-h-screen bg-slate-50">
            <header className="border-b border-slate-200 bg-white">
                <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                        <span className="text-lg font-bold text-slate-900">SplitLedger</span>
                        <nav className="flex flex-wrap gap-1">
                            {NAV_ITEMS.map((item) => (
                                <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
                                    {item.label}
                                </NavLink>
                            ))}
                        </nav>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-sm text-slate-600">{user.name}</span>
                        <button
                            onClick={logout}
                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                            Log out
                        </button>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-5xl px-4 py-8">
                <Outlet />
            </main>
        </div>
    )
}