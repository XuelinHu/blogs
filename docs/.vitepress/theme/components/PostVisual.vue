<script setup lang="ts">
defineProps<{
  emoji: string
  kind: string
}>()
</script>

<template>
  <div class="post-visual" :class="`post-visual--${kind}`">
    <span class="post-visual__emoji">{{ emoji }}</span>
    <span class="post-visual__orb post-visual__orb--one"></span>
    <span class="post-visual__orb post-visual__orb--two"></span>

    <svg class="post-visual__scene" viewBox="0 0 160 112" aria-hidden="true">
      <g v-if="kind === 'reinforcement'" class="scene scene--reinforcement">
        <path class="scene__dash" d="M25 82C50 30 89 92 133 32" />
        <circle class="scene__target-ring" cx="132" cy="31" r="15" />
        <circle class="scene__target-ring" cx="132" cy="31" r="8" />
        <circle class="scene__fill" cx="132" cy="31" r="3" />
        <g class="scene__bot">
          <rect class="scene__soft" x="20" y="54" width="34" height="28" rx="10" />
          <rect class="scene__fill" x="25" y="60" width="24" height="14" rx="6" />
          <circle class="scene__dark" cx="33" cy="66" r="2.2" />
          <circle class="scene__dark" cx="42" cy="66" r="2.2" />
          <path class="scene__thin" d="M32 72c3 3 8 3 11 0M37 54v-7" />
          <circle class="scene__fill" cx="37" cy="45" r="3" />
        </g>
        <circle class="scene__particle scene__particle--one" cx="75" cy="44" r="3" />
        <circle class="scene__particle scene__particle--two" cx="95" cy="72" r="2.5" />
      </g>

      <g v-else-if="kind === 'urdf'" class="scene scene--urdf">
        <path class="scene__ground" d="M19 91h122" />
        <path class="scene__link scene__link--one" d="M46 82L74 59" />
        <path class="scene__link scene__link--two" d="M76 57l31-20" />
        <circle class="scene__joint" cx="45" cy="83" r="10" />
        <circle class="scene__joint" cx="75" cy="58" r="9" />
        <circle class="scene__joint" cx="108" cy="36" r="8" />
        <path class="scene__gripper" d="M115 32l13-7m-13 15 14 4" />
        <path class="scene__axis scene__axis--x" d="M45 83h26" />
        <path class="scene__axis scene__axis--y" d="M45 83V56" />
        <circle class="scene__fill" cx="45" cy="83" r="3" />
        <circle class="scene__fill" cx="75" cy="58" r="3" />
        <circle class="scene__fill" cx="108" cy="36" r="3" />
      </g>

      <g v-else-if="kind === 'robot'" class="scene scene--robot">
        <path class="scene__ground" d="M23 92h114" />
        <g class="scene__walking-bot">
          <path class="scene__thin" d="M80 24v-8" />
          <circle class="scene__fill" cx="80" cy="13" r="3" />
          <rect class="scene__soft" x="58" y="24" width="44" height="31" rx="12" />
          <rect class="scene__fill" x="64" y="31" width="32" height="17" rx="7" />
          <circle class="scene__dark" cx="74" cy="39" r="2.5" />
          <circle class="scene__dark" cx="87" cy="39" r="2.5" />
          <path class="scene__thin" d="M74 46c3 3 10 3 13 0" />
          <rect class="scene__soft" x="63" y="57" width="35" height="26" rx="9" />
          <path class="scene__limb scene__limb--left" d="M66 61L52 77" />
          <path class="scene__limb scene__limb--right" d="M95 61l14 14" />
          <path class="scene__leg scene__leg--left" d="M73 82L63 96" />
          <path class="scene__leg scene__leg--right" d="M88 82l11 14" />
        </g>
      </g>

      <g v-else-if="kind === 'attention'" class="scene scene--attention">
        <path class="scene__attention-line" d="M31 76C52 18 79 22 91 76M58 76C77 35 103 32 128 76M31 76c30-28 63-28 97 0" />
        <g class="scene__tokens">
          <rect x="19" y="75" width="25" height="17" rx="5" />
          <rect x="53" y="75" width="25" height="17" rx="5" />
          <rect x="87" y="75" width="25" height="17" rx="5" />
          <rect x="121" y="75" width="25" height="17" rx="5" />
        </g>
        <circle class="scene__particle scene__particle--one" cx="62" cy="31" r="4" />
        <circle class="scene__particle scene__particle--two" cx="101" cy="28" r="3" />
        <path class="scene__spark" d="M126 20v13m-6-6h12" />
      </g>

      <g v-else-if="kind === 'vision'" class="scene scene--vision">
        <rect class="scene__frame" x="27" y="20" width="82" height="72" rx="11" />
        <g class="scene__pixels">
          <rect x="38" y="31" width="16" height="16" rx="3" />
          <rect x="58" y="31" width="16" height="16" rx="3" />
          <rect x="78" y="31" width="16" height="16" rx="3" />
          <rect x="38" y="51" width="16" height="16" rx="3" />
          <rect x="58" y="51" width="16" height="16" rx="3" />
          <rect x="78" y="51" width="16" height="16" rx="3" />
          <rect x="38" y="71" width="16" height="10" rx="3" />
          <rect x="58" y="71" width="16" height="10" rx="3" />
          <rect x="78" y="71" width="16" height="10" rx="3" />
        </g>
        <circle class="scene__lens" cx="112" cy="70" r="19" />
        <circle class="scene__lens-inner" cx="112" cy="70" r="8" />
        <path class="scene__lens-handle" d="M126 84l12 12" />
        <path class="scene__scan" d="M31 52h74" />
      </g>

      <g v-else-if="kind === 'sequence'" class="scene scene--sequence">
        <path class="scene__sequence-line" d="M18 59h124" />
        <path class="scene__arrow" d="M36 59l7-5m-7 5 7 5M72 59l7-5m-7 5 7 5M108 59l7-5m-7 5 7 5" />
        <g class="scene__cells">
          <rect x="14" y="40" width="27" height="38" rx="8" />
          <rect x="50" y="40" width="27" height="38" rx="8" />
          <rect x="86" y="40" width="27" height="38" rx="8" />
          <rect x="122" y="40" width="24" height="38" rx="8" />
        </g>
        <circle class="scene__gate scene__gate--one" cx="27" cy="59" r="5" />
        <circle class="scene__gate scene__gate--two" cx="63" cy="59" r="5" />
        <circle class="scene__gate scene__gate--three" cx="99" cy="59" r="5" />
        <circle class="scene__gate scene__gate--four" cx="134" cy="59" r="5" />
        <path class="scene__wave" d="M18 28c12-16 20 16 32 0s20 16 32 0 20 16 32 0 20 16 28 2" />
      </g>

      <g v-else-if="kind === 'memory'" class="scene scene--memory">
        <path class="scene__memory-loop" d="M31 55c0-19 15-34 34-34h30c20 0 35 15 35 34S115 89 95 89H65" />
        <path class="scene__memory-arrow" d="m68 82-9 7 9 7" />
        <rect class="scene__memory-cell" x="42" y="39" width="76" height="40" rx="13" />
        <circle class="scene__memory-gate scene__memory-gate--forget" cx="61" cy="59" r="9" />
        <circle class="scene__memory-gate scene__memory-gate--input" cx="80" cy="59" r="9" />
        <circle class="scene__memory-gate scene__memory-gate--output" cx="99" cy="59" r="9" />
        <path class="scene__memory-symbol" d="M57 59h8M80 55v8M95 56l8 6m-8 0 8-6" />
        <circle class="scene__particle scene__particle--one" cx="33" cy="29" r="3" />
        <circle class="scene__particle scene__particle--two" cx="130" cy="84" r="2.5" />
      </g>

      <g v-else-if="kind === 'network'" class="scene scene--network">
        <path class="scene__network-lines" d="M28 56l38-25m-38 25 38 24m0-49 34 25M66 80l34-24m0 0 31-27m-31 27 31 28" />
        <circle class="scene__node scene__node--one" cx="28" cy="56" r="9" />
        <circle class="scene__node scene__node--two" cx="66" cy="31" r="8" />
        <circle class="scene__node scene__node--three" cx="66" cy="80" r="8" />
        <circle class="scene__node scene__node--four" cx="100" cy="56" r="10" />
        <circle class="scene__node scene__node--five" cx="131" cy="29" r="7" />
        <circle class="scene__node scene__node--six" cx="131" cy="84" r="7" />
      </g>

      <g v-else-if="kind === 'java'" class="scene scene--java">
        <path class="scene__steam scene__steam--one" d="M67 46c-9-10 8-13 1-24" />
        <path class="scene__steam scene__steam--two" d="M84 46c-8-9 9-14 2-27" />
        <path class="scene__cup" d="M48 48h58v27c0 13-10 23-23 23H71c-13 0-23-10-23-23V48Z" />
        <path class="scene__cup-handle" d="M106 57h9c19 0 18 26 1 26h-11" />
        <path class="scene__coffee" d="M53 54h48" />
        <path class="scene__spark" d="M31 30v15m-7-7h14M126 24v12m-6-6h12" />
      </g>

      <g v-else-if="kind === 'database'" class="scene scene--database">
        <ellipse class="scene__db-top" cx="80" cy="29" rx="43" ry="14" />
        <path class="scene__db-body" d="M37 29v22c0 8 19 14 43 14s43-6 43-14V29M37 51v22c0 8 19 14 43 14s43-6 43-14V51M37 73v12c0 8 19 14 43 14s43-6 43-14V73" />
        <path class="scene__db-glow" d="M48 55c17 7 47 8 65 0" />
        <circle class="scene__particle scene__particle--one" cx="51" cy="37" r="3" />
        <circle class="scene__particle scene__particle--two" cx="61" cy="40" r="2" />
      </g>

      <g v-else-if="kind === 'testing'" class="scene scene--testing">
        <rect class="scene__window" x="24" y="22" width="112" height="72" rx="10" />
        <path class="scene__window-bar" d="M24 38h112" />
        <circle class="scene__fill" cx="34" cy="30" r="3" />
        <circle class="scene__fill" cx="44" cy="30" r="3" />
        <path class="scene__check scene__check--one" d="m39 56 7 7 13-16" />
        <path class="scene__check scene__check--two" d="m39 78 7 7 13-16" />
        <path class="scene__test-line" d="M68 57h46M68 79h36" />
        <circle class="scene__scanner" cx="116" cy="78" r="13" />
      </g>

      <g v-else-if="kind === 'reading'" class="scene scene--reading">
        <path class="scene__book" d="M24 32c20-6 39 0 56 13v49C62 81 44 77 24 82V32Zm112 0c-20-6-39 0-56 13v49c18-13 36-17 56-12V32Z" />
        <path class="scene__book-line" d="M35 45c13-2 24 1 34 7M35 57c13-2 24 1 34 7M125 45c-13-2-24 1-34 7M125 57c-13-2-24 1-34 7" />
        <path class="scene__spark" d="M80 15v15m-7-7h14" />
      </g>

      <g v-else class="scene scene--code">
        <rect class="scene__window" x="23" y="20" width="114" height="76" rx="10" />
        <path class="scene__window-bar" d="M23 37h114" />
        <circle class="scene__fill" cx="34" cy="29" r="3" />
        <circle class="scene__fill" cx="44" cy="29" r="3" />
        <circle class="scene__fill" cx="54" cy="29" r="3" />
        <path class="scene__code-brackets" d="m53 56-12 11 12 11m54-22 12 11-12 11M91 48 69 86" />
        <path class="scene__cursor" d="M96 83h18" />
      </g>
    </svg>
  </div>
