// counter + max show a "12/255" character count (red once over the limit)
export default function TextAreaField({ label, name, error, counter, max, ...textareaProps }) {
    return (
        <div>
            <div className="mb-1 flex items-center justify-between">
                <label htmlFor={name} className="text-sm font-medium text-slate-700">
                    {label}
                </label>
                {max !== undefined && (
                    <span className={`text-xs ${counter > max ? 'text-red-600' : 'text-slate-400'}`}>
            {counter}/{max}
          </span>
                )}
            </div>
            <textarea
                id={name}
                name={name}
                rows={2}
                className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 ${
                    error ? 'border-red-400' : 'border-slate-300'
                }`}
                {...textareaProps}
            />
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
    )
}