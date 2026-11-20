import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {
  Building2,
  CheckCircle2,
  Clock,
  Rocket,
  ShieldCheck,
  Sparkles,
  TerminalSquare,
  UserCheck,
  Zap,
} from 'lucide-react';
import { Backdrop } from '../components/Backdrop';
import { SceneHeader } from '../components/SceneHeader';
import { COLORS, FONTS, SPRING_SMOOTH, SPRING_SNAPPY } from '../theme';

const DEPLOY_MODES = [
  {
    icon: Building2,
    title: 'Corporativo / Intune',
    desc: 'OOBE puro pronto para Microsoft Entra ID & Autopilot',
    accent: COLORS.cyan,
  },
  {
    icon: UserCheck,
    title: 'Bypass / Conta Local',
    desc: 'Instalação 100% offline sem obrigatoriedade de conta Microsoft',
    accent: COLORS.indigo,
  },
  {
    icon: Zap,
    title: 'Zero-Touch Bancada',
    desc: 'Cria WORKGROUP\\Admin e entra direto na Área de Trabalho',
    accent: COLORS.emerald,
  },
];

const FEATURE_CARDS = [
  {
    icon: Sparkles,
    badge: 'IMAGEM 100% LIMPA',
    title: 'Zero Bloatware',
    description:
      'Aplicação direta da imagem WIM/ESD oficial sem softwares indesejados de fabricantes e sem travas de TPM 2.0, Secure Boot ou RAM.',
    snippet: 'reg add HKLM\\...\\LabConfig /v BypassTPMCheck /d 1 /f',
    bullets: [
      'Sem bloatware OEM pré-instalado',
      'Registro otimizado offline antes do 1º boot',
      'WinRE & BCDBoot gravados automaticamente',
    ],
    accent: COLORS.cyan,
  },
  {
    icon: TerminalSquare,
    badge: 'FIRST-BOOT AUTOMATION',
    title: 'SetupComplete.cmd',
    description:
      'Orquestração silenciosa executada na finalização do Windows: horário NTP, ativação KMS sanitizada e limpeza segura.',
    snippet: 'w32tm /config /manualpeerlist:"time.windows.com" && del %~f0',
    bullets: [
      'NTP sincronizado via pool.ntp.org / time.windows.com',
      'Ativação via slmgr (W269N-WFGWX-YVC9B-4J6C9-T83GX)',
      'Auto-remoção do script após conclusão',
    ],
    accent: COLORS.emerald,
  },
  {
    icon: Rocket,
    badge: 'PRONTO PARA PRODUÇÃO',
    title: 'Prontidão Imediata',
    description:
      'Estação entregue padronizada, com drivers carregados, políticas aplicadas e relatório técnico de auditoria salvo em log.',
    snippet: '[OK] Deploy finalizado • Drivers + Audit Log salvos',
    bullets: [
      'Drivers .inf + scripts OEM já ativos no boot',
      'Log completo de hardware, edição e data/hora',
      'Padronização idêntica em toda a frota',
    ],
    accent: COLORS.indigo,
  },
];

