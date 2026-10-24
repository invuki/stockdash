import { Card, Placeholder } from 'react-bootstrap'

export interface SkeletonRowsProps {
  count: number
  // This union keeps loading placeholders aligned with the matching stock layout.
  variant: 'table' | 'cards'
}

export function SkeletonRows({ count, variant }: SkeletonRowsProps) {
  // Array.from creates the requested number of placeholder rows without fixed markup.
  const rows = Array.from({ length: count }, (_, index) => index)
  if (variant === 'cards') {
    return (
      <>
        {rows.map((row) => (
          <Card className="mb-2" key={row} aria-hidden="true">
            <Card.Body>
              <Placeholder as="span" animation="glow" className="w-100">
                <Placeholder xs={5} /> <Placeholder xs={3} />
                <Placeholder xs={7} className="mt-3" /> <Placeholder xs={4} className="mt-3" />
              </Placeholder>
            </Card.Body>
          </Card>
        ))}
      </>
    )
  }

  return (
    <>
      {rows.map((row) => (
        <tr key={row} aria-hidden="true">
          <td colSpan={5}>
            <Placeholder as="span" animation="glow" className="w-100">
              <Placeholder xs={1} /> <Placeholder xs={2} /> <Placeholder xs={3} />
              <Placeholder xs={2} /> <Placeholder xs={2} />
            </Placeholder>
          </td>
        </tr>
      ))}
    </>
  )
}
