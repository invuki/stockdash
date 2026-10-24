import { SP100, type Sp100Company } from '../src/data/sp100.js'
import type { Quote, QuotesResponse } from '../src/types/stocks.js'

interface ApiRequest {
  method?: string
}

interface ApiResponse {
  setHeader(name: string, value: string): void
  status(code: number): ApiResponse
  json(body: unknown): ApiResponse
}

export interface AlpacaTrade {
  p: number
  t: string
}

export interface AlpacaBar {
  c: number
  v: number
  t: string
}

interface AlpacaHistoryBar {
  c: number
  t: string
}

export interface AlpacaSnapshot {
  latestTrade?: AlpacaTrade
  prevDailyBar?: AlpacaBar
  dailyBar?: AlpacaBar
}

export interface AlpacaSnapshotsResponse {
  [symbol: string]: AlpacaSnapshot
}

interface AlpacaBarsResponse {
  bars: Record<string, AlpacaHistoryBar[]>
}

interface AlpacaEnvironment {
  ALPACA_API_KEY?: string
  ALPACA_API_SECRET?: string
}

let cachedResponse: QuotesResponse | null = null
let cacheExpiresAt = 0

function isObject(value: unknown): value is Record<string, unknown> {
  // This type guard narrows unknown JSON to a property-readable object.
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isAlpacaBar(value: unknown): value is AlpacaBar {
  if (!isObject(value)) return false
  return typeof value.c === 'number'
    && Number.isFinite(value.c)
    && typeof value.v === 'number'
    && Number.isFinite(value.v)
    && typeof value.t === 'string'
    && Number.isFinite(Date.parse(value.t))
}

function isAlpacaSnapshot(value: unknown): value is AlpacaSnapshot {
  if (!isObject(value)) return false
  const { latestTrade, prevDailyBar, dailyBar } = value
  return (latestTrade === undefined
      || (isObject(latestTrade)
        && typeof latestTrade.p === 'number'
        && Number.isFinite(latestTrade.p)
        && typeof latestTrade.t === 'string'
        && Number.isFinite(Date.parse(latestTrade.t))))
    && (prevDailyBar === undefined || isAlpacaBar(prevDailyBar))
    && (dailyBar === undefined || isAlpacaBar(dailyBar))
}

function isAlpacaSnapshotsResponse(value: unknown): value is AlpacaSnapshotsResponse {
  // Checking every entry narrows the parsed JSON only when all snapshots are valid.
  return isObject(value) && Object.values(value).every(isAlpacaSnapshot)
}

function isAlpacaBarsResponse(value: unknown): value is AlpacaBarsResponse {
  if (!isObject(value) || !isObject(value.bars)) return false
  return Object.values(value.bars).every((bars) => Array.isArray(bars)
    && bars.every((bar) => isObject(bar)
      && typeof bar.c === 'number'
      && Number.isFinite(bar.c)
      && typeof bar.t === 'string'
      && Number.isFinite(Date.parse(bar.t))))
}

const NEW_YORK_DATE_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/New_York',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

function tradingDate(timestamp: string): string {
  const parts = NEW_YORK_DATE_FORMATTER.formatToParts(new Date(timestamp))
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? ''
  return `${part('year')}-${part('month')}-${part('day')}`
}

function historicalChange(
  price: number,
  bars: AlpacaHistoryBar[],
  sessionIndex: number,
  tradingDays: number,
): { change: number | null; changePercent: number | null } {
  const referenceBar = bars[sessionIndex - tradingDays]
  if (!referenceBar || referenceBar.c <= 0) return { change: null, changePercent: null }
  const change = Number((price - referenceBar.c).toFixed(2))
  return {
    change,
    changePercent: Number((change / referenceBar.c * 100).toFixed(2)),
  }
}

function quoteFromSnapshot(
  symbol: string,
  name: string,
  snapshot: AlpacaSnapshot,
  dailyBars: AlpacaHistoryBar[],
): Quote | null {
  const price = snapshot.latestTrade?.p
  const latestTradeAt = snapshot.latestTrade?.t
  if (price === undefined || latestTradeAt === undefined) return null

  const bars = [...dailyBars].sort((left, right) => Date.parse(left.t) - Date.parse(right.t))
  const sessionDate = tradingDate(latestTradeAt)
  const sessionIndex = bars.findLastIndex((bar) => tradingDate(bar.t) === sessionDate)
  const previousClose = bars[sessionIndex - 1]?.c
  if (sessionIndex < 1 || previousClose === undefined || previousClose <= 0) return null

  const change = Number((price - previousClose).toFixed(2))
  const threeDay = historicalChange(price, bars, sessionIndex, 3)
  const sevenDay = historicalChange(price, bars, sessionIndex, 7)
  return {
    symbol,
    name,
    price,
    change,
    changePercent: Number((change / previousClose * 100).toFixed(2)),
    change3Day: threeDay.change,
    change3DayPercent: threeDay.changePercent,
    change7Day: sevenDay.change,
    change7DayPercent: sevenDay.changePercent,
    volume: snapshot.dailyBar?.v ?? 0,
  }
}

export function mapSnapshotsToQuotes(
  companies: Sp100Company[],
  snapshots: AlpacaSnapshotsResponse,
  dailyBarsBySymbol: Record<string, AlpacaHistoryBar[]>,
): Quote[] {
  return companies.flatMap(({ symbol, name }) => {
    const snapshot = snapshots[symbol]
    // Alpaca can omit symbols when it has no snapshot for that ticker.
    if (!snapshot) return []
    const quote = quoteFromSnapshot(symbol, name, snapshot, dailyBarsBySymbol[symbol] ?? [])
    return quote ? [quote] : []
  })
}

async function createAlpacaResponse(
  apiKey: string,
  apiSecret: string,
): Promise<QuotesResponse> {
  const url = new URL('https://data.alpaca.markets/v2/stocks/snapshots')
  url.searchParams.set('symbols', SP100.map(({ symbol }) => symbol).join(','))
  url.searchParams.set('feed', 'iex')

  let alpacaResponse: Response
  try {
    alpacaResponse = await fetch(url, {
      headers: {
        'APCA-API-KEY-ID': apiKey,
        'APCA-API-SECRET-KEY': apiSecret,
      },
      signal: AbortSignal.timeout(10_000),
    })
  } catch {
    throw new Error('Could not connect to Alpaca. Check the server network and try again.')
  }

  if (!alpacaResponse.ok) {
    throw new Error(`Alpaca returned HTTP ${alpacaResponse.status}. Check the API keys and feed access.`)
  }

  let snapshotData: unknown
  try {
    snapshotData = await alpacaResponse.json()
  } catch {
    throw new Error('Alpaca returned invalid JSON.')
  }
  if (!isAlpacaSnapshotsResponse(snapshotData)) {
    throw new Error('Alpaca returned a snapshot response with an invalid shape.')
  }

  const barsUrl = new URL('https://data.alpaca.markets/v2/stocks/bars')
  barsUrl.searchParams.set('symbols', SP100.map(({ symbol }) => symbol).join(','))
  barsUrl.searchParams.set('timeframe', '1Day')
  barsUrl.searchParams.set('start', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString())
  barsUrl.searchParams.set('limit', '10000')
  barsUrl.searchParams.set('sort', 'asc')
  barsUrl.searchParams.set('feed', 'iex')
  barsUrl.searchParams.set('adjustment', 'split')

  let barsResponse: Response
  try {
    barsResponse = await fetch(barsUrl, {
      headers: {
        'APCA-API-KEY-ID': apiKey,
        'APCA-API-SECRET-KEY': apiSecret,
      },
      signal: AbortSignal.timeout(10_000),
    })
  } catch {
    throw new Error('Could not load historical bars from Alpaca. Check the server network and try again.')
  }
  if (!barsResponse.ok) {
    throw new Error(`Alpaca returned HTTP ${barsResponse.status} for historical bars.`)
  }

  let barsData: unknown
  try {
    barsData = await barsResponse.json()
  } catch {
    throw new Error('Alpaca returned invalid historical bars JSON.')
  }
  if (!isAlpacaBarsResponse(barsData)) {
    throw new Error('Alpaca returned historical bars with an invalid shape.')
  }

  const quotes = mapSnapshotsToQuotes(SP100, snapshotData, barsData.bars)
    .sort((left, right) => right.changePercent - left.changePercent)
  return { updatedAt: new Date().toISOString(), quotes }
}

export default function handler(
  request: ApiRequest,
  response: ApiResponse,
  environment: AlpacaEnvironment = process.env,
): Promise<void> {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')
    response.status(405).json({ error: 'Method not allowed' })
    return Promise.resolve()
  }

  response.setHeader('Cache-Control', 'private, max-age=15')
  if (cachedResponse && Date.now() < cacheExpiresAt) {
    response.status(200).json(cachedResponse)
    return Promise.resolve()
  }

  const { ALPACA_API_KEY: apiKey, ALPACA_API_SECRET: apiSecret } = environment
  if (!apiKey && !apiSecret) {
    response.status(503).json({
      error: 'Live quote data is unavailable. Configure both Alpaca API credentials on the server.',
    })
    return Promise.resolve()
  }
  if (!apiKey || !apiSecret) {
    response.status(500).json({ error: 'Set both Alpaca API environment variables on the server.' })
    return Promise.resolve()
  }

  return createAlpacaResponse(apiKey, apiSecret).then((result) => {
    cachedResponse = result
    cacheExpiresAt = Date.now() + 20_000
    response.status(200).json(result)
  }).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'Unable to load stock data.'
    response.status(502).json({ error: message })
  })
}
