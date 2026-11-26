<script lang="ts">
  // Event 2, Count (spec, Rules 2.2). Today's colour is shown first; Ready sends the crowd across
  // once (about 4 seconds); then a stepper asks how many wore today's colour. Raw result in plain ink.
  import EventCard from '../components/EventCard.svelte';
  import EventHeader from '../components/EventHeader.svelte';
  import Figure from '../components/Figure.svelte';
  import { config, countParams } from '../lib/config';
  import { countResult, generateCount, type CountResult } from '../lib/events/count';
  import { pressOrClick } from '../lib/press';

  const tap = pressOrClick();

  let { card, date, onstart, onresult, onnext }: { card: number; date: string; onstart: () => void; onresult: (r: CountResult) => void; onnext: () => void } = $props();

  const p = countParams();
  const c = $derived(generateCount(card));
  const kit = (i: number) => config.kits[i];
  const kitName = $derived(config.kitNames[c.todayKit]);

  type Phase = 'ready' | 'crossing' | 'answer' | 'done';
  let phase: Phase = $state('ready');
  let guess = $state(0);
  let result: CountResult | null = $state(null);
  let timer: ReturnType<typeof setTimeout> | undefined;
  let hold: ReturnType<typeof setTimeout> | undefined;

  function ready() {
    onstart();
    phase = 'crossing';
    const end = Math.max(...c.figures.map((f) => f.startMs + f.crossMs));
    timer = setTimeout(() => (phase = 'answer'), end);
  }

  function nudge(by: number) {
    guess = Math.min(p.guessMax, Math.max(0, guess + by));
  }

  function startHold(by: number) {
    nudge(by);
    const again = () => {
      nudge(by);
      hold = setTimeout(again, p.holdRepeatMs);
    };
    hold = setTimeout(again, p.holdDelayMs);
  }
  const stopHold = () => clearTimeout(hold);

  function done() {
    result = countResult(guess, c.target);
    phase = 'done';
    onresult(result);
  }

  $effect(() => () => {
    clearTimeout(timer);
    clearTimeout(hold);
  });
</script>

<section class="screen">
  <EventHeader {card} {date} current="count" />

  <EventCard id="count" status={phase === 'answer' || phase === 'done' ? 'How many?' : `Today: ${kitName}`}>
    <div class="field">
      {#if phase === 'ready'}
        <div class="today">
          <div class="big-fig"><Figure colour={kit(c.todayKit)} label={`today's colour, ${kitName}`} /></div>
          <p>Count the <b>{kitName}</b> figures.</p>
        </div>
      {:else if phase === 'crossing'}
        {#each c.figures as f, i (i)}
          <div
            class="walker"
            style:--lane={f.lane}
            style:--lanes={p.lanes}
            style:animation-duration={`${f.crossMs}ms`}
            style:animation-delay={`${f.startMs}ms`}
          >
            <Figure colour={kit(f.kit)} />
          </div>
        {/each}
      {:else}
        <div class="stepper">
          <button class="step" aria-label="one fewer" onpointerdown={() => tap.press(() => startHold(-1))} onpointerup={stopHold} onpointerleave={stopHold} onpointercancel={stopHold} onclick={() => tap.click(() => nudge(-1))} disabled={phase === 'done'}>−</button>
          <output class="num" aria-live="polite">{guess}</output>
          <button class="step" aria-label="one more" onpointerdown={() => tap.press(() => startHold(1))} onpointerup={stopHold} onpointerleave={stopHold} onpointercancel={stopHold} onclick={() => tap.click(() => nudge(1))} disabled={phase === 'done'}>+</button>
        </div>
      {/if}
    </div>
  </EventCard>

  <div class="foot">
    {#if phase === 'ready'}
      <button class="pill" onclick={ready}>Ready</button>
    {:else if phase === 'crossing'}
      <button class="pill" disabled>Watch</button>
    {:else if phase === 'answer'}
      <button class="pill" onclick={done}>Done</button>
    {:else if result}
      <p class="raw">You said {result.guess}. There were {result.actual}.</p>
      <button class="pill" onclick={onnext}>Next</button>
    {/if}
  </div>
</section>

<style>
  .field {
    position: relative;
    height: var(--field-h);
    margin: var(--space-6) 0 0;
    border-radius: var(--r-l);
    background: repeating-linear-gradient(var(--angle-stripes), var(--lawn) 0 var(--lawn-stripe), var(--lawn-2) var(--lawn-stripe) calc(2 * var(--lawn-stripe)));
    border: var(--line) solid var(--ink);
    overflow: hidden;
    container-type: inline-size;
  }
  .today {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    background: var(--chalk);
  }
  .today p {
    font-size: var(--size-l);
  }
  .big-fig {
    width: calc(2 * var(--fig-w));
    height: calc(2 * var(--fig-h));
  }
  .walker {
    position: absolute;
    width: var(--fig-w);
    height: var(--fig-h);
    left: 0;
    top: calc((100% - var(--fig-h)) * var(--lane) / (var(--lanes) - 1));
    animation-name: cross;
    animation-timing-function: linear;
    animation-fill-mode: both;
  }
  /* where container units are missing (iOS 15 and older), cross by `left` instead (round-2 b3) */
  @supports not (container-type: inline-size) {
    .walker {
      animation-name: cross-left;
    }
  }
  @keyframes cross-left {
    from {
      left: calc(-1 * var(--fig-w));
    }
    to {
      left: 100%;
    }
  }
  @keyframes cross {
    from {
      transform: translateX(calc(-1 * var(--fig-w)));
    }
    to {
      transform: translateX(100cqw);
    }
  }
  .stepper {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-6);
    background: var(--chalk);
  }
  .step {
    width: var(--stepper);
    height: var(--stepper);
    border-radius: var(--r-round);
    border: var(--line) solid var(--ink);
    background: var(--paper);
    font-family: var(--font-display);
    font-size: var(--size-title);
    box-shadow: var(--shadow-s);
    user-select: none;
    -webkit-user-select: none;
  }
  .step:active {
    transform: translateY(var(--space-1));
  }
  .num {
    font-family: var(--font-display);
    font-size: var(--size-score);
    min-width: var(--stepper);
    text-align: center;
  }
</style>
