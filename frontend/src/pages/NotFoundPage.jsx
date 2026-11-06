import { Link } from 'react-router-dom'

export default function NotFoundPage() {
    return (
        <div className="mx-auto max-w-md rounded-2xl bg-surface p-8 text-center shadow-sm ring-1 ring-line">
            <h1 className="text-2xl font-bold text-ink">Page not found</h1>
            <p className="mt-2 text-sm text-muted">
                The page you are looking for doesn&apos;t exist or has moved.
            </p>
            <Link
                to="/"
                className="mt-6 inline-block rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-on-brand hover:bg-brand-hover"
            >
                Go to the dashboard
            </Link>
        </div>
    )
}