export default function SelectField({ label, name, error, children, ...selectProps }) {
    return (
        <div>
            <label htmlFor={name} className="mb-1 block text-sm font-medium text-ink">
                {label}
            </label>
            <select
                id={name}
                name={name}
                className={`w-full rounded-lg border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand ${
                    error ? 'border-negative' : 'border-line-strong'
                }`}
                {...selectProps}
            >
                {children}
            </select>
            {error && <p className="mt-1 text-sm text-negative">{error}</p>}
        </div>
    )
}