export const COLORS = {
  bg: '#0B0F19',
  bgElevated: '#111827',
  bgCard: 'rgba(17, 24, 39, 0.78)',
  bgCardSolid: '#121A2A',
  bgCode: '#0D1322',
  border: 'rgba(148, 163, 184, 0.16)',
  borderCyan: 'rgba(56, 189, 248, 0.35)',
  borderEmerald: 'rgba(16, 185, 129, 0.38)',
  cyan: '#38BDF8',
  cyanBright: '#7DD3FC',
  cyanDeep: '#0284C7',
  emerald: '#10B981',
  emeraldBright: '#34D399',
  indigo: '#818CF8',
  amber: '#FBBF24',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
} as const;

export const FONTS = {
  sans: '"Inter", "Segoe UI", system-ui, -apple-system, sans-serif',
  mono: '"JetBrains Mono", "Cascadia Code", Consolas, monospace',
} as const;

export const VIDEO = {
  width: 1920,
  height: 1080,
  fps: 30,
  transitionFrames: 15,
  scenes: {
    intro: 165, // 5.5s
    boot: 260, // 8.67s
    unattend: 345, // 11.5s
    postInstall: 285, // 9.5s
    stack: 205, // 6.83s
  },
} as const;

// 165 + 260 + 345 + 285 + 205 - (4 * 15) = 1200 frames = 40.0s
export const TOTAL_DURATION_FRAMES =
  VIDEO.scenes.intro +
  VIDEO.scenes.boot +
  VIDEO.scenes.unattend +
  VIDEO.scenes.postInstall +
  VIDEO.scenes.stack -
  4 * VIDEO.transitionFrames;

export const SPRING_SMOOTH = {
  damping: 200,
  mass: 0.9,
  stiffness: 120,
};

export const SPRING_SNAPPY = {
  damping: 18,
  mass: 0.75,
  stiffness: 170,
};
