<script lang="ts">
  // Read 2, Read of the day, played as Pour the sand on every day in G-02 (R4). Five boxes and one
  // bucket of sand: hold a finger over a box to pour; the bucket must be empty before Show me. Score:
  // overlap with the crowd's real spread x 0.8; ✓ at 70 or more.
  import Bar from '../components/Bar.svelte';
  import { dayOfCard, weekday, WEEKDAYS } from '../lib/card';
  import { config, game } from '../lib/config';
  import type { Crowd } from '../lib/crowd';
  import { boxSpec, matched, overlap, wholeShares } from '../lib/reads';
  import { isAbandoned, type EventResults } from '../lib/results';
  import { readPoints } from '../lib/score';
  import { readOfDay, week } from '../lib/week';

  let { crowd, results, onresult, onnext }: { crowd: Crowd; results: EventResults; onresult: (r: { read: number[] }) => void; onnext: () => void } = $props();

  const P = config.pour;
  const ev = $derived(crowd.readEvent);
  const spec = $derived(boxSpec(ev));
  const today = $derived(weekday(dayOfCard(crowd.card)));
  const strip = $derived([1, 2, 3, 4, 5, 6, 0].map((d) => ({ d, form: d === today ? week.readShort[readOfDay(crowd.card).played] : week.readShort[week.read[d].form] })));

  const empty0 = () => boxSpec(crowd.readEvent).labels.map(() => 0);
  let sand = $state(empty0());
  let pointer = -1;
  let box = $state(-1); // the box being poured into
  let shown = $state(false);
  let host: HTMLDivElement | undefined = $state();
  let frame = 0;
  let last = 0;
  const left = $derived(Math.max(0, P.bucket - sand.reduce((a, b) => a + b, 0)));
  const empty = $derived(left < 0.5);
  const scale = $derived(Math.max(P.scaleFloor, ...sand, ...(shown ? crowd.boxShares : [])));
  const ov = $derived(overlap(sand, crowd.boxShares));
  const crowdPct = $derived(wholeShares(crowd.boxShares));
  const order = $derived(crowd.boxShares.map((_, i) => i).sort((a, b) => crowd.boxShares[b] - crowd.boxShares[a]));

  const context = $derived.by(() => {
    if (isAbandoned(results[ev])) return `You left ${game(ev).name} before it finished.`;
    switch (ev) {
      case 'count':
        return `The answer was ${results.count.actual}; you said ${results.count.guess}.`;
      case 'stop':
        return results.stop.signedMean === 0
          ? 'You were on the notch on average.'
          : `You were ${Math.abs(results.stop.signedMean).toFixed(1)}% ${results.stop.signedMean < 0 ? 'early' : 'late'} on average.`;
      case 'repeat':
        return `You repeated ${results.repeat.longest}.`;
      case 'pair':
        return `You took ${results.pair.seconds.toFixed(1)} s.`;
      case 'sort':
        return `You had ${results.sort.pairsOut} out of order.`;
    }
    return '';
  });

  function boxAt(x: number): number {
    if (!host) return -1;
    const r = host.getBoundingClientRect();
    const n = sand.length;
    return Math.max(0, Math.min(n - 1, Math.floor(((x - r.left) / r.width) * n)));
  }

  function tick(t: number) {
    const dt = last ? (t - last) / 1000 : 0;
    last = t;
    if (box >= 0 && left > 0) {
      const add = Math.min(left, dt * P.pourPerSecond);
      sand[box] = sand[box] + add;
    }
    frame = requestAnimationFrame(tick);
  }

  function down(e: PointerEvent) {
    if (shown || pointer !== -1) return; // one finger, one loop (review 32, 33)
    e.preventDefault();
    pointer = e.pointerId;
    box = boxAt(e.clientX);
    last = 0;
    frame = requestAnimationFrame(tick);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  }
  const move = (e: PointerEvent) => {
    if (e.pointerId === pointer) box = boxAt(e.clientX);
  };
  function up(e?: PointerEvent) {
    if (e && e.pointerId !== pointer) return;
    pointer = -1;
    box = -1;
    cancelAnimationFrame(frame);
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    window.removeEventListener('pointercancel', up);
  }

  /** Keyboard and switch access: each press pours a fixed amount into the box (review 29). */
  function pourKey(i: number) {
    if (shown) return;
    sand[i] = sand[i] + Math.min(left, P.keyStep);
  }

  function show() {
    const total = sand.reduce((a, b) => a + b, 0) || 1;
    sand = sand.map((s) => (s / total) * P.bucket);
    shown = true;
    onresult({ read: sand.slice() });
  }

  $effect(() => () => up());
</script>

