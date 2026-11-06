export default function FormField({ label, name, error, ...inputProps }) {
    return (
        <div>
            <label htmlFor={name} className="mb-1 block text-sm font-medium text-ink">
                {label}
            </label>
            <input
                id={name}
                name={name}
                className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand ${
                    error ? 'border-negative' : 'border-line-strong'
                }`}
                {...inputProps}
            />
            {error && <p className="mt-1 text-sm text-negative">{error}</p>}
        </div>
    )
}