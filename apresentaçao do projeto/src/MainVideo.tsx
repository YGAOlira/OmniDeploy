import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';
import { Scene1Intro } from './scenes/Scene1Intro';
import { Scene2Boot } from './scenes/Scene2Boot';
import { Scene3Unattend } from './scenes/Scene3Unattend';
import { Scene4PostInstall } from './scenes/Scene4PostInstall';
import { Scene5Stack } from './scenes/Scene5Stack';
import { COLORS, FONTS, TOTAL_DURATION_FRAMES, VIDEO } from './theme';

export const MainVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const progressPct = interpolate(
    frame,
    [0, TOTAL_DURATION_FRAMES - 1],
    [0, 100],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const timing = linearTiming({ durationInFrames: VIDEO.transitionFrames });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, fontFamily: FONTS.sans }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={VIDEO.scenes.intro}>
          <Scene1Intro />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: 'from-right' })}
          timing={timing}
        />

        <TransitionSeries.Sequence durationInFrames={VIDEO.scenes.boot}>
          <Scene2Boot />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={timing} />

        <TransitionSeries.Sequence durationInFrames={VIDEO.scenes.unattend}>
          <Scene3Unattend />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: 'from-right' })}
          timing={timing}
        />

        <TransitionSeries.Sequence durationInFrames={VIDEO.scenes.postInstall}>
          <Scene4PostInstall />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={timing} />

        <TransitionSeries.Sequence durationInFrames={VIDEO.scenes.stack}>
          <Scene5Stack />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      {/* Ultra-clean global timeline progress bar along bottom edge */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 4,
          backgroundColor: 'rgba(148, 163, 184, 0.14)',
          zIndex: 50,
        }}
      >
        <div
          style={{
            width: `${progressPct}%`,
            height: '100%',
            background: `linear-gradient(90deg, ${COLORS.cyan}, ${COLORS.emerald})`,
            boxShadow: `0 0 12px ${COLORS.cyan}`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
