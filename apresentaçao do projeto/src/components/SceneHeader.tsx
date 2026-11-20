import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS, FONTS, SPRING_SMOOTH } from '../theme';

interface SceneHeaderProps {
  badge: string;
  title: string;
  highlight?: string;
  subtitle?: string;
  delay?: number;
}

export const SceneHeader: React.FC<SceneHeaderProps> = ({
  badge,
  title,
  highlight,
  subtitle,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const badgeProgress = spring({
    frame: frame - delay,
    fps,
    config: SPRING_SMOOTH,
  });

  const titleProgress = spring({
    frame: frame - delay - 5,
    fps,
    config: SPRING_SMOOTH,
  });

  const subProgress = spring({
    frame: frame - delay - 11,
    fps,
    config: SPRING_SMOOTH,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 10,
          alignSelf: 'flex-start',
          padding: '6px 14px',
          borderRadius: 999,
          backgroundColor: 'rgba(56, 189, 248, 0.1)',
          border: `1px solid ${COLORS.borderCyan}`,
          opacity: badgeProgress,
          transform: `translateY(${interpolate(badgeProgress, [0, 1], [14, 0])}px)`,
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            backgroundColor: COLORS.cyan,
            boxShadow: `0 0 10px ${COLORS.cyan}`,
          }}
        />
        <span
          style={{
            fontFamily: FONTS.mono,
            fontSize: 15,
            fontWeight: 600,
            letterSpacing: '0.12em',
            color: COLORS.cyanBright,
          }}
        >
          {badge}
        </span>
      </div>

      <h1
        style={{
          margin: 0,
          fontSize: 52,
          fontWeight: 800,
          lineHeight: 1.12,
          letterSpacing: '-0.025em',
          color: COLORS.textPrimary,
          opacity: titleProgress,
          transform: `translateY(${interpolate(titleProgress, [0, 1], [22, 0])}px)`,
        }}
      >
        {title}{' '}
        {highlight && (
          <span
            style={{
              background: `linear-gradient(90deg, ${COLORS.cyan}, ${COLORS.emeraldBright})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {highlight}
          </span>
        )}
      </h1>

      {subtitle && (
        <p
          style={{
            margin: 0,
            fontSize: 22,
            fontWeight: 400,
            color: COLORS.textSecondary,
            opacity: subProgress,
            transform: `translateY(${interpolate(subProgress, [0, 1], [16, 0])}px)`,
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
};
