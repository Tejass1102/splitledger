const BASE =
    'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60'

const VARIANTS = {
    primary: 'bg-brand text-on-brand hover:bg-brand-hover',
    secondary: 'border border-line-strong bg-surface text-ink hover:bg-subtle',
    danger: 'bg-negative text-on-negative hover:bg-negative-hover',
    ghost: 'text-brand hover:bg-brand-soft',
}

const SIZES = {
    md: 'px-4 py-2 text-sm',
    sm: 'px-3 py-1.5 text-sm',
}

// Use directly on <Link> or <a>; <Button> uses it for real buttons.
export function buttonClass({ variant = 'primary', size = 'md', className = '' } = {}) {
    return `${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`.trim()
}