import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { Toaster } from 'react-hot-toast';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Toaster
      toastOptions={{
        style: { color: '#713200', fontSize: 12, width: 256 },
        position: 'bottom-right'
      }}
    />
  </StrictMode>,
)
