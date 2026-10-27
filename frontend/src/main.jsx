import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <ErrorBoundary>
            <ThemeProvider>
                <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
                    <BrowserRouter>
                        <ToastProvider>
                            <AuthProvider>
                            <App />
                            </AuthProvider>
                        </ToastProvider>
                    </BrowserRouter>
                </GoogleOAuthProvider>
            </ThemeProvider>
        </ErrorBoundary>
    </StrictMode>,
)