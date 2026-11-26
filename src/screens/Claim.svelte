<script lang="ts">
  // Read 3, Claim it: plant your flag (spec, Rules 5). A track of the whole field, worst to best.
  // Plant your flag at c, the share of everyone you think you beat. Your real place is p. Make it and
  // you bank c; fall short and you lose twice the gap. The reveal drops everyone in as beads, one
  // for every 5 in 100: where they planted above the track, where they finished below it.
  import Bar from '../components/Bar.svelte';
  import { config } from '../lib/config';
  import type { Crowd } from '../lib/crowd';
  import { apportion } from '../lib/reads';
  import { flagPoints } from '../lib/score';
  import { signed } from '../lib/share';

  let { crowd, place, onresult, onnext }: { crowd: Crowd; place: number; onresult: (r: { flag: number }) => void; onnext: () => void } = $props();

  const W = 322;
  const MID = 160;
  const BINS = config.claim.bins;
  const bw = W / BINS;
  let flag = $state(config.claim.startFlag);
  let pointer = -1;
  let planted = $state(false);
  let svg: SVGSVGElement | undefined = $state();
  const short = $derived(place < flag);
  const pts = $derived(flagPoints(flag, place));
  const per = config.scoring.beadsPer;

  function bins(values: number[]): number[] {
    const counts = new Array(BINS).fill(0);
    for (const v of values) counts[Math.min(BINS - 1, Math.floor(v / (100 / BINS)))] += 1;
    return apportion(counts, 100 / per); // one bead for every 5 in 100, exactly 20 beads
  }
  const plantBeads = $derived(bins(crowd.players.map((p) => p.flag)));
  const finishBeads = $derived(bins(crowd.players.map((p) => p.place)));
  const above = $derived(Math.round((crowd.players.filter((p) => p.flag > 50).length / crowd.players.length) * 100));
  const finishedAbove = $derived(Math.round((crowd.players.filter((p) => p.place > 50).length / crowd.players.length) * 100));

  function setFrom(e: PointerEvent) {
    if (!svg || (pointer !== -1 && e.pointerId !== pointer)) return;
    const r = svg.getBoundingClientRect();
    flag = Math.max(0, Math.min(100, Math.round(((e.clientX - r.left) / r.width) * 100)));
  }
  function down(e: PointerEvent) {
    if (planted || pointer !== -1) return;
    e.preventDefault();
    pointer = e.pointerId;
    setFrom(e);
    window.addEventListener('pointermove', setFrom);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  }
  function up(e?: PointerEvent) {
    if (e && e.pointerId !== pointer) return;
    pointer = -1;
    window.removeEventListener('pointermove', setFrom);
    window.removeEventListener('pointerup', up);
    window.removeEventListener('pointercancel', up);
  }
  function plant() {
    planted = true;
    onresult({ flag });
  }
  $effect(() => () => up());

  const fx = $derived((flag / 100) * W);
  const px = $derived((place / 100) * W);
  const top = $derived(planted ? MID - 132 : MID - 96);
</script>

