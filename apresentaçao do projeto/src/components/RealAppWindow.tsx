import React from 'react';
import {
  Check,
  Copy,
  Monitor,
  RefreshCw,
  Shield,
  Terminal,
  X,
} from 'lucide-react';
import { FONTS } from '../theme';

// Cores exatas do tema Dark.xaml do aplicativo WPF
export const APP = {
  bg: '#0A0F1C',
  surface: '#111827',
  surface2: '#172033',
  surface3: '#1E2A42',
  border: '#26344F',
  accent: '#3B82F6',
  accent2: '#6366F1',
  text: '#E6EAF2',
  muted: '#8C9AB3',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  selectedBg: '#142449',
} as const;

export const WIZARD_STEPS = [
  { id: 0, tit: 'Disco de destino', sub: 'Seleção e particionamento' },
  { id: 1, tit: 'Imagem e edição', sub: 'WIM/ESD + índice DISM' },
  { id: 2, tit: 'Modo de implantação', sub: 'Intune, Bypass ou Zero-Touch' },
  { id: 3, tit: 'Drivers sob demanda', sub: 'Injeção de drivers e teclado' },
  { id: 4, tit: 'Pós-instalação', sub: 'NTP e ativação do Windows' },
  { id: 5, tit: 'Execução e console', sub: 'Resumo e terminal ao vivo' },
];

export interface LogEntry {
  time: string;
  msg: string;
  color: string;
  bold?: boolean;
  thresholdPct: number;
}

// 100% sanitizado (sem siglas corporativas, sem chave real, sem servidor interno)
export const CONSOLE_LOGS: LogEntry[] = [
  {
    time: '14:02:01',
    msg: '═══ INÍCIO DA IMPLANTAÇÃO WINDEPLOY v1.0 ═══',
    color: '#60A5FA',
    bold: true,
    thresholdPct: 0,
  },
  {
    time: '14:02:01',
    msg: 'Disco 0 (Samsung NVMe 476.9 GB) | Boot: UEFI (GPT) | Win11 Pro [Idx 2]',
    color: '#CBD5E1',
    thresholdPct: 2,
  },
  {
    time: '14:02:02',
    msg: '> diskpart /s X:\\Temp\\deploy_diskpart.txt',
    color: '#22D3EE',
    thresholdPct: 6,
  },
  {
    time: '14:02:03',
    msg: '✓ GPT criado: EFI (100MB) + MSR + Windows (W:) + WinRE (R:)',
    color: '#34D399',
    thresholdPct: 12,
  },
  {
    time: '14:02:04',
    msg: '> dism /Apply-Image /ImageFile:D:\\01_ISOs\\Win11_Pro.wim /Index:2 /ApplyDir:W:\\',
    color: '#22D3EE',
    thresholdPct: 18,
  },
  {
    time: '14:02:08',
    msg: 'Progresso DISM: [==================   64.2%          ]',
    color: '#94A3B8',
    thresholdPct: 45,
  },
  {
    time: '14:02:11',
    msg: '✓ Imagem aplicada com êxito em W:\\ (100.0%)',
    color: '#34D399',
    thresholdPct: 72,
  },
  {
    time: '14:02:12',
    msg: '> reagentc /Setreimage /Path R:\\Recovery\\WindowsRE /Target W:\\Windows',
    color: '#22D3EE',
    thresholdPct: 78,
  },
  {
    time: '14:02:13',
    msg: '> bcdboot W:\\Windows /s S: /f UEFI /l pt-BR   →   ✓ Boot UEFI gravado',
    color: '#34D399',
    thresholdPct: 84,
  },
  {
    time: '14:02:14',
    msg: '> dism /Image:W:\\ /Add-Driver /Driver:D:\\02_Drivers /Recurse',
    color: '#22D3EE',
    thresholdPct: 89,
  },
  {
    time: '14:02:15',
    msg: '> reg load HKLM\\OFF_SYS → BypassTPM / SecureBoot / RAM + Scancode ABNT2',
    color: '#22D3EE',
    thresholdPct: 93,
  },
  {
    time: '14:02:16',
    msg: '✓ unattend.xml (ZERO-TOUCH) + SetupComplete.cmd (NTP: time.windows.com)',
    color: '#34D399',
    thresholdPct: 97,
  },
  {
    time: '14:02:17',
    msg: '═══ IMPLANTAÇÃO CONCLUÍDA COM SUCESSO! ═══',
    color: '#34D399',
    bold: true,
    thresholdPct: 100,
  },
];

export interface RealAppWindowProps {
  step: number; // 0..5
  selectedMode?: 'intune' | 'bypass' | 'zerotouch';
  execProgress?: number; // 0..100 when step === 5
  execSeconds?: number;
  highlightButton?: 'proximo' | 'iniciar' | null;
}

