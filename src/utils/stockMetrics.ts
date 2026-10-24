import type { Quote, SortKey } from '../types/stocks'

export const SORT_LABELS: Record<SortKey, string> = {
  changePercent: '1-day change %',
  change: '1-day change $',
  change3DayPercent: '3-day change %',
  change3Day: '3-day change $',
  change7DayPercent: '7-day change %',
  change7Day: '7-day change $',
  price: 'Price',
  name: 'Company',
  volume: 'Volume',
}

export function getSortValue(quote: Quote, sortKey: SortKey): number | string | null {
  return quote[sortKey]
}

export function isChangeSortKey(sortKey: SortKey): boolean {
  return [
    'changePercent',
    'change',
    'change3DayPercent',
    'change3Day',
    'change7DayPercent',
    'change7Day',
  ].includes(sortKey)
}

export function formatSortValue(quote: Quote, sortKey: SortKey): string {
  const value = getSortValue(quote, sortKey)
  if (value === null) return '—'
  if (typeof value === 'string') return value
  if (sortKey === 'volume') return new Intl.NumberFormat('en-US', { notation: 'compact' }).format(value)
  if (sortKey.endsWith('Percent')) return `${value.toFixed(2)}%`
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}
