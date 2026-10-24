import { Button, Form } from 'react-bootstrap'
import type { SortDirection, SortKey } from '../types/stocks'

export interface SortControlsProps {
  sortKey: SortKey
  direction: SortDirection
  onSortChange: (sortKey: SortKey) => void
  onDirectionToggle: () => void
}

function isSortKey(value: string): value is SortKey {
  // This type guard narrows a select's general string to the allowed sort options.
  return [
    'changePercent',
    'change',
    'change3DayPercent',
    'change3Day',
    'change7DayPercent',
    'change7Day',
    'price',
    'name',
    'volume',
  ].includes(value)
}

export function SortControls({
  sortKey,
  direction,
  onSortChange,
  onDirectionToggle,
}: SortControlsProps) {
  return (
    <div className="sort-controls d-flex gap-2">
      <Form.Select
        aria-label="Sort stocks by"
        value={sortKey}
        onChange={(event) => {
          const value = event.currentTarget.value
          if (isSortKey(value)) onSortChange(value)
        }}
      >
        <option value="changePercent">1-day change %</option>
        <option value="change">1-day change $</option>
        <option value="change3DayPercent">3-day change %</option>
        <option value="change3Day">3-day change $</option>
        <option value="change7DayPercent">7-day change %</option>
        <option value="change7Day">7-day change $</option>
        <option value="price">Price</option>
        <option value="name">Company</option>
        <option value="volume">Volume</option>
      </Form.Select>
      <Button variant="outline-secondary" onClick={onDirectionToggle}>
        <i className={`bi bi-sort-${direction === 'asc' ? 'up' : 'down'} me-1`} aria-hidden="true" />
        {direction === 'asc' ? 'Ascending' : 'Descending'}
      </Button>
    </div>
  )
}
