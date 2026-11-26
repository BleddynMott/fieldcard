<script lang="ts">
  // Home (spec, First 60 seconds). The Hot Seat card joins in G-04b; until then the sign board,
  // the how-to for a first-time player, and Play.
  let {
    card,
    date,
    firstTime,
    opensOn,
    onplay,
  }: { card: number | null; date: string; firstTime: boolean; opensOn: string; onplay: () => void } = $props();
</script>

<section class="screen">
  <div class="lawn">
    <div class="board">
      <div class="t">FIELDCARD</div>
      <div class="s">{card === null ? `Card #1 opens ${opensOn}` : `Card #${card} · ${date}`}</div>
    </div>
  </div>

  {#if card !== null && firstTime}
    <div class="how">
      <p>
        Five quick events. Then read the crowd: where did everyone go, and where did you finish? You get three scores:
        <b>Hands</b> for the events, <b>Hunch</b> for reading everyone else, and your <b>Flag</b>.
      </p>
    </div>
  {/if}

  {#if card !== null}
    <div class="foot"><button class="pill" onclick={onplay}>Play card #{card}</button></div>
  {/if}
</section>

<style>
  .screen {
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
  }
  .lawn {
    height: var(--ev-lawn-h);
    position: relative;
    background: repeating-linear-gradient(90deg, var(--lawn) 0 var(--lawn-stripe), var(--lawn-2) var(--lawn-stripe) calc(2 * var(--lawn-stripe)));
    border-bottom: var(--line) solid var(--ink);
  }
  .board {
    position: absolute;
    left: 50%;
    top: var(--space-6);
    transform: translateX(-50%) rotate(var(--tilt));
    background: var(--chalk);
    border: var(--line) solid var(--ink);
    border-radius: var(--r-l);
    padding: var(--space-3) var(--space-6) var(--space-2);
    text-align: center;
    box-shadow: var(--shadow-m);
    white-space: nowrap;
  }
  .t {
    font-family: var(--font-display);
    font-size: var(--size-big);
    line-height: var(--lh-tight);
  }
  .s {
    font-weight: var(--w-bold);
    font-size: var(--size-s);
    color: var(--dim);
    margin-top: var(--space-1);
  }
  .how {
    margin: var(--space-6) var(--space-5) 0;
    background: var(--chalk);
    border: var(--line) solid var(--ink);
    border-radius: var(--r-card);
    padding: var(--space-4);
    box-shadow: var(--shadow-m);
    color: var(--ink-soft);
  }
  .how b {
    color: var(--ink);
  }
  .foot {
    margin-top: auto;
    padding: var(--space-6) var(--space-5) var(--space-8);
  }
</style>
