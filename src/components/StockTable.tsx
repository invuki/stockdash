import { Placeholder, Table } from 'react-bootstrap'
import type { Quote, SortDirection, SortKey } from '../types/stocks'
import { SkeletonRows } from './SkeletonRows'
import { StockRow } from './StockRow'
import { SORT_LABELS } from '../utils/stockMetrics'

export interface StockTableProps {
  quotes: Quote[]
  loading: boolean
  sortKey: SortKey
  direction: SortDirection
}

export function StockTable({ quotes, loading, sortKey, direction }: StockTableProps) {
  const order = ` ${direction === 'desc' ? '↓' : '↑'}`
  if (loading) {
    return (
      <div aria-label="Loading stock data" aria-busy="true">
        <div className="d-none d-sm-block table-responsive">
          <Table hover className="stock-table">
            <StockTableHead sortKey={sortKey} order={order} />
            <tbody><SkeletonRows count={8} variant="table" /></tbody>
          </Table>
        </div>
        <div className="d-sm-none"><SkeletonRows count={5} variant="cards" /></div>
        <Placeholder as="span" className="visually-hidden">Loading stock data</Placeholder>
      </div>
    )
  }

  return (
    <>
      <div className="d-none d-sm-block table-responsive">
        <Table hover className="stock-table" responsive="sm">
          <StockTableHead sortKey={sortKey} order={order} />
          <tbody>
            {quotes.map((quote, index) => (
              <StockRow key={quote.symbol} quote={quote} rank={index + 1} sortKey={sortKey} variant="table" />
            ))}
          </tbody>
        </Table>
      </div>
      <div className="d-sm-none">
        {quotes.map((quote, index) => (
          <StockRow key={quote.symbol} quote={quote} rank={index + 1} sortKey={sortKey} variant="card" />
        ))}
      </div>
    </>
  )
}

interface StockTableHeadProps {
  sortKey: SortKey
  order: string
}

function StockTableHead({ sortKey, order }: StockTableHeadProps) {
  return (
    <thead>
      <tr>
        <th scope="col">#</th>
        <th scope="col">Symbol</th>
        <th scope="col">Company</th>
        <th scope="col" className="number-cell">Price</th>
        <th scope="col" className="number-cell">{SORT_LABELS[sortKey]}{order}</th>
      </tr>
    </thead>
  )
}
