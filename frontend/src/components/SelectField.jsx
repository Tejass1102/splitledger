export default function SelectField({ label, name, error, children, ...selectProps }) {
    return (
        <div>
            <label htmlFor={name} className="mb-1 block text-sm font-medium text-slate-700">
                {label}
            </label>
            <select
                id={name}
                name={name}
                className={`w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 ${
                    error ? 'border-red-400' : 'border-slate-300'
                }`}
                {...selectProps}
            >
                {children}
            </select>
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
    )
}