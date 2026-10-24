import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Pages that need a logged-in user
export function ProtectedRoute() {
    const { user } = useAuth()
    const location = useLocation()

    if (!user) {
        return <Navigate to="/login" replace state={{ from: location }} />
    }
    return <Outlet />
}

// Login/register: logged-in users are sent to where they were heading (or home)
export function PublicRoute() {
    const { user } = useAuth()
    const location = useLocation()

    if (user) {
        return <Navigate to={location.state?.from?.pathname ?? '/'} replace />
    }
    return <Outlet />
}