<script lang="ts">
  // The lawn above every event: the sign board and the five bibs, the current one raised in its colour.
  import Mark from './Mark.svelte';
  import { config } from '../lib/config';

  let { card, date, current }: { card: number; date: string; current: string } = $props();
</script>

<div class="lawn">
  <div class="board">
    <div class="t">FIELDCARD</div>
    <div class="s">Card #{card} · {date}</div>
  </div>
  <div class="bibs">
    {#each config.games as g (g.id)}
      <div class="bib" class:on={g.id === current} style:--event={g.colour}>
        <Mark id={g.id} />
      </div>
    {/each}
  </div>
</div>

<style>
  .lawn {
    height: var(--ev-lawn-h);
    position: relative;
    background: repeating-linear-gradient(90deg, var(--lawn) 0 var(--lawn-stripe), var(--lawn-2) var(--lawn-stripe) calc(2 * var(--lawn-stripe)));
    border-bottom: var(--line) solid var(--ink);
  }
  .board {
    position: absolute;
    left: 50%;
    top: var(--space-5);
    transform: translateX(-50%) rotate(var(--tilt));
    background: var(--chalk);
    border: var(--line) solid var(--ink);
    border-radius: var(--r-l);
    padding: var(--space-2) var(--space-5) var(--space-1);
    text-align: center;
    box-shadow: var(--shadow-m);
    white-space: nowrap;
  }
  .t {
    font-family: var(--font-display);
    font-size: var(--size-title);
    line-height: var(--lh-tight);
  }
  .s {
    font-weight: var(--w-semi);
    font-size: var(--size-s);
    color: var(--dim);
  }
  .bibs {
    position: absolute;
    bottom: calc(-1 * var(--space-6));
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
    gap: var(--space-2);
  }
  .bib {
    width: var(--bib-w);
    height: var(--bib-h);
    background: var(--chalk);
    border: var(--line) solid var(--ink);
    border-radius: var(--r-s);
    display: grid;
    place-items: center;
    position: relative;
    color: var(--dim);
    box-shadow: var(--shadow-s);
  }
  .bib::before,
  .bib::after {
    content: '';
    position: absolute;
    top: var(--space-1);
    width: var(--bib-hole);
    height: var(--bib-hole);
    border-radius: var(--r-round);
    background: var(--ink);
  }
  .bib::before {
    left: var(--space-2);
  }
  .bib::after {
    right: var(--space-2);
  }
  .bib.on {
    background: var(--event);
    color: var(--chalk);
    transform: translateY(calc(-1 * var(--space-2)));
  }
</style>
