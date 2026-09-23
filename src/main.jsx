import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import { CurrencyProvider } from '@/lib/CurrencyContext'
import '@/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <CurrencyProvider>
    <App />
  </CurrencyProvider>
)
