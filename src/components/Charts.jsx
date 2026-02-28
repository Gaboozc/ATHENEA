import React, { useMemo } from 'react';
import './Charts.css';

/**
 * Simple Chart Components for Data Visualization
 * Lightweight, no external dependencies
 */

// Bar Chart Component
export const BarChart = ({ data, title, height = 200 }) => {
  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <div className="chart-container">
      {title && <h3 className="chart-title">{title}</h3>}
      <div className="bar-chart" style={{ height: `${height}px` }}>
        {data.map((item, index) => (
          <div key={index} className="bar-item">
            <div 
              className="bar"
              style={{ 
                height: `${(item.value / maxValue) * 100}%`,
                background: item.color || '#4a90e2'
              }}
              title={`${item.label}: ${item.value}`}
            >
              <span className="bar-value">{item.value}</span>
            </div>
            <span className="bar-label">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Pie Chart Component (Donut style)
export const PieChart = ({ data, title, size = 200 }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = 0;

  const slices = data.map((item, index) => {
    const percentage = (item.value / total) * 100;
    const angle = (item.value / total) * 360;
    const slice = {
      ...item,
      percentage: percentage.toFixed(1),
      startAngle: currentAngle,
      endAngle: currentAngle + angle,
    };
    currentAngle += angle;
    return slice;
  });

  return (
    <div className="chart-container">
      {title && <h3 className="chart-title">{title}</h3>}
      <div className="pie-chart-wrapper">
        <div className="pie-chart" style={{ width: size, height: size }}>
          <svg viewBox="0 0 100 100" className="pie-svg">
            {slices.map((slice, index) => {
              const x1 = 50 + 40 * Math.cos((slice.startAngle - 90) * Math.PI / 180);
              const y1 = 50 + 40 * Math.sin((slice.startAngle - 90) * Math.PI / 180);
              const x2 = 50 + 40 * Math.cos((slice.endAngle - 90) * Math.PI / 180);
              const y2 = 50 + 40 * Math.sin((slice.endAngle - 90) * Math.PI / 180);
              const largeArc = slice.endAngle - slice.startAngle > 180 ? 1 : 0;

              return (
                <path
                  key={index}
                  d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
                  fill={slice.color || `hsl(${index * 360 / data.length}, 70%, 60%)`}
                  className="pie-slice"
                  title={`${slice.label}: ${slice.percentage}%`}
                />
              );
            })}
            <circle cx="50" cy="50" r="25" fill="white" />
          </svg>
          <div className="pie-center">
            <span className="pie-total">{total}</span>
            <span className="pie-label">Total</span>
          </div>
        </div>
        <div className="pie-legend">
          {slices.map((slice, index) => (
            <div key={index} className="legend-item">
              <span 
                className="legend-color" 
                style={{ background: slice.color || `hsl(${index * 360 / data.length}, 70%, 60%)` }}
              ></span>
              <span className="legend-label">{slice.label}</span>
              <span className="legend-value">{slice.percentage}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Line Chart Component
export const LineChart = ({ data, title, height = 200 }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;

  const points = data.map((item, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - (((item.value - minValue) / range) * 100);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="chart-container">
      {title && <h3 className="chart-title">{title}</h3>}
      <div className="line-chart" style={{ height: `${height}px` }}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="line-svg">
          <polyline
            points={points}
            fill="none"
            stroke="#4a90e2"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
          {data.map((item, index) => {
            const x = (index / (data.length - 1)) * 100;
            const y = 100 - (((item.value - minValue) / range) * 100);
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="3"
                fill="#4a90e2"
                className="line-point"
                vectorEffect="non-scaling-stroke"
              >
                <title>{`${item.label}: ${item.value}`}</title>
              </circle>
            );
          })}
        </svg>
        <div className="line-labels">
          {data.map((item, index) => (
            <span key={index} className="line-label">{item.label}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

// Progress Ring Component
export const ProgressRing = ({ value, max, label, size = 120, color = '#4a90e2' }) => {
  const percentage = (value / max) * 100;
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="progress-ring-container" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="progress-ring-svg">
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="8"
        />
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          className="progress-ring-circle"
        />
      </svg>
      <div className="progress-ring-content">
        <span className="progress-value">{value}</span>
        <span className="progress-max">/ {max}</span>
        {label && <span className="progress-label">{label}</span>}
      </div>
    </div>
  );
};

// Stats Card with Trend
export const StatCard = ({ value, label, trend, icon, color = '#4a90e2' }) => {
  const trendIcon = trend > 0 ? '↑' : trend < 0 ? '↓' : '→';
  const trendColor = trend > 0 ? '#22c55e' : trend < 0 ? '#ef4444' : '#6b7280';

  return (
    <div className="stat-card-custom" style={{ borderLeft: `4px solid ${color}` }}>
      {icon && <div className="stat-icon" style={{ color }}>{icon}</div>}
      <div className="stat-content">
        <div className="stat-value-large">{value}</div>
        <div className="stat-label-text">{label}</div>
        {trend !== undefined && (
          <div className="stat-trend" style={{ color: trendColor }}>
            <span className="trend-icon">{trendIcon}</span>
            <span className="trend-value">{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
    </div>
  );
};
