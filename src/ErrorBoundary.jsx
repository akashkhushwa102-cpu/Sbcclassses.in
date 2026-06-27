import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
    
    // Send error to logging service in production
    if (import.meta.env.VITE_ENABLE_ERROR_REPORTING === 'true') {
      this.logErrorToService(error, errorInfo);
    }
  }

  logErrorToService = (error, errorInfo) => {
    // You can integrate with services like Sentry, LogRocket, etc.
    console.log('Logging error to service:', {
      message: error.toString(),
      stack: errorInfo.componentStack,
      timestamp: new Date().toISOString()
    });
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          backgroundColor: '#08090F',
          color: '#F0F0FA',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: '20px'
        }}>
          <h1 style={{ fontSize: '32px', marginBottom: '20px' }}>⚠️ Something went wrong</h1>
          <p style={{ fontSize: '16px', marginBottom: '20px', maxWidth: '500px', textAlign: 'center' }}>
            We encountered an unexpected error. Please try refreshing the page or contact support.
          </p>
          {import.meta.env.DEV && this.state.error && (
            <details style={{ 
              marginTop: '20px', 
              maxWidth: '600px', 
              padding: '10px', 
              backgroundColor: '#111220',
              borderRadius: '8px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontSize: '12px',
              color: '#FF6B00'
            }}>
              <summary style={{ cursor: 'pointer', marginBottom: '10px' }}>Error details (Dev only)</summary>
              <p>{this.state.error.toString()}</p>
              <p>{this.state.errorInfo?.componentStack}</p>
            </details>
          )}
          <button
            onClick={this.handleReset}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              backgroundColor: '#FF6B00',
              color: '#FFF',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
