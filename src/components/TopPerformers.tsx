import { Card, Col, Placeholder, Row } from 'react-bootstrap'
import type { Quote, SortKey } from '../types/stocks'
import { formatSortValue, isChangeSortKey, SORT_LABELS } from '../utils/stockMetrics'

interface TopPerformersProps {
  quotes: Quote[]
  sortKey: SortKey
  loading: boolean
}

export function TopPerformers({ quotes, sortKey, loading }: TopPerformersProps) {
  if (quotes.length === 0 && !loading) return null

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
