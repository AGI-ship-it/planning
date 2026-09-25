import { useEffect } from 'react'

// The walkthrough starts on the intranet, not in the planner: sawa.html is the
// Sawa landing page, and its Planner quick link opens preview.html — the
// prototype itself, a single self-contained file rather than this React
// scaffold, which was never finished.
//
// Rather than leave / broken or overwrite index.html, this sends it to the page
// the demo opens on. If the React build is ever picked up again, replace this
// with the real root component and the redirect goes with it.
const LANDING = 'sawa.html'

export default function App() {
  useEffect(() => {
    window.location.replace(LANDING)
  }, [])

  return (
    <main style={{ font: '14px system-ui, sans-serif', padding: '48px', color: '#3f3f46' }}>
      Opening Sawa…{' '}
      <a href={LANDING} style={{ color: '#de0090' }}>
        sawa.html
      </a>
    </main>
  )
}
