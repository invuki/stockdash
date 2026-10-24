import { Card, Col, Placeholder, Row } from 'react-bootstrap'
import type { ReactNode } from 'react'
import type { Quote } from '../types/stocks'

export interface SummaryBarProps {
  quotes: Quote[]
  loading: boolean
}

function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
}

export function SummaryBar({ quotes, loading }: SummaryBarProps) {
  if (loading) {
    return (
      <Row xs={1} sm={3} className="g-3" aria-label="Loading market summary" aria-busy="true">
        {['Advancing', 'Top gainer', 'Average change'].map((label) => (
          <Col key={label}>
            <Card className="summary-card h-100" aria-hidden="true">
              <Card.Body className="py-3 px-3 px-md-4">
                <Card.Subtitle className="summary-label mb-2">{label}</Card.Subtitle>
                <Placeholder as="div" animation="glow" className="summary-value mb-0">
                  <Placeholder xs={7} />
                </Placeholder>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    )
  }

  const advancing = quotes.filter((quote) => quote.changePercent > 0).length
  // The generic reduce result can represent an empty list without inventing a quote.
  const topGainer = quotes.reduce<Quote | null>(
    (top, quote) => (!top || quote.changePercent > top.changePercent ? quote : top),
    null,
  )
  const averageChange = quotes.length
    ? quotes.reduce((sum, quote) => sum + quote.changePercent, 0) / quotes.length
    : 0

  return (
    <Row xs={1} sm={3} className="g-3" aria-label="Market summary">
      <Col><SummaryCard label="Advancing" value={<>{advancing}<span> / {quotes.length}</span></>} /></Col>
      <Col>
        <SummaryCard
          label="Top gainer"
          value={topGainer ? `${topGainer.symbol} ${formatPercent(topGainer.changePercent)}` : '—'}
        />
      </Col>
      <Col>
        <SummaryCard
          label="Average change"
          value={formatPercent(averageChange)}
          valueClass={averageChange >= 0 ? 'gain' : 'loss'}
        />
      </Col>
    </Row>
  )
}

interface SummaryCardProps {
  label: string
  value: ReactNode
  valueClass?: string
}

function SummaryCard({ label, value, valueClass = '' }: SummaryCardProps) {
  return (
    <Card className="summary-card h-100">
      <Card.Body className="py-3 px-3 px-md-4">
        <Card.Subtitle className="summary-label mb-2">{label}</Card.Subtitle>
        <Card.Title className={`summary-value mb-0 ${valueClass}`}>{value}</Card.Title>
      </Card.Body>
    </Card>
  )
}
