import './Badge.css';

type BadgeColor = 'cyan' | 'gold' | 'red' | 'green' | 'amber' | 'gray' | 'orange';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  color?: BadgeColor;
}

export function Badge({ color = 'cyan', className = '', children, ...props }: BadgeProps) {
  return (
    <span className={`ui-badge ui-badge--${color} ${className}`.trim()} {...props}>
      {children}
    </span>
  );
}
