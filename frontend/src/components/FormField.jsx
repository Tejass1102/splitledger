import { inputClass } from './fieldStyles'

export default function FormField({ label, name, error, ...inputProps }) {
    const errorId = `${name}-error`
    return (
        <div>
            <label htmlFor={name} className="mb-1 block text-sm font-medium text-ink">
                {label}
            </label>
            <input
                id={name}
                name={name}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? errorId : undefined}
                className={inputClass({ error: Boolean(error) })}
                {...inputProps}
            />
            {error && (
                <p id={errorId} className="mt-1 text-sm text-negative">
                    {error}
                </p>
            )}
        </div>
    )
}