import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { AuthProvider } from './AuthContext';
import { ThemeProvider } from './themeContext';

// CSS imports
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by boundary:', error, errorInfo);
    }
    
    // In production, you might want to send this to an error reporting service
    // Example: Sentry, LogRocket, etc.
    // reportError(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-container" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '20px',
          textAlign: 'center',
          backgroundColor: '#f8f9fa'
        }}>
          <div className="error-content" style={{
            maxWidth: '600px',
            padding: '40px',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <i className="fas fa-exclamation-triangle" style={{
              fontSize: '48px',
              color: '#dc3545',
              marginBottom: '20px'
            }}></i>
            <h2 style={{ color: '#dc3545', marginBottom: '16px' }}>
              Oops! Something went wrong
            </h2>
            <p style={{ color: '#6c757d', marginBottom: '24px' }}>
              We're sorry, but something unexpected happened. Please try refreshing the page.
            </p>
            
            <div style={{ marginBottom: '24px' }}>
              <button 
                onClick={() => window.location.reload()}
                className="btn btn-primary me-3"
                style={{ marginRight: '12px' }}
              >
                <i className="fas fa-redo me-2"></i>
                Refresh Page
              </button>
              <button 
                onClick={() => window.history.back()}
                className="btn btn-secondary"
              >
                <i className="fas fa-arrow-left me-2"></i>
                Go Back
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={{ 
                textAlign: 'left', 
                backgroundColor: '#f8f9fa', 
                padding: '16px', 
                borderRadius: '4px',
                marginTop: '20px'
              }}>
                <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '8px' }}>
                  Error Details (Development Only)
                </summary>
                <pre style={{ 
                  fontSize: '12px', 
                  overflow: 'auto',
                  whiteSpace: 'pre-wrap',
                  color: '#dc3545'
                }}>
                  {this.state.error.toString()}
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Loading Component for better UX during initial load
const LoadingScreen = () => (
  <div className="loading-screen" style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#000',
    color: '#fff'
  }}>
    <div className="loading-spinner" style={{
      width: '50px',
      height: '50px',
      border: '3px solid #333',
      borderTop: '3px solid #fff',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      marginBottom: '20px'
    }}></div>
    <h3>Loading FlixXit...</h3>
    <p style={{ color: '#ccc', marginTop: '10px' }}>
      Please wait while we load your content
    </p>
  </div>
);

// Add CSS for loading animation
const loadingStyles = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .loading-screen {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  
  .error-boundary-container {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
`;

// Inject loading styles
const styleSheet = document.createElement('style');
styleSheet.type = 'text/css';
styleSheet.innerText = loadingStyles;
document.head.appendChild(styleSheet);

// Service Worker registration for PWA capabilities (optional)
const registerServiceWorker = () => {
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    });
  }
};

// Performance monitoring setup
const setupPerformanceMonitoring = () => {
  // Send performance metrics to analytics
  reportWebVitals((metric) => {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Performance metric:', metric);
    }
    
    // In production, send to analytics service
    // Example: Google Analytics, Mixpanel, etc.
    // analytics.track('Web Vital', metric);
  });
};

// Main App Wrapper with all providers
const AppWithProviders = () => (
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <React.Suspense fallback={<LoadingScreen />}>
              <App />
            </React.Suspense>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);

// Initialize app
const initializeApp = () => {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  
  // Check if root element exists
  if (!root) {
    console.error('Root element not found. Make sure you have a div with id="root" in your HTML.');
    return;
  }
  
  // Render the app
  root.render(<AppWithProviders />);
  
  // Setup additional features
  setupPerformanceMonitoring();
  registerServiceWorker();
  
  // Log app initialization in development
  if (process.env.NODE_ENV === 'development') {
    console.log('🎬 FlixXit App initialized successfully!');
    console.log('Environment:', process.env.NODE_ENV);
    console.log('React version:', React.version);
  }
};

// Handle any uncaught errors
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
  // In production, you might want to send this to an error reporting service
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  // In production, you might want to send this to an error reporting service
});

// Initialize the app
initializeApp();