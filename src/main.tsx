import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/inter'
import '@fontsource-variable/rubik'
import './index.css'
import App from './App.tsx'
import { trackAppHeight } from './lib/appHeight.ts'

// Before the first render: the stylesheet's fallback is deliberately the safe,
// slightly-short guess, and this replaces it with the measured height.
trackAppHeight()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
