import { StatusBar } from './StatusBar'
import type { DashboardTheme } from '../types/stocks'

export interface DashboardHeaderProps {
  lastUpdated: string | null
  loading: boolean
  onRefresh: () => void
  theme: DashboardTheme
  onToggleTheme: () => void
}

export function DashboardHeader({
  lastUpdated,
  loading,
  onRefresh,
  theme,
  onToggleTheme,
}: DashboardHeaderProps) {
  return (
    <header className="dashboard-header">
      <div>
        <h1>Stock performance</h1>
        <p className="header-subtitle">S&amp;P 100 · Today’s top performers</p>
      </div>
      <StatusBar
        lastUpdated={lastUpdated}
        loading={loading}
        onRefresh={onRefresh}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />
    </header>
  )
}
