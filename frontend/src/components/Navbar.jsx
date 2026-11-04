import { diffLabel } from '../utils/api'

export default function Navbar({ sessionId, difficulty, onHome }) {
  return (
    <nav className="navbar">
      <button className="brand" onClick={onHome}>
        <div className="brand-logo">IQ</div>
        <div>
          <div className="brand-text">Interview<span>IQ</span></div>
          <div className="brand-tag">AI-Powered Interview Practice</div>
        </div>
      </button>
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        {difficulty && (
          <span className={`diff-${difficulty}`}>{diffLabel(difficulty)}</span>
        )}
        {sessionId && (
          <span style={{ fontSize:'0.7rem', color:'var(--muted)', fontFamily:'monospace' }}>
            {sessionId.slice(0,10)}…
          </span>
        )}
      </div>
    </nav>
  )
}
