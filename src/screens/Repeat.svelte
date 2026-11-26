<script lang="ts">
  // Event 3, Repeat (spec, Rules 2.3). The grid lights a sequence; tap it back; 3 squares first, one
  // more each round, up to 9; the first wrong tap ends it. Raw result: the longest repeated.
  import EventCard from '../components/EventCard.svelte';
  import EventHeader from '../components/EventHeader.svelte';
  import { repeatParams } from '../lib/config';
  import { generateRepeat, roundLengths, type RepeatResult } from '../lib/events/repeat';
  import { tokenMs } from '../lib/tokens';
  import { pressOrClick } from '../lib/press';

  const input = pressOrClick();

  let { card, date, onstart, onresult, onnext }: { card: number; date: string; onstart: () => void; onresult: (r: RepeatResult) => void; onnext: () => void } = $props();

  const p = repeatParams();
  const r = $derived(generateRepeat(card));
  const lengths = roundLengths(p);

  type Phase = 'ready' | 'watch' | 'tap' | 'done';
  let phase: Phase = $state('ready');
  let round = $state(0); // index into lengths
  let lit = $state(-1); // the square lit by the sequence
  let pressed = $state(-1); // the square the finger just pressed
  let wrongAt = $state(-1);
  let said = $state('');
  let tapped = 0;
  let longest = $state(0);
  let inputMs = 0;
  let tapStart = 0;
  let timers: ReturnType<typeof setTimeout>[] = [];
  const later = (fn: () => void, ms: number) => timers.push(setTimeout(fn, ms));

  const len = $derived(lengths[Math.min(round, lengths.length - 1)]);

  function play() {
    phase = 'watch';
    tapped = 0;
    const each = r.flashMs + p.gapMs;
    for (let i = 0; i < len; i++) {
      later(() => {
        lit = r.sequence[i];
        said = `Square ${r.sequence[i] + 1}`; // announced, for players who cannot see the grid
      }, p.pauseBeforeMs + i * each);
      later(() => (lit = -1), p.pauseBeforeMs + i * each + r.flashMs);
    }
    later(() => {
      said = 'Your turn';
      phase = 'tap';
      tapStart = performance.now();
    }, p.pauseBeforeMs + len * each);
  }

  function finish() {
    phase = 'done';
    onresult({ longest, timeMs: Math.round(inputMs) });
  }

  function tap(cell: number, e?: Event) {
    e?.preventDefault();
    if (phase !== 'tap') return;
    pressed = cell;
    later(() => (pressed = -1), tokenMs('--dur-tap'));
    if (cell !== r.sequence[tapped]) {
      wrongAt = cell;
      inputMs += performance.now() - tapStart;
      return finish();
    }
    tapped += 1;
    if (tapped === len) {
      inputMs += performance.now() - tapStart;
      longest = len;
      if (round + 1 >= lengths.length) return finish();
      round += 1;
      phase = 'watch';
      later(play, p.betweenRoundsMs);
    }
  }

  $effect(() => () => timers.forEach(clearTimeout));

  const status = $derived(phase === 'ready' ? `Starts at ${lengths[0]}` : `${len} squares`);
</script>

<section class="screen">
  <EventHeader {card} {date} current="repeat" />

  <EventCard id="repeat" {status}>
    <p class="said" aria-live="assertive">{said}</p>
    <div class="grid" style:--n={p.grid}>
      {#each Array(p.grid * p.grid) as _, i (i)}
        <button
          class="sq"
          class:lit={lit === i || pressed === i}
          class:wrong={wrongAt === i}
          aria-label={`square ${i + 1}`}
          aria-disabled={phase !== 'tap'}
          onpointerdown={(e) => input.press(() => tap(i, e))}
          onclick={() => input.click(() => tap(i))}
        ></button>
      {/each}
    </div>
  </EventCard>

  <div class="foot">
    {#if phase === 'ready'}
      <button class="pill" onclick={() => (onstart(), play())}>Ready</button>
    {:else if phase === 'watch'}
      <button class="pill" disabled>Watch</button>
    {:else if phase === 'tap'}
      <button class="pill" disabled>Your turn</button>
    {:else}
      <p class="raw">You repeated {longest} {longest === 1 ? 'square' : 'squares'}.</p>
      <button class="pill" onclick={onnext}>Next</button>
    {/if}
  </div>
</section>

<style>
  .grid {
    margin: var(--space-6) auto 0;
    display: grid;
    grid-template-columns: repeat(var(--n), var(--tile));
    gap: var(--space-3);
    justify-content: center;
  }
  .sq {
    width: var(--tile);
    height: var(--tile);
    border-radius: var(--r-m);
    border: var(--line) solid var(--ink);
    background: var(--paper);
    box-shadow: var(--shadow-s);
    transition: background var(--dur-tap);
    touch-action: none;
  }
  .sq[aria-disabled='true'] {
    cursor: default;
  }
  .said {
    position: absolute;
    width: var(--line);
    height: var(--line);
    overflow: hidden;
    clip-path: inset(50%);
  }
  .sq.lit {
    background: var(--repeat);
  }
  .sq.wrong {
    background: var(--ink);
  }
</style>
