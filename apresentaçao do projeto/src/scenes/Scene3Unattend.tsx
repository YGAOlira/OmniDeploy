import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {
  CheckCircle2,
  Code2,
  Cpu,
  HardDrive,
  Lock,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import { Backdrop } from '../components/Backdrop';
import { SceneHeader } from '../components/SceneHeader';
import { COLORS, FONTS, SPRING_SMOOTH, SPRING_SNAPPY } from '../theme';

interface CodeToken {
  text: string;
  color: string;
}

type CodeLine = CodeToken[];

// 100% SANITIZED XML & Config mockup (zero corporate or real keys/servers)
const XML_LINES: CodeLine[] = [
  [{ text: '<?xml version="1.0" encoding="utf-8"?>', color: COLORS.textMuted }],
  [
    { text: '<unattend ', color: COLORS.cyan },
    { text: 'xmlns', color: COLORS.indigo },
    { text: '="urn:schemas-microsoft-com:unattend">', color: COLORS.emeraldBright },
  ],
  [{ text: '  <!-- Particionamento Automático GPT (EFI + MSR + Windows + WinRE) -->', color: COLORS.textMuted }],
  [
    { text: '  <DiskConfiguration>', color: COLORS.cyan },
    { text: '<WillWipeDisk>', color: COLORS.cyanBright },
    { text: 'true', color: COLORS.amber },
    { text: '</WillWipeDisk></DiskConfiguration>', color: COLORS.cyan },
  ],
  [{ text: '', color: COLORS.textPrimary }],
  [{ text: '  <!-- Idioma, Fuso Horário & Servidor NTP Sanitizado -->', color: COLORS.textMuted }],
  [
    { text: '  <UILanguage>', color: COLORS.cyan },
    { text: 'pt-BR', color: COLORS.emeraldBright },
    { text: '</UILanguage>', color: COLORS.cyan },
  ],
  [
    { text: '  <TimeZone>', color: COLORS.cyan },
    { text: 'E. South America Standard Time', color: COLORS.emeraldBright },
    { text: '</TimeZone>', color: COLORS.cyan },
  ],
  [
    { text: '  <NtpServer>', color: COLORS.cyan },
    { text: 'time.windows.com', color: COLORS.amber },
    { text: '</NtpServer>', color: COLORS.cyan },
  ],
  [{ text: '', color: COLORS.textPrimary }],
  [{ text: '  <!-- Registro Offline: Bypass Hardware & Conta Online -->', color: COLORS.textMuted }],
  [
    { text: '  <LabConfig ', color: COLORS.cyan },
    { text: 'BypassTPMCheck', color: COLORS.indigo },
    { text: '="1" ', color: COLORS.amber },
    { text: 'BypassSecureBoot', color: COLORS.indigo },
    { text: '="1" ', color: COLORS.amber },
    { text: 'BypassNRO', color: COLORS.indigo },
    { text: '="1" />', color: COLORS.amber },
  ],
  [{ text: '', color: COLORS.textPrimary }],
  [{ text: '  <!-- Credenciais, Repositório & Product Key Sanitizados -->', color: COLORS.textMuted }],
  [
    { text: '  <ImageSource>', color: COLORS.cyan },
    { text: '\\\\SERVER-DEPLOY\\Images\\Win11_Pro.wim', color: COLORS.emeraldBright },
    { text: '</ImageSource>', color: COLORS.cyan },
  ],
  [
    { text: '  <Account ', color: COLORS.cyan },
    { text: 'User', color: COLORS.indigo },
    { text: '="CORP\\Admin" ', color: COLORS.emeraldBright },
    { text: 'Password', color: COLORS.indigo },
    { text: '="********" />', color: COLORS.textSecondary },
  ],
  [
    { text: '  <ProductKey>', color: COLORS.cyan },
    { text: 'XXXXX-XXXXX-XXXXX-XXXXX-XXXXX', color: COLORS.amber },
    { text: '</ProductKey>', color: COLORS.cyan },
  ],
  [{ text: '</unattend>', color: COLORS.cyan }],
];

const TOTAL_CHARS = XML_LINES.reduce(
  (acc, line) => acc + line.reduce((s, t) => s + t.text.length, 0) + 1,
  0
);

const DRIVER_PACKAGES = [
  { name: 'Chipset_NVMe_Storage.inf', size: '42 MB', startFrame: 150 },
  { name: 'Intel_Ethernet_WiFi6E.inf', size: '68 MB', startFrame: 185 },
  { name: 'OEM_Keyboard_Hotkeys.inf', size: '19 MB', startFrame: 220 },
];

export const Scene3Unattend: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const editorIn = spring({ frame: frame - 14, fps, config: SPRING_SMOOTH });
  const pipelineIn = spring({ frame: frame - 24, fps, config: SPRING_SMOOTH });

  // Typewriter progress across frames 20 -> 265
  const visibleChars = Math.floor(
    interpolate(frame, [20, 265], [0, TOTAL_CHARS], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );

  // DISM progress bars
  const diskpartPct = Math.round(
    interpolate(frame, [45, 90], [0, 100], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );
  const dismApplyPct = Math.round(
    interpolate(frame, [85, 165], [0, 100], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );
  const dismDriversPct = Math.round(
    interpolate(frame, [145, 255], [0, 100], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );
  const registryPct = Math.round(
    interpolate(frame, [245, 290], [0, 100], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );

  const overallPct = Math.round(
    diskpartPct * 0.15 + dismApplyPct * 0.45 + dismDriversPct * 0.25 + registryPct * 0.15
  );

  const cursorVisible = Math.floor(frame / 10) % 2 === 0;

  let remainingChars = visibleChars;

  return (
    <AbsoluteFill style={{ fontFamily: FONTS.sans }}>
      <Backdrop accentShift={2} hudTag="STAGE 02 // UNATTEND & DISM INJECTION" />

      <AbsoluteFill
        style={{
          padding: '54px 84px',
          display: 'flex',
          flexDirection: 'column',
          gap: 26,
        }}
      >
        <SceneHeader
          badge="02 // AUTOMAÇÃO UNATTEND & INJEÇÃO DE DRIVERS"
          title="Resposta Automática +"
          highlight="Drivers na Imagem"
          subtitle="Particionamento GPT/MBR, aplicação WIM/ESD, injeção recursiva de drivers (.inf) e patches offline."
        />

        <div style={{ display: 'flex', gap: 28, flex: 1, minHeight: 0 }}>
          {/* LEFT: Code Editor with Typing Effect */}
          <div
            style={{
              flex: 1.32,
              borderRadius: 18,
              backgroundColor: COLORS.bgCode,
              border: `1px solid ${COLORS.borderCyan}`,
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              opacity: editorIn,
              transform: `translateY(${interpolate(editorIn, [0, 1], [24, 0])}px)`,
            }}
          >
            {/* Editor Header / Tabs */}
            <div
              style={{
                padding: '12px 20px',
                backgroundColor: '#111827',
                borderBottom: `1px solid ${COLORS.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ display: 'flex', gap: 7, marginRight: 6 }}>
                  <div style={{ width: 11, height: 11, borderRadius: '50%', backgroundColor: '#EF4444' }} />
                  <div style={{ width: 11, height: 11, borderRadius: '50%', backgroundColor: '#F59E0B' }} />
                  <div style={{ width: 11, height: 11, borderRadius: '50%', backgroundColor: COLORS.emerald }} />
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '5px 14px',
                    borderRadius: 8,
                    backgroundColor: 'rgba(56, 189, 248, 0.12)',
                    border: `1px solid ${COLORS.borderCyan}`,
                  }}
                >
                  <Code2 size={15} color={COLORS.cyan} />
                  <span
                    style={{
                      fontFamily: FONTS.mono,
                      fontSize: 14,
                      fontWeight: 600,
                      color: COLORS.textPrimary,
                    }}
                  >
                    autounattend.xml
                  </span>
                </div>
                <span
                  style={{
                    fontFamily: FONTS.mono,
                    fontSize: 13,
                    color: COLORS.textMuted,
                  }}
                >
                  W:\Windows\Panther\unattend.xml
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontFamily: FONTS.mono,
                  fontSize: 12,
                  color: COLORS.emeraldBright,
                }}
              >
                <Lock size={13} />
                <span>SANITIZADO</span>
              </div>
            </div>

            {/* Code Lines */}
            <div
              style={{
                flex: 1,
                padding: '22px 24px',
                fontFamily: FONTS.mono,
                fontVariantLigatures: 'none',
                fontSize: 16.5,
                lineHeight: 1.72,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              {XML_LINES.map((tokens, lineIdx) => {
                if (remainingChars <= 0) {
                  return null;
                }

                const lineFullLen = tokens.reduce((s, t) => s + t.text.length, 0);
                const charsToShow = Math.min(remainingChars, lineFullLen);
                const isActiveLine =
                  remainingChars <= lineFullLen + 1 && visibleChars < TOTAL_CHARS;
                remainingChars -= lineFullLen + 1;

                let drawn = 0;

                return (
                  <div
                    key={lineIdx}
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      minHeight: 28,
                      backgroundColor: isActiveLine
                        ? 'rgba(56, 189, 248, 0.06)'
                        : 'transparent',
                      borderRadius: 4,
                    }}
                  >
                    <span
                      style={{
                        width: 36,
                        flexShrink: 0,
                        color: '#334155',
                        fontSize: 14,
                        userSelect: 'none',
                      }}
                    >
                      {String(lineIdx + 1).padStart(2, '0')}
                    </span>
                    <span style={{ whiteSpace: 'pre' }}>
                      {tokens.map((tok, tIdx) => {
                        const avail = Math.max(0, charsToShow - drawn);
                        const slice = tok.text.slice(0, avail);
                        drawn += tok.text.length;
                        if (!slice) return null;
                        return (
                          <span key={tIdx} style={{ color: tok.color }}>
                            {slice}
                          </span>
                        );
                      })}
                      {isActiveLine && cursorVisible && (
                        <span
                          style={{
                            display: 'inline-block',
                            width: 9,
                            height: 19,
                            backgroundColor: COLORS.cyan,
                            verticalAlign: 'middle',
                            marginLeft: 2,
                            boxShadow: `0 0 10px ${COLORS.cyan}`,
                          }}
                        />
                      )}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Editor Status Footer */}
            <div
              style={{
                padding: '10px 20px',
                backgroundColor: '#0F172A',
                borderTop: `1px solid ${COLORS.border}`,
                display: 'flex',
                justifyContent: 'space-between',
                fontFamily: FONTS.mono,
                fontSize: 13,
                color: COLORS.textMuted,
              }}
            >
              <span>UTF-8 • Microsoft-Windows-Shell-Setup</span>
              <span style={{ color: COLORS.cyanBright }}>
                NTP: time.windows.com • Key: Mascarada
              </span>
            </div>
          </div>

          {/* RIGHT: Live DISM & Driver Injection Monitor */}
          <div
            style={{
              flex: 0.92,
              borderRadius: 18,
              backgroundColor: COLORS.bgCard,
              border: `1px solid ${COLORS.border}`,
              padding: 26,
              display: 'flex',
              flexDirection: 'column',
              gap: 18,
              opacity: pipelineIn,
              transform: `translateX(${interpolate(pipelineIn, [0, 1], [28, 0])}px)`,
            }}
          >
            {/* Header + Global Percentage */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: FONTS.mono,
                    fontSize: 13,
                    letterSpacing: '0.1em',
                    color: COLORS.cyan,
                    marginBottom: 4,
                  }}
                >
                  DEPLOY ENGINE // EXECUÇÃO AO VIVO
                </div>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: COLORS.textPrimary,
                  }}
                >
                  DISM & Injeção Offline
                </div>
              </div>
              <div
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: 32,
                  fontWeight: 800,
                  color: overallPct === 100 ? COLORS.emeraldBright : COLORS.cyanBright,
                }}
              >
                {overallPct}%
              </div>
            </div>

            {/* Global Bar */}
            <div
              style={{
                height: 10,
                borderRadius: 999,
                backgroundColor: 'rgba(148, 163, 184, 0.15)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${overallPct}%`,
                  height: '100%',
                  borderRadius: 999,
                  background: `linear-gradient(90deg, ${COLORS.cyan}, ${COLORS.emerald})`,
                  boxShadow: `0 0 18px ${COLORS.cyan}88`,
                }}
              />
            </div>

            {/* Step 1: DiskPart */}
            <PipelineRow
              icon={HardDrive}
              title="1. DiskPart — Layout GPT Automático"
              detail="EFI 100MB • MSR 16MB • Windows NTFS • WinRE"
              pct={diskpartPct}
            />

            {/* Step 2: DISM Apply */}
            <PipelineRow
              icon={Cpu}
              title="2. DISM /Apply-Image"
              detail="Win11_Pro_x64.wim [Index:1] → W:\"
              pct={dismApplyPct}
            />

            {/* Step 3: Driver Injection Card */}
            <div
              style={{
                padding: '14px 16px',
                borderRadius: 14,
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                border: `1px solid ${
                  dismDriversPct === 100 ? COLORS.borderEmerald : COLORS.borderCyan
                }`,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <Wrench size={17} color={COLORS.cyan} />
                  <span
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: COLORS.textPrimary,
                    }}
                  >
                    3. DISM /Add-Driver /Recurse
                  </span>
                </div>
                <span
                  style={{
                    fontFamily: FONTS.mono,
                    fontSize: 14,
                    fontWeight: 700,
                    color:
                      dismDriversPct === 100 ? COLORS.emeraldBright : COLORS.cyanBright,
                  }}
                >
                  {dismDriversPct}%
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {DRIVER_PACKAGES.map((pkg) => {
                  const pIn = spring({
                    frame: frame - pkg.startFrame,
                    fps,
                    config: SPRING_SNAPPY,
                  });
                  const done = frame >= pkg.startFrame + 24;
                  return (
                    <div
                      key={pkg.name}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        borderRadius: 8,
                        backgroundColor: done
                          ? 'rgba(16, 185, 129, 0.1)'
                          : 'rgba(56, 189, 248, 0.08)',
                        border: `1px solid ${
                          done
                            ? 'rgba(16, 185, 129, 0.35)'
                            : 'rgba(56, 189, 248, 0.25)'
                        }`,
                        opacity: pIn,
                        transform: `translateX(${interpolate(pIn, [0, 1], [16, 0])}px)`,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: FONTS.mono,
                          fontSize: 13.5,
                          color: COLORS.textPrimary,
                        }}
                      >
                        {pkg.name}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          style={{
                            fontFamily: FONTS.mono,
                            fontSize: 12,
                            color: COLORS.textMuted,
                          }}
                        >
                          {pkg.size}
                        </span>
                        {done ? (
                          <CheckCircle2 size={16} color={COLORS.emerald} />
                        ) : (
                          <span
                            style={{
                              fontFamily: FONTS.mono,
                              fontSize: 11,
                              color: COLORS.cyanBright,
                            }}
                          >
                            INJETANDO...
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 4: Registry Offline */}
            <PipelineRow
              icon={ShieldCheck}
              title="4. Registro Offline (HKLM Hives)"
              detail="BypassTPMCheck • BypassSecureBoot • BypassNRO"
              pct={registryPct}
            />
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

interface PipelineRowProps {
  icon: React.FC<{ size?: number; color?: string }>;
  title: string;
  detail: string;
  pct: number;
}

const PipelineRow: React.FC<PipelineRowProps> = ({
  icon: Icon,
  title,
  detail,
  pct,
}) => {
  const done = pct >= 100;
  return (
    <div
      style={{
        padding: '13px 16px',
        borderRadius: 12,
        backgroundColor: 'rgba(15, 23, 42, 0.78)',
        border: `1px solid ${done ? COLORS.borderEmerald : COLORS.border}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <Icon size={17} color={done ? COLORS.emerald : COLORS.cyan} />
          <span
            style={{
              fontSize: 15.5,
              fontWeight: 700,
              color: COLORS.textPrimary,
            }}
          >
            {title}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {done && <CheckCircle2 size={16} color={COLORS.emerald} />}
          <span
            style={{
              fontFamily: FONTS.mono,
              fontSize: 13.5,
              fontWeight: 700,
              color: done ? COLORS.emeraldBright : COLORS.cyanBright,
            }}
          >
            {pct}%
          </span>
        </div>
      </div>

      <div
        style={{
          fontFamily: FONTS.mono,
          fontSize: 12.5,
          color: COLORS.textSecondary,
        }}
      >
        {detail}
      </div>

      <div
        style={{
          height: 5,
          borderRadius: 999,
          backgroundColor: 'rgba(148, 163, 184, 0.14)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            borderRadius: 999,
            backgroundColor: done ? COLORS.emerald : COLORS.cyan,
          }}
        />
      </div>
    </div>
  );
};
