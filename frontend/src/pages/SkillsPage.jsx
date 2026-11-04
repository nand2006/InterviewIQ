import { diffLabel } from '../utils/api'

const CAT_STYLE = {
  'Programming':     { bg:'#1E3A5F', color:'#60A5FA', icon:'💻' },
  'AI/ML':           { bg:'#2D1B69', color:'#C4B5FD', icon:'🤖' },
  'Web Development': { bg:'#0D3321', color:'#6EE7B7', icon:'🌐' },
  'Database':        { bg:'#3B1F0D', color:'#FCA5A5', icon:'🗄️' },
  'CS Fundamentals': { bg:'#1A2A1A', color:'#86EFAC', icon:'📚' },
  'DevOps':          { bg:'#2A1A2E', color:'#E879F9', icon:'⚙️' },
  'Cloud':           { bg:'#1C2A3A', color:'#7DD3FC', icon:'☁️' },
  'Soft Skills':     { bg:'#3B2A0A', color:'#FDE68A', icon:'🤝' },
}

export default function SkillsPage({ uploadData, onStart }) {
  const { skills, total_questions, filename, difficulty } = uploadData

  const grouped = {}
  skills.forEach(s => {
    const cat = s.category || 'Other'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(s)
  })

  return (
    <div className="page fade-up">
      <div className="wrap">

        {/* Header */}
        <div className="card" style={{ marginBottom:20,
          background:'linear-gradient(135deg,#1E293B,#0F172A)' }}>
          <div style={{ display:'flex', justifyContent:'space-between',
            alignItems:'flex-start', flexWrap:'wrap', gap:14 }}>
            <div>
              <div style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--teal)',
                textTransform:'uppercase', letterSpacing:1.5, marginBottom:6 }}>
                ✅ Resume Analyzed Successfully
              </div>
              <h2 style={{ color:'var(--white)', marginBottom:6, fontSize:'1.4rem' }}>
                Skills Detected from Your Resume
              </h2>
              <div style={{ display:'flex', gap:12, flexWrap:'wrap', fontSize:'0.82rem', color:'var(--muted)' }}>
                <span>📄 {filename}</span>
                <span>•</span>
                <span>{skills.length} skills found</span>
                <span>•</span>
                <span>{total_questions} questions ready</span>
                <span>•</span>
                <span className={`diff-${difficulty}`}>{diffLabel(difficulty)}</span>
              </div>
            </div>
            <button className="btn btn-primary btn-lg" onClick={onStart}>
              🎤 Begin Interview →
            </button>
          </div>
        </div>

        {/* Skills grouped by category */}
        {Object.entries(grouped).map(([cat, catSkills]) => {
          const meta = CAT_STYLE[cat] || { bg:'#1E293B', color:'#94A3B8', icon:'🔧' }
          return (
            <div key={cat} className="card" style={{ marginBottom:14 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                <div style={{ width:34, height:34, borderRadius:8, background:meta.bg,
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1rem' }}>
                  {meta.icon}
                </div>
                <span style={{ fontWeight:700, color:'var(--white)' }}>{cat}</span>
                <span style={{ marginLeft:'auto', background:meta.bg, color:meta.color,
                  padding:'3px 10px', borderRadius:99, fontSize:'0.72rem', fontWeight:700 }}>
                  {catSkills.length} skill{catSkills.length > 1 ? 's' : ''}
                </span>
              </div>
              <div>
                {catSkills.map(s => (
                  <span key={s.skill} className="skill-badge" style={{ borderColor: meta.color+'30' }}>
                    <span style={{ color: meta.color }}>{s.display_name}</span>
                  </span>
                ))}
              </div>
            </div>
          )
        })}

        {/* Bottom CTA */}
        <div style={{ background:'#0C2A3F', border:'1px solid #1D4ED8', borderRadius:12,
          padding:'18px 22px', display:'flex', justifyContent:'space-between',
          alignItems:'center', flexWrap:'wrap', gap:12, marginTop:4 }}>
          <div>
            <div style={{ fontWeight:700, color:'#60A5FA', marginBottom:2 }}>
              {total_questions} personalized questions ready!
            </div>
            <div style={{ fontSize:'0.82rem', color:'var(--muted)' }}>
              AI will adapt difficulty based on your live performance
            </div>
          </div>
          <button className="btn btn-primary" onClick={onStart}>
            🎤 Start Interview
          </button>
        </div>

      </div>
    </div>
  )
}
