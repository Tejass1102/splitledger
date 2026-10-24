import { GoogleLogin } from '@react-oauth/google'

// onCredential receives the Google ID token (a JWT string) to send to our backend
export default function GoogleSignInButton({ onCredential, onError, disabled }) {
    return (
        <div className={`flex justify-center ${disabled ? 'pointer-events-none opacity-60' : ''}`}>
            <GoogleLogin
                onSuccess={(response) => onCredential(response.credential)}
                onError={() => onError('Google sign-in was cancelled or failed. Please try again.')}
                theme="outline"
                size="large"
                text="continue_with"
                width="320"
            />
        </div>
    )
}