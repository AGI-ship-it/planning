import { useEffect } from 'react'

// The prototype is preview.html — a single self-contained file, not this React
// scaffold. The scaffold was never finished: main.tsx has always imported
// ./App, and ./App has never existed, so the dev server's root URL answered
// with Vite's "Failed to resolve import" overlay rather than the app.
//
// Rather than leave / broken or overwrite index.html, this sends it to the file
// that actually runs. If the React build is ever picked up again, replace this
// with the real root component and the redirect goes with it.
const PROTOTYPE = 'preview.html'

export default function App() {
  useEffect(() => {
    window.location.replace(PROTOTYPE)
  }, [])

  return (
    <main style={{ font: '14px system-ui, sans-serif', padding: '48px', color: '#3f3f46' }}>
      Opening the planner…{' '}
      <a href={PROTOTYPE} style={{ color: '#de0090' }}>
        preview.html
      </a>
    </main>
  )
}
