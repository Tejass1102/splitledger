import ThemeToggle from './ThemeToggle'

export default function AuthLayout({ title, subtitle, children }) {
    return (
        <div className="relative flex min-h-screen items-center justify-center bg-page px-4 py-10">
            <div className="absolute right-4 top-4">
                <ThemeToggle />
            </div>

            <div className="w-full max-w-md rounded-2xl bg-surface p-8 shadow-sm ring-1 ring-line">
                <div className="flex items-center gap-2">
                    <span
                        aria-hidden="true"
                        className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-base font-bold text-on-brand"
                    >
                        S
                    </span>
                    <h1 className="text-2xl font-bold text-ink">SplitLedger</h1>
                </div>
                <h2 className="mt-6 text-lg font-semibold text-ink">{title}</h2>
                {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
                <div className="mt-6">{children}</div>
            </div>
        </div>
    )
}