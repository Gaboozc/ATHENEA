import './EmptyState.css';

/**
 * Reusable empty-state block with optional CTA button.
 * Props: icon, title, message, ctaLabel, onCta
 */
const EmptyState = ({ icon = '📭', title, message, ctaLabel, onCta }) => (
  <div className="empty-state">
    <span className="empty-state__icon">{icon}</span>
    {title && <p className="empty-state__title">{title}</p>}
    {message && <p className="empty-state__msg">{message}</p>}
    {ctaLabel && onCta && (
      <button className="empty-state__cta" onClick={onCta}>
        {ctaLabel}
      </button>
    )}
  </div>
);

export default EmptyState;
