import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {
  ArrowRight,
  Code2,
  Cpu,
  Database,
  FileCode2,
  HardDrive,
  Layers,
  Terminal,
  Wrench,
} from 'lucide-react';
import { Backdrop } from '../components/Backdrop';
import { SceneHeader } from '../components/SceneHeader';
import { COLORS, FONTS, SPRING_SMOOTH, SPRING_SNAPPY } from '../theme';

const STACK_ITEMS = [
  {
    icon: Terminal,
    name: 'Windows PE (x64)',
    role: 'Ambiente de Pré-Instalação & ADK',
    tag: 'BOOT',
    accent: COLORS.cyan,
  },
  {
    icon: Layers,
    name: 'C# / .NET 8 WPF',
    role: 'App Nativo SingleFile Autocontido',
    tag: 'UI & ENGINE',
    accent: COLORS.indigo,
  },
  {
    icon: Wrench,
    name: 'DISM & WIM/ESD',
    role: 'Aplicação de Imagem & Drivers .inf',
    tag: 'IMAGING',
    accent: COLORS.emerald,
  },
  {
    icon: Code2,
    name: 'PowerShell',
    role: 'Gerador WinPE & Gravador USB',
    tag: 'AUTOMATION',
    accent: COLORS.cyanBright,
  },
  {
    icon: FileCode2,
    name: 'Unattend XML',
    role: 'Resposta Automática Specialize/OOBE',
    tag: 'CONFIG',
    accent: COLORS.amber,
  },
  {
    icon: HardDrive,
    name: 'DiskPart & BCDBoot',
    role: 'Layout Híbrido UEFI (GPT) & MBR',
    tag: 'STORAGE',
    accent: COLORS.cyan,
  },
  {
    icon: Cpu,
    name: 'WMI & Registry Offline',
    role: 'Inventário de Hardware & Patches HKLM',
    tag: 'SYSTEM',
    accent: COLORS.indigo,
  },
  {
    icon: Database,
    name: 'SetupComplete.cmd',
    role: 'NTP, Ativação & Logs Pós-Boot',
    tag: 'POST-DEPLOY',
    accent: COLORS.emerald,
  },
];

export const Scene5Stack: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const ctaIn = spring({ frame: frame - 88, fps, config: SPRING_SMOOTH });
  const arrowNudge = Math.sin(frame * 0.16) * 5;

  return (
    <AbsoluteFill style={{ fontFamily: FONTS.sans }}>
      <Backdrop accentShift={4} hudTag="STAGE 04 // TECH STACK & ARCHITECTURE" />

      <AbsoluteFill
        style={{
          padding: '54px 84px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: 30,
        }}
      >
        <SceneHeader
          badge="04 // STACK TECNOLÓGICA"
          title="Engenharia de Deploy"
          highlight="de Ponta a Ponta"
          subtitle="Tecnologias nativas do ecossistema Windows combinadas em um pipeline moderno e replicável."
        />

        {/* 4x2 Tech Badges Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 22,
          }}
        >
          {STACK_ITEMS.map((item, idx) => {
            const cardIn = spring({
              frame: frame - 18 - idx * 7,
              fps,
              config: SPRING_SNAPPY,
            });
            const Icon = item.icon;
            return (
              <div
                key={item.name}
                style={{
                  padding: '24px 22px',
                  borderRadius: 16,
                  backgroundColor: COLORS.bgCard,
                  border: `1px solid ${COLORS.border}`,
                  boxShadow: '0 16px 40px rgba(0, 0, 0, 0.38)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  opacity: cardIn,
                  transform: `translateY(${interpolate(cardIn, [0, 1], [26, 0])}px) scale(${interpolate(cardIn, [0, 1], [0.94, 1])})`,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 12,
                      backgroundColor: `${item.accent}1A`,
                      border: `1px solid ${item.accent}52`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={23} color={item.accent} />
                  </div>
                  <span
                    style={{
                      fontFamily: FONTS.mono,
                      fontSize: 11.5,
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      padding: '4px 9px',
                      borderRadius: 6,
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      border: `1px solid ${item.accent}35`,
                      color: item.accent,
                    }}
                  >
                    {item.tag}
                  </span>
                </div>

                <div>
                  <div
                    style={{
                      fontSize: 21,
                      fontWeight: 800,
                      color: COLORS.textPrimary,
                      marginBottom: 5,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {item.name}
                  </div>
                  <div
                    style={{
                      fontSize: 14.5,
                      lineHeight: 1.4,
                      color: COLORS.textSecondary,
                    }}
                  >
                    {item.role}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Clean Portfolio Call-to-Action Footer */}
        <div
          style={{
            padding: '26px 34px',
            borderRadius: 18,
            background:
              'linear-gradient(95deg, rgba(17, 24, 39, 0.96) 0%, rgba(14, 30, 52, 0.95) 60%, rgba(16, 185, 129, 0.14) 100%)',
            border: `1px solid ${COLORS.borderCyan}`,
            boxShadow: '0 20px 60px rgba(2, 132, 199, 0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            opacity: ctaIn,
            transform: `translateY(${interpolate(ctaIn, [0, 1], [24, 0])}px)`,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontFamily: FONTS.mono,
                fontSize: 14,
                fontWeight: 600,
                color: COLORS.emeraldBright,
                letterSpacing: '0.1em',
              }}
            >
              <span
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: '50%',
                  backgroundColor: COLORS.emerald,
                  boxShadow: `0 0 12px ${COLORS.emerald}`,
                }}
              />
              <span>INFRAESTRUTURA & AUTOMAÇÃO DE SISTEMAS</span>
            </div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: COLORS.textPrimary,
                letterSpacing: '-0.02em',
              }}
            >
              Quer ver mais projetos de engenharia e automação?
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '16px 28px',
              borderRadius: 14,
              background: `linear-gradient(90deg, ${COLORS.cyanDeep}, ${COLORS.cyan})`,
              boxShadow: `0 10px 30px rgba(56, 189, 248, 0.35)`,
              color: '#082F49',
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: '-0.01em',
            }}
          >
            <span>Explore o Portfólio Completo</span>
            <ArrowRight
              size={22}
              strokeWidth={2.8}
              style={{ transform: `translateX(${arrowNudge}px)` }}
            />
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
