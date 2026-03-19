import { Component } from 'react';
import './ErrorBoundary.css';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[Athenea] ErrorBoundary caught:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="eb-fallback">
          <div className="eb-fallback__card">
            <span className="eb-fallback__icon">⚠️</span>
            <h2 className="eb-fallback__title">Algo salió mal</h2>
            <p className="eb-fallback__msg">
              {this.props.message || 'Esta sección tuvo un error inesperado.'}
            </p>
            {this.state.error?.message && (
              <code className="eb-fallback__detail">{this.state.error.message}</code>
            )}
            <div className="eb-fallback__actions">
              <button className="eb-fallback__btn primary" onClick={this.handleReset}>
                Reintentar
              </button>
              <button
                className="eb-fallback__btn secondary"
                onClick={() => { window.location.href = '/dashboard'; }}
              >
                Ir al Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