</template>

<style scoped>
.post-visual {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 122px;
  overflow: hidden;
  color: rgb(255 255 255 / 0.94);
}

.post-visual__emoji {
  position: absolute;
  z-index: 3;
  top: 10px;
  left: 10px;
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border: 1px solid rgb(255 255 255 / 0.35);
  border-radius: 10px;
  background: rgb(255 255 255 / 0.18);
  box-shadow: 0 6px 18px rgb(15 23 42 / 0.12);
  font-size: 17px;
  line-height: 1;
  backdrop-filter: blur(5px);
  transition: transform 0.3s ease;
}

.post-visual:hover .post-visual__emoji {
  transform: rotate(-8deg) scale(1.08);
}

.post-visual__scene {
  position: absolute;
  inset: 3px 0 0;
  z-index: 2;
  width: 100%;
  height: 100%;
  overflow: visible;
  filter: drop-shadow(0 5px 8px rgb(15 23 42 / 0.12));
  transition: transform 0.36s ease;
}

.post-visual:hover .post-visual__scene {
  transform: translateY(-2px) scale(1.025);
}

.post-visual__orb {
  position: absolute;
  z-index: 1;
  border-radius: 50%;
  background: rgb(255 255 255 / 0.14);
}

.post-visual__orb--one {
  top: -29px;
  right: -20px;
  width: 88px;
  height: 88px;
}

