/**
 * Loader — Animated loading spinner.
 */
import './Loader.css';

export default function Loader({ size = 'md', text = '', className = '' }) {
  return (
    <div className={`loader-container ${className}`}>
      <div className={`loader loader-${size}`}>
        <div className="loader-ring" />
        <div className="loader-ring" />
        <div className="loader-ring" />
      </div>
      {text && <p className="loader-text">{text}</p>}
    </div>
  );
}

export function PageLoader({ text = 'Loading...' }) {
  return (
    <div className="page-loader">
      <Loader size="lg" text={text} />
    </div>
  );
}
