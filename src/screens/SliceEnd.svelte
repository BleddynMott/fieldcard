<script lang="ts">
  // Shown only while G-02 is between its gate and the other four events (the plan's order):
  // Stop is built first and judged before Count, Repeat, Pair and Sort exist.
  let { mean, preview, onagain }: { mean: number | null; preview: boolean; onagain: () => void } = $props();
</script>

<section class="screen">
  <div class="card">
    <h1>Stop is done</h1>
    {#if mean !== null}<p>{mean}% off the notch, on average.</p>{/if}
    <p>Count, Repeat, Pair and Sort are built once Stop has been judged against its reference screen.</p>
  </div>
  {#if preview}
    <div class="foot"><button class="pill" onclick={onagain}>Preview only: play today again</button></div>
  {/if}
</section>

<style>
  .screen {
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    padding-top: var(--space-8);
  }
  .card {
    margin: 0 var(--space-5);
    background: var(--chalk);
    border: var(--line) solid var(--ink);
    border-radius: var(--r-card);
    padding: var(--space-4);
    box-shadow: var(--shadow-m);
  }
  h1 {
    font-family: var(--font-display);
    font-weight: var(--w-regular);
    font-size: var(--size-title);
    line-height: var(--lh-tight);
    margin-bottom: var(--space-2);
  }
  p + p {
    margin-top: var(--space-2);
    color: var(--ink-soft);
  }
  .foot {
    margin-top: auto;
    padding: var(--space-6) var(--space-5) var(--space-8);
  }
</style>
