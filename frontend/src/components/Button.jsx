import { buttonClass } from './buttonStyles'

// type defaults to "button" so it never submits a form by accident; pass type="submit" when needed
export default function Button({
                                   variant = 'primary',
                                   size = 'md',
                                   type = 'button',
                                   className = '',
                                   ...props
                               }) {
    return <button type={type} className={buttonClass({ variant, size, className })} {...props} />
}

// Square icon-only button. label is required: it is the accessible name and the tooltip.
export function IconButton({ label, tone = 'neutral', className = '', children, ...props }) {
    const hover =
        tone === 'danger'
            ? 'hover:bg-negative-soft hover:text-negative'
            : 'hover:bg-subtle hover:text-ink'
    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-60 ${hover} ${className}`}
            {...props}
        >
            {children}
        </button>
    )
}