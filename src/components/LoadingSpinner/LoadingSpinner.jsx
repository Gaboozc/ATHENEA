import './LoadingSpinner.css';

const SIZE_MAP = {
  sm: 14,
  md: 20,
  lg: 28,
};

const LoadingSpinner = ({ size = 'md', className = '', label = 'Loading' }) => {
  const px = SIZE_MAP[size] || SIZE_MAP.md;
  return (
    <span
      className={`loading-spinner ${className}`.trim()}
      style={{ width: px, height: px }}
      role="status"
      aria-label={label}
    />
  );
};

export default LoadingSpinner;
