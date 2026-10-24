import { SearchInput } from './SearchInput'
import { SortControls } from './SortControls'
import type { SortDirection, SortKey } from '../types/stocks'

export interface MarketControlsProps {
  countLabel: string
  search: string
  sortKey: SortKey
  direction: SortDirection
  onSearchChange: (value: string) => void
  onSortChange: (key: SortKey) => void
  onDirectionToggle: () => void
}

export function MarketControls({
  countLabel,
  search,
  sortKey,
  direction,
  onSearchChange,
  onSortChange,
  onDirectionToggle,
}: MarketControlsProps) {
  return (
    <div className="section-heading">
      <div>
        <h2 id="market-heading">Market movers</h2>
        <p>{countLabel}</p>
      </div>
      <div className="controls-row">
        <SearchInput value={search} onChange={onSearchChange} />
        <SortControls
          sortKey={sortKey}
          direction={direction}
          onSortChange={onSortChange}
          onDirectionToggle={onDirectionToggle}
        />
      </div>
    </div>
  )
}