export const RealAppWindow: React.FC<RealAppWindowProps> = ({
  step,
  selectedMode = 'zerotouch',
  execProgress = 0,
  execSeconds = 0,
  highlightButton = null,
}) => {
  const phaseLabel =
    execProgress >= 100
      ? '✓ Implantação concluída com sucesso!'
      : execProgress >= 95
        ? '[8/8] Gerando SetupComplete.cmd (NTP + Ativação)...'
        : execProgress >= 91
          ? '[6/8] Aplicando ajustes offline no Registro...'
          : execProgress >= 86
            ? '[5/8] Injetando drivers sob demanda...'
            : execProgress >= 80
              ? '[4/8] Gravando inicialização UEFI (bcdboot)...'
              : execProgress >= 74
                ? '[3/8] Configurando WinRE...'
                : execProgress >= 15
                  ? '[2/8] Aplicando imagem do Windows via DISM...'
                  : '[1/8] Particionando disco com diskpart...';

  const mins = String(Math.floor(execSeconds / 60)).padStart(2, '0');
  const secs = String(execSeconds % 60).padStart(2, '0');

  const stepTitle =
    step === 0
      ? 'Selecione o disco de destino'
      : step === 1
        ? 'Imagem e edição do Windows'
        : step === 2
          ? 'Modo de implantação'
          : step === 3
            ? 'Drivers sob demanda'
            : step === 4
              ? 'Scripts pós-instalação'
              : 'Execução e terminal em tempo real';

  return (
    <div
      style={{
        width: 1320,
        height: 820,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: FONTS.sans,
        color: APP.text,
      }}
    >
      {/* Top WinPE Simulated Environment Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 8px 10px',
          fontSize: 12,
          color: '#94A3B8',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              width: 9,
              height: 9,
              borderRadius: '50%',
              backgroundColor: APP.success,
              boxShadow: `0 0 8px ${APP.success}`,
            }}
          />
          <span style={{ fontFamily: FONTS.mono, fontWeight: 600, color: '#E2E8F0' }}>
            Windows PE 10.0.26100 (x64)
          </span>
          <span style={{ color: '#475569' }}>|</span>
          <span>Unidade RAM: X:\ (Boot)</span>
        </div>
        <div
          style={{
            backgroundColor: 'rgba(23, 37, 84, 0.7)',
            border: '1px solid rgba(30, 64, 175, 0.55)',
            color: '#93C5FD',
            padding: '2px 10px',
            borderRadius: 6,
            fontFamily: FONTS.mono,
            fontSize: 11.5,
          }}
        >
          winpeshl.ini → WinDeploy.exe
        </div>
      </div>

      {/* Main WPF App Window */}
      <div
        style={{
          flex: 1,
          borderRadius: 18,
          overflow: 'hidden',
          border: `1.5px solid ${APP.border}`,
          background: 'radial-gradient(circle at 50% 50%, #0D1527 0%, #060913 100%)',
          boxShadow: '0 32px 70px rgba(0, 0, 0, 0.85), 0 0 0 1px #1F293D',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* 1. CABEÇALHO (fiel ao header-gradient do HTML) */}
        <div
          style={{
            background: 'linear-gradient(90deg, #0F1A33 0%, #111827 60%, #16123A 100%)',
            borderBottom: `1px solid ${APP.border}`,
            padding: '14px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)',
                boxShadow: '0 8px 20px rgba(59, 130, 246, 0.28)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Monitor size={21} color="#FFFFFF" strokeWidth={2.2} />
              <span
                style={{
                  fontSize: 8,
                  fontWeight: 800,
                  letterSpacing: '0.12em',
                  color: '#FFFFFF',
                  marginTop: 1,
                }}
              >
                DEPLOY
              </span>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20, fontWeight: 700, color: '#FFFFFF' }}>
                  Mídia de Formatação WinDeploy
                </span>
                <span
                  style={{
                    backgroundColor: '#1D3A6E',
                    border: '1px solid rgba(59, 130, 246, 0.5)',
                    color: '#93C5FD',
                    fontSize: 12,
                    fontWeight: 700,
                    padding: '2px 9px',
                    borderRadius: 6,
                  }}
                >
                  v1.0
                </span>
              </div>
              <div style={{ fontSize: 12, color: APP.muted, marginTop: 2 }}>
                Engine Automatizado de Implantação Windows 11 (x64)
              </div>
            </div>
          </div>

          {/* Real-time environment pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <EnvPill dotColor="#C084FC" text="Windows PE" />
            <EnvPill dotColor="#34D399" label="Boot:" text="UEFI (GPT)" />
            <EnvPill dotColor="#60A5FA" text="DEPLOY_DATA em D:" accentText />
            <div
              style={{
                marginLeft: 6,
                padding: 7,
                borderRadius: 8,
                color: '#94A3B8',
              }}
            >
              <X size={16} />
            </div>
          </div>
        </div>

        {/* 2. CORPO PRINCIPAL (Lateral 320px + Wizard Principal) */}
        <div
          style={{
            flex: 1,
            padding: 18,
            display: 'flex',
            gap: 18,
            overflow: 'hidden',
          }}
        >
          {/* LATERAL ESQUERDA */}
          <div
            style={{
              width: 315,
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            {/* Card 1: Diagnóstico de Hardware (WMI) */}
            <div
              style={{
                backgroundColor: APP.surface,
                border: `1px solid ${APP.border}`,
                borderRadius: 12,
                padding: 14,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: `1px solid ${APP.border}`,
                  paddingBottom: 8,
                  marginBottom: 10,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: APP.muted,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}
                >
                  Diagnóstico de Hardware
                </span>
                <span
                  style={{
                    fontFamily: FONTS.mono,
                    fontSize: 10.5,
                    color: '#34D399',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      backgroundColor: '#34D399',
                    }}
                  />
                  WMI OK
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: APP.muted, textTransform: 'uppercase' }}>
                    Fabricante / Modelo
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: '#FFFFFF', marginTop: 2 }}>
                    Lenovo ThinkPad T14 Gen 2
                  </div>
                  <div style={{ fontFamily: FONTS.mono, fontSize: 10.5, color: '#94A3B8' }}>
                    Workstation Corporativa x64
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: APP.muted, textTransform: 'uppercase' }}>
                    Processador
                  </div>
                  <div style={{ fontSize: 11.5, color: '#E2E8F0', marginTop: 2 }}>
                    Intel Core i7-1185G7 @ 3.00GHz (4C/8T)
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: APP.muted, textTransform: 'uppercase' }}>
                    Número de Série / Service Tag
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: APP.surface2,
                      border: `1px solid ${APP.border}`,
                      borderRadius: 8,
                      padding: '5px 9px',
                      marginTop: 4,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: FONTS.mono,
                        fontSize: 13,
                        fontWeight: 700,
                        color: '#FCD34D',
                      }}
                    >
                      SN-8420-DEMO
                    </span>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 10.5,
                        backgroundColor: APP.surface3,
                        border: `1px solid ${APP.border}`,
                        borderRadius: 5,
                        padding: '2px 7px',
                        color: '#CBD5E1',
                      }}
                    >
                      <Copy size={10} /> Copiar
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: APP.muted, textTransform: 'uppercase' }}>
                    Memória RAM
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#E2E8F0' }}>
                    16.0 GB DDR4
                  </span>
                </div>
              </div>

              <div
                style={{
                  marginTop: 10,
                  backgroundColor: 'rgba(6, 78, 59, 0.35)',
                  border: '1px solid rgba(6, 95, 70, 0.5)',
                  borderRadius: 8,
                  padding: '7px 9px',
                  fontSize: 10.5,
                  color: '#6EE7B7',
                  lineHeight: 1.35,
                }}
              >
                ✓ Sem bloqueios de TPM 2.0, Secure Boot ou RAM mínima via DISM.
              </div>
            </div>

            {/* Card 2: Lista de Etapas do Wizard */}
            <div
              style={{
                flex: 1,
                backgroundColor: APP.surface,
                border: `1px solid ${APP.border}`,
                borderRadius: 12,
                padding: '10px 10px',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: APP.muted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                  padding: '2px 8px 6px',
                }}
              >
                Etapas da Implantação
              </div>

              {WIZARD_STEPS.map((etp, idx) => {
                const ativo = idx === step;
                const concluido = idx < step || (step === 5 && execProgress >= 100);
                return (
                  <div
                    key={etp.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '7px 9px',
                      borderRadius: 10,
                      backgroundColor: ativo ? '#16264A' : 'transparent',
                      border: ativo
                        ? '1px solid rgba(59, 130, 246, 0.38)'
                        : '1px solid transparent',
                    }}
                  >
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        fontWeight: 700,
                        background: concluido
                          ? APP.success
                          : ativo
                            ? 'linear-gradient(135deg, #3B82F6, #6366F1)'
                            : APP.surface3,
                        border: concluido
                          ? `1px solid ${APP.success}`
                          : ativo
                            ? `1px solid ${APP.accent}`
                            : `1px solid ${APP.border}`,
                        color: concluido || ativo ? '#FFFFFF' : APP.muted,
                      }}
                    >
                      {concluido ? <Check size={13} strokeWidth={3} /> : idx + 1}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 12.5,
                          fontWeight: ativo ? 700 : concluido ? 600 : 500,
                          color: ativo ? '#FFFFFF' : concluido ? '#E2E8F0' : APP.muted,
                          lineHeight: 1.2,
                        }}
                      >
                        {etp.tit}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: '#64748B',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {etp.sub}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ÁREA CENTRAL DO WIZARD */}
          <div
            style={{
              flex: 1,
              backgroundColor: APP.surface,
              border: `1px solid ${APP.border}`,
              borderRadius: 12,
              padding: '20px 24px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Header da Etapa */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: `1px solid ${APP.border}`,
                paddingBottom: 12,
                marginBottom: 16,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: '#60A5FA',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  Etapa {step + 1} de 6 • {WIZARD_STEPS[step].tit}
                </div>
                <div style={{ fontSize: 21, fontWeight: 700, color: '#FFFFFF', marginTop: 3 }}>
                  {stepTitle}
                </div>
              </div>

              {step === 0 && (
                <div
                  style={{
                    backgroundColor: APP.surface3,
                    border: `1px solid ${APP.border}`,
                    color: '#CBD5E1',
                    padding: '6px 12px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <RefreshCw size={13} /> Atualizar Discos
                </div>
              )}
            </div>

            {/* Conteúdo Dinâmico da Etapa */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
              {step === 0 && <Step0Disk />}
              {step === 1 && <Step1Image />}
              {step === 2 && <Step2Mode selectedMode={selectedMode} />}
              {step === 3 && <Step3Drivers />}
              {step === 4 && <Step4PostInstall />}
              {step === 5 && (
                <Step5Execution
                  progress={execProgress}
                  phaseLabel={phaseLabel}
                  timeText={`${mins}:${secs}`}
                />
              )}
            </div>
          </div>
        </div>

        {/* 3. RODAPÉ FIXO (fiel ao HTML) */}
        <div
          style={{
            backgroundColor: APP.surface,
            borderTop: `1px solid ${APP.border}`,
            padding: '12px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                backgroundColor: APP.surface3,
                border: `1px solid ${APP.border}`,
                color: '#E2E8F0',
                padding: '7px 14px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 7,
              }}
            >
              <span style={{ fontFamily: FONTS.mono, color: '#60A5FA' }}>&gt;_</span>
              Prompt (CMD)
            </div>
            <div
              style={{
                backgroundColor: APP.surface3,
                border: `1px solid ${APP.border}`,
                color: '#CBD5E1',
                padding: '7px 14px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              Desligar
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                backgroundColor: APP.surface3,
                border: `1px solid ${APP.border}`,
                color: '#CBD5E1',
                padding: '8px 18px',
                borderRadius: 8,
                fontSize: 12.5,
                fontWeight: 600,
                opacity: step === 0 || step === 5 ? 0.4 : 1,
              }}
            >
              ← Voltar
            </div>
            {step < 5 ? (
              <div
                style={{
                  background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)',
                  color: '#FFFFFF',
                  padding: '8px 22px',
                  borderRadius: 8,
                  fontSize: 12.5,
                  fontWeight: 700,
                  boxShadow:
                    highlightButton === 'proximo'
                      ? '0 0 24px rgba(59, 130, 246, 0.85)'
                      : '0 6px 18px rgba(59, 130, 246, 0.25)',
                  transform: highlightButton === 'proximo' ? 'scale(0.96)' : 'scale(1)',
                }}
              >
                Próximo →
              </div>
            ) : (
              <div
                style={{
                  backgroundColor: execProgress >= 100 ? APP.success : APP.surface3,
                  color: '#FFFFFF',
                  padding: '8px 22px',
                  borderRadius: 8,
                  fontSize: 12.5,
                  fontWeight: 700,
                }}
              >
                {execProgress >= 100 ? '✓ Concluído' : 'Executando...'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const EnvPill: React.FC<{
  dotColor: string;
  label?: string;
  text: string;
  accentText?: boolean;
}> = ({ dotColor, label, text, accentText }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 7,
      backgroundColor: APP.surface3,
      border: `1px solid ${APP.border}`,
      padding: '5px 12px',
      borderRadius: 999,
      fontSize: 12,
    }}
  >
    <span
      style={{
        width: 7,
        height: 7,
        borderRadius: '50%',
        backgroundColor: dotColor,
      }}
    />
    {label && <span style={{ color: APP.muted }}>{label}</span>}
    <span
      style={{
        fontWeight: 600,
        color: accentText ? '#BFDBFE' : '#F8FAFC',
      }}
    >
      {text}
    </span>
  </div>
);

/* ---------------- ETAPA 1: DISCO DE DESTINO ---------------- */
const Step0Disk: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
    <div style={{ fontSize: 13, color: APP.muted }}>
      O disco escolhido será totalmente limpo e reparticionado. O pendrive de boot é ocultado automaticamente por segurança.
    </div>

    {/* Disco 0 Selecionado */}
    <div
      style={{
        backgroundColor: APP.selectedBg,
        border: `2px solid ${APP.accent}`,
        borderRadius: 12,
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 9,
            backgroundColor: APP.surface3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: FONTS.mono,
            fontWeight: 700,
            color: '#60A5FA',
            fontSize: 15,
          }}
        >
          D0
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 700, color: '#FFFFFF' }}>
            Disco 0 • NVMe Samsung MZVLB512HBJQ
            <span
              style={{
                backgroundColor: 'rgba(30, 58, 138, 0.7)',
                border: '1px solid rgba(29, 78, 216, 0.6)',
                color: '#93C5FD',
                fontSize: 10.5,
                padding: '2px 8px',
                borderRadius: 5,
              }}
            >
              Recomendado
            </span>
          </div>
          <div style={{ fontSize: 12.5, color: APP.muted, marginTop: 3 }}>
            476.9 GB • Barramento NVMe • Mídia SSD • Tabela Atual: GPT
          </div>
        </div>
      </div>
      <div style={{ fontFamily: FONTS.mono, fontSize: 17, fontWeight: 700, color: '#60A5FA' }}>
        476.9 GB
      </div>
    </div>

    {/* Disco 1 */}
    <div
      style={{
        backgroundColor: APP.surface,
        border: `1.5px solid ${APP.border}`,
        borderRadius: 12,
        padding: '13px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 9,
            backgroundColor: APP.surface3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: FONTS.mono,
            fontWeight: 700,
            color: '#94A3B8',
            fontSize: 15,
          }}
        >
          D1
        </div>
        <div>
          <div style={{ fontSize: 14.5, fontWeight: 600, color: '#FFFFFF' }}>
            Disco 1 • Seagate Barracuda ST1000LM048
          </div>
          <div style={{ fontSize: 12.5, color: APP.muted, marginTop: 3 }}>
            931.5 GB • Barramento SATA • Mídia HDD • Tabela Atual: GPT
          </div>
        </div>
      </div>
      <div style={{ fontFamily: FONTS.mono, fontSize: 16, fontWeight: 700, color: '#CBD5E1' }}>
        931.5 GB
      </div>
    </div>

    {/* Aviso de Disco Oculto */}
    <div
      style={{
        backgroundColor: 'rgba(120, 53, 15, 0.25)',
        border: '1px solid rgba(180, 83, 9, 0.45)',
        borderRadius: 10,
        padding: '9px 14px',
        fontSize: 12,
        color: '#FBBF24',
        display: 'flex',
        alignItems: 'center',
        gap: 9,
      }}
    >
      <Shield size={15} color="#FBBF24" />
      <span>
        <strong>Ocultos por segurança:</strong> Disco 2 (Pendrive Boot USB 3.0 32GB em D:).
      </span>
    </div>

    {/* Mapa Visual de Partições (EFI + MSR + Windows + WinRE) */}
    <div
      style={{
        backgroundColor: APP.surface2,
        border: `1px solid ${APP.border}`,
        borderRadius: 12,
        padding: 16,
        marginTop: 2,
      }}
    >
      <div
        style={{
          fontSize: 11.5,
          fontWeight: 700,
          color: APP.muted,
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
          marginBottom: 4,
        }}
      >
        Layout de Partições Planejado (Modo UEFI GPT)
      </div>
      <div style={{ fontSize: 12.5, color: '#94A3B8', marginBottom: 12 }}>
        Tabela GPT particionada automaticamente: EFI (FAT32) + MSR + Windows (NTFS) + WinRE (Recuperação).
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr 7.8fr 2.1fr', gap: 7, height: 60 }}>
        <div
          style={{
            backgroundColor: '#D97706',
            borderRadius: 8,
            padding: '6px 9px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 800, color: '#FFFFFF' }}>EFI</div>
          <div style={{ fontSize: 10, color: '#FEF3C7' }}>100 MB</div>
        </div>
        <div
          style={{
            backgroundColor: '#475569',
            borderRadius: 8,
            padding: '6px 9px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 800, color: '#FFFFFF' }}>MSR</div>
          <div style={{ fontSize: 10, color: '#E2E8F0' }}>16 MB</div>
        </div>
        <div
          style={{
            backgroundColor: '#2563EB',
            borderRadius: 8,
            padding: '6px 14px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, fontWeight: 800, color: '#FFFFFF' }}>
            <span>Windows (C:)</span>
            <span
              style={{
                fontSize: 10.5,
                backgroundColor: 'rgba(30, 58, 138, 0.7)',
                padding: '1px 7px',
                borderRadius: 5,
              }}
            >
              NTFS
            </span>
          </div>
          <div style={{ fontSize: 11.5, color: '#DBEAFE' }}>
            475.8 GB (Restante do Disco)
          </div>
        </div>
        <div
          style={{
            backgroundColor: '#059669',
            borderRadius: 8,
            padding: '6px 10px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 800, color: '#FFFFFF' }}>WinRE</div>
          <div style={{ fontSize: 10, color: '#D1FAE5' }}>1024 MB</div>
        </div>
      </div>
    </div>
  </div>
);

/* ---------------- ETAPA 2: IMAGEM E EDIÇÃO ---------------- */
const Step1Image: React.FC = () => {
  const editions = [
    { idx: 1, name: 'Windows 11 Home Single Language', desc: 'Edição doméstica offline', size: '16.2 GB', active: false },
    { idx: 2, name: 'Windows 11 Pro', desc: 'Domínio, BitLocker, Hyper-V, Intune / Autopilot', size: '16.4 GB', active: true },
    { idx: 3, name: 'Windows 11 Enterprise', desc: 'Grandes corporações e licenciamento por volume', size: '16.4 GB', active: false },
    { idx: 4, name: 'Windows 11 Education', desc: 'Ambientes acadêmicos e laboratórios', size: '16.3 GB', active: false },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '5fr 7fr', gap: 18 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: APP.muted, textTransform: 'uppercase' }}>
          Arquivo de Imagem (01_ISOs_Imagens\)
        </div>
        <div
          style={{
            backgroundColor: APP.selectedBg,
            border: `2px solid ${APP.accent}`,
            borderRadius: 12,
            padding: 14,
          }}
        >
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span
              style={{
                backgroundColor: '#1E3A8A',
                color: '#BFDBFE',
                fontSize: 10.5,
                fontWeight: 800,
                padding: '2px 7px',
                borderRadius: 5,
              }}
            >
              WIM
            </span>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#FFFFFF', wordBreak: 'break-all' }}>
                Win11_Pro_26H2_x64_PT-BR.wim
              </div>
              <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 5 }}>
                Tamanho: 7.71 GB • Metadados DISM OK
              </div>
            </div>
          </div>
        </div>
        <div
          style={{
            backgroundColor: APP.surface2,
            border: `1px solid ${APP.border}`,
            borderRadius: 10,
            padding: 12,
            fontSize: 12,
            color: '#94A3B8',
            lineHeight: 1.45,
          }}
        >
          Imagem WIM/ESD lida diretamente via cabeçalho XML ou DISM, sem depender de ferramentas externas.
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: APP.muted, textTransform: 'uppercase' }}>
            Edição do Windows (Índice DISM)
          </span>
          <span style={{ fontSize: 12, color: '#60A5FA', fontWeight: 600 }}>4 edições detectadas</span>
        </div>

        {editions.map((ed) => (
          <div
            key={ed.idx}
            style={{
              backgroundColor: ed.active ? APP.selectedBg : APP.surface,
              border: ed.active ? `2px solid ${APP.accent}` : `1.5px solid ${APP.border}`,
              borderRadius: 11,
              padding: '11px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 7,
                  backgroundColor: ed.active ? '#2563EB' : APP.surface3,
                  color: ed.active ? '#FFFFFF' : '#CBD5E1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: 13,
                }}
              >
                {ed.idx}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, fontWeight: 700, color: '#FFFFFF' }}>
                  {ed.name}
                  {ed.active && (
                    <span
                      style={{
                        backgroundColor: 'rgba(30, 58, 138, 0.85)',
                        color: '#BFDBFE',
                        fontSize: 10,
                        padding: '1px 7px',
                        borderRadius: 4,
                      }}
                    >
                      Recomendado
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 2 }}>{ed.desc}</div>
              </div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: ed.active ? '#93C5FD' : '#94A3B8' }}>
              {ed.size}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ---------------- ETAPA 3: MODO DE IMPLANTAÇÃO ---------------- */
const Step2Mode: React.FC<{ selectedMode: 'intune' | 'bypass' | 'zerotouch' }> = ({
  selectedMode,
}) => {
  const modes = [
    {
      id: 'intune' as const,
      title: 'Corporativo / Intune',
      tag: 'Entra ID • Windows Autopilot',
      tagBg: 'rgba(30, 58, 138, 0.65)',
      tagColor: '#93C5FD',
      tagBorder: 'rgba(29, 78, 216, 0.5)',
      desc: 'OOBE limpo sem unattend de usuário. Pronto para ingresso no Microsoft Entra ID e provisionamento automático via Intune.',
    },
    {
      id: 'bypass' as const,
      title: 'Bypass / Conta Local Offline',
      tag: 'unattend_bypass.xml',
      tagBg: 'rgba(120, 53, 15, 0.55)',
      tagColor: '#FCD34D',
      tagBorder: 'rgba(180, 83, 9, 0.5)',
      desc: 'Injeta bypass em C:\\Windows\\Panther\\unattend.xml e ativa BypassNRO. Permite criar conta local offline sem exigir Wi-Fi.',
    },
    {
      id: 'zerotouch' as const,
      title: 'Zero-Touch Bancada',
      tag: 'unattend_zerotouch.xml',
      tagBg: 'rgba(6, 78, 59, 0.6)',
      tagColor: '#6EE7B7',
      tagBorder: 'rgba(5, 150, 105, 0.55)',
      desc: 'Automatização total de bancada. Cria conta local WORKGROUP\\Admin, pula todas as telas do OOBE e faz logon direto no Desktop.',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ fontSize: 13, color: APP.muted }}>
        Define como o Windows se comportará durante o primeiro boot (experiência OOBE).
      </div>

      {modes.map((m) => {
        const active = selectedMode === m.id;
        return (
          <div
            key={m.id}
            style={{
              backgroundColor: active ? APP.selectedBg : APP.surface,
              border: active ? `2px solid ${APP.accent}` : `1.5px solid ${APP.border}`,
              borderRadius: 13,
              padding: '16px 18px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 14,
              boxShadow: active ? '0 0 24px rgba(59, 130, 246, 0.18)' : 'none',
            }}
          >
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                marginTop: 2,
                border: `2px solid ${active ? APP.accent : '#475569'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {active && (
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    backgroundColor: APP.accent,
                  }}
                />
              )}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF' }}>{m.title}</span>
                <span
                  style={{
                    backgroundColor: m.tagBg,
                    color: m.tagColor,
                    border: `1px solid ${m.tagBorder}`,
                    fontFamily: FONTS.mono,
                    fontSize: 11,
                    fontWeight: 600,
                    padding: '2px 9px',
                    borderRadius: 6,
                  }}
                >
                  {m.tag}
                </span>
              </div>
              <div style={{ fontSize: 13, color: '#CBD5E1', marginTop: 6, lineHeight: 1.45 }}>
                {m.desc}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ---------------- ETAPA 4: DRIVERS SOB DEMANDA ---------------- */
const Step3Drivers: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
    <div
      style={{
        backgroundColor: 'rgba(23, 37, 84, 0.45)',
        border: '1px solid rgba(30, 64, 175, 0.55)',
        borderRadius: 12,
        padding: '13px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#BFDBFE' }}>
          Hardware Detectado (WMI): Lenovo ThinkPad T14 Gen 2
        </div>
        <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 3 }}>
          Pacote de drivers e correção ABNT2 pré-selecionados automaticamente para este modelo.
        </div>
      </div>
      <span
        style={{
          backgroundColor: APP.surface3,
          border: `1px solid ${APP.border}`,
          color: '#CBD5E1',
          padding: '5px 12px',
          borderRadius: 7,
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        Reescanear
      </span>
    </div>

    {[
      {
        name: 'Lenovo_ThinkPad_Teclado',
        badge: 'Recomendado para este hardware',
        desc: 'Correção ABNT2 (Scancode Map no Registro) • Aplicado offline na imagem',
        checked: true,
        status: 'Ativo',
      },
      {
        name: 'Chipset_NVMe_Storage_x64',
        badge: '14 arquivos .inf',
        desc: 'Injeção recursiva via DISM /Add-Driver /Recurse antes do primeiro boot',
        checked: true,
        status: 'Ativo',
      },
      {
        name: 'Intel_WiFi6E_Ethernet',
        badge: '8 arquivos .inf',
        desc: 'Conectividade de rede pronta na primeira inicialização',
        checked: true,
        status: 'Ativo',
      },
    ].map((d) => (
      <div
        key={d.name}
        style={{
          backgroundColor: APP.selectedBg,
          border: `2px solid ${APP.accent}`,
          borderRadius: 12,
          padding: '13px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: 5,
              backgroundColor: APP.accent,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Check size={14} color="#FFFFFF" strokeWidth={3} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 14.5, fontWeight: 700, color: '#FFFFFF' }}>
              {d.name}
              <span
                style={{
                  backgroundColor: 'rgba(6, 78, 59, 0.75)',
                  border: '1px solid rgba(5, 150, 105, 0.55)',
                  color: '#6EE7B7',
                  fontSize: 10.5,
                  padding: '2px 8px',
                  borderRadius: 5,
                }}
              >
                {d.badge}
              </span>
            </div>
            <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 3 }}>{d.desc}</div>
          </div>
        </div>
        <span style={{ fontFamily: FONTS.mono, fontSize: 12.5, fontWeight: 700, color: '#34D399' }}>
          {d.status}
        </span>
      </div>
    ))}
  </div>
);

/* ---------------- ETAPA 5: PÓS-INSTALAÇÃO (SANITIZADA) ---------------- */
const Step4PostInstall: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
    <div style={{ fontSize: 13, color: APP.muted }}>
      Compilado automaticamente em{' '}
      <span style={{ fontFamily: FONTS.mono, color: '#93C5FD' }}>
        C:\Windows\Setup\Scripts\SetupComplete.cmd
      </span>{' '}
      e disparado na finalização do setup.
    </div>

    {/* NTP Card (Sanitizado: time.windows.com / pool.ntp.org) */}
    <div
      style={{
        backgroundColor: APP.surface2,
        border: `1.5px solid ${APP.accent}`,
        borderRadius: 12,
        padding: '15px 18px',
        display: 'flex',
        gap: 13,
      }}
    >
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: 5,
          backgroundColor: APP.accent,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 2,
          flexShrink: 0,
        }}
      >
        <Check size={14} color="#FFFFFF" strokeWidth={3} />
      </div>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF' }}>
          Sincronização de Horário Oficial (NTP)
        </div>
        <div style={{ fontSize: 12.5, color: '#94A3B8', marginTop: 4, lineHeight: 1.45 }}>
          Define fuso horário <span style={{ fontFamily: FONTS.mono, color: '#E2E8F0' }}>E. South America Standard Time</span>, ativa o serviço <span style={{ fontFamily: FONTS.mono, color: '#E2E8F0' }}>w32time</span> e sincroniza com{' '}
          <strong style={{ color: '#93C5FD' }}>time.windows.com / pool.ntp.org</strong>.
        </div>
      </div>
    </div>

    {/* Ativação Card (Sanitizado: XXXXX-XXXXX...) */}
    <div
      style={{
        backgroundColor: APP.surface2,
        border: `1.5px solid ${APP.accent}`,
        borderRadius: 12,
        padding: '15px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', gap: 13 }}>
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: 5,
            backgroundColor: APP.accent,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 2,
            flexShrink: 0,
          }}
        >
          <Check size={14} color="#FFFFFF" strokeWidth={3} />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF' }}>
            Ativação Automática do Windows 11 Pro
          </div>
          <div style={{ fontSize: 12.5, color: '#94A3B8', marginTop: 3 }}>
            Executa <span style={{ fontFamily: FONTS.mono, color: '#E2E8F0' }}>slmgr.vbs /ipk</span> e{' '}
            <span style={{ fontFamily: FONTS.mono, color: '#E2E8F0' }}>slmgr.vbs /ato</span> silenciosamente e remove o script ao concluir.
          </div>
        </div>
      </div>

      <div
        style={{
          paddingLeft: 33,
          paddingTop: 10,
          borderTop: `1px solid ${APP.border}`,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 600, color: '#CBD5E1' }}>
          Chave de Produto (Sanitizada / KMS)
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              flex: 1,
              backgroundColor: APP.bg,
              border: `1px solid ${APP.border}`,
              borderRadius: 8,
              padding: '9px 14px',
              fontFamily: FONTS.mono,
              fontSize: 14.5,
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: '#FCD34D',
            }}
          >
            XXXXX-XXXXX-XXXXX-XXXXX-XXXXX
          </div>
          <div
            style={{
              backgroundColor: APP.surface3,
              border: `1px solid ${APP.border}`,
              color: '#CBD5E1',
              padding: '9px 14px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            Mascarada
          </div>
        </div>
      </div>
    </div>
  </div>
);

/* ---------------- ETAPA 6: EXECUÇÃO E CONSOLE AO VIVO ---------------- */
const Step5Execution: React.FC<{
  progress: number;
  phaseLabel: string;
  timeText: string;
}> = ({ progress, phaseLabel, timeText }) => {
  const visibleLogs = CONSOLE_LOGS.filter((l) => progress >= l.thresholdPct);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
      {/* Barra de Progresso */}
      <div
        style={{
          backgroundColor: APP.surface2,
          border: `1px solid ${APP.border}`,
          borderRadius: 12,
          padding: '13px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 9,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
          <span style={{ fontWeight: 700, color: progress >= 100 ? '#34D399' : '#FFFFFF' }}>
            {phaseLabel}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontFamily: FONTS.mono }}>
            <span style={{ color: '#94A3B8', fontSize: 12 }}>
              Tempo: <strong style={{ color: '#E2E8F0' }}>{timeText}</strong>
            </span>
            <span
              style={{
                color: progress >= 100 ? '#34D399' : '#60A5FA',
                fontWeight: 800,
                fontSize: 16,
              }}
            >
              {Math.round(progress)}%
            </span>
          </div>
        </div>
        <div
          style={{
            width: '100%',
            height: 12,
            borderRadius: 999,
            backgroundColor: APP.surface3,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              borderRadius: 999,
              background:
                progress >= 100
                  ? 'linear-gradient(90deg, #10B981, #34D399)'
                  : 'linear-gradient(90deg, #3B82F6, #6366F1)',
            }}
          />
        </div>
      </div>

      {/* Terminal Embutido */}
      <div
        style={{
          flex: 1,
          backgroundColor: '#060A14',
          border: `1px solid ${APP.border}`,
          borderRadius: 12,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: FONTS.mono,
          fontVariantLigatures: 'none',
        }}
      >
        <div
          style={{
            backgroundColor: '#0B1222',
            borderBottom: `1px solid ${APP.border}`,
            padding: '7px 14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 11,
            color: '#94A3B8',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#EF4444' }} />
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#F59E0B' }} />
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10B981' }} />
            <Terminal size={12} color="#94A3B8" style={{ marginLeft: 4 }} />
            <span style={{ color: '#CBD5E1' }}>Console ao Vivo — WinDeploy (STDIO)</span>
          </div>
          <span style={{ color: '#64748B' }}>Deployment Engine v1.0</span>
        </div>

        <div
          style={{
            flex: 1,
            padding: '12px 15px',
            display: 'flex',
            flexDirection: 'column',
            gap: 5,
            fontSize: 12,
            lineHeight: 1.42,
            overflow: 'hidden',
          }}
        >
          {visibleLogs.map((entry, idx) => (
            <div key={idx} style={{ color: entry.color, fontWeight: entry.bold ? 700 : 400 }}>
              <span style={{ color: '#475569', marginRight: 7 }}>[{entry.time}]</span>
              {entry.msg}
            </div>
          ))}
        </div>
      </div>

      {/* Banner de Conclusão */}
      {progress >= 100 && (
        <div
          style={{
            backgroundColor: 'rgba(6, 78, 59, 0.4)',
            border: '1px solid rgba(16, 185, 129, 0.55)',
            borderRadius: 11,
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: 12.5, fontWeight: 600, color: '#6EE7B7' }}>
            ✓ Windows 11 instalado e configurado! Remova o pendrive e reinicie.
          </span>
          <span
            style={{
              backgroundColor: '#059669',
              color: '#FFFFFF',
              fontSize: 12,
              fontWeight: 700,
              padding: '6px 14px',
              borderRadius: 8,
            }}
          >
            Reiniciar Agora
          </span>
        </div>
      )}
    </div>
  );
};
