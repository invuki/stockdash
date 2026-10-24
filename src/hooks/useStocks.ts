import { useCallback, useEffect, useRef, useState } from 'react'
import type { Quote, QuotesResponse } from '../types/stocks'

export interface UseStocksResult {
  data: QuotesResponse | null
  loading: boolean
  error: string | null
  lastUpdated: string | null
  refresh: () => Promise<void>
}

function isQuote(value: unknown): value is Quote {
  // The object check narrows unknown before its fields are read.
  if (typeof value !== 'object' || value === null) return false
  const quote = value as Record<string, unknown>
  return typeof quote.symbol === 'string'
    && typeof quote.name === 'string'
    && typeof quote.price === 'number'
    && Number.isFinite(quote.price)
    && typeof quote.change === 'number'
    && Number.isFinite(quote.change)
    && typeof quote.changePercent === 'number'
    && Number.isFinite(quote.changePercent)
    && (quote.change3Day === null
      || (typeof quote.change3Day === 'number' && Number.isFinite(quote.change3Day)))
    && (quote.change3DayPercent === null
      || (typeof quote.change3DayPercent === 'number' && Number.isFinite(quote.change3DayPercent)))
    && (quote.change7Day === null
      || (typeof quote.change7Day === 'number' && Number.isFinite(quote.change7Day)))
    && (quote.change7DayPercent === null
      || (typeof quote.change7DayPercent === 'number' && Number.isFinite(quote.change7DayPercent)))
    && typeof quote.volume === 'number'
    && Number.isFinite(quote.volume)
}

function isQuotesResponse(value: unknown): value is QuotesResponse {
  // This type guard checks the complete response before exposing it as trusted quote data.
  if (typeof value !== 'object' || value === null) return false
  const response = value as Record<string, unknown>
  return typeof response.updatedAt === 'string'
    && Number.isFinite(Date.parse(response.updatedAt))
    && Array.isArray(response.quotes)
    && response.quotes.every(isQuote)
}

function isApiError(value: unknown): value is { error: string } {
  if (typeof value !== 'object' || value === null) return false
  return 'error' in value && typeof value.error === 'string'
}

export function useStocks(): UseStocksResult {
  // Explicit state types make the initial empty state and API failures unambiguous.
  const [data, setData] = useState<QuotesResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const controller = useRef<AbortController | null>(null)

  const refresh = useCallback(async (): Promise<void> => {
    controller.current?.abort()
    const requestController = new AbortController()
    controller.current = requestController
    setLoading(true)

    try {
      const response = await fetch('/api/quotes', { signal: requestController.signal })
      if (!response.ok) {
        // The API error body is untrusted until the guard confirms its shape.
        const body: unknown = await response.json().catch(() => null)
        const message = isApiError(body) ? body.error : `Request failed (${response.status}).`
        throw new Error(message)
      }
      const result: unknown = await response.json()
      if (!isQuotesResponse(result)) throw new Error('The quotes API returned invalid data.')
      setData(result)
      setError(null)
    } catch (caught: unknown) {
      // Checking the caught value narrows unknown safely; fetch can throw non-Error values.
      if (caught instanceof Error && caught.name === 'AbortError') return
      setError(caught instanceof Error ? caught.message : 'An unexpected error occurred.')
    } finally {
      if (!requestController.signal.aborted) setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
    const interval = window.setInterval(() => void refresh(), 30_000)
    return () => {
      window.clearInterval(interval)
      controller.current?.abort()
    }
  }, [refresh])

  return { data, loading, error, lastUpdated: data?.updatedAt ?? null, refresh }
}
