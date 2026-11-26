<script lang="ts">
  // The Scorecard (spec, Last 60 seconds; reference design/reference/3-scorecard.png), top to bottom:
  // the one result line, Hunch and Hands with a sentence each, the five event chips, the flag line,
  // Share and the text it copies, the streak line and the time to the next card. The Mirror Duel
  // joins in G-04c.
  import Bar from '../components/Bar.svelte';
  import Mark from '../components/Mark.svelte';
  import { allGames } from '../lib/config';
  import type { Scorecard } from '../lib/score';
  import { shareText, signed } from '../lib/share';
  import { streakText, type StreakLine } from '../lib/streak';
  import type { EventId } from '../lib/week';

  let { score, streak, preview, onagain }: { score: Scorecard; streak: StreakLine; preview: boolean; onagain: () => void } = $props();

  const text = $derived(shareText(score));
  const short = $derived(score.flagPoints < 0);
  let copied = $state('');
  let now = $state(new Date());

  $effect(() => {
    const t = setInterval(() => (now = new Date()), 30_000);
    return () => clearInterval(t);
  });

  const nextIn = $derived.by(() => {
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const mins = Math.max(0, Math.ceil((midnight.getTime() - now.getTime()) / 60_000));
    return `${Math.floor(mins / 60)} h ${mins % 60} m`;
  });

  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ text });
        return;
      }
      await navigator.clipboard.writeText(text);
      copied = 'Copied';
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return; // the share sheet was closed
      copied = 'Select the text below to copy it';
    }
  }
</script>

<section class="screen">
  <Bar title={`SCORECARD #${score.card}`} step={3} />
  <h1 class="lead">You read the crowd better than {score.hunch} in 100.</h1>

  <div class="hh">
    <div class="tile hunch">
      <small>HUNCH</small><b>{score.hunch}</b><span>Ranked against everyone's reads today</span>
    </div>
    <div class="tile">
      <small>HANDS</small><b>{score.hands}</b><span>You beat {score.hands} in 100 at the events, on average</span>
    </div>
  </div>

  <div class="evs">
    {#each allGames() as g (g.id)}
      <div style:--event={g.colour}><span class="mk"><Mark id={g.id} /></span><b>beat {score.beat[g.id as EventId]}%</b></div>
    {/each}
  </div>
  <p class="evcap">Each event on its own.</p>

  <div class="claimline">
    <span>{short ? '✗' : '✓'} Flag {score.flag}, finished {score.place}</span>
    <b class:bad={short} class:good={!short}>{signed(score.flagPoints)}</b>
  </div>

  {#if score.simulated}<span class="simlabel">against a simulated crowd</span>{/if}

  <div class="foot">
    <button class="pill" onclick={share}>{copied || 'Share'}</button>
    <div class="sharebox"><small>COPIES THIS</small><pre>{text}</pre></div>
    <div class="streak"><span>{streakText(streak)}</span><span>Next card in {nextIn}</span></div>
    {#if preview}<button class="pill quiet" onclick={onagain}>Preview only: play today again</button>{/if}
  </div>
</section>

<style>
  .lead {
    font-family: var(--font-display);
    font-weight: var(--w-regular);
    font-size: var(--size-title);
    line-height: var(--lh-tight);
    margin: var(--space-4) var(--space-5) 0;
  }
  .hh {
    display: flex;
    gap: var(--space-3);
    margin: var(--space-4) var(--space-5) 0;
  }
  .tile {
    flex: 1;
    border: var(--line) solid var(--ink);
    border-radius: var(--r-l);
    background: var(--chalk);
    padding: var(--space-3);
    box-shadow: var(--shadow-s);
  }
  .tile.hunch {
    background: var(--hunch-bg);
  }
  .tile small {
    font-weight: var(--w-bold);
    font-size: var(--size-s);
    letter-spacing: var(--tracking-label);
    color: var(--dim);
  }
  .tile b {
    display: block;
    font-family: var(--font-display);
    font-weight: var(--w-regular);
    font-size: var(--size-score);
    line-height: var(--lh-tight);
  }
  .tile span {
    display: block;
    font-size: var(--size-s);
    font-weight: var(--w-semi);
    color: var(--ink-soft);
    line-height: var(--lh-tight);
    margin-top: var(--space-1);
  }
  .evs {
    display: flex;
    gap: var(--space-1);
    margin: var(--space-3) var(--space-5) 0;
  }
  .evs div {
    flex: 1;
    text-align: center;
    border: var(--line) solid var(--ink);
    border-radius: var(--r-m);
    background: var(--chalk);
    padding: var(--space-1) 0;
  }
  .evs .mk {
    display: block;
    color: var(--event);
  }
  .evs b {
    display: block;
    font-weight: var(--w-bold);
    font-size: var(--size-s);
    white-space: nowrap;
  }
  .evcap {
    margin: var(--space-1) var(--space-5) 0;
    font-size: var(--size-s);
    font-weight: var(--w-semi);
    color: var(--dim);
  }
  .claimline {
    margin: var(--space-3) var(--space-5) 0;
    display: flex;
    align-items: center;
    gap: var(--space-3);
    border: var(--line) solid var(--ink);
    border-radius: var(--r-m);
    padding: var(--space-2) var(--space-3);
    background: var(--flag-bg);
    font-weight: var(--w-bold);
    font-size: var(--size-m);
  }
  .claimline b {
    margin-left: auto;
    font-family: var(--font-display);
    font-weight: var(--w-regular);
    font-size: var(--size-xl);
  }
  .claimline b.bad {
    color: var(--wrong);
  }
  .claimline b.good {
    color: var(--right);
  }
  .sharebox {
    background: var(--ink);
    color: var(--chalk);
    border-radius: var(--r-m);
    padding: var(--space-3) var(--space-4);
  }
  .sharebox small {
    font-size: var(--size-xs);
    letter-spacing: var(--tracking-label);
    color: var(--ghost);
  }
  .sharebox pre {
    font-family: var(--font-body);
    font-weight: var(--w-semi);
    font-size: var(--size-m);
    line-height: var(--lh-body);
    white-space: pre-wrap;
    user-select: all;
    -webkit-user-select: all;
  }
  .streak {
    display: flex;
    justify-content: space-between;
    font-weight: var(--w-semi);
    font-size: var(--size-s);
    color: var(--dim);
  }
</style>
