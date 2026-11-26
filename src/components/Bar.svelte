<script lang="ts">
  // The band at the top of every screen after the events: the step's name and three step marks,
  // so the player knows which of the three reads they are on (DESIGN.md, Do 5).
  let { title, step }: { title: string; step: number } = $props(); // step 0, 1, 2; 3 = all done
</script>

<div class="bar">
  <span class="t">{title}</span>
  <span class="steps" aria-label={step < 3 ? `read ${step + 1} of 3` : 'all three reads done'}>
    {#each [0, 1, 2] as i (i)}<i class:on={i === step} class:done={i < step}></i>{/each}
  </span>
</div>
