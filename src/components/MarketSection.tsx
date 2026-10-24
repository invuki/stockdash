import { Alert } from 'react-bootstrap'
import { ErrorState } from './ErrorState'
import { MarketControls } from './MarketControls'
import { StockTable } from './StockTable'
import type { Quote, SortDirection, SortKey } from '../types/stocks'

export interface MarketSectionProps {
  quotes: Quote[]
  totalCount: number
  loading: boolean
  error: string | null
  hasData: boolean
  search: string
  sortKey: SortKey
  direction: SortDirection
  onSearchChange: (value: string) => void
  onSortChange: (key: SortKey) => void
  onDirectionToggle: () => void
  onRetry: () => void
}

export function MarketSection({
  quotes,
  totalCount,
  loading,
  error,
  hasData,
  search,
  sortKey,
  direction,
  onSearchChange,
  onSortChange,
  onDirectionToggle,
  onRetry,
}: MarketSectionProps) {
  const countLabel = hasData ? `${quotes.length} of ${totalCount} stocks` : 'Loading stock list'

  return (
    <section aria-labelledby="market-heading" className="market-section mt-4">
      <MarketControls
        countLabel={countLabel}
        search={search}
        sortKey={sortKey}
        direction={direction}
        onSearchChange={onSearchChange}
        onSortChange={onSortChange}
        onDirectionToggle={onDirectionToggle}
      />
      {loading ? (
        <StockTable quotes={quotes} loading sortKey={sortKey} direction={direction} />
      ) : error && !hasData ? (
        <ErrorState message={error} loading={loading} onRetry={onRetry} />
      ) : quotes.length === 0 && hasData ? (
        <Alert variant="secondary" className="text-center">
          No stocks match “{search}”. Try another ticker or company.
        </Alert>
      ) : (
        <StockTable quotes={quotes} loading={loading} sortKey={sortKey} direction={direction} />
      )}
    </section>
  )
}
