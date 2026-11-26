<script lang="ts">
  // Event 5, Sort (spec, Rules 2.5). Five blobs of close size: drag them into order, smallest to
  // largest, then Done. Raw result: pairs out of order, in plain ink.
  import EventCard from '../components/EventCard.svelte';
  import EventHeader from '../components/EventHeader.svelte';
  import { blobPath, generateSort, sortResult, type SortResult } from '../lib/events/sort';

  let { card, date, onresult, onnext }: { card: number; date: string; onresult: (r: SortResult) => void; onnext: () => void } = $props();

  const c = $derived(generateSort(card));
  const paths = $derived(c.blobs.map((b) => blobPath(b)));

  type Phase = 'ready' | 'play' | 'done';
  let phase: Phase = $state('ready');
  let order: number[] = $state([]);
  let drag: { id: number; startX: number; startIdx: number; dx: number } | null = $state(null);
  let row: HTMLDivElement | undefined = $state();
  let started = 0;
  let result: SortResult | null = $state(null);

  function ready() {
    order = c.start.slice();
    phase = 'play';
    started = performance.now();
  }

  function down(id: number, e: PointerEvent) {
    if (phase !== 'play') return;
    e.preventDefault();
    drag = { id, startX: e.clientX, startIdx: order.indexOf(id), dx: 0 };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  }

  function move(e: PointerEvent) {
    if (!drag || !row) return;
    const cellW = row.clientWidth / order.length;
    const moved = e.clientX - drag.startX;
    const target = Math.max(0, Math.min(order.length - 1, drag.startIdx + Math.round(moved / cellW)));
    const at = order.indexOf(drag.id);
    if (target !== at) {
      const next = order.filter((x) => x !== drag!.id);
      next.splice(target, 0, drag.id);
      order = next;
    }
    drag.dx = moved - (order.indexOf(drag.id) - drag.startIdx) * cellW;
  }

  function up() {
    drag = null;
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    window.removeEventListener('pointercancel', up);
  }

  function done() {
    result = sortResult(order.slice(), performance.now() - started);
    phase = 'done';
    onresult(result);
  }

  $effect(() => () => up());
</script>

<section class="screen">
  <EventHeader {card} {date} current="sort" />

  <EventCard id="sort" status="5 blobs">
    <div class="row" bind:this={row}>
      {#if phase === 'ready'}
        {#each c.start as id (id)}<div class="cell empty"></div>{/each}
      {:else}
        {#each order as id (id)}
          <div
            class="cell"
            class:dragging={drag?.id === id}
            style:transform={drag?.id === id ? `translateX(${drag.dx}px)` : undefined}
            onpointerdown={(e) => down(id, e)}
            role="button"
            tabindex="-1"
            aria-label="blob"
          >
            <svg viewBox="0 0 100 100" aria-hidden="true"><path d={paths[id]} /></svg>
          </div>
        {/each}
      {/if}
    </div>
    <div class="ends"><span>smallest</span><span>largest</span></div>
  </EventCard>

  <div class="foot">
    {#if phase === 'ready'}
      <button class="pill" onclick={ready}>Ready</button>
    {:else if phase === 'play'}
      <button class="pill" onclick={done}>Done</button>
    {:else if result}
      <p class="raw">{result.pairsOut === 0 ? 'All in order.' : `${result.pairsOut} ${result.pairsOut === 1 ? 'pair' : 'pairs'} out of order.`}</p>
      <button class="pill" onclick={onnext}>Next</button>
    {/if}
  </div>
</section>

<style>
  .row {
    margin-top: var(--space-6);
    display: grid;
    grid-template-columns: repeat(5, minmax(0, var(--blob-cell)));
    gap: var(--space-1);
    justify-content: center;
    touch-action: none;
  }
  .cell {
    width: 100%;
    aspect-ratio: 1;
    border-radius: var(--r-m);
    border: var(--line-thin) dashed var(--rule);
    background: var(--paper);
    cursor: grab;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
  }
  .cell.empty {
    cursor: default;
  }
  .cell.dragging {
    position: relative;
    z-index: 1;
    cursor: grabbing;
    border-color: var(--ink);
    box-shadow: var(--shadow-s);
  }
  svg {
    width: 100%;
    height: 100%;
    display: block;
  }
  path {
    fill: var(--sort);
    stroke: var(--ink);
    stroke-width: var(--shape-stroke);
  }
  .ends {
    display: flex;
    justify-content: space-between;
    margin-top: var(--space-2);
    font-weight: var(--w-bold);
    font-size: var(--size-s);
    color: var(--dim);
  }
</style>
