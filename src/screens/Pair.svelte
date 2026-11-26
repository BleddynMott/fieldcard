<script lang="ts">
  // Event 4, Pair (spec, Rules 2.4). Twelve shapes, exactly two identical: tap both. A wrong pair
  // adds 3 seconds. Raw result: seconds, in plain ink.
  import EventCard from '../components/EventCard.svelte';
  import EventHeader from '../components/EventHeader.svelte';
  import PairShape from '../components/PairShape.svelte';
  import { config, pairParams } from '../lib/config';
  import { tokenMs } from '../lib/tokens';
  import { pressOrClick } from '../lib/press';

  const input = pressOrClick();
  import { generatePair, pairResult, type PairResult } from '../lib/events/pair';

  let { card, date, onstart, onresult, onnext }: { card: number; date: string; onstart: () => void; onresult: (r: PairResult) => void; onnext: () => void } = $props();

  const p = pairParams();
  const c = $derived(generatePair(card));

  type Phase = 'ready' | 'play' | 'done';
  let phase: Phase = $state('ready');
  let picked = $state(-1);
  let wrong = $state(0);
  let flash = $state(false); // "+3 s" after a wrong pair
  let started = 0;
  let now = $state(0);
  let frame = 0;
  let flashTimer: ReturnType<typeof setTimeout> | undefined;
  let result: PairResult | null = $state(null);

  function ready() {
    onstart();
    phase = 'play';
    started = performance.now();
    const tick = () => {
      now = performance.now() - started;
      frame = requestAnimationFrame(tick);
    };
    tick();
  }

  function tap(i: number, e?: Event) {
    e?.preventDefault();
    if (phase !== 'play') return;
    if (picked === -1) return void (picked = i);
    if (picked === i) return void (picked = -1);
    const a = Math.min(picked, i);
    const b = Math.max(picked, i);
    if (a === c.pair[0] && b === c.pair[1]) {
      cancelAnimationFrame(frame);
      result = pairResult(performance.now() - started, wrong);
      phase = 'done';
      onresult(result);
      return;
    }
    wrong += 1;
    picked = -1;
    flash = true;
    clearTimeout(flashTimer);
    flashTimer = setTimeout(() => (flash = false), tokenMs('--dur-note'));
  }

  $effect(() => () => {
    cancelAnimationFrame(frame);
    clearTimeout(flashTimer);
  });

  const clock = $derived(((now + wrong * p.wrongPenaltyMs) / 1000).toFixed(1));
  const isPair = (i: number) => phase === 'done' && (i === c.pair[0] || i === c.pair[1]);
  const label = (i: number) => {
    const s = c.shapes[i];
    return `${config.kitNames[s.kit]} ${p.formNames[s.form]}, ${p.styleNames[s.style]}`;
  };
  const penalty = `+${p.wrongPenaltyMs / 1000} s`;
</script>

<section class="screen">
  <EventHeader {card} {date} current="pair" />

  <EventCard id="pair" status={phase === 'ready' ? p.label : `${clock} s`}>
    <div class="grid" style:--cols={p.columns}>
      {#each c.shapes as s, i (i)}
        <button
          class="tile"
          class:picked={picked === i}
          class:found={isPair(i)}
          aria-label={phase === 'ready' ? `shape ${i + 1}` : label(i)}
          aria-pressed={picked === i}
          disabled={phase !== 'play'}
          onpointerdown={(e) => input.press(() => tap(i, e))}
          onclick={() => input.click(() => tap(i))}
        >
          {#if phase !== 'ready'}<PairShape shape={s} />{/if}
        </button>
      {/each}
    </div>
    <p class="penalty" class:show={flash} role="status">Not a pair · {penalty}</p>
  </EventCard>

  <div class="foot">
    {#if phase === 'ready'}
      <button class="pill" onclick={ready}>Ready</button>
    {:else if phase === 'play'}
      <button class="pill" disabled>Find the two</button>
    {:else if result}
      <p class="raw">{result.seconds.toFixed(1)} seconds{result.wrong ? `, with ${result.wrong} wrong` : ''}.</p>
      <button class="pill" onclick={onnext}>Next</button>
    {/if}
  </div>
</section>

<style>
  .grid {
    margin-top: var(--space-4);
    display: grid;
    grid-template-columns: repeat(var(--cols), minmax(0, var(--shape-cell)));
    gap: var(--space-2);
    justify-content: center;
  }
  .tile {
    width: 100%;
    aspect-ratio: 1;
    padding: var(--space-2);
    border-radius: var(--r-m);
    border: var(--line) solid var(--ink);
    background: var(--paper);
    touch-action: none;
  }
  .tile:disabled {
    cursor: default;
  }
  .tile.picked,
  .tile.found {
    box-shadow: var(--ring-you);
  }
  .penalty {
    margin-top: var(--space-2);
    text-align: center;
    font-weight: var(--w-bold);
    visibility: hidden;
  }
  .penalty.show {
    visibility: visible;
  }
</style>
