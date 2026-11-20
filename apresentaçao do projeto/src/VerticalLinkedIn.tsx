import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {
  ArrowDown,
  CheckCircle2,
  Cpu,
  Database,
  FileCode2,
  HardDrive,
  Layers,
  MousePointer2,
  ShieldCheck,
  Terminal,
  Usb,
  Wrench,
} from 'lucide-react';
import { Backdrop } from './components/Backdrop';
import { RealAppWindow } from './components/RealAppWindow';
import { COLORS, FONTS, SPRING_SMOOTH, SPRING_SNAPPY } from './theme';

export const VERTICAL_VIDEO = {
  width: 1080,
  height: 1920,
  fps: 60,
  durationInFrames: 1500, // 25.0s @ 60fps
} as const;

interface ActCaption {
  start: number;
  end: number;
  badge: string;
  line1: string;
  line2: string;
  sub: string;
}

const CAPTIONS: ActCaption[] = [
  {
    start: 0,
    end: 192,
    badge: 'WINDOWS 11 • WINPE x64',
    line1: 'Deploy Windows',
    line2: '100% Automatizado',
    sub: 'Conheça a interface real da ferramenta em WinPE.',
  },
  {
    start: 192,
    end: 450,
    badge: 'ETAPA 01 // WMI & DISCO',
    line1: 'Hardware + GPT',
    line2: 'em Um Clique',
    sub: 'Leitura WMI, proteção do USB e particionamento automático.',
  },
  {
    start: 450,
    end: 730,
    badge: 'ETAPAS 02–03 // IMAGEM & OOBE',
    line1: 'Intune, Bypass',
    line2: 'ou Zero-Touch',
    sub: 'Seleção de índice WIM/DISM e perfil de primeiro boot.',
  },
  {
    start: 730,
    end: 990,
    badge: 'ETAPAS 04–05 // DRIVERS & PÓS-BOOT',
    line1: 'Drivers, NTP',
    line2: 'e Ativação Segura',
    sub: 'Detecção automática de hardware + SetupComplete.cmd.',
  },
  {
    start: 990,
    end: 1320,
    badge: 'ETAPA 06 // MOTOR DISM AO VIVO',
    line1: '8 Etapas Sem',
    line2: 'Intervenção Manual',
    sub: 'DiskPart → DISM → WinRE → BCDBoot → Drivers → Unattend.',
  },
];

const OUTRO_STACK = [
  { icon: Terminal, name: 'Windows PE x64', tag: 'BOOT' },
  { icon: Layers, name: 'C# / .NET 8 WPF', tag: 'APP' },
  { icon: Wrench, name: 'DISM & WIM/ESD', tag: 'IMAGING' },
  { icon: FileCode2, name: 'Unattend XML', tag: 'OOBE' },
  { icon: HardDrive, name: 'DiskPart & BCDBoot', tag: 'UEFI / MBR' },
  { icon: Cpu, name: 'WMI & Registry', tag: 'OFFLINE' },
  { icon: Database, name: 'SetupComplete.cmd', tag: 'PÓS-BOOT' },
  { icon: ShieldCheck, name: 'PowerShell USB', tag: 'MEDIA' },
];

const STEP_LABELS = ['Disco', 'Imagem', 'Modo', 'Drivers', 'Pós', 'Console'];

function smoothRange(
  frame: number,
  inStart: number,
  inEnd: number,
  from: number,
  to: number
): number {
  return interpolate(frame, [inStart, inEnd], [from, to], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });
}

