import { Card } from 'react-bootstrap'
import type { ReactNode } from 'react'
import type { Quote, SortKey } from '../types/stocks'
import { formatSortValue, isChangeSortKey } from '../utils/stockMetrics'

export interface StockRowProps {
  quote: Quote
  rank: number
  sortKey: SortKey
  // This union permits only the desktop table and mobile card layouts.
  variant: 'table' | 'card'
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

export function StockRow({ quote, rank, sortKey, variant }: StockRowProps) {
  const selectedValue = quote[sortKey]
  const positive = typeof selectedValue === 'number' && selectedValue >= 0
  const changeIcon = positive ? 'bi-arrow-up-right' : 'bi-arrow-down-right'
  const changeClass = isChangeSortKey(sortKey) ? positive ? 'gain' : 'loss' : ''

  if (variant === 'card') {
    return (
      <Card className="mobile-stock-card mb-2">
        <Card.Body>
          <div className="mobile-stock-company">
            <span className="stock-rank me-2">#{rank}</span>
            <strong className="stock-symbol">{quote.symbol}</strong>
            <span className="stock-company ms-2">{quote.name}</span>
          </div>
          <StockField label="Price" value={formatCurrency(quote.price)} />
          <StockField
            label="Selected metric"
            value={(
              <span className={changeClass}>
                {isChangeSortKey(sortKey) && typeof selectedValue === 'number' && (
                  <i className={`bi ${changeIcon} me-1`} aria-hidden="true" />
                )}
                {formatSortValue(quote, sortKey)}
              </span>
            )}
          />
        </Card.Body>
      </Card>
    )
  }

  return (
    <tr>
      <td className="stock-rank">{rank}</td>
      <th scope="row" className="stock-symbol">{quote.symbol}</th>
      <td className="stock-company">{quote.name}</td>
      <td className="number-cell">{formatCurrency(quote.price)}</td>
      <td className={`number-cell stock-change ${changeClass}`}>
        {isChangeSortKey(sortKey) && typeof selectedValue === 'number' && (
          <i className={`bi ${changeIcon} me-1`} aria-hidden="true" />
        )}
        {formatSortValue(quote, sortKey)}
      </td>
    </tr>
  )
}

interface StockFieldProps {
  label: string
  value: ReactNode
}

function StockField({ label, value }: StockFieldProps) {
  return (
    <div className="mobile-stock-field">
      <span className="mobile-stock-label">{label}</span>
      <span className="stock-change">{value}</span>
    </div>
  )
}
