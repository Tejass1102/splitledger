import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react'

const STORAGE_KEY = 'splitledger-theme'
const DARK_QUERY = '(prefers-color-scheme: dark)'

const ThemeContext = createContext(null)

function readStoredTheme() {
    try {
        const value = localStorage.getItem(STORAGE_KEY)
        return value === 'light' || value === 'dark' ? value : null
    } catch {
        return null // storage unavailable
    }
}

function readSystemTheme() {
    return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }) {
    const [stored, setStored] = useState(readStoredTheme)
    const [system, setSystem] = useState(readSystemTheme)

    // An explicit choice wins; otherwise follow the OS (and keep following it live).
    const theme = stored ?? system

    useEffect(() => {
        const media = window.matchMedia(DARK_QUERY)
        const onChange = (event) => setSystem(event.matches ? 'dark' : 'light')
        media.addEventListener('change', onChange)
        return () => media.removeEventListener('change', onChange)
    }, [])

    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark')
    }, [theme])

    const setTheme = useCallback((next) => {
        setStored(next)
        try {
            localStorage.setItem(STORAGE_KEY, next)
        } catch {
            // storage unavailable: the choice lasts for this session only
        }
    }, [])

    const toggleTheme = useCallback(() => {
        setTheme(theme === 'dark' ? 'light' : 'dark')
    }, [theme, setTheme])

    const value = useMemo(
        () => ({ theme, isDark: theme === 'dark', setTheme, toggleTheme }),
        [theme, setTheme, toggleTheme],
    )

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
    const context = useContext(ThemeContext)
    if (!context) {
        throw new Error('useTheme must be used inside ThemeProvider')
    }
    return context
}