import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { RemindersProvider } from '../context/RemindersContext'
import ErrorBoundary from './ErrorBoundary'
import NotificationBell from './NotificationBell'
import SalaryBanner from './SalaryBanner'

const NAV_ITEMS = [
    { to: '/', label: 'Dashboard', end: true },
    { to: '/expenses', label: 'Expenses', end: false },
    { to: '/incomes', label: 'Incomes', end: false },
    { to: '/groups', label: 'Groups', end: false },
    { to: '/categories', label: 'Categories', end: false },
    { to: '/profile', label: 'Profile', end: false },
]

function isActivePath(item, pathname) {
    return item.end
        ? pathname === item.to
        : pathname === item.to || pathname.startsWith(`${item.to}/`)
}

function titleFor(pathname) {
    const match = NAV_ITEMS.find((item) => isActivePath(item, pathname))
    return match ? `${match.label} · SplitLedger` : 'Page not found · SplitLedger'
}

const desktopLink = ({ isActive }) =>
    `rounded-lg px-3 py-2 text-sm font-medium ${
        isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
    }`

const mobileLink = ({ isActive }) =>
    `block rounded-lg px-3 py-2.5 text-sm font-medium ${
        isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-100'
    }`

const logoutButton =
    'rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50'

export default function AppLayout() {
    const { user, logout } = useAuth()
    const location = useLocation()
    const [menuOpen, setMenuOpen] = useState(false)

    useEffect(() => {
        document.title = titleFor(location.pathname)
    }, [location.pathname])

    return (
        <RemindersProvider>
            <div className="min-h-screen bg-slate-50">
                <a
                    href="#main-content"
                    className="sr-only rounded-lg bg-white px-4 py-2 text-sm font-semibold text-indigo-700 shadow focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50"
                >
                    Skip to content
                </a>

                <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
                    <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
                        <div className="flex items-center gap-6">
                            <span className="text-lg font-bold text-slate-900">SplitLedger</span>
                            <nav className="hidden gap-1 lg:flex" aria-label="Main">
                                {NAV_ITEMS.map((item) => (
                                    <NavLink key={item.to} to={item.to} end={item.end} className={desktopLink}>
                                        {item.label}
                                    </NavLink>
                                ))}
                            </nav>
                        </div>

                        <div className="flex items-center gap-2">
                            <NotificationBell />
                            <span className="hidden text-sm text-slate-600 lg:inline">{user.name}</span>
                            <button onClick={logout} className={`${logoutButton} hidden lg:inline-block`}>
                                Log out
                            </button>
                            <button
                                onClick={() => setMenuOpen((open) => !open)}
                                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                                aria-expanded={menuOpen}
                                aria-controls="mobile-menu"
                                className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth="1.5"
                                    stroke="currentColor"
                                    className="h-6 w-6"
                                    aria-hidden="true"
                                >
                                    {menuOpen ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                    ) : (
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                                        />
                                    )}
                                </svg>
                            </button>
                        </div>
                    </div>

                    {menuOpen && (
                        <nav
                            id="mobile-menu"
                            aria-label="Main"
                            className="border-t border-slate-100 px-4 py-3 lg:hidden"
                        >
                            <div className="mx-auto max-w-5xl space-y-1">
                                {NAV_ITEMS.map((item) => (
                                    <NavLink
                                        key={item.to}
                                        to={item.to}
                                        end={item.end}
                                        onClick={() => setMenuOpen(false)}
                                        className={mobileLink}
                                    >
                                        {item.label}
                                    </NavLink>
                                ))}
                                <div className="mt-2 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                                    <span className="truncate text-sm text-slate-600">{user.name}</span>
                                    <button onClick={logout} className={logoutButton}>
                                        Log out
                                    </button>
                                </div>
                            </div>
                        </nav>
                    )}
                </header>

                <main id="main-content" tabIndex={-1} className="mx-auto max-w-5xl px-4 py-8 outline-none">
                    <SalaryBanner />
                    {/* key resets the boundary when you move to another page */}
                    <ErrorBoundary key={location.pathname} compact>
                        <Outlet />
                    </ErrorBoundary>
                </main>
            </div>
        </RemindersProvider>
    )
}