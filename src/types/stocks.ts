export interface Quote {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  change3Day: number | null
  change3DayPercent: number | null
  change7Day: number | null
  change7DayPercent: number | null
  volume: number
}

export interface QuotesResponse {
  updatedAt: string
  quotes: Quote[]
}

// This union limits sorting to fields that appear in the dashboard controls.
export type SortKey =
  | 'changePercent'
  | 'change'
  | 'change3DayPercent'
  | 'change3Day'
  | 'change7DayPercent'
  | 'change7Day'
  | 'price'
  | 'name'
  | 'volume'

// This union prevents invalid sort order strings from entering the UI state.
export type SortDirection = 'asc' | 'desc'

// This union keeps the theme toggle synchronized with the available color tokens.
export type DashboardTheme = 'dark' | 'light'
