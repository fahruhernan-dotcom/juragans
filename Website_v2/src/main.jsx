import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { GlobalErrorDialog } from './components/GlobalErrorCatcher'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <GlobalErrorDialog />
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
