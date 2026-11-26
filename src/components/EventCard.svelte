<script lang="ts">
  // The card every event sits in (as Stop's, design/reference/1-event-stop-mid-play.png): the
  // event's chip and name, a small status pill, the one-line how-to, then the play area.
  import type { Snippet } from 'svelte';
  import Mark from './Mark.svelte';
  import { game } from '../lib/config';

  let { id, status = '', children }: { id: string; status?: string; children: Snippet } = $props();
  const info = $derived(game(id));
</script>

<div class="game">
  <div class="gh">
    <div class="chip" style:--event={info.colour}><Mark {id} /></div>
    <h1 class="n">{info.name}</h1>
    {#if status}<div class="g">{status}</div>{/if}
  </div>
  <p class="how">{info.how}</p>
  {@render children()}
</div>

<style>
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
</style>
