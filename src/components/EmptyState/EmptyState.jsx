import './EmptyState.css';

/**
 * Reusable empty-state block with optional CTA action.
 * Backward compatible props:
 * - Legacy: message, ctaLabel, onCta
 * - New: description, action: { label, onClick, icon }
 */
const EmptyState = ({
  icon = '📭',
  title,
  message,
  description,
  action,
  ctaLabel,
  onCta,
}) => {
  const resolvedDescription = description ?? message;
  const resolvedAction = action ?? (ctaLabel && onCta
    ? { label: ctaLabel, onClick: onCta }
    : null);

  return (
    <div className="empty-state">
      <span className="empty-state__icon">{icon}</span>
      {title && <p className="empty-state__title">{title}</p>}
      {resolvedDescription && <p className="empty-state__msg">{resolvedDescription}</p>}
      {resolvedAction?.label && typeof resolvedAction?.onClick === 'function' && (
        <button className="empty-state__cta" onClick={resolvedAction.onClick}>
          {resolvedAction.icon ? <span aria-hidden="true">{resolvedAction.icon}</span> : null}
          <span>{resolvedAction.label}</span>
        </button>
      )}
    </div>
  );
};

export default EmptyState;
