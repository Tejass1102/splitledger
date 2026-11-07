import { Link } from 'react-router-dom'
import { buttonClass } from '../components/buttonStyles'
import { AlertCircleIcon } from '../components/icons'

export default function NotFoundPage() {
    return (
        <div className="mx-auto max-w-md rounded-2xl bg-surface p-8 text-center shadow-sm ring-1 ring-line">
            <span
                aria-hidden="true"
                className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft text-brand"
            >
                <AlertCircleIcon size={24} />
            </span>
            <h1 className="mt-4 text-2xl font-bold text-ink">Page not found</h1>
            <p className="mt-2 text-sm text-muted">
                The page you are looking for doesn&apos;t exist or has moved.
            </p>
            <Link to="/" className={`${buttonClass({ variant: 'primary' })} mt-6`}>
                Go to the dashboard
            </Link>
        </div>
    )
}