<script lang="ts">
  import Home from './screens/Home.svelte';
  import SliceEnd from './screens/SliceEnd.svelte';
  import Stop from './screens/Stop.svelte';
  import { boardDate, cardNumber, localDay, parseDay } from './lib/card';
  import { config } from './lib/config';
  import type { StopResult } from './lib/events/stop';
  import { deviceStore } from './lib/store';

  const preview = import.meta.env.VITE_PREVIEW === '1';
  const store = deviceStore();
  const today = localDay(new Date());
  const card = cardNumber(today);
  const date = boardDate(today);
  const opensOn = boardDate(parseDay(config.launch));

  type Screen = 'home' | 'stop' | 'slice-end';
  const resume = (): Screen => (card !== null && store.played(card, 'stop') ? 'slice-end' : 'home');
  let screen: Screen = $state(resume());
  let attempt = $state(card === null ? null : store.load(card));

  function stopResultSaved(r: StopResult) {
    if (card === null) return;
    store.record(card, 'stop', r);
    attempt = store.load(card);
  }

  function again() {
    if (card === null) return;
    store.clear(card);
    attempt = store.load(card);
    screen = 'home';
  }

  const stopMean = $derived((attempt?.steps.stop as StopResult | undefined)?.mean ?? null);
</script>

{#if screen === 'home'}
  <Home {card} {date} {opensOn} firstTime={card !== null && !store.playedBefore(card)} onplay={() => (screen = 'stop')} />
{:else if screen === 'stop' && card !== null}
  <Stop {card} {date} onresult={stopResultSaved} onnext={() => (screen = 'slice-end')} />
{:else}
  <SliceEnd mean={stopMean} {preview} onagain={again} />
{/if}
