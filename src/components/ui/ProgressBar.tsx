import './ProgressBar.css';

type ProgressColor = 'cyan' | 'gold' | 'red';
type ProgressSize = 'thin' | 'md' | 'tall';

interface ProgressBarProps {
  value: number;       // 0–100
  color?: ProgressColor;
  size?: ProgressSize;
  className?: string;
}

export function ProgressBar({ value, color = 'cyan', size = 'md', className = '' }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, value));
  const sizeClass = size !== 'md' ? ` ui-progress--${size}` : '';
  const colorClass = color !== 'cyan' ? ` ui-progress--${color}` : '';
  return (
    <div className={`ui-progress${sizeClass}${colorClass} ${className}`.trim()}>
      <div className="ui-progress__fill" style={{ width: `${pct}%` }} />
    </div>
  );
}
