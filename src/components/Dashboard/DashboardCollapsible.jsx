import { useState } from 'react';

export const DashboardCollapsible = ({
  title,
  subtitle,
  badge,
  children,
  defaultOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(Boolean(defaultOpen));

  return (
    <section className="db-collapsible" aria-label={title}>
      <button
        type="button"
        className="db-collapsible-header"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
      >
        <div className="db-collapsible-title-wrap">
          <h3>{title}</h3>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        <div className="db-collapsible-meta">
          {badge ? <span className="db-collapsible-badge">{badge}</span> : null}
          <span className={`db-collapsible-arrow ${isOpen ? 'is-open' : ''}`}>▾</span>
        </div>
      </button>

      {isOpen ? <div className="db-collapsible-body">{children}</div> : null}
    </section>
  );
};
