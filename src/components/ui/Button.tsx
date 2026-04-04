import './Button.css';

type ButtonVariant = 'primary' | 'secondary' | 'gold' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({
  variant = 'secondary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const sizeClass = size !== 'md' ? ` ui-btn--${size}` : '';
  return (
    <button
      type="button"
      className={`ui-btn ui-btn--${variant}${sizeClass} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
