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
  Cpu,
  FolderOpen,
  HardDrive,
  Monitor,
  Shield,
  Terminal,
  Usb,
} from 'lucide-react';
import { Backdrop } from '../components/Backdrop';
import { SceneHeader } from '../components/SceneHeader';
import { COLORS, FONTS, SPRING_SMOOTH, SPRING_SNAPPY } from '../theme';

const DATA_FOLDERS = [
  {
    folder: '01_ISOs_Imagens/',
    desc: 'Win11_Pro_x64.wim (WIM / ESD oficial)',
    color: COLORS.cyan,
  },
  {
    folder: '02_Drivers/',
    desc: 'Pacotes .inf organizados por modelo de hardware',
    color: COLORS.indigo,
  },
  {
    folder: '03_Scripts/',
    desc: 'Sincronização NTP & ativação pós-instalação',
    color: COLORS.emerald,
  },
  {
    folder: '04_Config/',
    desc: 'autounattend.xml & parâmetros de deploy',
    color: COLORS.amber,
  },
  {
    folder: '05_App_Sistema/',
    desc: 'WinDeploy.exe — atualizável sem recriar WinPE',
    color: COLORS.cyanBright,
  },
];

const WINPE_CHECKS = [
  { label: 'winpeshl.ini → startnet.cmd', status: 'Auto-Launch' },
  { label: 'WMI Hardware Scan', status: 'NVMe 512 GB • 16 GB RAM' },
  { label: 'Firmware Detectado', status: 'UEFI (GPT) / Legacy OK' },
  { label: 'Partição DEPLOY_DATA', status: 'Montada em D:\\' },
  { label: 'Motor DISM / WIM XML', status: 'Win 11 Pro [Índice 1]' },
];

