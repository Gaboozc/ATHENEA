import './Skeleton.css';

/**
 * Skeleton — componente reutilizable de carga
 * FIX UI-10
 *
 * Variantes:
 *   line   → línea de texto
 *   card   → bloque card
 *   avatar → círculo
 *   stat   → número grande + label simulado
 *
 * @param {object} props
 * @param {'line'|'card'|'avatar'|'stat'} [props.type='line']
 * @param {string} [props.width]
 * @param {string} [props.height]
 * @param {string} [props.size]   — diámetro para avatar
 * @param {string} [props.className]
 */
export const Skeleton = ({ type = 'line', width, height, size, className = '' }) => {
  if (type === 'avatar') {
    const dim = size || '40px';
    return (
      <div
        className={`skeleton skeleton--avatar ${className}`}
        style={{ width: dim, height: dim }}
        aria-hidden="true"
      />
    );
  }

  if (type === 'stat') {
    return (
      <div className={`skeleton-stat ${className}`} aria-hidden="true">
        <div className="skeleton skeleton--number" />
        <div className="skeleton skeleton--label" />
      </div>
    );
  }

  if (type === 'card') {
    return (
      <div
        className={`skeleton skeleton--card ${className}`}
        style={{ height: height || '120px', width: width || '100%' }}
        aria-hidden="true"
      />
    );
  }

  // default: line
  return (
    <div
      className={`skeleton skeleton--line ${className}`}
      style={{ width: width || '100%' }}
      aria-hidden="true"
    />
  );
};

export default Skeleton;
