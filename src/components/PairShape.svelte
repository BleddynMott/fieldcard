<script lang="ts">
  // One of Pair's shapes: a form (circle, square, triangle, diamond), a kit colour, and a style
  // (solid, outline, or solid with a hole). Drawn in a 100-unit square.
  import { config } from '../lib/config';
  import type { Shape } from '../lib/events/pair';

  let { shape }: { shape: Shape } = $props();
  const d = $derived(
    [
      'M50 14 A36 36 0 1 1 49.99 14 Z',
      'M16 16 H84 V84 H16 Z',
      'M50 12 L88 84 H12 Z',
      'M50 10 L90 50 L50 90 L10 50 Z',
    ][shape.form],
  );
</script>

<svg viewBox="0 0 100 100" class="ps" class:outline={shape.style === 1} style:--kit={config.kits[shape.kit]} aria-hidden="true">
  <path {d} />
  {#if shape.style === 2}<circle class="hole" cx="50" cy={shape.form === 2 ? 60 : 50} r="13" />{/if}
</svg>

<style>
  .ps {
    width: 100%;
    height: 100%;
    display: block;
  }
  path {
    fill: var(--kit);
    stroke: var(--ink);
    stroke-width: var(--shape-stroke);
    stroke-linejoin: round;
  }
  .outline path {
    fill: var(--chalk);
    stroke: var(--kit);
    stroke-width: var(--shape-stroke-bold);
  }
  .hole {
    fill: var(--chalk);
    stroke: var(--ink);
    stroke-width: var(--shape-stroke);
  }
</style>
