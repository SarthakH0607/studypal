/**
 * Card — Glassmorphism card component.
 */
import './Card.css';

export default function Card({
  children,
  variant = 'default',
  padding = 'md',
  hover = false,
  glow = false,
  className = '',
  ...props
}) {
  return (
    <div
      className={`card card-${variant} card-pad-${padding} ${hover ? 'card-hover' : ''} ${glow ? 'card-glow' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return <div className={`card-header ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = '' }) {
  return <h3 className={`card-title ${className}`}>{children}</h3>;
}

export function CardContent({ children, className = '' }) {
  return <div className={`card-content ${className}`}>{children}</div>;
}
