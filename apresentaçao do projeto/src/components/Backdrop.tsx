import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { COLORS, FONTS } from '../theme';

interface BackdropProps {
  accentShift?: number;
  hudTag?: string;
}

export const Backdrop: React.FC<BackdropProps> = ({
  accentShift = 0,
  hudTag = 'WINDEPLOY // AUTOMATION ENGINE',
}) => {
  const frame = useCurrentFrame();

  const gridOffset = (frame * 0.35) % 64;
  const glow1X = 18 + Math.sin((frame + accentShift * 40) * 0.015) * 6;
  const glow1Y = 16 + Math.cos((frame + accentShift * 30) * 0.012) * 5;
  const glow2X = 82 + Math.cos((frame + accentShift * 25) * 0.014) * 5;
  const glow2Y = 82 + Math.sin((frame + accentShift * 35) * 0.016) * 5;

  const scanY = interpolate(frame % 240, [0, 240], [-10, 110]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg,
        overflow: 'hidden',
        fontFamily: FONTS.sans,
      }}
    >
      {/* Subtle radial glow - Electric Cyan */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(920px circle at ${glow1X}% ${glow1Y}%, rgba(56, 189, 248, 0.14), transparent 65%),
                       radial-gradient(840px circle at ${glow2X}% ${glow2Y}%, rgba(16, 185, 129, 0.09), transparent 65%)`,
        }}
      />

      {/* Precision technical dot/line grid */}
      <div
        style={{
          position: 'absolute',
          inset: -64,
          backgroundImage: `
            linear-gradient(to right, rgba(56, 189, 248, 0.045) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(56, 189, 248, 0.045) 1px, transparent 1px)
          `,
          backgroundSize: '64px 64px',
          transform: `translate3d(0, ${gridOffset}px, 0)`,
          maskImage:
            'radial-gradient(ellipse 85% 85% at 50% 50%, black 45%, transparent 100%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 85% 85% at 50% 50%, black 45%, transparent 100%)',
        }}
      />

      {/* Faint horizontal sweep line */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: `${scanY}%`,
          height: 2,
          background:
            'linear-gradient(90deg, transparent 0%, rgba(56, 189, 248, 0.16) 50%, transparent 100%)',
          opacity: 0.65,
        }}
      />

      {/* Subtle corner HUD markers */}
      <div
        style={{
          position: 'absolute',
          top: 32,
          right: 48,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontFamily: FONTS.mono,
          fontSize: 13,
          letterSpacing: '0.12em',
          color: COLORS.textMuted,
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: COLORS.emerald,
            boxShadow: `0 0 10px ${COLORS.emerald}`,
          }}
        />
        <span>{hudTag}</span>
      </div>

      {/* Subtle vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 50% 50%, transparent 55%, rgba(5, 8, 15, 0.55) 100%)',
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  );
};
