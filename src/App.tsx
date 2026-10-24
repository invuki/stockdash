import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Container } from 'react-bootstrap'
import { DashboardHeader } from './components/DashboardHeader'
import { MarketSection } from './components/MarketSection'
import { SummaryBar } from './components/SummaryBar'
import { TopPerformers } from './components/TopPerformers'
import { useStocks } from './hooks/useStocks'
import { getSortValue } from './utils/stockMetrics'
import type { DashboardTheme, SortDirection, SortKey } from './types/stocks'

const MIN_REFRESH_SKELETON_MS = 450

function App() {
  const { data, loading, error, lastUpdated, refresh } = useStocks()
  const [theme, setTheme] = useState<DashboardTheme>('dark')
  const [manualRefresh, setManualRefresh] = useState(false)
  const manualRefreshInProgress = useRef(false)
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('changePercent')
  const [direction, setDirection] = useState<SortDirection>('desc')

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme)
  }, [theme])

  const refreshDashboard = useCallback(async () => {
    if (manualRefreshInProgress.current) return

    manualRefreshInProgress.current = true
    setManualRefresh(true)
    const startedAt = Date.now()

    try {
      await refresh()
    } finally {
      const remainingMs = Math.max(0, MIN_REFRESH_SKELETON_MS - (Date.now() - startedAt))
      if (remainingMs > 0) {
        await new Promise<void>((resolve) => window.setTimeout(resolve, remainingMs))
      }
      manualRefreshInProgress.current = false
      setManualRefresh(false)
    }
  }, [refresh])

  const quotes = useMemo(() => {
    const query = search.trim().toLowerCase()
    return (data?.quotes ?? [])
      .filter((quote) => quote.symbol.toLowerCase().includes(query)
        || quote.name.toLowerCase().includes(query))
      .sort((left, right) => {
        const leftValue = getSortValue(left, sortKey)
        const rightValue = getSortValue(right, sortKey)
        if (leftValue === null) return rightValue === null ? 0 : 1
        if (rightValue === null) return -1
        const difference = typeof leftValue === 'string'
          ? leftValue.localeCompare(String(rightValue))
          : leftValue - Number(rightValue)
        return direction === 'asc' ? difference : -difference
      })
  }, [data, direction, search, sortKey])

  const topPerformers = useMemo(
    () => [...quotes]
      .sort((left, right) => {
        const leftValue = getSortValue(left, sortKey)
        const rightValue = getSortValue(right, sortKey)
        if (leftValue === null) return rightValue === null ? 0 : 1
        if (rightValue === null) return -1
        return typeof leftValue === 'string'
          ? leftValue.localeCompare(String(rightValue))
          : Number(rightValue) - leftValue
      })
      .slice(0, 3),
    [quotes, sortKey],
  )

  const isStale = lastUpdated !== null && Date.now() - Date.parse(lastUpdated) > 120_000
  return (
    <Container fluid="sm" className="dashboard-shell py-4 py-lg-5">
      <DashboardHeader
        lastUpdated={lastUpdated}
        loading={loading}
        onRefresh={() => void refreshDashboard()}
        theme={theme}
        onToggleTheme={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')}
      />

      {isStale && (
        <Alert variant="warning" className="dashboard-alert" role="status">
          <i className="bi bi-exclamation-triangle me-2" />
          Data may be stale. The last successful update was over two minutes ago.
        </Alert>
      )}
      {error && data && (
        <Alert variant="danger" className="dashboard-alert" role="status">
          Refresh failed: {error} Showing the last successful data.
        </Alert>
      )}

      <SummaryBar quotes={data?.quotes ?? []} loading={manualRefresh || (loading && !data)} />
      <TopPerformers
        quotes={topPerformers}
        sortKey={sortKey}
        loading={manualRefresh || (loading && !data)}
      />

      <MarketSection
        quotes={quotes}
        totalCount={data?.quotes.length ?? 0}
        loading={manualRefresh || (loading && !data)}
        error={error}
        hasData={data !== null}
        search={search}
        sortKey={sortKey}
        direction={direction}
        onSearchChange={setSearch}
        onSortChange={setSortKey}
        onDirectionToggle={() => setDirection((current) => current === 'asc' ? 'desc' : 'asc')}
        onRetry={() => void refreshDashboard()}
      />

      <footer className="dashboard-footer border-top mt-4 pt-3 small text-body-secondary">
        Data from Alpaca IEX feed, may differ from consolidated quotes. Not investment advice.
      </footer>
    </Container>
  )
}

export default App
