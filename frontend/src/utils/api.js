import axios from 'axios'
const BASE = 'http://localhost:5000/api'
export const api = {
  health: ()                    => axios.get(`${BASE}/health`),
  demo:   (difficulty)          => axios.get(`${BASE}/demo?difficulty=${difficulty}`),
  upload: (file, difficulty)    => {
    const form = new FormData()
    form.append('resume', file)
    form.append('difficulty', difficulty)
    return axios.post(`${BASE}/upload`, form)
  },
  getCurrentQuestion: (sid)         => axios.get(`${BASE}/question/${sid}/current`),
  submitAnswer:       (sid, qid, a) => axios.post(`${BASE}/answer/${sid}`, { question_id: qid, answer: a }),
  getReport:          (sid)         => axios.get(`${BASE}/report/${sid}`),
  resetSession:       (sid, diff)   => axios.post(`${BASE}/reset/${sid}`, { difficulty: diff }),
}
export const scoreColor = (s) => s >= 80 ? '#22C55E' : s >= 60 ? '#16A34A' : s >= 40 ? '#F59E0B' : '#EF4444'
export const diffColor  = (d) => d === 'easy' ? '#22C55E' : d === 'medium' ? '#F59E0B' : '#EF4444'
export const diffLabel  = (d) => d === 'easy' ? '🟢 Easy' : d === 'medium' ? '🟡 Medium' : '🔴 Hard'