export const Scene4PostInstall: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const barIn = spring({ frame: frame - 115, fps, config: SPRING_SMOOTH });
  const manualWidth = interpolate(frame, [125, 175], [0, 88], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const autoWidth = interpolate(frame, [135, 185], [0, 14], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const savingsPop = spring({ frame: frame - 175, fps, config: SPRING_SNAPPY });

  return (
    <AbsoluteFill style={{ fontFamily: FONTS.sans }}>
      <Backdrop accentShift={3} hudTag="STAGE 03 // POST-INSTALL & STANDARDIZATION" />

      <AbsoluteFill
        style={{
          padding: '50px 84px',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
        }}
      >
        <SceneHeader
          badge="03 // PÓS-INSTALAÇÃO & PADRONIZAÇÃO"
          title="Máquina Pronta no"
          highlight="Primeiro Boot"
          subtitle="Três perfis de implantação e scripts pós-instalação que eliminam retrabalho operacional."
        />

        {/* 3 Deployment Modes Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 18 }}>
          {DEPLOY_MODES.map((mode, idx) => {
            const mIn = spring({
              frame: frame - 18 - idx * 9,
              fps,
              config: SPRING_SNAPPY,
            });
            const Icon = mode.icon;
            return (
              <div
                key={mode.title}
                style={{
                  padding: '14px 18px',
                  borderRadius: 14,
                  backgroundColor: 'rgba(17, 24, 39, 0.85)',
                  border: `1px solid ${mode.accent}44`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  opacity: mIn,
                  transform: `translateY(${interpolate(mIn, [0, 1], [18, 0])}px)`,
                }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 11,
                    backgroundColor: `${mode.accent}1C`,
                    border: `1px solid ${mode.accent}55`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={21} color={mode.accent} />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 17,
                      fontWeight: 700,
                      color: COLORS.textPrimary,
                      marginBottom: 2,
                    }}
                  >
                    {mode.title}
                  </div>
                  <div
                    style={{
                      fontSize: 13.5,
                      color: COLORS.textSecondary,
                      lineHeight: 1.3,
                    }}
                  >
                    {mode.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 3 Feature Cards Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 24,
            flex: 1,
          }}
        >
          {FEATURE_CARDS.map((card, idx) => {
            const cIn = spring({
              frame: frame - 46 - idx * 14,
              fps,
              config: SPRING_SMOOTH,
            });
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                style={{
                  position: 'relative',
                  padding: '26px 26px 22px',
                  borderRadius: 18,
                  backgroundColor: COLORS.bgCard,
                  border: `1px solid ${COLORS.border}`,
                  boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  overflow: 'hidden',
                  opacity: cIn,
                  transform: `translateY(${interpolate(cIn, [0, 1], [32, 0])}px)`,
                }}
              >
                {/* Top glow accent line */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    background: `linear-gradient(90deg, ${card.accent}, transparent)`,
                  }}
                />

                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 16,
                    }}
                  >
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 13,
                        backgroundColor: `${card.accent}1A`,
                        border: `1px solid ${card.accent}50`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon size={24} color={card.accent} />
                    </div>

                    <span
                      style={{
                        fontFamily: FONTS.mono,
                        fontSize: 12,
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        padding: '5px 10px',
                        borderRadius: 999,
                        backgroundColor: `${card.accent}18`,
                        color: card.accent,
                        border: `1px solid ${card.accent}40`,
                      }}
                    >
                      {card.badge}
                    </span>
                  </div>

                  <h2
                    style={{
                      margin: '0 0 10px',
                      fontSize: 27,
                      fontWeight: 800,
                      color: COLORS.textPrimary,
                      letterSpacing: '-0.015em',
                    }}
                  >
                    {card.title}
                  </h2>

                  <p
                    style={{
                      margin: '0 0 18px',
                      fontSize: 16.5,
                      lineHeight: 1.55,
                      color: COLORS.textSecondary,
                    }}
                  >
                    {card.description}
                  </p>

                  {/* Compact technical telemetry pill */}
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: 10,
                      backgroundColor: 'rgba(11, 15, 25, 0.85)',
                      border: `1px solid ${card.accent}30`,
                      fontFamily: FONTS.mono,
                      fontSize: 12.5,
                      color: card.accent,
                      lineHeight: 1.4,
                      wordBreak: 'break-word',
                    }}
                  >
                    &gt; {card.snippet}
                  </div>
                </div>

                {/* Checklist */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    paddingTop: 14,
                    borderTop: `1px solid rgba(148, 163, 184, 0.12)`,
                  }}
                >
                  {card.bullets.map((b, bIdx) => {
                    const bIn = spring({
                      frame: frame - 78 - idx * 12 - bIdx * 8,
                      fps,
                      config: SPRING_SMOOTH,
                    });
                    return (
                      <div
                        key={b}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 9,
                          opacity: bIn,
                          transform: `translateX(${interpolate(bIn, [0, 1], [-10, 0])}px)`,
                        }}
                      >
                        <CheckCircle2
                          size={16}
                          color={COLORS.emerald}
                          style={{ flexShrink: 0 }}
                        />
                        <span
                          style={{
                            fontSize: 14.5,
                            color: COLORS.textPrimary,
                            fontWeight: 500,
                          }}
                        >
                          {b}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Operational Impact Comparison Bar */}
        <div
          style={{
            padding: '20px 28px',
            borderRadius: 16,
            backgroundColor: COLORS.bgCode,
            border: `1px solid ${COLORS.borderEmerald}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 32,
            opacity: barIn,
            transform: `translateY(${interpolate(barIn, [0, 1], [22, 0])}px)`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 260 }}>
            <Clock size={26} color={COLORS.emeraldBright} />
            <div>
              <div
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: 12,
                  color: COLORS.textMuted,
                  letterSpacing: '0.1em',
                }}
              >
                GANHO OPERACIONAL
              </div>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: COLORS.textPrimary,
                }}
              >
                Tempo por Estação
              </div>
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Manual Bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span
                style={{
                  width: 175,
                  fontFamily: FONTS.mono,
                  fontSize: 14,
                  color: COLORS.textMuted,
                }}
              >
                Deploy Manual
              </span>
              <div
                style={{
                  flex: 1,
                  height: 14,
                  borderRadius: 999,
                  backgroundColor: 'rgba(148, 163, 184, 0.1)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${manualWidth}%`,
                    height: '100%',
                    borderRadius: 999,
                    backgroundColor: '#475569',
                  }}
                />
              </div>
              <span
                style={{
                  width: 80,
                  textAlign: 'right',
                  fontFamily: FONTS.mono,
                  fontSize: 15,
                  color: COLORS.textSecondary,
                }}
              >
                ~90 min
              </span>
            </div>

            {/* Automated Bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span
                style={{
                  width: 175,
                  fontFamily: FONTS.mono,
                  fontSize: 14,
                  fontWeight: 700,
                  color: COLORS.cyanBright,
                }}
              >
                Pipeline Automático
              </span>
              <div
                style={{
                  flex: 1,
                  height: 14,
                  borderRadius: 999,
                  backgroundColor: 'rgba(148, 163, 184, 0.1)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${autoWidth}%`,
                    height: '100%',
                    borderRadius: 999,
                    background: `linear-gradient(90deg, ${COLORS.cyan}, ${COLORS.emerald})`,
                    boxShadow: `0 0 18px ${COLORS.emerald}AA`,
                  }}
                />
              </div>
              <span
                style={{
                  width: 80,
                  textAlign: 'right',
                  fontFamily: FONTS.mono,
                  fontSize: 15,
                  fontWeight: 800,
                  color: COLORS.emeraldBright,
                }}
              >
                ~12 min
              </span>
            </div>
          </div>

          <div
            style={{
              padding: '12px 22px',
              borderRadius: 12,
              backgroundColor: 'rgba(16, 185, 129, 0.16)',
              border: `1.5px solid ${COLORS.emerald}`,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              opacity: savingsPop,
              transform: `scale(${interpolate(savingsPop, [0, 1], [0.85, 1])})`,
            }}
          >
            <ShieldCheck size={22} color={COLORS.emeraldBright} />
            <div>
              <div
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: 24,
                  fontWeight: 800,
                  color: COLORS.emeraldBright,
                  lineHeight: 1,
                }}
              >
                -86%
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: COLORS.textPrimary,
                  marginTop: 2,
                }}
              >
                Tempo de Bancada
              </div>
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
