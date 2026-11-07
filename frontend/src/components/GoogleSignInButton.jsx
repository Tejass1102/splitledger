import { GoogleLogin } from '@react-oauth/google'
import { useTheme } from '../context/ThemeContext'

// onCredential receives the Google ID token (a JWT string) to send to our backend
export default function GoogleSignInButton({ onCredential, onError, disabled }) {
    const { isDark } = useTheme()

    return (
        <div className={`flex justify-center ${disabled ? 'pointer-events-none opacity-60' : ''}`}>
            <GoogleLogin
                onSuccess={(response) => onCredential(response.credential)}
                onError={() => onError('Google sign-in was cancelled or failed. Please try again.')}
                theme={isDark ? 'filled_black' : 'outline'}
                size="large"
                text="continue_with"
                width="320"
            />
        </div>
    )
}