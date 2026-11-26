<script lang="ts">
  // Event 1, Stop (spec, Rules 2.1; reference design/reference/1-event-stop-mid-play.png).
  // One-line how-to and Ready; then the first tap anywhere stops the marker. Three goes.
  // Raw result in plain ink; no colour for good or bad, no comparison during the round.
  import EventHeader from '../components/EventHeader.svelte';
  import Mark from '../components/Mark.svelte';
  import { game, stopParams } from '../lib/config';
  import { generateStop, markerAt, signedOff, stopResult, type StopResult } from '../lib/events/stop';

  let {
    card,
    date,
    onresult,
    onnext,
  }: { card: number; date: string; onresult: (r: StopResult) => void; onnext: () => void } = $props();

  const info = game('stop');
  const p = stopParams();
  const stop = $derived(generateStop(card));

  type Phase = 'ready' | 'running' | 'between' | 'done';
  let phase: Phase = $state('ready');
  let go = $state(0); // index of the current go
  let pos = $state(0);
  let dir: 1 | -1 = $state(1);
  let offs: number[] = $state([]);
  let started = 0;
  let frame = 0;
  let pause: ReturnType<typeof setTimeout> | undefined;

  const goNow = $derived(stop.goes[Math.min(go, stop.goes.length - 1)]);

  function begin() {
    phase = 'running';
    started = performance.now();
    pos = 0;
    tick();
  }

  function tick() {
    const m = markerAt(performance.now() - started, goNow.sweepMs);
    pos = m.pos;
    dir = m.dir;
    frame = requestAnimationFrame(tick);
  }

  function tap(e: PointerEvent) {
    if (phase !== 'running') return;
    e.preventDefault();
    cancelAnimationFrame(frame);
    const m = markerAt(performance.now() - started, goNow.sweepMs);
    pos = m.pos;
    offs = [...offs, signedOff(m.pos, m.dir, goNow.notch)];
    if (offs.length >= stop.goes.length) {
      phase = 'done';
      onresult(stopResult(offs));
    } else {
      phase = 'between';
      pause = setTimeout(() => {
        go += 1;
        begin();
      }, p.pauseBetweenGoesMs);
    }
  }

  $effect(() => {
    if (phase !== 'running') return;
    window.addEventListener('pointerdown', tap);
    return () => window.removeEventListener('pointerdown', tap);
  });

  $effect(() => () => {
    cancelAnimationFrame(frame);
    clearTimeout(pause);
  });

  const fmt = (o: number) => `${Math.abs(o).toFixed(p.resultDecimals)}% off`;
  const result = $derived(offs.length === stop.goes.length ? stopResult(offs) : null);
</script>

<section class="screen" class:live={phase === 'running'}>
  <EventHeader {card} {date} current="stop" />

  <div class="game">
    <div class="gh">
      <div class="chip" style:--event={info.colour}><Mark id="stop" /></div>
      <h1 class="n">{info.name}</h1>
      <div class="g">Go {Math.min(offs.length + (phase === 'between' ? 0 : 1), stop.goes.length)} of {stop.goes.length}</div>
    </div>
    <p class="how">{info.how}</p>

    <div class="lane" style:--n={goNow.notch} style:--p={pos} aria-hidden="true">
      <div class="tape"></div>
      <div class="runner" class:back={dir === -1}></div>
    </div>

    <div class="tries">
      {#each stop.goes as _, i (i)}
        <span class:done={i < offs.length}>{i < offs.length ? fmt(offs[i]) : `Go ${i + 1}`}</span>
      {/each}
    </div>
  </div>

  <div class="foot">
    {#if phase === 'ready'}
      <button class="pill" onclick={begin}>Ready</button>
    {:else if phase === 'running'}
      <p class="hint">Tap anywhere to stop</p>
    {:else if phase === 'between'}
      <p class="hint">Go {offs.length + 1} next</p>
    {:else if result}
      <p class="raw">{result.mean.toFixed(p.resultDecimals)}% off the notch, on average</p>
      <button class="pill next" onclick={onnext}>Next</button>
    {/if}
  </div>
</section>

<style>
  .screen {
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
  }
  .screen.live {
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
  }
  .game {
    margin: var(--space-8) var(--space-4) 0;
    background: var(--chalk);
    border: var(--line) solid var(--ink);
    border-radius: var(--r-card);
    padding: var(--space-5);
    box-shadow: var(--shadow-m);
  }
  .gh {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }
  .chip {
    width: var(--chip);
    height: var(--chip);
    border-radius: var(--r-m);
    display: grid;
    place-items: center;
    border: var(--line) solid var(--ink);
    background: var(--event);
    color: var(--chalk);
    flex: none;
  }
  .n {
    font-family: var(--font-display);
    font-weight: var(--w-regular);
    font-size: var(--size-title);
    line-height: var(--lh-tight);
  }
  .g {
    margin-left: auto;
    font-weight: var(--w-bold);
    font-size: var(--size-m);
    background: var(--paper);
    border: var(--line-thin) solid var(--ink);
    border-radius: var(--r-pill);
    padding: var(--space-1) var(--space-3);
    white-space: nowrap;
  }
  .how {
    color: var(--ink-soft);
    margin-top: var(--space-2);
    font-size: var(--size-m);
  }
  .lane {
    position: relative;
    height: var(--lane-h);
    margin: var(--space-6) 0 var(--space-2);
    border-radius: var(--r-l);
    background: var(--track);
    border: var(--line) solid var(--ink);
    overflow: hidden;
  }
  /* the two white lane lines */
  .lane::before,
  .lane::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    height: var(--line);
    background: var(--white);
  }
  .lane::before {
    top: 27%;
  }
  .lane::after {
    top: 70%;
  }
  .tape {
    position: absolute;
    top: 0;
    bottom: 0;
    width: var(--tape-w);
    left: calc((100% - var(--runner)) * var(--n) + (var(--runner) - var(--tape-w)) / 2);
    background: repeating-linear-gradient(0deg, var(--white) 0 var(--tape-stripe), var(--stop) var(--tape-stripe) calc(2 * var(--tape-stripe)));
    border-left: var(--line) solid var(--ink);
    border-right: var(--line) solid var(--ink);
  }
  .runner {
    position: absolute;
    top: 50%;
    width: var(--runner);
    height: var(--runner);
    left: calc((100% - var(--runner)) * var(--p));
    transform: translateY(-50%);
    border-radius: var(--r-round);
    background: var(--chalk);
    border: var(--line) solid var(--ink);
    box-shadow: var(--shadow-trail);
  }
  .runner.back {
    transform: translateY(-50%) scaleX(-1);
  }
  .next {
    margin-top: var(--space-4);
  }
  .tries {
    display: flex;
    gap: var(--space-2);
  }
  .tries span {
    flex: 1;
    text-align: center;
    border: var(--line) solid var(--ink);
    border-radius: var(--r-m);
    padding: var(--space-2) 0;
    font-weight: var(--w-bold);
    background: var(--paper);
    color: var(--dim);
  }
  .tries span.done {
    background: var(--chalk);
    color: var(--ink);
  }
  .foot {
    margin-top: auto;
    padding: var(--space-6) var(--space-5) var(--space-8);
    text-align: center;
  }
  .hint,
  .raw {
    font-family: var(--font-display);
    font-size: var(--size-xl);
    line-height: var(--lh-tight);
  }
</style>
