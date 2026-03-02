import React, { useRef, useState, useEffect } from 'react';

// 3x3 pattern lock grid
const points = [
  [0, 0], [1, 0], [2, 0],
  [0, 1], [1, 1], [2, 1],
  [0, 2], [1, 2], [2, 2],
];

const getCircleCenter = (idx, size, padding) => {
  const col = idx % 3;
  const row = Math.floor(idx / 3);
  const gap = (size - 2 * padding) / 2;
  return [padding + col * gap, padding + row * gap];
};

export default function PatternLock({ value, onChange, size = 180, disabled = false }) {
  const [active, setActive] = useState(false);
  const [pattern, setPattern] = useState(value || []);
  const svgRef = useRef();

  // Sincroniza el patrón interno si cambia la prop value (pero solo si es diferente)
  useEffect(() => {
    if (Array.isArray(value) && value.join(',') !== pattern.join(',')) {
      setPattern(value);
    }
    // eslint-disable-next-line
  }, [value]);

  const handlePointerDown = (e) => {
    if (disabled) return;
    setActive(true);
    setPattern([]);
    if (onChange) onChange([]);
  };

  const handlePointerUp = (e) => {
    setActive(false);
    if (onChange) onChange(pattern);
  };

  const handlePointerMove = (e) => {
    if (!active || disabled) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    points.forEach((_, idx) => {
      const [cx, cy] = getCircleCenter(idx, size, 28);
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      if (dist < 24 && !pattern.includes(idx)) {
            setPattern((prev) => [...prev, idx]);
      }
    });
  };

  const handleClear = () => {
    setPattern([]);
    if (onChange) onChange([]);
  };

  return (
    <div className="flex flex-col items-center">
      <svg
        ref={svgRef}
        width={size}
        height={size}
        className={`bg-blue-50 rounded-xl select-none touch-none ${disabled ? 'opacity-60' : ''}`}
        style={{ touchAction: 'none' }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerMove={handlePointerMove}
        onTouchStart={handlePointerDown}
        onTouchEnd={handlePointerUp}
        onTouchMove={handlePointerMove}
      >
        {/* Draw lines */}
        {pattern.length > 1 && pattern.map((idx, i) => {
          if (i === 0) return null;
          const [x1, y1] = getCircleCenter(pattern[i - 1], size, 28);
          const [x2, y2] = getCircleCenter(pattern[i], size, 28);
          return (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#1976F3" strokeWidth="4" strokeLinecap="round" />
          );
        })}
        {/* Draw circles */}
        {points.map(([col, row], idx) => {
          const [cx, cy] = getCircleCenter(idx, size, 28);
          const isActive = pattern.includes(idx);
          return (
            <circle
              key={idx}
              cx={cx}
              cy={cy}
              r={18}
              fill={isActive ? '#1976F3' : '#fff'}
              stroke="#1976F3"
              strokeWidth={isActive ? 4 : 2}
              style={{ transition: 'fill 0.2s, stroke-width 0.2s' }}
            />
          );
        })}
      </svg>
      <button
        type="button"
        className="mt-2 px-3 py-1 rounded-lg border border-primary-200 text-primary-600 font-semibold flex items-center gap-1 hover:bg-primary-50 transition"
        onClick={handleClear}
        disabled={disabled}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        Limpiar
      </button>
    </div>
  );
}
