import { Alert, Button } from 'react-bootstrap'

export interface ErrorStateProps {
  message: string
  loading: boolean
  onRetry: () => void
}

export function ErrorState({ message, loading, onRetry }: ErrorStateProps) {
  return (
    <Alert variant="danger" className="d-flex align-items-center justify-content-between gap-3">
      <span><i className="bi bi-exclamation-circle me-2" aria-hidden="true" />{message}</span>
      <Button variant="outline-danger" size="sm" onClick={onRetry} disabled={loading}>
        <i className="bi bi-arrow-clockwise me-1" aria-hidden="true" />
        {loading ? 'Retrying…' : 'Retry'}
      </Button>
    </Alert>
  )
}
