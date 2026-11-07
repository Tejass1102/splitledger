// Shared look for text inputs, selects and textareas
export function inputClass({ error = false, compact = false, fullWidth = true } = {}) {
    return [
        fullWidth ? 'w-full' : '',
        'rounded-lg border bg-surface px-3 text-sm text-ink placeholder:text-faint outline-none transition-colors',
        compact ? 'py-1.5' : 'py-2',
        'focus:ring-2 disabled:opacity-60',
        error
            ? 'border-negative focus:border-negative focus:ring-negative/30'
            : 'border-line-strong focus:border-brand focus:ring-brand/30',
    ]
        .filter(Boolean)
        .join(' ')
}