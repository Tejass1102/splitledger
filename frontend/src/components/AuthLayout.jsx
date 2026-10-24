export default function AuthLayout({ title, subtitle, children }) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
            <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
                <h1 className="text-2xl font-bold text-slate-900">SplitLedger</h1>
                <h2 className="mt-6 text-lg font-semibold text-slate-900">{title}</h2>
                {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
                <div className="mt-6">{children}</div>
            </div>
        </div>
    )
}