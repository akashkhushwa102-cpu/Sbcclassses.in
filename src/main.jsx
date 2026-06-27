import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './ErrorBoundary.jsx'

// Suppress third-party performance monitoring errors
window.addEventListener('error', (event) => {
  if (event.message?.includes('clearMarks') || event.message?.includes('mgt') || event.message?.includes('TypeError')) {
    event.preventDefault();
    return false;
  }
});

// Suppress unhandled promise rejections from third-party scripts
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.message?.includes('mgt') || event.reason?.message?.includes('clearMarks')) {
    event.preventDefault();
  }
});

// Create a safe version of common functions that might be called by extensions
if (!window.mgt) {
  window.mgt = {
    clearMarks: () => {},
    mark: () => {},
    measure: () => {}
  };
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
)
