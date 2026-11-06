import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { RemindersProvider } from '../context/RemindersContext'
import AccountMenu from './AccountMenu'
import Avatar from './Avatar'
import ErrorBoundary from './ErrorBoundary'
import {
    CategoriesIcon,
    CloseIcon,
    DashboardIcon,
    ExpensesIcon,
    GroupsIcon,
    IncomesIcon,
    LogoutIcon,
    MenuIcon,
    ProfileIcon,
} from './icons'
import NotificationBell from './NotificationBell'
import SalaryBanner from './SalaryBanner'
import ThemeToggle from './ThemeToggle'

// inDesktopNav: false = reachable from the account menu on desktop instead
const NAV_ITEMS = [
    { to: '/', label: 'Dashboard', end: true, icon: DashboardIcon, inDesktopNav: true },
    { to: '/expenses', label: 'Expenses', end: false, icon: ExpensesIcon, inDesktopNav: true },
    { to: '/incomes', label: 'Incomes', end: false, icon: IncomesIcon, inDesktopNav: true },
    { to: '/groups', label: 'Groups', end: false, icon: GroupsIcon, inDesktopNav: true },
    { to: '/categories', label: 'Categories', end: false, icon: CategoriesIcon, inDesktopNav: true },
    { to: '/profile', label: 'Profile', end: false, icon: ProfileIcon, inDesktopNav: false },
]

const DESKTOP_ITEMS = NAV_ITEMS.filter((item) => item.inDesktopNav)

function isActivePath(item, pathname) {
    return item.end
        ? pathname === item.to
        : pathname === item.to || pathname.startsWith(`${item.to}/`)
}

function titleFor(pathname) {
    const match = NAV_ITEMS.find((item) => isActivePath(item, pathname))
    return match ? `${match.label} · SplitLedger` : 'Page not found · SplitLedger'
}

const focusRing =
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand'

const desktopLink = ({ isActive }) =>
    `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${focusRing} ${
        isActive ? 'bg-brand-soft text-brand' : 'text-muted hover:bg-subtle hover:text-ink'
    }`

const mobileLink = ({ isActive }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${focusRing} ${
        isActive ? 'bg-brand-soft text-brand' : 'text-ink hover:bg-subtle'
    }`

export default function AppLayout() {
    const { user, logout } = useAuth()
    const location = useLocation()
    const [menuOpen, setMenuOpen] = useState(false)

    useEffect(() => {
        document.title = titleFor(location.pathname)
    }, [location.pathname])

    return (
        <RemindersProvider>
            <div className="min-h-screen bg-page">
                <a
                    href="#main-content"
                    className="sr-only rounded-lg bg-surface px-4 py-2 text-sm font-semibold text-brand shadow focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50"
                >
                    Skip to content
                </a>

                <header className="sticky top-0 z-30 border-b border-line bg-surface/90 backdrop-blur">
                    <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
                        <div className="flex items-center gap-6">
                            <Link
                                to="/"
                                aria-label="SplitLedger home"
                                className={`flex items-center gap-2 rounded-lg ${focusRing}`}
                            >
                                <span
                                    aria-hidden="true"
                                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-sm font-bold text-on-brand"
                                >
                                    S
                                </span>
                                <span className="text-lg font-bold text-ink">SplitLedger</span>
                            </Link>
                            <nav className="hidden gap-1 lg:flex" aria-label="Main">
                                {DESKTOP_ITEMS.map((item) => (
                                    <NavLink key={item.to} to={item.to} end={item.end} className={desktopLink}>
                                        <item.icon size={18} />
                                        {item.label}
                                    </NavLink>
                                ))}
                            </nav>
                        </div>

                        <div className="flex items-center gap-1">
                            <div className="hidden lg:block">
                                <ThemeToggle />
                            </div>
                            <NotificationBell />
                            <div className="hidden lg:block">
                                <AccountMenu />
                            </div>
                            <button
                                onClick={() => setMenuOpen((open) => !open)}
                                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                                aria-expanded={menuOpen}
                                aria-controls="mobile-menu"
                                className={`inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-subtle hover:text-ink lg:hidden ${focusRing}`}
                            >
                                {menuOpen ? <CloseIcon size={22} /> : <MenuIcon size={22} />}
                            </button>
                        </div>
                    </div>

                    {menuOpen && (
                        <nav
                            id="mobile-menu"
                            aria-label="Main"
                            className="border-t border-line px-4 py-3 lg:hidden"
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
                                        <item.icon size={20} />
                                        {item.label}
                                    </NavLink>
                                ))}

                                <div className="mt-2 border-t border-line pt-2">
                                    <ThemeToggle variant="row" />
                                </div>

                                <div className="flex items-center justify-between gap-3 border-t border-line pt-3">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <Avatar name={user.name} size="sm" />
                                        <span className="truncate text-sm text-ink">{user.name}</span>
                                    </div>
                                    <button
                                        onClick={logout}
                                        className={`flex items-center gap-2 rounded-lg border border-line-strong px-3 py-1.5 text-sm font-medium text-ink hover:bg-subtle ${focusRing}`}
                                    >
                                        <LogoutIcon size={16} />
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