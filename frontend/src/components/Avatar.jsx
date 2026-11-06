function initialsOf(name) {
    const parts = (name || '').trim().split(/\s+/).filter(Boolean)
    if (parts.length === 0) return '?'
    const first = parts[0][0]
    const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
    return (first + last).toUpperCase()
}

const SIZES = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-9 w-9 text-sm',
}

export default function Avatar({ name, size = 'md' }) {
    return (
        <span
            aria-hidden="true"
            className={`inline-flex shrink-0 items-center justify-center rounded-full bg-brand-soft font-semibold text-brand ${SIZES[size]}`}
        >
            {initialsOf(name)}
        </span>
    )
}