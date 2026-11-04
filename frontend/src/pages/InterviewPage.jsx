import { useState, useEffect, useRef } from 'react'
import { api, scoreColor, diffLabel } from '../utils/api'

export default function InterviewPage({ sessionId, totalQ, onDone }) {
  const [current,    setCurrent]    = useState(null)
  const [answer,     setAnswer]     = useState('')
  const [result,     setResult]     = useState(null)
  const [listening,  setListening]  = useState(false)
  const [transcript, setTranscript] = useState('') // accumulated speech
  const [loading,    setLoading]    = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState('')
  const [allDone,    setAllDone]    = useState(false)
  const recogRef = useRef(null)
  const ansRef   = useRef(null)

  useEffect(() => { fetchQ() }, [])

  async function fetchQ() {
    setLoading(true); setResult(null); setAnswer(''); setTranscript(''); setError('')
    try {
      const { data } = await api.getCurrentQuestion(sessionId)
      if (data.completed) { setAllDone(true); return }
      setCurrent(data)
    } catch { setError('Failed to load question. Check backend.') }
    finally { setLoading(false) }
  }

  // ── FIXED MIC: uses continuous recognition, appends clean text ──────────────
  function startVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      setError('Voice not supported. Please use Google Chrome for mic input.')
      return
    }
    setError('')

    const r          = new SR()
    r.lang           = 'en-US'
    r.continuous     = true   // keep recording until user stops
    r.interimResults = false  // only final results — avoids duplicates and pronunciation errors

    r.onstart  = () => setListening(true)
    r.onend    = () => setListening(false)
    r.onerror  = (e) => {
      setListening(false)
      if (e.error === 'not-allowed')
        setError('Microphone access denied. Click the 🔒 lock icon in the address bar → allow Microphone → refresh.')
      else if (e.error === 'no-speech')
        setError('No speech detected. Please speak clearly into the microphone.')
      else
        setError(`Microphone error: ${e.error}. Try again.`)
    }

    let accumulated = ''
    r.onresult = (e) => {
      // Collect only FINAL results to avoid duplicates
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          const chunk = e.results[i][0].transcript.trim()
          if (chunk) {
            accumulated += (accumulated ? ' ' : '') + chunk
          }
        }
      }
      // Update both transcript state and answer
      const base = ansRef.current?.dataset?.base || ''
      const full = base ? base + ' ' + accumulated : accumulated
      setAnswer(full.trim())
      setTranscript(accumulated)
    }

    recogRef.current = r
    r.start()
  }

  function stopVoice() {
    recogRef.current?.stop()
    setListening(false)
  }

  function toggleMic() {
    if (listening) {
      stopVoice()
    } else {
      // Save current typed answer as base so voice appends to it
      if (ansRef.current) {
        ansRef.current.dataset.base = answer
      }
      setTranscript('')
      startVoice()
    }
  }

  // ── Submit ──────────────────────────────────────────────────────────────────
  async function submit() {
    if (listening) stopVoice()
    const finalAnswer = answer.trim()
    if (!finalAnswer) { setError('Please type or speak your answer before submitting.'); return }
    setSubmitting(true); setError('')
    try {
      const { data } = await api.submitAnswer(sessionId, current.id, finalAnswer)
      setResult(data)
    } catch { setError('Submission failed. Try again.') }
    finally { setSubmitting(false) }
  }

  async function skip() {
    if (listening) stopVoice()
    setSubmitting(true)
    try {
      await api.submitAnswer(sessionId, current.id, '[Skipped]')
      await fetchQ()
    } catch { setError('Skip failed.') }
    finally { setSubmitting(false) }
  }

  async function next() {
    if (result?.all_completed) { setAllDone(true) }
    else { await fetchQ() }
  }

  // ── All done screen ─────────────────────────────────────────────────────────
  if (allDone) return (
    <div className="page" style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div className="card fade-up" style={{ textAlign:'center', maxWidth:460, padding:'48px 40px' }}>
        <div style={{ fontSize:'4rem', marginBottom:16 }}>🎉</div>
        <h2 style={{ color:'var(--white)', marginBottom:8 }}>Interview Complete!</h2>
        <p style={{ color:'var(--muted)', marginBottom:32, fontSize:'0.95rem' }}>
          All questions answered. Your AI-powered report is ready.
        </p>
        <button
          className="btn btn-primary btn-full btn-lg"
          style={{ fontSize:'1rem' }}
          onClick={onDone}
        >
          📊 View My AI Report →
        </button>
      </div>
    </div>
  )

  if (loading) return (
    <div className="page" style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center' }}>
        <div className="spinner" style={{ width:40,height:40,margin:'0 auto 14px' }} />
        <div style={{ color:'var(--muted)' }}>Loading question…</div>
      </div>
    </div>
  )

  if (!current) return null
  const pct = current.progress_percent || 0

  return (
    <div className="page fade-up">
      <div className="wrap">

        {/* Progress */}
        <div className="card-sm" style={{ marginBottom:18 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <span style={{ fontFamily:'monospace', fontSize:'0.78rem', color:'var(--muted)' }}>
              Question {current.question_number} / {current.total_questions}
            </span>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              {current.ai_status?.adjustments > 0 && (
                <span style={{ fontSize:'0.72rem', color:'var(--teal)' }}>
                  🤖 AI adjusted difficulty {current.ai_status.adjustments}×
                </span>
              )}
              <span style={{ fontFamily:'monospace', fontSize:'0.78rem', color:'var(--teal)', fontWeight:700 }}>
                {pct}%
              </span>
            </div>
          </div>
          <div className="prog-track">
            <div className="prog-fill" style={{ width:`${pct}%` }} />
          </div>
          <div style={{ display:'flex', gap:6, marginTop:10, flexWrap:'wrap' }}>
            <span className="tag tag-purple">{current.skill}</span>
            <span className="tag tag-gray">{current.category}</span>
            <span className={`diff-${current.difficulty}`}>{diffLabel(current.difficulty)}</span>
          </div>
        </div>

        {/* Question */}
        <div className="q-card">
          <div className="q-meta">Question {current.question_number}</div>
          <div className="q-text">{current.question}</div>
        </div>

        {/* Answer / Result */}
        {!result ? (
          <div className="card">
            {/* Header row */}
            <div style={{ display:'flex', justifyContent:'space-between',
              alignItems:'center', marginBottom:12 }}>
              <span style={{ fontWeight:700, fontSize:'0.9rem' }}>Your Answer</span>
              {listening && (
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div className="waveform">
                    {[1,2,3,4,5].map(i=><div key={i} className="wave-bar" style={{ height:6 }} />)}
                  </div>
                  <span style={{ color:'var(--red)', fontSize:'0.75rem', fontWeight:700, fontFamily:'monospace' }}>
                    RECORDING…
                  </span>
                </div>
              )}
            </div>

            {error && <div className="alert alert-err">{error}</div>}

            {/* Textarea + mic button */}
            <div className="answer-wrap">
              <textarea
                ref={ansRef}
                className="answer-box"
                placeholder={
                  listening
                    ? '🎤 Listening… speak your answer now. Click ⏹ to stop.'
                    : 'Type your answer here, or click the 🎤 mic button to speak…\n\nTip: Include technical terms, examples, and explanations for higher scores.'
                }
                value={answer}
                onChange={e => { setAnswer(e.target.value); setError('') }}
                onKeyDown={e => { if (e.ctrlKey && e.key==='Enter') submit() }}
              />
              <button
                className={`mic-btn ${listening ? 'mic-btn-active' : 'mic-btn-idle'}`}
                onClick={toggleMic}
                title={listening ? 'Click to stop recording' : 'Click to speak your answer'}
              >
                {listening ? '⏹' : '🎤'}
              </button>
            </div>

            {/* Hints */}
            <div style={{ display:'flex', justifyContent:'space-between',
              alignItems:'center', marginTop:8, marginBottom:16 }}>
              <span style={{ fontSize:'0.72rem', color:'var(--muted)', fontFamily:'monospace' }}>
                {answer.length} chars · ctrl+enter to submit
              </span>
              <span style={{ fontSize:'0.72rem', color: listening ? 'var(--red)' : 'var(--teal)', fontWeight:600 }}>
                {listening ? '🔴 Recording — click ⏹ to stop' : '🎤 Click mic to speak'}
              </span>
            </div>

            {/* Mic tip */}
            {!listening && (
              <div style={{ background:'#0F172A', border:'1px solid #334155', borderRadius:8,
                padding:'8px 12px', fontSize:'0.78rem', color:'var(--muted)', marginBottom:14 }}>
                💡 <b style={{ color:'var(--teal)' }}>Mic tip:</b> Use Chrome browser for best voice recognition.
                Speak clearly at normal pace. The mic captures your full answer automatically.
              </div>
            )}

            {/* Buttons */}
            <div style={{ display:'flex', gap:10 }}>
              <button
                className="btn btn-primary btn-full"
                onClick={submit}
                disabled={submitting || !answer.trim()}
                style={{ flex:1 }}
              >
                {submitting
                  ? <><span className="spinner" style={{ width:16,height:16 }} /> Evaluating…</>
                  : 'Submit Answer ✓'}
              </button>
              <button
                className="btn btn-ghost"
                onClick={skip}
                disabled={submitting}
                style={{ padding:'11px 20px', flexShrink:0 }}
              >
                Skip ⏭
              </button>
            </div>
          </div>
        ) : (
          /* Result card */
          <div className="card fade-up">
            {/* Score display */}
            <div style={{ display:'flex', gap:18, alignItems:'center', marginBottom:16, flexWrap:'wrap' }}>
              <div
                className="score-ring"
                style={{
                  border: `4px solid ${scoreColor(result.score)}`,
                  background: scoreColor(result.score) + '18',
                }}
              >
                <div className="score-num" style={{ color:scoreColor(result.score) }}>
                  {result.score}
                </div>
                <div className="score-lbl">/ 100</div>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:800, fontSize:'1.2rem', color:'var(--white)', marginBottom:4 }}>
                  {result.quality}
                </div>
                <div style={{ color:'var(--muted)', fontSize:'0.85rem', lineHeight:1.55 }}>
                  {result.feedback}
                </div>
              </div>
            </div>

            {/* Score breakdown */}
            <div style={{ display:'flex', gap:10, marginBottom:14, flexWrap:'wrap' }}>
              <div style={{ background:'#1E3A5F', borderRadius:8, padding:'6px 12px', fontSize:'0.78rem' }}>
                <span style={{ color:'var(--muted)' }}>Semantic: </span>
                <span style={{ color:'#60A5FA', fontWeight:700 }}>{result.semantic_pct}%</span>
              </div>
              <div style={{ background:'#2D1B69', borderRadius:8, padding:'6px 12px', fontSize:'0.78rem' }}>
                <span style={{ color:'var(--muted)' }}>NB Classifier: </span>
                <span style={{ color:'#C4B5FD', fontWeight:700 }}>{result.nb_classification?.label}</span>
              </div>
              {result.difficulty_status?.current && (
                <div style={{ background:'#0D3321', borderRadius:8, padding:'6px 12px', fontSize:'0.78rem' }}>
                  <span style={{ color:'var(--muted)' }}>Next difficulty: </span>
                  <span style={{ color:'#6EE7B7', fontWeight:700 }}>{result.difficulty_status.current}</span>
                </div>
              )}
            </div>

            {/* Answer echo */}
            <div style={{ background:'var(--navy)', borderRadius:8, padding:'10px 14px',
              marginBottom:12, fontSize:'0.85rem', color:'var(--muted)',
              fontStyle:'italic', borderLeft:'3px solid #334155' }}>
              "{answer}"
            </div>

            {/* Keywords */}
            {(result.keywords_found?.length > 0 || result.keywords_missed?.length > 0) && (
              <div style={{ marginBottom:14 }}>
                {result.keywords_found?.length > 0 && (
                  <div style={{ marginBottom:6 }}>
                    <span style={{ fontSize:'0.72rem', color:'var(--muted)', marginRight:6 }}>
                      ✅ Good terms used:
                    </span>
                    {result.keywords_found.map(k => <span key={k} className="chip chip-g">{k}</span>)}
                  </div>
                )}
                {result.keywords_missed?.length > 0 && (
                  <div>
                    <span style={{ fontSize:'0.72rem', color:'var(--muted)', marginRight:6 }}>
                      💡 Try to include:
                    </span>
                    {result.keywords_missed.map(k => <span key={k} className="chip chip-r">{k}</span>)}
                  </div>
                )}
              </div>
            )}

            {/* Next button */}
            {result.all_completed ? (
              <button
                className="btn btn-full btn-lg"
                style={{ background:'var(--green)', color:'var(--navy)', fontSize:'1rem' }}
                onClick={() => setAllDone(true)}
              >
                🎉 Finish Interview → View AI Report
              </button>
            ) : (
              <button className="btn btn-primary btn-full btn-lg" onClick={next}>
                Next Question →
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