<section class="screen">
  <Bar title="CLAIM IT" step={2} />
  <p class="idea">Today's five events</p>
  {#if !planted}
    <h1 class="ask">Plant your flag where you finished.</h1>
    <p class="sub">Everyone, worst to best. Make it and you bank your flag. Fall short and you lose double the gap.</p>
  {:else}
    <h1 class="ask">{short ? `${flag - place} short of your flag.` : 'You made it.'}</h1>
  {/if}

  <div class="panel">
    <svg bind:this={svg} viewBox={`0 0 ${W} ${planted ? 300 : 230}`} class="chart" onpointerdown={down} role="slider" aria-label="your flag" aria-valuemin="0" aria-valuemax="100" aria-valuenow={flag} tabindex="0"
      onkeydown={(e) => { if (planted) return; if (e.key === 'ArrowLeft') flag = Math.max(0, flag - 1); if (e.key === 'ArrowRight') flag = Math.min(100, flag + 1); }}>
      <rect class="track" x="0" y={MID - 10} width={W} height="20" rx="6" />
      <text class="end" x="6" y={MID + 4}>worst</text>
      <text class="end" x={W - 6} y={MID + 4} text-anchor="end">best</text>
      {#if planted}
        {#each plantBeads as n, i (i)}
          {#each Array(n) as _, k (k)}<circle class="bead plant drop" style:--k={i + k} cx={i * bw + bw / 2} cy={MID - 24 - k * 13} r="6" />{/each}
        {/each}
        {#each finishBeads as n, i (i)}
          {#each Array(n) as _, k (k)}<circle class="bead finish drop" style:--k={i + k} cx={i * bw + bw / 2} cy={MID + 24 + k * 13} r="6" />{/each}
        {/each}
        {#if short}<rect class="gap" x={px} y={MID - 4} width={fx - px} height="8" rx="4" />{/if}
        <circle class="you" cx={px} cy={MID} r="10" />
        <text class="lab" x={px < W / 2 ? px + 14 : px - 14} y={MID + 72} text-anchor={px < W / 2 ? 'start' : 'end'}>you finished {place}</text>
      {:else}
        {#each Array(BINS) as _, i (i)}
          <circle class="bead empty" cx={i * bw + bw / 2} cy={MID + 26} r="4" />
          <circle class="bead empty" cx={i * bw + bw / 2} cy={MID - 26} r="4" />
        {/each}
        <text class="hint" x={W / 2} y={MID + 56} text-anchor="middle">everyone drops in when you plant</text>
      {/if}
      <line class="pole" x1={fx} y1={MID - 10} x2={fx} y2={top} />
      <path class="flag" d={`M${fx} ${top} L${fx + 30} ${top + 10} L${fx} ${top + 20} Z`} />
      <text class="lab" x={flag > 50 ? fx - 6 : fx + 34} y={top + 14} text-anchor={flag > 50 ? 'end' : 'start'}>your flag: {flag}</text>
    </svg>
    {#if !planted}
      <div class="stake">
        <div class="w">Make it<b>+{flag}</b></div>
        <div class="l">Fall short<b>−2 a point</b></div>
      </div>
    {:else}
      <div class="key"><span><i class="k-plant"></i>where everyone planted</span><span><i class="k-finish"></i>where they finished</span></div>
    {/if}
  </div>

  {#if planted}
    <span class="simlabel">simulated crowd</span>
    <div class="fact"><b>{above}% planted above the middle.</b> {finishedAbove}% finished there.</div>
  {/if}

  <div class="foot">
    {#if !planted}
      <button class="pill" onclick={plant}>Plant it</button>
    {:else}
      <div class="result" class:bad={short}>
        <span>{short ? '✗' : '✓'}</span>
        <span>Flag {flag}, finished {place}</span>
        <span class="pts">{signed(pts)}</span>
      </div>
      <button class="pill" onclick={onnext}>See your scorecard</button>
    {/if}
  </div>
</section>

<style>
  .chart {
    width: 100%;
    display: block;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
  }
  .track {
    fill: var(--track);
    stroke: var(--ink);
    stroke-width: var(--line);
  }
  .end {
    fill: var(--white);
    font-size: var(--size-xs);
    font-weight: var(--w-bold);
  }
  .bead.plant {
    fill: var(--chalk);
    stroke: var(--ghost);
    stroke-width: var(--line-thin);
  }
  .bead.finish {
    fill: var(--crowd);
    stroke: var(--ink);
    stroke-width: var(--line-thin);
  }
  .bead.empty {
    fill: var(--bead-empty);
  }
  .gap {
    fill: var(--wrong);
    stroke: var(--ink);
    stroke-width: var(--line-thin);
  }
  .you {
    fill: var(--you);
    stroke: var(--ink);
    stroke-width: var(--line);
  }
  .pole {
    stroke: var(--ink);
    stroke-width: var(--line);
  }
  .flag {
    fill: var(--flag);
    stroke: var(--ink);
    stroke-width: var(--line-thin);
  }
  .lab {
    fill: var(--ink);
    font-size: var(--size-s);
    font-weight: var(--w-bold);
  }
  .hint {
    fill: var(--dim);
    font-size: var(--size-xs);
    font-weight: var(--w-bold);
  }
  .stake {
    display: flex;
    gap: var(--space-2);
    margin-top: var(--space-2);
  }
  .stake div {
    flex: 1;
    border: var(--line-thin) solid var(--ink);
    border-radius: var(--r-m);
    padding: var(--space-2) var(--space-3);
    font-size: var(--size-s);
    font-weight: var(--w-bold);
    color: var(--dim);
    background: var(--paper);
  }
  .stake b {
    display: block;
    font-family: var(--font-display);
    font-weight: var(--w-regular);
    font-size: var(--size-xl);
  }
  .stake .w b {
    color: var(--right);
  }
  .stake .l b {
    color: var(--wrong);
  }
  .key {
    display: flex;
    gap: var(--space-4);
    margin-top: var(--space-2);
    font-size: var(--size-s);
    font-weight: var(--w-bold);
    color: var(--dim);
  }
  .key i {
    display: inline-block;
    width: var(--space-3);
    height: var(--space-3);
    border-radius: var(--r-round);
    border: var(--line-thin) solid var(--ink);
    vertical-align: middle;
    margin-right: var(--space-1);
  }
  .k-plant {
    background: var(--chalk);
    border-color: var(--ghost);
  }
  .k-finish {
    background: var(--crowd);
  }
</style>
