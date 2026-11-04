import { useState } from 'react'
import './index.css'
import Navbar      from './components/Navbar'
import UploadPage  from './pages/UploadPage'
import SkillsPage  from './pages/SkillsPage'
import InterviewPage from './pages/InterviewPage'
import ReportPage  from './pages/ReportPage'

export default function App() {
  const [page,       setPage]       = useState('upload')
  const [sessionId,  setSessionId]  = useState(null)
  const [uploadData, setUploadData] = useState(null)

  function onUpload(data) {
    setSessionId(data.session_id)
    setUploadData(data)
    setPage('skills')
  }
  function onStart()   { setPage('interview') }
  function onDone()    { setPage('report') }
  function onReset()   { setPage('interview') }
  function onHome()    { setPage('upload'); setSessionId(null); setUploadData(null) }

  return (
    <div>
      <Navbar
        sessionId={sessionId}
        difficulty={uploadData?.difficulty}
        onHome={onHome}
      />
      {page==='upload'    && <UploadPage   onSuccess={onUpload} />}
      {page==='skills'    && uploadData && <SkillsPage uploadData={uploadData} onStart={onStart} />}
      {page==='interview' && sessionId  && <InterviewPage sessionId={sessionId} totalQ={uploadData?.total_questions||0} onDone={onDone} />}
      {page==='report'    && sessionId  && <ReportPage sessionId={sessionId} onReset={onReset} onHome={onHome} />}
    </div>
  )
}
