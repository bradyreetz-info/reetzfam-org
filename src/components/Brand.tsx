import { Link } from 'react-router-dom'

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className={`brand ${compact ? 'brand--compact' : ''}`} aria-label="ReetzFam.org home">
      <span className="brand-mark" aria-hidden="true"><span>R</span></span>
      <span>ReetzFam<span className="brand-dot">.org</span></span>
    </Link>
  )
}
