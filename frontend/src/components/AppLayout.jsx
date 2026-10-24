import { NavLink, Outlet } from 'react-router-dom'
import { RemindersProvider } from '../context/RemindersContext'
import { useAuth } from '../context/AuthContext'
import NotificationBell from './NotificationBell'
import SalaryBanner from './SalaryBanner'

// Later parts add one entry here for each new page
const NAV_ITEMS = [
    { to: '/', label: 'Dashboard', end: true },
    { to: '/expenses', label: 'Expenses', end: false },
    { to: '/incomes', label: 'Incomes', end: false },
    { to: '/categories', label: 'Categories', end: false },
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
        <RemindersProvider>
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
                            <NotificationBell />
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
                    <SalaryBanner />
                    <Outlet />
                </main>
            </div>
        </RemindersProvider>
    )
}