import './Card.css';

type CardVariant = 'default' | 'elevated' | 'inset';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  title?: string;
}

export function Card({
  variant = 'default',
  title,
  className = '',
  children,
  ...props
}: CardProps) {
  const variantClass = variant !== 'default' ? ` ui-card--${variant}` : '';
  return (
    <div className={`ui-card${variantClass} ${className}`.trim()} {...props}>
      {title && <h2 className="ui-card__title">{title}</h2>}
      {children}
    </div>
  );
}
