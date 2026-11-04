import { useState, useRef } from 'react'
import { api } from '../utils/api'

const DIFFS = [
  { key:'easy',   icon:'🟢', name:'Easy',   desc:'Basic definition questions\nIdeal for beginners' },
  { key:'medium', icon:'🟡', name:'Medium', desc:'Application & how-it-works\nIdeal for placement prep' },
  { key:'hard',   icon:'🔴', name:'Hard',   desc:'Advanced & design questions\nIdeal for experienced' },
]

export default function UploadPage({ onSuccess }) {
  const [diff,    setDiff]    = useState('medium')
  const [file,    setFile]    = useState(null)
  const [drag,    setDrag]    = useState(false)
  const [loading, setLoading] = useState(false)
  const [demoL,   setDemoL]   = useState(false)
  const [error,   setError]   = useState('')
  const ref = useRef()

  function pick(f) {
    if (!f) return
    const ext = f.name.split('.').pop().toLowerCase()
    if (!['pdf','docx','doc','txt'].includes(ext)) {
      setError('Only PDF, DOCX, DOC, TXT files allowed.'); return
    }
    if (f.size > 5*1024*1024) { setError('Max file size is 5MB.'); return }
    setFile(f); setError('')
  }

  async function upload() {
    if (!file) { setError('Please select your resume first.'); return }
    setLoading(true); setError('')
    try {
      const { data } = await api.upload(file, diff)
      onSuccess(data)
    } catch(e) {
      setError(e.response?.data?.error || 'Upload failed. Make sure the backend is running.')
    } finally { setLoading(false) }
  }

  async function demo() {
    setDemoL(true); setError('')
    try {
      const { data } = await api.demo(diff)
      onSuccess(data)
    } catch(e) {
      setError(e.response?.data?.error || 'Demo failed. Make sure the backend is running.')
    } finally { setDemoL(false) }
  }

  return (
    <div className="page">
      <div className="wrap fade-up">

        {/* ── Hero ── */}
        <div style={{ textAlign:'center', marginBottom:40 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'#1E3A5F',
            border:'1px solid #1D4ED8', borderRadius:99, padding:'5px 16px',
            fontSize:'0.78rem', fontWeight:700, color:'#60A5FA', marginBottom:16 }}>
            🤖 Powered by TF-IDF · Cosine Similarity · Naive Bayes · Adaptive AI
          </div>
          <h1 style={{ fontSize:'2.4rem', fontWeight:900, color:'var(--white)',
            lineHeight:1.2, marginBottom:12 }}>
            Upload Resume.<br/>
            <span style={{ background:'linear-gradient(135deg,#0EA5E9,#8B5CF6)',
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
              backgroundClip:'text' }}>Practice Smart.</span>
          </h1>
          <p style={{ color:'var(--muted)', fontSize:'1rem', maxWidth:500, margin:'0 auto' }}>
            InterviewIQ reads your resume, detects your skills using NLP,
            and generates personalized interview questions — with instant AI feedback.
          </p>
        </div>

        {/* ── Step 1: Choose Difficulty ── */}
        <div className="card" style={{ marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
            <div style={{ width:26, height:26, borderRadius:99, background:'var(--teal)',
              color:'var(--navy)', fontWeight:900, fontSize:'0.85rem',
              display:'flex', alignItems:'center', justifyContent:'center' }}>1</div>
            <div style={{ fontWeight:700, fontSize:'1rem', color:'var(--white)' }}>
              Choose Your Interview Level
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
            {DIFFS.map(d => (
              <div
                key={d.key}
                className={`diff-card ${diff === d.key ? 'selected' : ''}`}
                onClick={() => setDiff(d.key)}
              >
                <div className="diff-icon">{d.icon}</div>
                <div className="diff-name" style={{
                  color: d.key==='easy' ? '#6EE7B7' : d.key==='medium' ? '#FCD34D' : '#FCA5A5'
                }}>{d.name}</div>
                <div className="diff-desc">{d.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop:14, padding:'10px 14px', background:'#0F172A',
            borderRadius:10, fontSize:'0.82rem', color:'var(--muted)' }}>
            💡 <b style={{ color:'var(--teal)' }}>AI Adaptive Mode:</b> The system will automatically
            adjust question difficulty based on your live performance during the interview.
          </div>
        </div>

        {/* ── Step 2: Upload Resume ── */}
        <div className="card" style={{ marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
            <div style={{ width:26, height:26, borderRadius:99, background:'var(--teal)',
              color:'var(--navy)', fontWeight:900, fontSize:'0.85rem',
              display:'flex', alignItems:'center', justifyContent:'center' }}>2</div>
            <div style={{ fontWeight:700, fontSize:'1rem', color:'var(--white)' }}>
              Upload Your Resume
            </div>
            <span style={{ fontSize:'0.78rem', color:'var(--muted)', marginLeft:'auto' }}>
              PDF · DOCX · TXT (max 5MB)
            </span>
          </div>

          {error && <div className="alert alert-err">⚠️ {error}</div>}

          {/* Drop zone */}
          <div
            onClick={() => ref.current.click()}
            onDragOver={e => { e.preventDefault(); setDrag(true) }}
            onDragLeave={() => setDrag(false)}
            onDrop={e => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files[0]) }}
            style={{
              border: `2px dashed ${drag ? '#0EA5E9' : '#334155'}`,
              borderRadius:12, padding:'36px 24px', textAlign:'center',
              cursor:'pointer', transition:'all 0.2s',
              background: drag ? '#0C2A3F' : 'var(--navy)',
            }}
          >
            <div style={{ fontSize:'2.8rem', marginBottom:10 }}>
              {file ? '📄' : '📂'}
            </div>
            {file ? (
              <>
                <div style={{ fontWeight:700, color:'var(--white)', marginBottom:4 }}>{file.name}</div>
                <div style={{ fontSize:'0.8rem', color:'var(--muted)' }}>
                  {(file.size/1024).toFixed(1)} KB — Click to change
                </div>
              </>
            ) : (
              <>
                <div style={{ fontWeight:700, color:'var(--white)', marginBottom:4 }}>
                  Drag & drop your resume here
                </div>
                <div style={{ fontSize:'0.85rem', color:'var(--muted)' }}>or click to browse</div>
              </>
            )}
          </div>
          <input ref={ref} type="file" accept=".pdf,.docx,.doc,.txt"
            style={{ display:'none' }} onChange={e => pick(e.target.files[0])} />

          <button
            className="btn btn-primary btn-full btn-lg"
            style={{ marginTop:16, fontSize:'1rem' }}
            onClick={upload}
            disabled={loading || !file}
          >
            {loading
              ? <><span className="spinner" style={{ width:18,height:18 }} /> Analyzing Resume…</>
              : '🚀 Start AI Interview'}
          </button>

          <div style={{ textAlign:'center', marginTop:14,
            paddingTop:14, borderTop:'1px solid var(--border)' }}>
            <button
              className="btn btn-ghost"
              style={{ fontSize:'0.88rem' }}
              onClick={demo}
              disabled={demoL}
            >
              {demoL
                ? <><span className="spinner" style={{ width:14,height:14 }} /> Loading…</>
                : '✨ Try Demo — No Upload Needed'}
            </button>
          </div>
        </div>

        {/* ── How it works ── */}
        <div className="card">
          <div style={{ fontWeight:700, marginBottom:16, color:'var(--white)' }}>How InterviewIQ Works</div>
          <div style={{ display:'grid', gap:12 }}>
            {[
              ['📤','Resume Parsing',    'Upload PDF/DOCX → pdfminer extracts text automatically'],
              ['🧠','NLP Skill Detection','Keyword matching + regex detects your technical skills'],
              ['🤖','AI Question Gen',   'TF-IDF + Naive Bayes selects questions at your difficulty level'],
              ['📊','Semantic Scoring',  'Cosine Similarity evaluates how close your answer is to ideal'],
              ['🎯','Adaptive Engine',   'AI adjusts difficulty live based on your performance scores'],
            ].map(([icon, title, desc]) => (
              <div key={title} style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                <div style={{ width:36, height:36, borderRadius:8, background:'#1E3A5F',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:'1.1rem', flexShrink:0 }}>{icon}</div>
                <div>
                  <div style={{ fontWeight:700, fontSize:'0.88rem', color:'var(--white)', marginBottom:2 }}>{title}</div>
                  <div style={{ fontSize:'0.8rem', color:'var(--muted)' }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