export const Scene2Boot: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const barIn = spring({ frame: frame - 18, fps, config: SPRING_SMOOTH });
  const bootCardIn = spring({ frame: frame - 26, fps, config: SPRING_SMOOTH });
  const dataCardIn = spring({ frame: frame - 52, fps, config: SPRING_SMOOTH });
  const rightPanelIn = spring({ frame: frame - 34, fps, config: SPRING_SMOOTH });

  // Animated SVG signal pulse
  const dashOffset = interpolate(frame, [0, 120], [0, -160]);
  const uefiHighlight = spring({ frame: frame - 42, fps, config: SPRING_SNAPPY });
  const legacyHighlight = spring({ frame: frame - 54, fps, config: SPRING_SNAPPY });
  const winpeReady = spring({ frame: frame - 72, fps, config: SPRING_SNAPPY });

  return (
    <AbsoluteFill style={{ fontFamily: FONTS.sans }}>
      <Backdrop accentShift={1} hudTag="STAGE 01 // HYBRID BOOT ARCHITECTURE" />

      <AbsoluteFill
        style={{
          padding: '56px 84px',
          display: 'flex',
          flexDirection: 'column',
          gap: 28,
        }}
      >
        <SceneHeader
          badge="01 // COMPATIBILIDADE & ESTRUTURA DE BOOT"
          title="Um Único Pendrive."
          highlight="Qualquer Hardware."
          subtitle="Particionamento híbrido UEFI (GPT) + Legacy (BIOS/MBR) com WinPE x64 e camada modular."
        />

        {/* Partition Bar Visual */}
        <div
          style={{
            padding: '18px 24px',
            borderRadius: 16,
            backgroundColor: COLORS.bgCard,
            border: `1px solid ${COLORS.border}`,
            opacity: barIn,
            transform: `translateY(${interpolate(barIn, [0, 1], [18, 0])}px)`,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Usb size={20} color={COLORS.cyan} />
              <span
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: 16,
                  fontWeight: 700,
                  color: COLORS.textPrimary,
                }}
              >
                USB_DEPLOY_MEDIA (32 GB) — LAYOUT DUAL-PARTITION
              </span>
            </div>
            <span
              style={{
                fontFamily: FONTS.mono,
                fontSize: 14,
                color: COLORS.emeraldBright,
              }}
            >
              ● PRONTO PARA BOOT EM BIOS E UEFI
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 10,
              height: 46,
              width: '100%',
            }}
          >
            {/* Partition 1 */}
            <div
              style={{
                width: `${interpolate(barIn, [0, 1], [5, 30])}%`,
                borderRadius: 10,
                background:
                  'linear-gradient(90deg, rgba(56, 189, 248, 0.28), rgba(56, 189, 248, 0.14))',
                border: `1.5px solid ${COLORS.cyan}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 16px',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
              }}
            >
              <span
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: 15,
                  fontWeight: 700,
                  color: COLORS.cyanBright,
                }}
              >
                DEPLOY_BOOT
              </span>
              <span
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: 13,
                  color: COLORS.textPrimary,
                }}
              >
                FAT32 • 1.5 GB • ATIVA
              </span>
            </div>

            {/* Partition 2 */}
            <div
              style={{
                flex: 1,
                borderRadius: 10,
                background:
                  'linear-gradient(90deg, rgba(16, 185, 129, 0.22), rgba(16, 185, 129, 0.08))',
                border: `1.5px solid ${COLORS.emerald}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 18px',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
              }}
            >
              <span
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: 15,
                  fontWeight: 700,
                  color: COLORS.emeraldBright,
                }}
              >
                DEPLOY_DATA (NTFS)
              </span>
              <span
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: 13,
                  color: COLORS.textSecondary,
                }}
              >
                ISOs &gt; 4 GB • DRIVERS • SCRIPTS • APP (.NET 8)
              </span>
            </div>
          </div>
        </div>

        {/* Main 2-column Technical Grid */}
        <div style={{ display: 'flex', gap: 28, flex: 1, minHeight: 0 }}>
          {/* Left Column: Dual Boot Flow + Modular Data Structure */}
          <div
            style={{
              flex: 1.25,
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
            }}
          >
            {/* Dual Boot Flow Card */}
            <div
              style={{
                padding: '22px 26px',
                borderRadius: 16,
                backgroundColor: COLORS.bgCard,
                border: `1px solid ${COLORS.borderCyan}`,
                opacity: bootCardIn,
                transform: `translateY(${interpolate(bootCardIn, [0, 1], [20, 0])}px)`,
              }}
            >
              <div
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  color: COLORS.cyan,
                  marginBottom: 16,
                }}
              >
                FLUXO DUAL-BOOT // PARTIÇÃO FAT32
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 14,
                }}
              >
                {/* UEFI & Legacy branches */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    width: '47%',
                  }}
                >
                  {/* UEFI Box */}
                  <div
                    style={{
                      padding: '12px 16px',
                      borderRadius: 12,
                      backgroundColor: 'rgba(56, 189, 248, 0.1)',
                      border: `1px solid ${COLORS.cyan}`,
                      transform: `scale(${interpolate(uefiHighlight, [0, 1], [0.92, 1])})`,
                      opacity: uefiHighlight,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 4,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 18,
                          fontWeight: 700,
                          color: COLORS.textPrimary,
                        }}
                      >
                        UEFI (GPT)
                      </span>
                      <span
                        style={{
                          fontFamily: FONTS.mono,
                          fontSize: 12,
                          padding: '2px 8px',
                          borderRadius: 6,
                          backgroundColor: 'rgba(56, 189, 248, 0.2)',
                          color: COLORS.cyanBright,
                        }}
                      >
                        x64 Moderno
                      </span>
                    </div>
                    <div
                      style={{
                        fontFamily: FONTS.mono,
                        fontSize: 13,
                        color: COLORS.textSecondary,
                      }}
                    >
                      efi\boot\bootx64.efi • bootmgr.efi
                    </div>
                  </div>

                  {/* Legacy Box */}
                  <div
                    style={{
                      padding: '12px 16px',
                      borderRadius: 12,
                      backgroundColor: 'rgba(129, 140, 248, 0.1)',
                      border: `1px solid ${COLORS.indigo}`,
                      transform: `scale(${interpolate(legacyHighlight, [0, 1], [0.92, 1])})`,
                      opacity: legacyHighlight,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 4,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 18,
                          fontWeight: 700,
                          color: COLORS.textPrimary,
                        }}
                      >
                        Legacy (BIOS / MBR)
                      </span>
                      <span
                        style={{
                          fontFamily: FONTS.mono,
                          fontSize: 12,
                          padding: '2px 8px',
                          borderRadius: 6,
                          backgroundColor: 'rgba(129, 140, 248, 0.22)',
                          color: '#C7D2FE',
                        }}
                      >
                        Compatível
                      </span>
                    </div>
                    <div
                      style={{
                        fontFamily: FONTS.mono,
                        fontSize: 13,
                        color: COLORS.textSecondary,
                      }}
                    >
                      bootmgr • bootsect /nt60 /mbr
                    </div>
                  </div>
                </div>

                {/* Animated SVG Converging Lines */}
                <svg width="90" height="120" viewBox="0 0 90 120">
                  <path
                    d="M 4 28 C 44 28, 44 60, 86 60"
                    fill="none"
                    stroke={COLORS.cyan}
                    strokeWidth="2.5"
                    strokeDasharray="6 6"
                    strokeDashoffset={dashOffset}
                  />
                  <path
                    d="M 4 92 C 44 92, 44 60, 86 60"
                    fill="none"
                    stroke={COLORS.indigo}
                    strokeWidth="2.5"
                    strokeDasharray="6 6"
                    strokeDashoffset={dashOffset}
                  />
                  <circle cx="84" cy="60" r="5" fill={COLORS.emerald} />
                </svg>

                {/* WinPE Target Box */}
                <div
                  style={{
                    width: '40%',
                    padding: '18px 18px',
                    borderRadius: 14,
                    background:
                      'linear-gradient(155deg, rgba(16, 185, 129, 0.16), rgba(17, 24, 39, 0.9))',
                    border: `1.5px solid ${COLORS.emerald}`,
                    boxShadow: '0 0 28px rgba(16, 185, 129, 0.16)',
                    opacity: winpeReady,
                    transform: `scale(${interpolate(winpeReady, [0, 1], [0.92, 1])})`,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 8,
                    }}
                  >
                    <Terminal size={20} color={COLORS.emeraldBright} />
                    <span
                      style={{
                        fontSize: 19,
                        fontWeight: 800,
                        color: COLORS.textPrimary,
                      }}
                    >
                      WinPE x64
                    </span>
                  </div>
                  <div
                    style={{
                      fontFamily: FONTS.mono,
                      fontSize: 13,
                      color: COLORS.emeraldBright,
                      marginBottom: 6,
                    }}
                  >
                    sources\boot.wim
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: COLORS.textSecondary,
                      lineHeight: 1.35,
                    }}
                  >
                    WMI + PowerShell + DISM + Auto-launch via{' '}
                    <span style={{ fontFamily: FONTS.mono, color: COLORS.textPrimary }}>
                      winpeshl.ini
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modular Folders Card */}
            <div
              style={{
                flex: 1,
                padding: '22px 26px',
                borderRadius: 16,
                backgroundColor: COLORS.bgCard,
                border: `1px solid ${COLORS.border}`,
                opacity: dataCardIn,
                transform: `translateY(${interpolate(dataCardIn, [0, 1], [20, 0])}px)`,
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}
            >
              <div
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  color: COLORS.emeraldBright,
                }}
              >
                ESTRUTURA MODULAR // DEPLOY_DATA (NTFS)
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 11, flex: 1, justifyContent: 'center' }}>
                {DATA_FOLDERS.map((item, idx) => {
                  const rowIn = spring({
                    frame: frame - 68 - idx * 9,
                    fps,
                    config: SPRING_SMOOTH,
                  });
                  return (
                    <div
                      key={item.folder}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '11px 16px',
                        borderRadius: 10,
                        backgroundColor: 'rgba(15, 23, 42, 0.72)',
                        border: `1px solid rgba(148, 163, 184, 0.12)`,
                        opacity: rowIn,
                        transform: `translateX(${interpolate(rowIn, [0, 1], [-18, 0])}px)`,
                      }}
                    >
                      <FolderOpen size={17} color={item.color} />
                      <span
                        style={{
                          fontFamily: FONTS.mono,
                          fontSize: 15,
                          fontWeight: 600,
                          color: item.color,
                          minWidth: 195,
                        }}
                      >
                        {item.folder}
                      </span>
                      <span
                        style={{
                          fontSize: 15,
                          color: COLORS.textSecondary,
                        }}
                      >
                        {item.desc}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Live WinPE Boot Environment Dashboard Mockup */}
          <div
            style={{
              flex: 0.9,
              borderRadius: 18,
              backgroundColor: COLORS.bgCode,
              border: `1px solid ${COLORS.borderCyan}`,
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.45)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              opacity: rightPanelIn,
              transform: `translateX(${interpolate(rightPanelIn, [0, 1], [32, 0])}px)`,
            }}
          >
            {/* Window Title Bar */}
            <div
              style={{
                padding: '14px 20px',
                backgroundColor: '#111827',
                borderBottom: `1px solid ${COLORS.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Monitor size={18} color={COLORS.cyan} />
                <span
                  style={{
                    fontFamily: FONTS.mono,
                    fontSize: 15,
                    fontWeight: 700,
                    color: COLORS.textPrimary,
                  }}
                >
                  WinDeploy.exe — WinPE x64
                </span>
              </div>
              <div style={{ display: 'flex', gap: 7 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#334155' }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#334155' }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: COLORS.emerald }} />
              </div>
            </div>

            {/* Body */}
            <div
              style={{
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                gap: 18,
                flex: 1,
              }}
            >
              {/* Hardware Summary Chips */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: 12,
                    backgroundColor: 'rgba(17, 24, 39, 0.9)',
                    border: `1px solid ${COLORS.border}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                    <Cpu size={15} color={COLORS.cyan} />
                    <span style={{ fontFamily: FONTS.mono, fontSize: 12, color: COLORS.textMuted }}>
                      FIRMWARE / ARCH
                    </span>
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: COLORS.textPrimary }}>
                    UEFI x64 • GPT Ready
                  </div>
                </div>

                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: 12,
                    backgroundColor: 'rgba(17, 24, 39, 0.9)',
                    border: `1px solid ${COLORS.border}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                    <HardDrive size={15} color={COLORS.emerald} />
                    <span style={{ fontFamily: FONTS.mono, fontSize: 12, color: COLORS.textMuted }}>
                      DISCO DESTINO (WMI)
                    </span>
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: COLORS.textPrimary }}>
                    Disk 0 • NVMe 512 GB
                  </div>
                </div>
              </div>

              {/* Boot Sequence Verification */}
              <div
                style={{
                  flex: 1,
                  padding: '18px 20px',
                  borderRadius: 14,
                  backgroundColor: 'rgba(11, 15, 25, 0.85)',
                  border: `1px solid ${COLORS.border}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                }}
              >
                <div
                  style={{
                    fontFamily: FONTS.mono,
                    fontSize: 13,
                    color: COLORS.textMuted,
                    letterSpacing: '0.08em',
                  }}
                >
                  INICIALIZAÇÃO & VERIFICAÇÃO DE INTEGRIDADE
                </div>

                {WINPE_CHECKS.map((chk, idx) => {
                  const itemIn = spring({
                    frame: frame - 80 - idx * 18,
                    fps,
                    config: SPRING_SNAPPY,
                  });
                  return (
                    <div
                      key={chk.label}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: 10,
                        backgroundColor: 'rgba(16, 185, 129, 0.07)',
                        border: `1px solid rgba(16, 185, 129, 0.24)`,
                        opacity: itemIn,
                        transform: `translateY(${interpolate(itemIn, [0, 1], [12, 0])}px)`,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <CheckCircle2 size={18} color={COLORS.emerald} />
                        <span
                          style={{
                            fontFamily: FONTS.mono,
                            fontSize: 14,
                            color: COLORS.textPrimary,
                          }}
                        >
                          {chk.label}
                        </span>
                      </div>
                      <span
                        style={{
                          fontFamily: FONTS.mono,
                          fontSize: 13,
                          fontWeight: 600,
                          color: COLORS.emeraldBright,
                        }}
                      >
                        {chk.status}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Ready Banner */}
              <div
                style={{
                  padding: '14px 18px',
                  borderRadius: 12,
                  background:
                    'linear-gradient(90deg, rgba(16, 185, 129, 0.2), rgba(56, 189, 248, 0.14))',
                  border: `1px solid ${COLORS.borderEmerald}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  opacity: spring({ frame: frame - 172, fps, config: SPRING_SMOOTH }),
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Shield size={20} color={COLORS.emeraldBright} />
                  <span style={{ fontSize: 16, fontWeight: 700, color: COLORS.textPrimary }}>
                    App .NET 8 SingleFile Carregado
                  </span>
                </div>
                <span
                  style={{
                    fontFamily: FONTS.mono,
                    fontSize: 13,
                    fontWeight: 700,
                    color: COLORS.emeraldBright,
                  }}
                >
                  READY
                </span>
              </div>
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
