export default function Card({ title, description, children }) {
    return (
        <section className="rounded-2xl bg-surface p-6 shadow-sm ring-1 ring-line">
            <h2 className="text-lg font-semibold text-ink">{title}</h2>
            {description && <p className="mt-1 text-sm text-muted">{description}</p>}
            <div className="mt-5">{children}</div>
        </section>
    )
}