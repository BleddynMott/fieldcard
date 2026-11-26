<script lang="ts">
  // The five event marks (design/DESIGN.md, Names, marks, colours), drawn as in b-final-run.html.
  let { id }: { id: string } = $props();
</script>

<svg class="mark-svg" viewBox="0 0 24 24" aria-hidden="true">
  {#if id === 'stop'}
    <path d="M2 15h20M12 9v6" />
  {:else if id === 'count'}
    <circle class="dot" cx="6" cy="16" r="2.2" /><circle class="dot" cx="12" cy="8" r="2.2" /><circle class="dot" cx="18" cy="16" r="2.2" />
  {:else if id === 'repeat'}
    <path d="M19 9a7 7 0 1 0 1 6" /><path d="M20 3v6h-6" />
  {:else if id === 'pair'}
    <circle cx="9" cy="12" r="6" /><circle cx="15" cy="12" r="6" />
  {:else if id === 'sort'}
    <path d="M5 20v-5M12 20v-9M19 20V5" />
  {/if}
</svg>

<style>
  .dot {
    fill: currentColor;
  }
</style>
