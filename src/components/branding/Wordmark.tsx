import React from 'react';

interface WordmarkProps {
  tone?: 'dark' | 'light';
  width?: number;
  underline?: boolean;
  className?: string;
}

export function Wordmark({
  tone = 'dark',
  width = 112,
  underline = true,
  className = '',
}: WordmarkProps) {
  const color = tone === 'light' ? '#E0E7E4' : '#055A43';
  const lineColor = tone === 'light' ? 'rgba(224,231,228,0.38)' : 'rgba(11,106,81,0.75)';
  const fontSize = Math.max(24, Math.round(width * 0.32));

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        lineHeight: 1,
      }}
      aria-label="FOCAO"
    >
      <span
        style={{
          fontFamily: 'var(--font-serif, serif)',
          color,
          fontSize: `${fontSize}px`,
          fontWeight: 400,
          letterSpacing: '0.22em',
          paddingLeft: '0.22em',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}
      >
        FOCAO
      </span>
      {underline && (
        <span
          style={{
            marginTop: '8px',
            height: '1px',
            width: `${Math.round(width * 0.78)}px`,
            background: `linear-gradient(to right, transparent, ${lineColor}, transparent)`,
            display: 'block',
          }}
        />
      )}
    </div>
  );
}
