import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { authApi } from '../api/auth'
import { setUnauthorizedHandler, tokenStore } from '../api/client'
import { useToast } from './ToastContext'

const USER_KEY = 'splitledger.user'

const AuthContext = createContext(null)

function readStoredUser() {
    try {
        const raw = localStorage.getItem(USER_KEY)
        return raw ? JSON.parse(raw) : null
    } catch {
        return null
    }
}

export function AuthProvider({ children }) {
    // Logged in only if both the token and the stored user exist
    const toast = useToast()
    const [user, setUser] = useState(() => (tokenStore.get() ? readStoredUser() : null))

    const saveSession = useCallback((auth) => {
        // auth = AuthResponse { token, type, id, name, email }
        const sessionUser = { id: auth.id, name: auth.name, email: auth.email }
        tokenStore.set(auth.token)
        localStorage.setItem(USER_KEY, JSON.stringify(sessionUser))
        setUser(sessionUser)
    }, [])

    const logout = useCallback(() => {
        tokenStore.clear()
        localStorage.removeItem(USER_KEY)
        setUser(null)
    }, [])

    // Merge changed fields (e.g. a new name) into the logged-in user, keeping the same token
    const updateUser = useCallback((changes) => {
        const updated = { ...readStoredUser(), ...changes }
        localStorage.setItem(USER_KEY, JSON.stringify(updated))
        setUser(updated)
    }, [])

    // If a protected call returns 401 (expired or invalid token), drop the session and say why
    useEffect(() => {
        setUnauthorizedHandler(() => {
            if (!tokenStore.get()) return // already logged out (for example with the button)
            logout()
            toast.info('Your session has expired. Please log in again.')
        })
        return () => setUnauthorizedHandler(null)
    }, [logout, toast])

    const login = useCallback(
        async (email, password) => {
            saveSession(await authApi.login({ email: email.trim(), password }))
        },
        [saveSession],
    )

    const register = useCallback(
        async (name, email, password) => {
            saveSession(await authApi.register({ name: name.trim(), email: email.trim(), password }))
        },
        [saveSession],
    )

    const loginWithGoogle = useCallback(
        async (idToken) => {
            saveSession(await authApi.google(idToken))
        },
        [saveSession],
    )

    const value = useMemo(
        () => ({ user, login, register, loginWithGoogle, logout, updateUser }),
        [user, login, register, loginWithGoogle, logout, updateUser],
    )

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
    return context
}