.post-visual__orb--two {
  bottom: -38px;
  left: 22px;
  width: 72px;
  height: 72px;
}

.scene__thin,
.scene__dash,
.scene__ground,
.scene__link,
.scene__gripper,
.scene__axis,
.scene__limb,
.scene__leg,
.scene__attention-line,
.scene__spark,
.scene__lens-handle,
.scene__scan,
.scene__sequence-line,
.scene__arrow,
.scene__wave,
.scene__network-lines,
.scene__steam,
.scene__cup,
.scene__cup-handle,
.scene__coffee,
.scene__db-body,
.scene__db-glow,
.scene__window-bar,
.scene__check,
.scene__test-line,
.scene__book,
.scene__book-line,
.scene__code-brackets,
.scene__cursor {
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.scene__thin { stroke-width: 2; }
.scene__soft { fill: rgb(255 255 255 / 0.3); stroke: currentColor; stroke-width: 2; }
.scene__fill { fill: currentColor; }
.scene__dark { fill: rgb(15 23 42 / 0.82); }
.scene__particle { fill: currentColor; opacity: 0.75; }
.scene__dash { stroke-width: 2.3; stroke-dasharray: 5 6; }
.scene__target-ring { fill: none; stroke: currentColor; stroke-width: 2.2; }
.scene__ground { stroke-width: 2.5; opacity: 0.55; }
.scene__link { stroke-width: 9; }
.scene__joint { fill: rgb(255 255 255 / 0.22); stroke: currentColor; stroke-width: 3; }
.scene__gripper { stroke-width: 4; }
.scene__axis { stroke-width: 2; opacity: 0.7; }
.scene__axis--x { stroke: #fde68a; }
.scene__axis--y { stroke: #bbf7d0; }
.scene__limb, .scene__leg { stroke-width: 8; }
.scene__attention-line { stroke-width: 2; opacity: 0.72; }
.scene__tokens rect { fill: rgb(255 255 255 / 0.22); stroke: currentColor; stroke-width: 2; }
.scene__spark { stroke-width: 2.5; }
.scene__frame, .scene__window { fill: rgb(255 255 255 / 0.13); stroke: currentColor; stroke-width: 2.5; }
.scene__pixels rect { fill: rgb(255 255 255 / 0.2); stroke: currentColor; stroke-width: 1.5; }
.scene__pixels rect:nth-child(2n) { fill: rgb(255 255 255 / 0.42); }
.scene__lens { fill: rgb(255 255 255 / 0.17); stroke: currentColor; stroke-width: 3; }
.scene__lens-inner { fill: none; stroke: currentColor; stroke-width: 2; }
.scene__lens-handle { stroke-width: 6; }
.scene__scan { stroke-width: 3; filter: drop-shadow(0 0 5px white); }
.scene__sequence-line, .scene__arrow { stroke-width: 2; }
.scene__cells rect { fill: rgb(255 255 255 / 0.18); stroke: currentColor; stroke-width: 2; }
.scene__gate { fill: currentColor; }
.scene__wave { stroke-width: 2.2; opacity: 0.72; }
.scene__memory-loop,
.scene__memory-arrow,
.scene__memory-symbol {
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.scene__memory-loop { stroke-width: 2.5; stroke-dasharray: 5 5; opacity: 0.72; }
.scene__memory-arrow { stroke-width: 3; }
.scene__memory-cell { fill: rgb(255 255 255 / 0.18); stroke: currentColor; stroke-width: 2.5; }
.scene__memory-gate { fill: rgb(255 255 255 / 0.25); stroke: currentColor; stroke-width: 1.8; }
.scene__memory-symbol { stroke-width: 2; }
.scene__network-lines { stroke-width: 2; opacity: 0.65; }
.scene__node { fill: rgb(255 255 255 / 0.28); stroke: currentColor; stroke-width: 2.5; }
.scene__steam { stroke-width: 3; }
.scene__cup { fill: rgb(255 255 255 / 0.14); stroke-width: 3; }
.scene__cup-handle { stroke-width: 5; }
.scene__coffee { stroke-width: 4; }
.scene__db-top { fill: rgb(255 255 255 / 0.24); stroke: currentColor; stroke-width: 2.5; }
.scene__db-body { stroke-width: 2.5; }
.scene__db-glow { stroke-width: 2; opacity: 0.65; }
.scene__window-bar { stroke-width: 2; opacity: 0.75; }
.scene__check { stroke-width: 4; }
.scene__test-line { stroke-width: 3; opacity: 0.7; }
.scene__scanner { fill: none; stroke: currentColor; stroke-width: 2; stroke-dasharray: 4 4; }
.scene__book { fill: rgb(255 255 255 / 0.14); stroke-width: 2.5; }
.scene__book-line { stroke-width: 2; opacity: 0.65; }
.scene__code-brackets { stroke-width: 4; }
.scene__cursor { stroke-width: 3; }

.post-visual:hover .scene__dash,
.post-visual:hover .scene__scanner {
  animation: dash-run 1.1s linear infinite;
}

.post-visual:hover .scene__bot,
.post-visual:hover .scene__walking-bot {
  animation: mini-bot-bob 0.42s ease-in-out infinite alternate;
}

.post-visual:hover .scene__link--one { animation: arm-link-one 1.1s ease-in-out infinite alternate; }
.post-visual:hover .scene__link--two { animation: arm-link-two 1.1s ease-in-out infinite alternate; }
.post-visual:hover .scene__scan { animation: scan-image 1.2s ease-in-out infinite alternate; }
.post-visual:hover .scene__attention-line { animation: attention-glow 1.1s ease-in-out infinite alternate; }
.post-visual:hover .scene__gate { animation: gate-pulse 0.8s ease-in-out infinite alternate; }
.post-visual:hover .scene__memory-loop { animation: dash-run 1.1s linear infinite; }
.post-visual:hover .scene__memory-gate { animation: gate-pulse 0.8s ease-in-out infinite alternate; }
.post-visual:hover .scene__node { animation: node-pulse 0.9s ease-in-out infinite alternate; }
.post-visual:hover .scene__steam { animation: steam-rise 1.2s ease-in-out infinite; }
.post-visual:hover .scene__db-top { animation: db-lift 0.9s ease-in-out infinite alternate; }
.post-visual:hover .scene__cursor { animation: cursor-blink 0.7s steps(1) infinite; }

@keyframes dash-run { to { stroke-dashoffset: -22; } }
@keyframes mini-bot-bob { to { transform: translateY(-4px) rotate(1deg); } }
@keyframes arm-link-one { to { transform: translate(2px, -2px); } }
@keyframes arm-link-two { to { transform: translate(-2px, 2px); } }
@keyframes scan-image { from { transform: translateY(-15px); } to { transform: translateY(24px); } }
@keyframes attention-glow { to { opacity: 1; filter: drop-shadow(0 0 5px white); } }
@keyframes gate-pulse { to { transform: scale(1.3); transform-origin: center; } }
@keyframes node-pulse { to { filter: drop-shadow(0 0 7px white); } }
@keyframes steam-rise { 50% { transform: translateY(-5px); opacity: 0.45; } }
@keyframes db-lift { to { transform: translateY(-3px); } }
@keyframes cursor-blink { 50% { opacity: 0; } }

@media (prefers-reduced-motion: reduce) {
  .post-visual *,
  .post-visual__scene,
  .post-visual__emoji {
    animation: none !important;
    transition: none !important;
  }
}
</style>
