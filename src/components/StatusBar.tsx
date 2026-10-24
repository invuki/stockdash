import { useEffect, useState } from 'react'
import { Badge, Button } from 'react-bootstrap'
import type { DashboardTheme } from '../types/stocks'

const REFRESH_COOLDOWN_MS = 30_000

export interface StatusBarProps {
  lastUpdated: string | null
  loading: boolean
  onRefresh: () => void
  theme: DashboardTheme
  onToggleTheme: () => void
}

export function StatusBar({
  lastUpdated,
  loading,
  onRefresh,
  theme,
  onToggleTheme,
}: StatusBarProps) {
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null)
  const [cooldownSeconds, setCooldownSeconds] = useState(0)

  useEffect(() => {
    if (cooldownUntil === null) return

    const updateCooldown = () => {
      const secondsRemaining = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000))
      setCooldownSeconds(secondsRemaining)
      if (secondsRemaining === 0) setCooldownUntil(null)
    }

    const interval = window.setInterval(updateCooldown, 250)
    updateCooldown()
    return () => window.clearInterval(interval)
  }, [cooldownUntil])

  const handleRefresh = () => {
    if (cooldownUntil !== null && Date.now() < cooldownUntil) return

    setCooldownUntil(Date.now() + REFRESH_COOLDOWN_MS)
    setCooldownSeconds(30)
    onRefresh()
  }

  const updatedLabel = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : 'Waiting for data'
  const refreshLabel = cooldownSeconds > 0
    ? `${loading ? 'Refreshing…' : 'Refresh'} (${cooldownSeconds}s)`
    : loading ? 'Refreshing…' : 'Refresh'

  return (
    <div className="status-bar">
      <Badge bg="secondary-subtle" text="secondary-emphasis" className="status-badge">
        S&amp;P 100
      </Badge>
      <span className="status-time">Updated {updatedLabel}</span>
      <Button
        variant="outline-secondary"
        size="sm"
        onClick={handleRefresh}
        disabled={loading || cooldownSeconds > 0}
        aria-busy={loading}
      >
        <i className="bi bi-arrow-clockwise me-1" aria-hidden="true" />
        {refreshLabel}
      </Button>
      <Button
        variant="outline-secondary"
        size="sm"
        onClick={onToggleTheme}
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
      >
        <i className={`bi ${theme === 'dark' ? 'bi-sun' : 'bi-moon'} me-1`} aria-hidden="true" />
        {theme === 'dark' ? 'Light' : 'Dark'}
      </Button>
    </div>
  )
}
