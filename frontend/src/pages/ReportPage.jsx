import { useState, useEffect } from 'react'
import { api, scoreColor, diffLabel } from '../utils/api'

export default function ReportPage({ sessionId, onReset, onHome }) {
  const [report,   setReport]   = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [expanded, setExpanded] = useState({})

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const { data } = await api.getReport(sessionId)
      setReport(data)
    } catch(e) {
      setError(e.response?.data?.error || 'Failed to load report.')
    } finally { setLoading(false) }
  }

  if (loading) return (
    <div className="page" style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center' }}>
        <div className="spinner" style={{ width:44,height:44,margin:'0 auto 14px' }} />
        <div style={{ color:'var(--muted)' }}>Generating AI report…</div>
      </div>
    </div>
  )

  if (error) return (
    <div className="page"><div className="wrap">
      <div className="alert alert-err">{error}</div>
      <button className="btn btn-primary" onClick={onHome}>← Go Home</button>
    </div></div>
  )

  if (!report) return null

  const {
    avg_score, avg_semantic, grade, verdict,
    skill_summary, strongest_skills, weakest_skills,
    confidence, recommendations, ai_features,
    answered_questions, total_questions, questions_attempted,
    difficulty,
  } = report

  const conf = confidence || {}
  const gradeColor = avg_score>=80?'#22C55E':avg_score>=65?'#16A34A':avg_score>=50?'#F59E0B':avg_score>=35?'#F97316':'#EF4444'

  return (
    <div className="page fade-up">
      <div className="wrap">

        {/* ── Hero ── */}
        <div className="report-hero">
          <div style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--teal)',
            textTransform:'uppercase', letterSpacing:1.5, marginBottom:8 }}>
            🤖 AI Performance Report
          </div>
          <div className="big-score">{avg_score}%</div>
          <div className="grade-pill" style={{ background:gradeColor, color:'#0F172A' }}>
            Grade {grade}
          </div>
          <div style={{ color:'var(--text)', fontSize:'1rem', marginTop:4 }}>{verdict}</div>
          <div style={{ fontSize:'0.82rem', color:'var(--muted)', marginTop:8 }}>
            {questions_attempted} of {total_questions} answered
            &nbsp;·&nbsp; {diffLabel(difficulty)}
          </div>

          {/* AI scores row */}
          <div style={{ display:'flex', justifyContent:'center', gap:32, marginTop:24, flexWrap:'wrap' }}>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:'1.8rem', fontWeight:900, color:'#60A5FA' }}>{avg_semantic}%</div>
              <div style={{ fontSize:'0.72rem', color:'var(--muted)' }}>Semantic Match</div>
              <div style={{ fontSize:'0.65rem', color:'#334155' }}>TF-IDF + Cosine</div>
            </div>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:'1.8rem', fontWeight:900, color:'#C4B5FD' }}>
                {conf.score || 0}%
              </div>
              <div style={{ fontSize:'0.72rem', color:'var(--muted)' }}>AI Confidence</div>
              <div style={{ fontSize:'0.65rem', color:'#334155' }}>{conf.readiness || '—'}</div>
            </div>
          </div>
        </div>

        {/* ── AI Features Used ── */}
        <div className="card" style={{ marginBottom:16, padding:'16px 20px' }}>
          <div style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--teal)',
            textTransform:'uppercase', letterSpacing:1, marginBottom:10 }}>
            🤖 AI Concepts Used in This Evaluation
          </div>
          <div>
            {(ai_features||[]).map(f => (
              <span key={f} className="ai-badge">{f}</span>
            ))}
          </div>
        </div>

        {/* ── AI Confidence Breakdown ── */}
        {conf.breakdown && Object.keys(conf.breakdown).length > 0 && (
          <div className="card" style={{ marginBottom:16 }}>
            <div style={{ fontWeight:700, color:'var(--white)', marginBottom:16 }}>
              🎯 AI Confidence Score Breakdown
            </div>
            {Object.entries(conf.breakdown).map(([key, val]) => (
              <div key={key} className="skill-row">
                <div className="sk-name" style={{ width:170 }}>
                  {key}
                </div>
                <div className="sk-bar">
                  <div className="prog-track">
                    <div style={{ height:'100%', width:`${val}%`,
                      background: val>=70?'#22C55E':val>=50?'#F59E0B':'#EF4444',
                      borderRadius:99, transition:'width 0.4s' }} />
                  </div>
                </div>
                <div className="sk-pct" style={{
                  color: val>=70?'#22C55E':val>=50?'#F59E0B':'#EF4444'
                }}>{val}%</div>
              </div>
            ))}
          </div>
        )}

        {/* ── Strongest / Weakest ── */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:16 }}>
          <div className="card">
            <div style={{ fontWeight:700, color:'#22C55E', marginBottom:12, fontSize:'0.95rem' }}>
              💪 Strongest Skills
            </div>
            {(strongest_skills||[]).length > 0 ? strongest_skills.map(sk => (
              <div key={sk} style={{ display:'flex', alignItems:'center',
                gap:8, marginBottom:8, padding:'6px 10px',
                background:'#052E16', borderRadius:8 }}>
                <span style={{ color:'#22C55E' }}>✓</span>
                <span style={{ fontWeight:600, color:'var(--white)', fontSize:'0.88rem' }}>{sk}</span>
                <span style={{ marginLeft:'auto', fontWeight:700,
                  color:'#22C55E', fontSize:'0.82rem' }}>
                  {skill_summary?.[sk]?.avg}%
                </span>
              </div>
            )) : (
              <div style={{ color:'var(--muted)', fontSize:'0.85rem' }}>Keep practicing!</div>
            )}
          </div>

          <div className="card">
            <div style={{ fontWeight:700, color:'#FCA5A5', marginBottom:12, fontSize:'0.95rem' }}>
              📚 Needs Improvement
            </div>
            {(weakest_skills||[]).length > 0 ? weakest_skills.map(sk => (
              <div key={sk} style={{ display:'flex', alignItems:'center',
                gap:8, marginBottom:8, padding:'6px 10px',
                background:'#450A0A', borderRadius:8 }}>
                <span style={{ color:'#EF4444' }}>⚠</span>
                <span style={{ fontWeight:600, color:'var(--white)', fontSize:'0.88rem' }}>{sk}</span>
                <span style={{ marginLeft:'auto', fontWeight:700,
                  color:'#EF4444', fontSize:'0.82rem' }}>
                  {skill_summary?.[sk]?.avg}%
                </span>
              </div>
            )) : (
              <div style={{ color:'var(--muted)', fontSize:'0.85rem' }}>No major weak areas! 🎉</div>
            )}
          </div>
        </div>

        {/* ── Skill Performance ── */}
        {skill_summary && Object.keys(skill_summary).length > 0 && (
          <div className="card" style={{ marginBottom:16 }}>
            <div style={{ fontWeight:700, color:'var(--white)', marginBottom:16 }}>
              📊 Skill-wise Performance
            </div>
            {Object.entries(skill_summary)
              .sort((a,b) => b[1].avg - a[1].avg)
              .map(([sk, d]) => (
                <div key={sk} style={{ marginBottom:14 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                    <span style={{ fontWeight:600, fontSize:'0.85rem', color:'var(--text)' }}>{sk}</span>
                    <div style={{ display:'flex', gap:14 }}>
                      <span style={{ fontSize:'0.72rem', color:'var(--muted)' }}>
                        Semantic {d.sem_avg}%
                      </span>
                      <span style={{ fontWeight:700, fontSize:'0.85rem', color:scoreColor(d.avg) }}>
                        {d.avg}%
                      </span>
                    </div>
                  </div>
                  <div className="prog-track">
                    <div style={{ width:`${d.avg}%`, height:'100%',
                      background:scoreColor(d.avg), borderRadius:99,
                      transition:'width 0.4s' }} />
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* ── AI Recommendations (RICH) ── */}
        {(recommendations||[]).length > 0 && (
          <div className="card" style={{ marginBottom:16 }}>
            <div style={{ fontWeight:700, color:'var(--white)', marginBottom:4, fontSize:'1rem' }}>
              🤖 AI Study Recommendations
            </div>
            <div style={{ fontSize:'0.78rem', color:'var(--muted)', marginBottom:14 }}>
              Personalized based on your performance, answer patterns, and skill gaps
            </div>
            {recommendations.map((r, i) => (
              <div key={i} className="rec-card">{r}</div>
            ))}
          </div>
        )}

        {/* ── Detailed Q&A Review ── */}
        <div className="card" style={{ marginBottom:24 }}>
          <div style={{ fontWeight:700, color:'var(--white)', marginBottom:16 }}>
            📝 Detailed Q&A Review
          </div>
          {(answered_questions||[]).map((q, i) => (
            <div key={q.id} style={{
              borderBottom: i < answered_questions.length-1 ? '1px solid var(--border)' : 'none',
              paddingBottom:14, marginBottom:14
            }}>
              <div
                style={{ display:'flex', justifyContent:'space-between',
                  alignItems:'center', gap:12, cursor:'pointer' }}
                onClick={() => setExpanded(e => ({...e, [q.id]:!e[q.id]}))}
              >
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:5 }}>
                    <span className="tag tag-purple" style={{ fontSize:'0.72rem' }}>{q.skill}</span>
                    <span className="tag tag-gray"   style={{ fontSize:'0.72rem' }}>{q.category}</span>
                    <span className={`diff-${q.difficulty}`} style={{ fontSize:'0.68rem' }}>
                      {diffLabel(q.difficulty)}
                    </span>
                    {q.nb_label && (
                      <span className="tag tag-blue" style={{ fontSize:'0.68rem' }}>
                        NB: {q.nb_label}
                      </span>
                    )}
                  </div>
                  <div style={{ fontWeight:600, fontSize:'0.9rem', color:'var(--white)' }}>
                    {q.question}
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontWeight:800, fontSize:'1rem', color:scoreColor(q.score||0) }}>
                      {q.score||0}%
                    </div>
                    <div style={{ fontSize:'0.65rem', color:'var(--muted)' }}>
                      sem {Math.round((q.semantic_score||0)*100)}%
                    </div>
                  </div>
                  <span style={{ color:'var(--muted)', fontSize:'0.8rem' }}>
                    {expanded[q.id] ? '▲' : '▼'}
                  </span>
                </div>
              </div>

              {expanded[q.id] && (
                <div style={{ marginTop:12 }} className="fade-up">
                  <div style={{ background:'var(--navy)', borderRadius:8, padding:'10px 14px',
                    marginBottom:8, fontSize:'0.85rem', color:'var(--muted)', fontStyle:'italic',
                    borderLeft:'3px solid #334155' }}>
                    {q.answer || '(No answer)'}
                  </div>
                  {q.feedback && (
                    <div style={{ fontSize:'0.82rem', color:'var(--muted)', marginBottom:8 }}>
                      💬 {q.feedback}
                    </div>
                  )}
                  <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
                    {q.keywords_found?.length > 0 && (
                      <div>
                        <span style={{ fontSize:'0.72rem', color:'var(--muted)' }}>Good: </span>
                        {q.keywords_found.map(k => <span key={k} className="chip chip-g">{k}</span>)}
                      </div>
                    )}
                    {q.keywords_missed?.length > 0 && (
                      <div>
                        <span style={{ fontSize:'0.72rem', color:'var(--muted)' }}>Missed: </span>
                        {q.keywords_missed.map(k => <span key={k} className="chip chip-r">{k}</span>)}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── Actions ── */}
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:40 }}>
          <button className="btn btn-primary btn-lg" onClick={onReset}>
            🔄 Practice Again
          </button>
          <button className="btn btn-secondary" onClick={onHome}>
            📤 Upload New Resume
          </button>
        </div>

      </div>
    </div>
  )
}
