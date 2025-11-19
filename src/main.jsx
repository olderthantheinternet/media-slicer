import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Error handling for app initialization
try {
  const rootElement = document.getElementById('root')
  if (!rootElement) {
    throw new Error('Root element not found')
  }

  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
} catch (error) {
  console.error('Failed to initialize app:', error)
  // Fallback: render error message
  const rootElement = document.getElementById('root')
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 20px; font-family: sans-serif;">
        <h1>Error Loading Application</h1>
        <p>${error.message}</p>
        <p>Please check the browser console for more details.</p>
      </div>
    `
  }
}

