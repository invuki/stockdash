import { Form } from 'react-bootstrap'

export interface SearchInputProps {
  value: string
  onChange: (value: string) => void
}

export function SearchInput({ value, onChange }: SearchInputProps) {
  return (
    <Form.Group className="search-control">
      <Form.Label className="visually-hidden">Search by ticker or company name</Form.Label>
      <div className="input-group">
        <span className="input-group-text" aria-hidden="true"><i className="bi bi-search" /></span>
        <Form.Control
          type="search"
          placeholder="Search ticker or company…"
          value={value}
          onChange={(event) => onChange(event.currentTarget.value)}
        />
      </div>
    </Form.Group>
  )
}
