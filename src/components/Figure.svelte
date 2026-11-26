<script lang="ts">
  // A person, as in the mock-up's figures: a head and a body, outlined in ink. Its colour is a token.
  let { colour, label = '' }: { colour: string; label?: string } = $props();
</script>

<svg class="fig" viewBox="0 0 20 30" style:--kit={colour} role={label ? 'img' : 'presentation'} aria-label={label || undefined}>
  <circle cx="10" cy="7" r="5.5" />
  <path d="M3 29 V19 Q3 13 10 13 Q17 13 17 19 V29 Z" />
</svg>

<style>
  .fig {
    display: block;
    width: 100%;
    height: 100%;
    fill: var(--kit);
    stroke: var(--ink);
    stroke-width: var(--fig-stroke);
  }
</style>
