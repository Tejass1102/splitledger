export default function EmptyState({ icon: Icon, title, description, action }) {
    return (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-line px-6 py-10 text-center">
            {Icon && (
                <span
                    aria-hidden="true"
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft text-brand"
                >
                    <Icon size={24} />
                </span>
            )}
            <p className="mt-4 text-sm font-semibold text-ink">{title}</p>
            {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
            {action && <div className="mt-4">{action}</div>}
        </div>
    )
}