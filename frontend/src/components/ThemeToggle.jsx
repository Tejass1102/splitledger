import { useTheme } from '../context/ThemeContext.jsx'
import { MoonIcon, SunIcon } from './icons.jsx'

export default function ThemeToggle({ variant = 'icon', className = '' }) {
    const { isDark, toggleTheme } = useTheme()
    const label = isDark ? 'Switch to light mode' : 'Switch to dark mode'
    const Icon = isDark ? MoonIcon : SunIcon

    if (variant === 'row') {
        return (
            <button
                type="button"
                onClick={toggleTheme}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-ink hover:bg-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${className}`}
            >
                <span>{isDark ? 'Dark mode' : 'Light mode'}</span>
                <Icon />
            </button>
        )
    }

    return (
        <button
            type="button"
            onClick={toggleTheme}
            aria-label={label}
            title={label}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-subtle hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${className}`}
        >
            <Icon />
        </button>
    )
}