export const VerticalLinkedIn: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ---- Determine current wizard step ----
  const step =
    frame < 450
      ? 0
      : frame < 555
        ? 1
        : frame < 730
          ? 2
          : frame < 855
            ? 3
            : frame < 990
              ? 4
              : 5;

  // Live selection change in Step 2 (Mode): switches from 'intune' -> 'zerotouch' at frame 645
  const selectedMode: 'intune' | 'bypass' | 'zerotouch' =
    frame < 645 ? 'intune' : 'zerotouch';

  // Live execution progress in Step 5 (frames 990..1260 -> 0..100%)
  const execProgress = interpolate(frame, [1005, 1255], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.quad),
  });

  const execSeconds = Math.floor(
    interpolate(frame, [1005, 1255], [0, 742], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );

  // ---- Cinematic 60fps Camera Choreography (scale, tx, ty) ----
  // Window entrance spring (frames 12..65)
  const introRise = spring({
    frame: frame - 12,
    fps,
    config: { damping: 26, mass: 0.9, stiffness: 120 },
  });

  // Base establishing: scale=0.76, tx=0, ty=0
  // Act 2A (WMI Hardware sidebar): f192..f232 -> scale=1.22, tx=254, ty=45
  // Act 2B (Disk & GPT map):       f305..f345 -> scale=1.06, tx=-166, ty=-8
  // Act 3..5 (Main wizard panels): stays locked cleanly at scale=1.06, tx=-166
  // Act 6 Outro:                   f1315..f1360 -> scale=0.72, tx=0, ty=120, opacity -> 0.08
  let camScale = 0.76;
  let camTx = 0;
  let camTy = interpolate(introRise, [0, 1], [240, 0]);
  let camOpacity = interpolate(introRise, [0, 1], [0, 1]);

  if (frame >= 192 && frame < 305) {
    camScale = smoothRange(frame, 192, 234, 0.76, 1.18);
    camTx = smoothRange(frame, 192, 234, 0, 240);
    camTy = smoothRange(frame, 192, 234, 0, 6);
  } else if (frame >= 305 && frame < 1315) {
    camScale = smoothRange(frame, 305, 348, 1.18, 1.06);
    camTx = smoothRange(frame, 305, 348, 240, -166);
    camTy = smoothRange(frame, 305, 348, 6, -6);
  } else if (frame >= 1315) {
    camScale = smoothRange(frame, 1315, 1360, 1.06, 0.72);
    camTx = smoothRange(frame, 1315, 1360, -166, 0);
    camTy = smoothRange(frame, 1315, 1360, -6, 140);
    camOpacity = smoothRange(frame, 1315, 1360, 1, 0.06);
  }

  // Subtle floating micro-motion for 60fps polish
  const subtleFloat = Math.sin(frame * 0.035) * 4;

  // Animated pointer in Step 2 (clicking Zero-Touch Bancada at frame 645)
  const showCursor = frame >= 580 && frame <= 715;
  const cursorX = smoothRange(frame, 585, 638, 760, 480);
  const cursorY = smoothRange(frame, 585, 638, 860, 1065);
  const clickPulse =
    frame >= 642 && frame <= 670
      ? interpolate(frame, [642, 670], [0, 1], { extrapolateRight: 'clamp' })
      : 0;
  const cursorScale =
    frame >= 640 && frame <= 654
      ? interpolate(frame, [640, 647, 654], [1, 0.82, 1])
      : 1;

  // Active Top Caption
  const activeCaption = CAPTIONS.find((c) => frame >= c.start && frame < c.end);

  // Outro overlay (frames 1320..1500)
  const isOutro = frame >= 1315;
  const outroIn = spring({
    frame: frame - 1325,
    fps,
    config: SPRING_SMOOTH,
  });

  const globalProgressPct = interpolate(
    frame,
    [0, VERTICAL_VIDEO.durationInFrames - 1],
    [0, 100],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill
      style={{
        fontFamily: FONTS.sans,
        backgroundColor: COLORS.bg,
        overflow: 'hidden',
      }}
    >
      <Backdrop accentShift={step} hudTag="60 FPS • VERTICAL DEMO" />

      {/* ==================== TOP KINETIC CAPTION ZONE ==================== */}
      {activeCaption && (
        <CaptionBlock
          key={activeCaption.badge}
          caption={activeCaption}
          localFrame={frame - activeCaption.start}
          fps={fps}
        />
      )}

      {/* ==================== CENTER REAL APP STAGE ==================== */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 475,
          height: 1080,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            opacity: camOpacity,
            transform: `translate3d(0, ${subtleFloat}px, 0) scale(${camScale}) translate3d(${camTx}px, ${camTy}px, 0)`,
            transformOrigin: 'center center',
            willChange: 'transform',
          }}
        >
          <RealAppWindow
            step={step}
            selectedMode={selectedMode}
            execProgress={execProgress}
            execSeconds={execSeconds}
            highlightButton={
              (frame >= 435 && frame < 450) ||
              (frame >= 542 && frame < 555) ||
              (frame >= 716 && frame < 730) ||
              (frame >= 842 && frame < 855) ||
              (frame >= 976 && frame < 990)
                ? 'proximo'
                : null
            }
          />
        </div>
      </div>

      {/* Animated Cursor for Interactive Click Moment in Step 2 */}
      {showCursor && (
        <div
          style={{
            position: 'absolute',
            left: cursorX,
            top: cursorY,
            zIndex: 40,
            pointerEvents: 'none',
            opacity:
              frame < 595
                ? smoothRange(frame, 580, 595, 0, 1)
                : frame > 700
                  ? smoothRange(frame, 700, 715, 1, 0)
                  : 1,
          }}
        >
          {/* Click ripple */}
          {clickPulse > 0 && (
            <div
              style={{
                position: 'absolute',
                left: -26,
                top: -26,
                width: 56,
                height: 56,
                borderRadius: '50%',
                border: `3px solid ${COLORS.cyan}`,
                transform: `scale(${0.4 + clickPulse * 1.4})`,
                opacity: 1 - clickPulse,
              }}
            />
          )}
          <div
            style={{
              transform: `scale(${cursorScale})`,
              filter: 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.75))',
            }}
          >
            <MousePointer2
              size={44}
              color="#FFFFFF"
              fill="#38BDF8"
              strokeWidth={2}
            />
          </div>
        </div>
      )}

      {/* ==================== BOTTOM WIZARD STEPPER (MOBILE HUD) ==================== */}
      {!isOutro && (
        <div
          style={{
            position: 'absolute',
            left: 48,
            right: 48,
            bottom: 72,
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
          }}
        >
          {/* 6-step pill tracker synced with real app */}
          <div
            style={{
              padding: '16px 20px',
              borderRadius: 18,
              backgroundColor: 'rgba(17, 24, 39, 0.88)',
              border: `1px solid ${COLORS.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {STEP_LABELS.map((lbl, idx) => {
              const done = idx < step || (step === 5 && execProgress >= 100);
              const active = idx === step && !(step === 5 && execProgress >= 100);
              return (
                <div
                  key={lbl}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    flex: 1,
                  }}
                >
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: FONTS.mono,
                      fontSize: 14,
                      fontWeight: 800,
                      background: done
                        ? COLORS.emerald
                        : active
                          ? 'linear-gradient(135deg, #3B82F6, #38BDF8)'
                          : 'rgba(30, 42, 66, 0.9)',
                      color: done || active ? '#FFFFFF' : COLORS.textMuted,
                      boxShadow: active
                        ? '0 0 18px rgba(56, 189, 248, 0.6)'
                        : 'none',
                    }}
                  >
                    {done ? <CheckCircle2 size={18} /> : idx + 1}
                  </div>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: active ? 700 : 500,
                      color: active
                        ? COLORS.cyanBright
                        : done
                          ? COLORS.emeraldBright
                          : COLORS.textMuted,
                    }}
                  >
                    {lbl}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Bottom trust strip */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0 8px',
              fontFamily: FONTS.mono,
              fontSize: 15,
              color: COLORS.textSecondary,
            }}
          >
            <span>UEFI (GPT) + Legacy (MBR)</span>
            <span style={{ color: COLORS.emeraldBright }}>
              ● C# .NET 8 WPF • WinPE x64
            </span>
          </div>
        </div>
      )}

      {/* ==================== ACT 6: CONSOLIDATION, STACK & CLOSING ==================== */}
      {isOutro && (
        <AbsoluteFill
          style={{
            padding: '115px 58px 90px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 32,
            opacity: outroIn,
          }}
        >
          {/* Outro Header */}
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 20px',
                borderRadius: 999,
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                border: `1px solid ${COLORS.borderEmerald}`,
                fontFamily: FONTS.mono,
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: '0.12em',
                color: COLORS.emeraldBright,
              }}
            >
              ● GANHO REAL DE PRATICIDADE
            </div>

            <h1
              style={{
                margin: 0,
                fontSize: 64,
                fontWeight: 800,
                lineHeight: 1.08,
                letterSpacing: '-0.03em',
                color: COLORS.textPrimary,
              }}
            >
              Tudo Reunido em{' '}
              <span
                style={{
                  background: `linear-gradient(90deg, ${COLORS.cyan}, ${COLORS.emeraldBright})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Uma Só Mídia
              </span>
            </h1>

            <p
              style={{
                margin: 0,
                fontSize: 24,
                color: COLORS.textSecondary,
                lineHeight: 1.38,
                maxWidth: 860,
              }}
            >
              Eliminamos a dependência de vários SSDs e ferramentas separadas no dia a dia de bancada.
            </p>
          </div>

          {/* Consolidation Visual: Replaced Tools -> Single Media */}
          <div
            style={{
              padding: '26px 28px',
              borderRadius: 22,
              backgroundColor: 'rgba(17, 24, 39, 0.92)',
              border: `1px solid ${COLORS.borderCyan}`,
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.45)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 18,
            }}
          >
            <div
              style={{
                fontFamily: FONTS.mono,
                fontSize: 13.5,
                fontWeight: 700,
                letterSpacing: '0.12em',
                color: COLORS.textMuted,
              }}
            >
              SUBSTITUIU NO FLUXO DE BANCADA
            </div>

            {/* Old fragmented tools */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: 12,
              }}
            >
              {['Vários SSDs', 'Ventoy', 'Rufus', 'WinPE Separado', 'Scripts Manuais'].map(
                (oldTool, idx) => {
                  const chipIn = spring({
                    frame: frame - 1326 - idx * 4,
                    fps,
                    config: SPRING_SNAPPY,
                  });
                  return (
                    <span
                      key={oldTool}
                      style={{
                        padding: '9px 18px',
                        borderRadius: 999,
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.35)',
                        color: '#FCA5A5',
                        fontFamily: FONTS.mono,
                        fontSize: 16,
                        fontWeight: 600,
                        textDecoration: 'line-through',
                        textDecorationThickness: '2px',
                        opacity: chipIn,
                        transform: `scale(${interpolate(chipIn, [0, 1], [0.85, 1])})`,
                      }}
                    >
                      {oldTool}
                    </span>
                  );
                }
              )}
            </div>

            {/* Converging Arrow */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: COLORS.cyanBright,
                fontFamily: FONTS.mono,
                fontSize: 13.5,
                fontWeight: 700,
                letterSpacing: '0.1em',
              }}
            >
              <ArrowDown size={20} color={COLORS.emeraldBright} />
              <span>CONSOLIDADO EM UMA ÚNICA FERRAMENTA</span>
              <ArrowDown size={20} color={COLORS.emeraldBright} />
            </div>

            {/* Unified Result Pill */}
            <div
              style={{
                width: '100%',
                padding: '18px 24px',
                borderRadius: 16,
                background:
                  'linear-gradient(90deg, rgba(56, 189, 248, 0.16), rgba(16, 185, 129, 0.18))',
                border: `1.5px solid ${COLORS.emerald}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 14,
              }}
            >
              <Usb size={28} color={COLORS.emeraldBright} />
              <span
                style={{
                  fontSize: 23,
                  fontWeight: 800,
                  color: COLORS.textPrimary,
                }}
              >
                1 Pendrive • UEFI + Legacy • App + Drivers + Unattend
              </span>
            </div>
          </div>

          {/* 2x4 Stack Grid optimized for Vertical Mobile */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 16,
            }}
          >
            {OUTRO_STACK.map((item, idx) => {
              const badgeIn = spring({
                frame: frame - 1345 - idx * 4,
                fps,
                config: SPRING_SNAPPY,
              });
              const Icon = item.icon;
              return (
                <div
                  key={item.name}
                  style={{
                    padding: '18px 20px',
                    borderRadius: 16,
                    backgroundColor: 'rgba(17, 24, 39, 0.92)',
                    border: `1px solid ${COLORS.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    opacity: badgeIn,
                    transform: `translateY(${interpolate(badgeIn, [0, 1], [20, 0])}px)`,
                  }}
                >
                  <div
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 12,
                      backgroundColor: 'rgba(56, 189, 248, 0.14)',
                      border: `1px solid ${COLORS.borderCyan}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={22} color={COLORS.cyan} />
                  </div>
                  <div>
                    <div
                      style={{
                        fontFamily: FONTS.mono,
                        fontSize: 11.5,
                        fontWeight: 700,
                        letterSpacing: '0.1em',
                        color: COLORS.emeraldBright,
                        marginBottom: 2,
                      }}
                    >
                      {item.tag}
                    </div>
                    <div
                      style={{
                        fontSize: 21,
                        fontWeight: 800,
                        color: COLORS.textPrimary,
                      }}
                    >
                      {item.name}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Clean Closing Summary Bar (sem CTA de portfólio) */}
          <div
            style={{
              padding: '24px 28px',
              borderRadius: 20,
              background:
                'linear-gradient(135deg, rgba(17, 24, 39, 0.96), rgba(14, 30, 52, 0.96))',
              border: `1.5px solid ${COLORS.borderCyan}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 14,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 28, fontWeight: 800, color: COLORS.textPrimary }}>
              Menos ferramentas. Mais padronização.
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 14,
                fontFamily: FONTS.mono,
                fontSize: 15.5,
                fontWeight: 700,
                color: COLORS.cyanBright,
              }}
            >
              <span>✓ UEFI &amp; Legacy</span>
              <span style={{ color: COLORS.textMuted }}>•</span>
              <span style={{ color: COLORS.emeraldBright }}>✓ Zero Bloatware</span>
              <span style={{ color: COLORS.textMuted }}>•</span>
              <span>✓ Pronto no 1º Boot</span>
            </div>
          </div>
        </AbsoluteFill>
      )}

      {/* Global Bottom Progress Line */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 6,
          backgroundColor: 'rgba(148, 163, 184, 0.15)',
          zIndex: 60,
        }}
      >
        <div
          style={{
            width: `${globalProgressPct}%`,
            height: '100%',
            background: `linear-gradient(90deg, ${COLORS.cyan}, ${COLORS.emerald})`,
            boxShadow: `0 0 14px ${COLORS.cyan}`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

const CaptionBlock: React.FC<{
  caption: ActCaption;
  localFrame: number;
  fps: number;
}> = ({ caption, localFrame, fps }) => {
  const anim = spring({
    frame: localFrame,
    fps,
    config: SPRING_SMOOTH,
  });

  const subAnim = spring({
    frame: localFrame - 8,
    fps,
    config: SPRING_SMOOTH,
  });

  return (
    <div
      style={{
        position: 'absolute',
        top: 108,
        left: 60,
        right: 60,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 14,
        zIndex: 20,
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 18px',
          borderRadius: 999,
          backgroundColor: 'rgba(56, 189, 248, 0.12)',
          border: `1px solid ${COLORS.borderCyan}`,
          opacity: anim,
          transform: `translateY(${interpolate(anim, [0, 1], [16, 0])}px)`,
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
        <span
          style={{
            fontFamily: FONTS.mono,
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: '0.12em',
            color: COLORS.cyanBright,
          }}
        >
          {caption.badge}
        </span>
      </div>

      <h1
        style={{
          margin: 0,
          fontSize: 66,
          fontWeight: 800,
          lineHeight: 1.07,
          letterSpacing: '-0.03em',
          color: COLORS.textPrimary,
          opacity: anim,
          transform: `translateY(${interpolate(anim, [0, 1], [26, 0])}px)`,
        }}
      >
        {caption.line1}
        <br />
        <span
          style={{
            background: `linear-gradient(90deg, ${COLORS.cyanBright}, ${COLORS.emeraldBright})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {caption.line2}
        </span>
      </h1>

      <p
        style={{
          margin: 0,
          fontSize: 25,
          fontWeight: 400,
          color: COLORS.textSecondary,
          lineHeight: 1.35,
          maxWidth: 880,
          opacity: subAnim,
          transform: `translateY(${interpolate(subAnim, [0, 1], [16, 0])}px)`,
        }}
      >
        {caption.sub}
      </p>
    </div>
  );
};
