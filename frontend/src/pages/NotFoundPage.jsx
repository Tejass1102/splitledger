import { Link } from 'react-router-dom'

export default function NotFoundPage() {
    return (
        <div className="mx-auto max-w-md rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
            <h1 className="text-2xl font-bold text-slate-900">Page not found</h1>
            <p className="mt-2 text-sm text-slate-500">
                The page you are looking for doesn&apos;t exist or has moved.
            </p>
            <Link
                to="/"
                className="mt-6 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
                Go to the dashboard
            </Link>
        </div>
    )
}