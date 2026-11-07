import { inputClass } from './fieldStyles'

// counter + max show a "12/255" character count (red once over the limit)
export default function TextAreaField({ label, name, error, counter, max, ...textareaProps }) {
    const errorId = `${name}-error`
    return (
        <div>
            <div className="mb-1 flex items-center justify-between">
                <label htmlFor={name} className="text-sm font-medium text-ink">
                    {label}
                </label>
                {max !== undefined && (
                    <span className={`text-xs ${counter > max ? 'text-negative' : 'text-muted'}`}>
                        {counter}/{max}
                    </span>
                )}
            </div>
            <textarea
                id={name}
                name={name}
                rows={2}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? errorId : undefined}
                className={inputClass({ error: Boolean(error) })}
                {...textareaProps}
            />
            {error && (
                <p id={errorId} className="mt-1 text-sm text-negative">
                    {error}
                </p>
            )}
        </div>
    )
}