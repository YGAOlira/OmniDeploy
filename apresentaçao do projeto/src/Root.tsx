import React from 'react';
import { Composition } from 'remotion';
import { MainVideo } from './MainVideo';
import { VerticalLinkedIn, VERTICAL_VIDEO } from './VerticalLinkedIn';
import { Scene1Intro } from './scenes/Scene1Intro';
import { Scene2Boot } from './scenes/Scene2Boot';
import { Scene3Unattend } from './scenes/Scene3Unattend';
import { Scene4PostInstall } from './scenes/Scene4PostInstall';
import { Scene5Stack } from './scenes/Scene5Stack';
import { TOTAL_DURATION_FRAMES, VIDEO } from './theme';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="VerticalLinkedIn"
        component={VerticalLinkedIn}
        durationInFrames={VERTICAL_VIDEO.durationInFrames}
        fps={VERTICAL_VIDEO.fps}
        width={VERTICAL_VIDEO.width}
        height={VERTICAL_VIDEO.height}
      />
      <Composition
        id="MainVideo"
        component={MainVideo}
        durationInFrames={TOTAL_DURATION_FRAMES}
        fps={VIDEO.fps}
        width={VIDEO.width}
        height={VIDEO.height}
      />
      <Composition
        id="Scene1Intro"
        component={Scene1Intro}
        durationInFrames={VIDEO.scenes.intro}
        fps={VIDEO.fps}
        width={VIDEO.width}
        height={VIDEO.height}
      />
      <Composition
        id="Scene2Boot"
        component={Scene2Boot}
        durationInFrames={VIDEO.scenes.boot}
        fps={VIDEO.fps}
        width={VIDEO.width}
        height={VIDEO.height}
      />
      <Composition
        id="Scene3Unattend"
        component={Scene3Unattend}
        durationInFrames={VIDEO.scenes.unattend}
        fps={VIDEO.fps}
        width={VIDEO.width}
        height={VIDEO.height}
      />
      <Composition
        id="Scene4PostInstall"
        component={Scene4PostInstall}
        durationInFrames={VIDEO.scenes.postInstall}
        fps={VIDEO.fps}
        width={VIDEO.width}
        height={VIDEO.height}
      />
      <Composition
        id="Scene5Stack"
        component={Scene5Stack}
        durationInFrames={VIDEO.scenes.stack}
        fps={VIDEO.fps}
        width={VIDEO.width}
        height={VIDEO.height}
      />
    </>
  );
};
