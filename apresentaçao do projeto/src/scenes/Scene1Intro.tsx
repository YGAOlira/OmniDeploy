import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { Cpu, Layers, Zap } from 'lucide-react';
import { Backdrop } from '../components/Backdrop';
import { COLORS, FONTS, SPRING_SMOOTH, SPRING_SNAPPY } from '../theme';

const METRICS = [
  {
    icon: Cpu,
    label: 'Boot Híbrido',
    value: 'UEFI GPT + Legacy MBR',
    accent: COLORS.cyan,
  },
  {
    icon: Layers,
    label: 'Pipeline Nativo',
    value: '8 Etapas Automatizadas',
    accent: COLORS.indigo,
  },
  {
    icon: Zap,
    label: 'Implantação',
    value: 'Zero Intervenção Manual',
    accent: COLORS.emerald,
  },
];

export const Scene1Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const emblemScale = spring({
    frame: frame - 4,
    fps,
    config: SPRING_SNAPPY,
  });

  const pillIn = spring({
    frame: frame - 10,
    fps,
    config: SPRING_SMOOTH,
  });

  const line1In = spring({
    frame: frame - 16,
    fps,
    config: SPRING_SMOOTH,
  });

  const line2In = spring({
    frame: frame - 24,
    fps,
    config: SPRING_SMOOTH,
  });

  const subIn = spring({
    frame: frame - 36,
    fps,
    config: SPRING_SMOOTH,
  });

  const ringRotation = interpolate(frame, [0, 180], [0, 45]);
  const pulse = 0.85 + Math.sin(frame * 0.1) * 0.15;

  return (
    <AbsoluteFill style={{ fontFamily: FONTS.sans }}>
      <Backdrop accentShift={0} hudTag="SYSTEM INIT // v1.0" />

      {/* Center subtle orbital glow ring */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '44%',
          width: 780,
          height: 780,
          transform: `translate(-50%, -50%) rotate(${ringRotation}deg) scale(${interpolate(emblemScale, [0, 1], [0.75, 1])})`,
          borderRadius: '50%',
          border: '1px solid rgba(56, 189, 248, 0.1)',
          boxShadow: 'inset 0 0 120px rgba(56, 189, 248, 0.05)',
          opacity: emblemScale,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -5,
            left: '50%',
            width: 10,
            height: 10,
            borderRadius: '50%',
            backgroundColor: COLORS.cyan,
            boxShadow: `0 0 22px ${COLORS.cyan}`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -5,
            left: '50%',
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: COLORS.emerald,
            boxShadow: `0 0 18px ${COLORS.emerald}`,
          }}
        />
      </div>

      {/* Main Content Container */}
      <AbsoluteFill
        style={{
          padding: '72px 120px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        }}
      >
        {/* Geometric Windows-inspired Deploy Emblem */}
        <div
          style={{
            width: 86,
            height: 86,
            borderRadius: 22,
            background:
              'linear-gradient(145deg, rgba(56, 189, 248, 0.18), rgba(16, 185, 129, 0.1))',
            border: `1px solid ${COLORS.borderCyan}`,
            boxShadow: `0 0 ${32 * pulse}px rgba(56, 189, 248, 0.28)`,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 6,
            padding: 20,
            marginBottom: 28,
            transform: `scale(${emblemScale})`,
            opacity: emblemScale,
          }}
        >
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                borderRadius: 4,
                background:
                  i === 3
                    ? `linear-gradient(135deg, ${COLORS.emerald}, ${COLORS.emeraldBright})`
                    : `linear-gradient(135deg, ${COLORS.cyan}, ${COLORS.cyanDeep})`,
              }}
            />
          ))}
        </div>

        {/* Status Pill */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px 20px',
            borderRadius: 999,
            backgroundColor: 'rgba(17, 24, 39, 0.88)',
            border: `1px solid ${COLORS.borderCyan}`,
            marginBottom: 28,
            opacity: pillIn,
            transform: `translateY(${interpolate(pillIn, [0, 1], [16, 0])}px)`,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: COLORS.emerald,
              boxShadow: `0 0 12px ${COLORS.emerald}`,
            }}
          />
          <span
            style={{
              fontFamily: FONTS.mono,
              fontSize: 16,
              fontWeight: 600,
              letterSpacing: '0.14em',
              color: COLORS.cyanBright,
            }}
          >
            WINDOWS 11 AUTOMATED DEPLOYMENT ENGINE
          </span>
        </div>

        {/* Hero Headline */}
        <div style={{ overflow: 'hidden', paddingBottom: 6 }}>
          <h1
            style={{
              margin: 0,
              fontSize: 78,
              fontWeight: 800,
              lineHeight: 1.08,
              letterSpacing: '-0.03em',
              color: COLORS.textPrimary,
              opacity: line1In,
              transform: `translateY(${interpolate(line1In, [0, 1], [48, 0])}px)`,
            }}
          >
            Automação de Deploy
          </h1>
        </div>

        <div style={{ overflow: 'hidden', paddingBottom: 12 }}>
          <h1
            style={{
              margin: 0,
              fontSize: 78,
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              background: `linear-gradient(95deg, ${COLORS.cyanBright} 0%, ${COLORS.cyan} 45%, ${COLORS.emeraldBright} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              opacity: line2In,
              transform: `translateY(${interpolate(line2In, [0, 1], [48, 0])}px)`,
            }}
          >
            & Mídia de Instalação Customizada
          </h1>
        </div>

        {/* Subtitle */}
        <p
          style={{
            margin: '18px 0 54px',
            maxWidth: 1020,
            fontSize: 30,
            fontWeight: 400,
            lineHeight: 1.4,
            color: COLORS.textSecondary,
            opacity: subIn,
            transform: `translateY(${interpolate(subIn, [0, 1], [22, 0])}px)`,
          }}
        >
          De horas de configuração manual para um{' '}
          <span style={{ color: COLORS.textPrimary, fontWeight: 600 }}>
            boot 100% automatizado
          </span>{' '}
          com WinPE, DISM, drivers e resposta unattend.
        </p>

        {/* Bottom 3 KPI Cards */}
        <div
          style={{
            display: 'flex',
            gap: 24,
            justifyContent: 'center',
            width: '100%',
            maxWidth: 1220,
          }}
        >
          {METRICS.map((item, idx) => {
            const cardIn = spring({
              frame: frame - 48 - idx * 8,
              fps,
              config: SPRING_SNAPPY,
            });
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 18,
                  padding: '20px 24px',
                  borderRadius: 16,
                  backgroundColor: COLORS.bgCard,
                  border: `1px solid ${COLORS.border}`,
                  boxShadow: '0 14px 40px rgba(0, 0, 0, 0.35)',
                  opacity: cardIn,
                  transform: `translateY(${interpolate(cardIn, [0, 1], [28, 0])}px) scale(${interpolate(cardIn, [0, 1], [0.95, 1])})`,
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    backgroundColor: `${item.accent}1A`,
                    border: `1px solid ${item.accent}55`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={24} color={item.accent} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div
                    style={{
                      fontFamily: FONTS.mono,
                      fontSize: 13,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      color: COLORS.textMuted,
                      marginBottom: 4,
                    }}
                  >
                    {item.label}
                  </div>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      color: COLORS.textPrimary,
                    }}
                  >
                    {item.value}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
