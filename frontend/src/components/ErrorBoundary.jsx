import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import PillButton from './PillButton';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minHeight: '400px', width: '100%', padding: '2rem', textAlign: 'center', backgroundColor: 'var(--bg-app)'
        }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(244, 63, 94, 0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-danger)',
            marginBottom: '1.5rem'
          }}>
            <AlertCircle size={32} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            Something went wrong
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', maxWidth: '400px' }}>
            We encountered an unexpected error while loading this component.
          </p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <PillButton onClick={this.handleReset} icon={RefreshCw}>
              Try Again
            </PillButton>
            <PillButton variant="muted" icon={Home} onClick={() => window.location.href = '/'}>
              Return Home
            </PillButton>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
