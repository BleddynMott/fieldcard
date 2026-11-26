<script lang="ts">
  // Read 1, Spot it: Three Doors (spec, Rules 3; reference design/reference/2-after-fifth-event-spot-it.png).
  // Tap the door you think the biggest share of the crowd went through; open the doors; the crowd
  // is inside each in proportion; the fact line; right or wrong.
  import Bar from '../components/Bar.svelte';
  import Figure from '../components/Figure.svelte';
  import Mark from '../components/Mark.svelte';
  import { config, game } from '../lib/config';
  import type { Crowd } from '../lib/crowd';
  import { doorSpec, topDoors, wholeShares } from '../lib/reads';

  let { crowd, onresult, onnext }: { crowd: Crowd; onresult: (r: { door: number }) => void; onnext: () => void } = $props();

  const ev = $derived(crowd.doorEvent);
  const spec = $derived(doorSpec(ev));
  const pct = $derived(wholeShares(crowd.doorShares));
  const top = $derived(topDoors(crowd.doorShares));
  let picked = $state(-1);
  let open = $state(false);
  const right = $derived(top.includes(picked));
  const order = $derived([0, 1, 2].sort((a, b) => crowd.doorShares[b] - crowd.doorShares[a]));

  function reveal() {
    open = true;
    onresult({ door: picked });
  }
</script>

<section class="screen">
  <Bar title="SPOT IT" step={0} />
  <p class="idea">Three doors · {game(ev).name}</p>
  {#if !open}
    <h1 class="ask">Which door did the crowd go through?</h1>
    <p class="sub">{spec.ask}</p>
  {:else}
    <h1 class="ask">{top.length === 1 ? `The biggest share ${spec.facts[top[0]]}.` : top.length === 2 ? 'The crowd split between two doors.' : 'The crowd split three ways.'}</h1>
  {/if}

  <div class="doors">
    {#each spec.labels as label, i (i)}
      <button class="door" class:pick={picked === i} class:open aria-pressed={picked === i} disabled={open} onclick={() => (picked = i)}>
        {#if open}
          <span class="pct">{pct[i]}%</span>
          <span class="crowdin">
            {#each Array(Math.max(picked === i ? 1 : 0, Math.round(pct[i] / config.scoring.beadsPer))) as _, k (k)}
              <span class="mini-fig drop" style:--k={k}><Figure colour={picked === i && k === 0 ? 'var(--you)' : 'var(--crowd)'} /></span>
            {/each}
          </span>
        {:else}
          <span class="panel-in"></span>
          <span class="knob"></span>
          {#if ev === 'stop'}
            <!-- as in reference 2: a small track with the notch, the marker early, on it or late -->
            <svg class="mini" viewBox="0 0 70 26" aria-hidden="true">
              <rect class="mini-track" x="1" y="14" width="68" height="10" rx="3" />
              <rect class="mini-notch" x="33" y="8" width="4" height="18" />
              <circle class="mini-runner" cx={35 + [-26, 0, 26][i]} cy="8" r="5" />
            </svg>
          {:else}
            <span class="mark"><Mark id={ev} /></span>
          {/if}
        {/if}
        <span class="sign">{label}</span>
      </button>
    {/each}
  </div>

  {#if open}
    <span class="simlabel">simulated crowd</span>
    <div class="fact">
      <b>{pct[order[0]]}% {spec.facts[order[0]]}.</b>
      {pct[order[1]]}% {spec.facts[order[1]]}, and {pct[order[2]]}% {spec.facts[order[2]]}.
    </div>
  {/if}

  <div class="foot">
    {#if !open}
      <button class="pill" disabled={picked < 0} onclick={reveal}>Open the doors</button>
    {:else}
      <div class="result" class:bad={!right}>
        <span>{right ? '✓' : '✗'}</span>
        <span>{right ? "You picked the crowd's door" : `The crowd's door: ${top.map((t) => spec.labels[t]).join(' or ')}`}</span>
        <span class="pts">{right ? `+${config.scoring.spotPoints}` : '0'}</span>
      </div>
      <button class="pill" onclick={onnext}>Next</button>
    {/if}
  </div>
</section>

<style>
  .doors {
    display: flex;
    gap: var(--space-3);
    margin: var(--space-5) var(--space-5) 0;
  }
  .door {
    flex: 1;
    position: relative;
    height: var(--door-h);
    border: var(--line) solid var(--ink);
    border-radius: var(--r-door);
    background: var(--wood);
    box-shadow: var(--shadow-m);
    overflow: hidden;
    color: var(--chalk);
  }
  .door:disabled {
    cursor: default;
  }
  .door.pick {
    box-shadow: var(--ring-you), var(--shadow-m);
  }
  .door.open {
    background: var(--door-open);
  }
  .panel-in {
    position: absolute;
    inset: var(--space-4) var(--space-4) var(--space-8);
    border: var(--line) solid var(--wood-dark);
    border-radius: var(--r-panel);
  }
  .knob {
    position: absolute;
    right: var(--space-4);
    top: 50%;
    width: var(--knob);
    height: var(--knob);
    border-radius: var(--r-round);
    background: var(--wood-dark);
    border: var(--line-thin) solid var(--ink);
  }
  .mark {
    position: absolute;
    left: 50%;
    top: var(--space-8);
    transform: translateX(-50%);
  }
  .mini {
    position: absolute;
    left: 50%;
    top: var(--space-8);
    width: var(--mini-w);
    transform: translateX(-50%);
  }
  .mini-track {
    fill: var(--track);
    stroke: var(--ink);
    stroke-width: var(--line-thin);
  }
  .mini-notch {
    fill: var(--stop);
    stroke: var(--ink);
    stroke-width: var(--line-thin);
  }
  .mini-runner {
    fill: var(--white);
    stroke: var(--ink);
    stroke-width: var(--line-thin);
  }
  .sign {
    position: absolute;
    left: var(--space-2);
    right: var(--space-2);
    bottom: var(--space-3);
    text-align: center;
    background: var(--chalk);
    color: var(--ink);
    border: var(--line-thin) solid var(--ink);
    border-radius: var(--r-s);
    font-family: var(--font-display);
    font-size: var(--size-m);
    padding: var(--space-1) 0;
    line-height: var(--lh-tight);
  }
  .pct {
    position: absolute;
    left: 0;
    right: 0;
    top: var(--space-3);
    text-align: center;
    font-family: var(--font-display);
    font-size: var(--size-title);
    color: var(--white);
    text-shadow: 0 var(--line-thin) 0 var(--ink);
  }
  .crowdin {
    position: absolute;
    left: var(--space-2);
    right: var(--space-2);
    bottom: var(--space-8);
    display: flex;
    flex-wrap: wrap-reverse;
    gap: var(--space-1);
    justify-content: center;
  }
  .mini-fig {
    width: var(--space-3);
    height: var(--space-5);
  }
</style>
