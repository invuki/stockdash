import { Card, Col, Placeholder, Row } from 'react-bootstrap'
import type { Quote, QuoteHistoryPoint, SortKey } from '../types/stocks'
import { formatSortValue, isChangeSortKey, SORT_LABELS } from '../utils/stockMetrics'

interface TopPerformersProps {
  quotes: Quote[]
  sortKey: SortKey
  loading: boolean
}

export function TopPerformers({ quotes, sortKey, loading }: TopPerformersProps) {
  if (quotes.length === 0 && !loading) return null
  const chartDays = sortKey.includes('7Day') ? 7 : sortKey.includes('3Day') ? 3 : null
  const isOneDayChange = sortKey === 'change' || sortKey === 'changePercent'

  return (
    <section aria-labelledby="top-performers-heading" className="top-performers mt-4">
      <div className="section-heading">
        <div>
          <h2 id="top-performers-heading">Top performers</h2>
          <p>Top stocks by {SORT_LABELS[sortKey].toLowerCase()}.</p>
        </div>
      </div>
      <Row className="g-3">
        {loading
          ? [0, 1, 2].map((rank) => (
            <Col key={rank} xs={12} md={4}>
              <Card className="performer-card h-100" aria-hidden="true">
                <Card.Body>
                  <div className="performer-heading">
                    <span className="performer-rank">#{rank + 1}</span>
                    <div className="performer-skeleton-copy">
                      <Placeholder as="div" animation="glow"><Placeholder xs={7} /></Placeholder>
                      <Placeholder as="div" animation="glow"><Placeholder xs={10} /></Placeholder>
                    </div>
                  </div>
                  {chartDays !== null && (
                    <StockHistoryChart
                      symbol=""
                      history={[]}
                      days={chartDays}
                      loading
                    />
                  )}
                  {isOneDayChange && <SessionPrices loading />}
                  <div className="performer-metrics">
                    <span className="performer-metric-label">{SORT_LABELS[sortKey]}</span>
                    <Placeholder as="span" animation="glow" className="performer-value">
                      <Placeholder xs={8} />
                    </Placeholder>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))
          : quotes.map((quote, index) => (
          <Col key={`${sortKey}-${quote.symbol}`} xs={12} md={4}>
            <Card className="performer-card h-100">
              <Card.Body>
                <div className="performer-heading">
                  <span className="performer-rank">#{index + 1}</span>
                  <div>
                    <h3 className="performer-symbol">{quote.symbol}</h3>
                    <p className="performer-company">{quote.name}</p>
                  </div>
                </div>
                {chartDays !== null && (
                  <StockHistoryChart
                    symbol={quote.symbol}
                    history={quote.history}
                    days={chartDays}
                  />
                )}
                {isOneDayChange && (
                  <SessionPrices
                    open={quote.sessionOpen}
                    current={quote.sessionPrice}
                  />
                )}
                <div className="performer-metrics">
                  <span className="performer-metric-label">{SORT_LABELS[sortKey]}</span>
                  <span className={`performer-value ${isChangeSortKey(sortKey)
                    ? typeof quote[sortKey] === 'number' && quote[sortKey] < 0 ? 'loss' : 'gain'
                    : ''}`}>
                    {formatSortValue(quote, sortKey)}
                  </span>
                </div>
              </Card.Body>
            </Card>
          </Col>
          ))}
      </Row>
    </section>
  )
}

interface SessionPricesProps {
  open?: number | null
  current?: number | null
  loading?: boolean
}

function SessionPrices({ open, current, loading = false }: SessionPricesProps) {
  if (loading) {
    return (
      <div className="performer-session-prices" aria-hidden="true">
        <span>Open <Placeholder as="span" animation="glow"><Placeholder xs={5} /></Placeholder></span>
        <span>Ongoing / close <Placeholder as="span" animation="glow"><Placeholder xs={5} /></Placeholder></span>
      </div>
    )
  }

  return (
    <div className="performer-session-prices">
      <span>Open <strong>{open === null || open === undefined ? '—' : formatCurrency(open)}</strong></span>
      <span>Ongoing / close <strong>{current === null || current === undefined ? '—' : formatCurrency(current)}</strong></span>
    </div>
  )
}

interface StockHistoryChartProps {
  symbol: string
  history: QuoteHistoryPoint[]
  days: number
  loading?: boolean
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value)
}

function StockHistoryChart({ symbol, history, days, loading = false }: StockHistoryChartProps) {
  const points = history.slice(-(days + 1))
  const first = points[0]
  const last = points.at(-1)

  if (loading) {
    return (
      <div className="performer-chart" aria-hidden="true">
        <div className="performer-chart-caption">
          <span>Price · {days}-day</span>
          <Placeholder as="span" animation="glow"><Placeholder xs={4} /></Placeholder>
        </div>
        <Placeholder as="div" animation="glow" className="performer-chart-skeleton" />
      </div>
    )
  }

  if (!first || !last) return null

  const prices = points.map(({ price }) => price)
  const minimum = Math.min(...prices)
  const maximum = Math.max(...prices)
  const range = Math.max(maximum - minimum, maximum * 0.001)
  const chartPoints = points.map((point, index) => ({
    x: points.length === 1 ? 160 : 10 + index * (300 / (points.length - 1)),
    y: 66 - ((point.price - minimum) / range) * 50,
  }))
  const path = chartPoints
    .map(({ x, y }, index) => `${index === 0 ? 'M' : 'L'} ${x} ${y}`)
    .join(' ')
  const direction = last.price >= first.price ? 'gain' : 'loss'
  const startDate = new Date(first.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })
  const endDate = new Date(last.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })

  return (
    <figure className={`performer-chart ${direction}`}>
      <figcaption className="performer-chart-caption">
        <span>Price · {days}-day</span>
        <span>{formatCurrency(first.price)} → {formatCurrency(last.price)}</span>
      </figcaption>
      <svg
        viewBox="0 0 320 82"
        role="img"
        aria-label={`${symbol} price over ${days} trading ${days === 1 ? 'day' : 'days'}, ${startDate} to ${endDate}: ${formatCurrency(first.price)} to ${formatCurrency(last.price)}`}
        preserveAspectRatio="none"
      >
        <path className="performer-chart-baseline" d="M 0 76 H 320" />
        <path className="performer-chart-line" d={path} />
        <circle
          className="performer-chart-endpoint"
          cx={chartPoints[chartPoints.length - 1].x}
          cy={chartPoints[chartPoints.length - 1].y}
          r="3"
        />
      </svg>
    </figure>
  )
}
