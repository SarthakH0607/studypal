/**
 * Badge — Small status indicator.
 */
import './Badge.css';

export default function Badge({ children, variant = 'default', size = 'sm', icon: Icon, className = '' }) {
  return (
    <span className={`badge badge-${variant} badge-${size} ${className}`}>
      {Icon && <Icon size={12} />}
      {children}
    </span>
  );
}
