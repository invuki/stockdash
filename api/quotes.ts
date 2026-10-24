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
}

export interface AlpacaBar {
  c: number
  v: number
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

function hashSymbol(symbol: string, salt = 0): number {
  return [...symbol].reduce((hash, character) => (
    (hash * 31 + character.charCodeAt(0) + salt) % 1_000_003
  ), 17)
}

function createMockQuote(symbol: string, name: string): Quote {
  const seed = hashSymbol(symbol)
  const price = Number((25 + (seed % 75_000) / 100).toFixed(2))
  const changePercent = Number((((hashSymbol(symbol, 13) % 8_001) / 1_000) - 4).toFixed(2))
  return {
    symbol,
    name,
    price,
    change: Number((price * changePercent / 100).toFixed(2)),
    changePercent,
    change3Day: Number((price * (((hashSymbol(symbol, 37) % 12_001) / 1_000) - 6) / 100).toFixed(2)),
    change3DayPercent: Number((((hashSymbol(symbol, 37) % 12_001) / 1_000) - 6).toFixed(2)),
    change7Day: Number((price * (((hashSymbol(symbol, 43) % 20_001) / 1_000) - 10) / 100).toFixed(2)),
    change7DayPercent: Number((((hashSymbol(symbol, 43) % 20_001) / 1_000) - 10).toFixed(2)),
    volume: 100_000 + hashSymbol(symbol, 29) * 17,
  }
}

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
}

function isAlpacaSnapshot(value: unknown): value is AlpacaSnapshot {
  if (!isObject(value)) return false
  const { latestTrade, prevDailyBar, dailyBar } = value
  return (latestTrade === undefined
      || (isObject(latestTrade)
        && typeof latestTrade.p === 'number'
        && Number.isFinite(latestTrade.p)))
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
      && typeof bar.t === 'string'))
}

function historicalChange(
  price: number,
  bars: AlpacaHistoryBar[],
  tradingDays: number,
): { change: number | null; changePercent: number | null } {
  const referenceBar = bars[bars.length - tradingDays - 1]
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
): Quote | null {
  const price = snapshot.latestTrade?.p
  const previousClose = snapshot.prevDailyBar?.c
  if (price === undefined || previousClose === undefined || previousClose <= 0) return null
  const change = Number((price - previousClose).toFixed(2))
  return {
    symbol,
    name,
    price,
    change,
    changePercent: Number((change / previousClose * 100).toFixed(2)),
    change3Day: null,
    change3DayPercent: null,
    change7Day: null,
    change7DayPercent: null,
    volume: snapshot.dailyBar?.v ?? 0,
  }
}

export function mapSnapshotsToQuotes(
  companies: Sp100Company[],
  snapshots: AlpacaSnapshotsResponse,
): Quote[] {
  return companies.flatMap(({ symbol, name }) => {
    const snapshot = snapshots[symbol]
    // Alpaca can omit symbols when it has no snapshot for that ticker.
    if (!snapshot) return []
    const quote = quoteFromSnapshot(symbol, name, snapshot)
    return quote ? [quote] : []
  })
}

function createMockResponse(): QuotesResponse {
  const quotes = SP100
    .map(({ symbol, name }) => createMockQuote(symbol, name))
    .sort((left, right) => right.changePercent - left.changePercent)
    .slice(0, 50)
  return { updatedAt: new Date().toISOString(), quotes }
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

  const quotes = mapSnapshotsToQuotes(SP100, snapshotData)
    .map((quote) => {
      const bars = barsData.bars[quote.symbol] ?? []
      const threeDay = historicalChange(quote.price, bars, 3)
      const sevenDay = historicalChange(quote.price, bars, 7)
      return {
        ...quote,
        change3Day: threeDay.change,
        change3DayPercent: threeDay.changePercent,
        change7Day: sevenDay.change,
        change7DayPercent: sevenDay.changePercent,
      }
    })
    .sort((left, right) => right.changePercent - left.changePercent)
    .slice(0, 50)
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
    cachedResponse = createMockResponse()
    cacheExpiresAt = Date.now() + 20_000
    response.status(200).json(cachedResponse)
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