<section class="screen">
  <Bar title="READ OF THE DAY" step={1} />
  <div class="week" aria-label="the read of the day, by weekday">
    {#each strip as s (s.d)}<span class:on={s.d === today}>{WEEKDAYS[s.d]}<small>{s.form}</small></span>{/each}
  </div>
  <p class="idea">{week.readNames.pour} · {game(ev).name}</p>
  {#if !shown}
    <h1 class="ask">{spec.ask}</h1>
    <p class="sub">{context} Hold over a box to pour: more sand, more people. One bucket.</p>
  {:else}
    <h1 class="ask">Your sand, then the crowd's.</h1>
  {/if}

  <div class="panel">
    <div class="sandbox" bind:this={host} onpointerdown={down} role="application" aria-label={`${spec.labels.length} boxes to pour sand into`}>
      {#each spec.labels as label, i (i)}
        <div class="slot" class:pouring={box === i}>
          {#if !shown}
            <button class="slot-key" aria-label={`pour into ${label}`} onclick={() => pourKey(i)}></button>
          {/if}
          {#if shown}
            {#if crowd.boxShares[i] >= 0.5}<div class="pile crowd grow" style:--k={i * 4} style:height={`${(crowd.boxShares[i] / scale) * 100}%`}></div>{/if}
            {#if sand[i] >= 0.5}<div class="pile mine-line" style:height={`${(sand[i] / scale) * 100}%`}></div>{/if}
          {:else}
            {#if sand[i] >= 0.5}<div class="pile mine" style:height={`${(sand[i] / scale) * 100}%`}></div>{/if}
          {/if}
          <span class="lbl">{label}</span>
        </div>
      {/each}
    </div>
    {#if !shown}
      <div class="meter">
        Bucket
        <div class="m"><i style:width={`${left}%`}></i></div>
        {Math.round(left)}% left
      </div>
    {:else}
      <div class="key"><span><i class="k-crowd"></i>the crowd</span><span><i class="k-you"></i>your sand</span></div>
    {/if}
  </div>

  {#if shown}
    <span class="simlabel">simulated crowd</span>
    <div class="fact">
      <b>The biggest group: {spec.labels[order[0]]}, {crowdPct[order[0]]}%.</b>
      Then {spec.labels[order[1]]}, {crowdPct[order[1]]}%.
    </div>
  {/if}

  <div class="foot">
    {#if !shown}
      <button class="pill quiet" onclick={() => (sand = empty0())} disabled={left >= P.bucket}>Tip it back</button>
      <button class="pill" disabled={!empty} onclick={show}>Show me</button>
    {:else}
      <div class="result" class:bad={!matched(ov)}>
        <span>{matched(ov) ? '✓' : '✗'}</span>
        <span>Your sand matched {Math.round(ov)}%</span>
        <span class="pts">+{readPoints(ov)}</span>
      </div>
      <button class="pill" onclick={onnext}>Next</button>
    {/if}
  </div>
</section>

<style>
  .week {
    display: flex;
    gap: var(--space-1);
    margin: var(--space-4) var(--space-5) 0;
  }
  .week span {
    flex: 1;
    text-align: center;
    font-size: var(--size-xs);
    font-weight: var(--w-bold);
    border: var(--line-thin) solid var(--ink);
    border-radius: var(--r-s);
    padding: var(--space-1) 0;
    background: var(--sand);
    line-height: var(--lh-tight);
  }
  .week span.on {
    background: var(--you);
  }
  .week small {
    display: block;
    font-weight: var(--w-semi);
    color: var(--dim);
    font-size: var(--size-xs);
  }
  .sandbox {
    position: relative;
    height: var(--sandbox-h);
    display: flex;
    gap: var(--space-2);
    align-items: flex-end;
    margin-bottom: var(--space-8);
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
  }
  .slot {
    flex: 1;
    height: 100%;
    position: relative;
    border: var(--line) solid var(--ink);
    border-top: 0;
    border-radius: var(--r-slot);
  }
  .slot.pouring {
    background: var(--tap-ring);
  }
  .slot-key {
    position: absolute;
    inset: 0;
    opacity: 0;
    pointer-events: none;
  }
  .slot-key:focus-visible {
    opacity: 1;
    outline: var(--line) solid var(--you);
  }
  .pile {
    position: absolute;
    left: var(--space-1);
    right: var(--space-1);
    bottom: var(--space-1);
    max-height: calc(100% - var(--space-1));
    border-radius: var(--r-pile);
  }
  .pile.mine {
    background: repeating-linear-gradient(var(--angle-sand), var(--sand) 0 var(--space-1), var(--sand-2) var(--space-1) var(--space-2));
    border: var(--line-thin) solid var(--ink);
  }
  .pile.crowd {
    background: var(--crowd-fill);
    border: var(--line-thin) solid var(--ink);
  }
  .pile.mine-line {
    border: var(--line) dashed var(--ink);
  }
  .lbl {
    position: absolute;
    left: calc(-1 * var(--space-1));
    right: calc(-1 * var(--space-1));
    top: calc(100% + var(--space-2));
    text-align: center;
    font-size: var(--size-xs);
    font-weight: var(--w-bold);
    color: var(--dim);
    line-height: var(--lh-tight);
  }
  .meter {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-weight: var(--w-bold);
    font-size: var(--size-s);
    color: var(--dim);
  }
  .meter .m {
    flex: 1;
    height: var(--meter-h);
    border: var(--line-thin) solid var(--ink);
    border-radius: var(--r-s);
    overflow: hidden;
    background: var(--paper);
  }
  .meter .m i {
    display: block;
    height: 100%;
    background: repeating-linear-gradient(var(--angle-sand), var(--sand) 0 var(--space-1), var(--sand-2) var(--space-1) var(--space-2));
  }
  .key {
    display: flex;
    gap: var(--space-4);
    font-size: var(--size-s);
    font-weight: var(--w-bold);
    color: var(--dim);
  }
  .key i {
    display: inline-block;
    width: var(--space-3);
    height: var(--space-3);
    border-radius: var(--r-xs);
    border: var(--line-thin) solid var(--ink);
    vertical-align: middle;
    margin-right: var(--space-1);
  }
  .k-crowd {
    background: var(--crowd);
  }
  .k-you {
    border-style: dashed;
  }
</style>
