import React from 'react';

interface CompassRoseWatermarkProps {
  size?: number | string;
  opacity?: number;
  speedSeconds?: number;
  primaryColor?: string;
  secondaryColor?: string;
  goldColor?: string;
  style?: React.CSSProperties;
}

export const CompassRoseWatermark: React.FC<CompassRoseWatermarkProps> = ({
  size = 460,
  opacity = 0.12,
  speedSeconds = 50,
  primaryColor = '#3E2415',   // Antique dark ink
  secondaryColor = '#8A5D2E', // Weathered walnut / copper
  goldColor = '#C59A45',      // Warm pirate gold
  style,
}) => {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: typeof size === 'number' ? `${size}px` : size,
        height: typeof size === 'number' ? `${size}px` : size,
        opacity,
        pointerEvents: 'none',
        userSelect: 'none',
        zIndex: 0,
        ...style,
      }}
    >
      <svg
        viewBox="0 0 400 400"
        className="animate-compass-spin"
        style={{
          width: '100%',
          height: '100%',
          animationDuration: `${speedSeconds}s`,
        }}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer double rings */}
        <circle cx="200" cy="200" r="186" stroke={primaryColor} strokeWidth="2.5" />
        <circle cx="200" cy="200" r="172" stroke={primaryColor} strokeWidth="1.5" strokeDasharray="4 4" />
        <circle cx="200" cy="200" r="120" stroke={secondaryColor} strokeWidth="1.5" />
        <circle cx="200" cy="200" r="52" stroke={secondaryColor} strokeWidth="1" strokeDasharray="3 3" />

        {/* Degree tick marks (every 30°) */}
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
          <line
            key={deg}
            x1="200"
            y1="16"
            x2="200"
            y2="28"
            stroke={primaryColor}
            strokeWidth="2"
            transform={`rotate(${deg} 200 200)`}
          />
        ))}

        {/* North point (Dark & Gold) */}
        <polygon points="200,16 210,185 200,200" fill={goldColor} />
        <polygon points="200,16 190,185 200,200" fill={primaryColor} />

        {/* South point */}
        <polygon points="200,384 190,215 200,200" fill={goldColor} />
        <polygon points="200,384 210,215 200,200" fill={primaryColor} />

        {/* East point */}
        <polygon points="384,200 215,210 200,200" fill={goldColor} />
        <polygon points="384,200 215,190 200,200" fill={primaryColor} />

        {/* West point */}
        <polygon points="16,200 185,190 200,200" fill={goldColor} />
        <polygon points="16,200 185,210 200,200" fill={primaryColor} />

        {/* Diagonal NE */}
        <polygon points="330,70 210,188 200,200" fill={secondaryColor} />
        <polygon points="330,70 198,192 200,200" fill="#D8BE8E" />

        {/* Diagonal NW */}
        <polygon points="70,70 190,198 200,200" fill={secondaryColor} />
        <polygon points="70,70 192,210 200,200" fill="#D8BE8E" />

        {/* Diagonal SE */}
        <polygon points="330,330 198,208 200,200" fill={secondaryColor} />
        <polygon points="330,330 210,202 200,200" fill="#D8BE8E" />

        {/* Diagonal SW */}
        <polygon points="70,330 202,210 200,200" fill={secondaryColor} />
        <polygon points="70,330 190,202 200,200" fill="#D8BE8E" />

        {/* Center Hub */}
        <circle cx="200" cy="200" r="14" fill={primaryColor} />
        <circle cx="200" cy="200" r="6" fill={goldColor} />
      </svg>
    </div>
  );
};
