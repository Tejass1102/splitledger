import Alert from './Alert'
import Button from './Button'

export default function LoadError({ message, onRetry }) {
    return (
        <div className="space-y-3">
            <Alert type="error">{message}</Alert>
            <Button variant="secondary" onClick={onRetry}>
                Retry
            </Button>
        </div>
    )
}