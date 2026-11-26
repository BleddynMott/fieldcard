<script lang="ts">
  // The card, start to finish: home, the five events, the three reads, the Scorecard. Each step's
  // result is stored the moment it is made (one attempt, R6); a reload resumes at the first step not
  // yet played; a finished card opens on its Scorecard, fixed at finish.
  import Home from './screens/Home.svelte';
  import Stop from './screens/Stop.svelte';
  import Count from './screens/Count.svelte';
  import Repeat from './screens/Repeat.svelte';
  import Pair from './screens/Pair.svelte';
  import Sort from './screens/Sort.svelte';
  import SpotIt from './screens/SpotIt.svelte';
  import Pour from './screens/Pour.svelte';
  import Claim from './screens/Claim.svelte';
  import ScorecardScreen from './screens/Scorecard.svelte';
  import { boardDate, cardNumber, localDay, parseDay } from './lib/card';
  import { config } from './lib/config';
  import { crowdFor } from './lib/crowd';
  import type { EventResults } from './lib/results';
  import { scoreBeforeFlag, scorecard, type Reads, type Scorecard } from './lib/score';
  import { deviceStore } from './lib/store';
  import { streak } from './lib/streak';

  const preview = import.meta.env.VITE_PREVIEW === '1';
  const store = deviceStore();
  const today = localDay(new Date());
  const card = cardNumber(today);
  const date = boardDate(today);
  const opensOn = boardDate(parseDay(config.launch));

  const STEPS = ['stop', 'count', 'repeat', 'pair', 'sort', 'spot', 'read', 'flag'] as const;
  type Step = (typeof STEPS)[number];
  type Screen = 'home' | Step | 'scorecard';

  const initial = card === null ? null : store.load(card);
  let attempt = $state(initial);
  const steps = $derived((attempt?.steps ?? {}) as Record<string, unknown>);
  const firstUnplayed = (): Step | 'scorecard' => STEPS.find((s) => !(s in steps)) ?? 'scorecard';
  const started = $derived(Object.keys(steps).length > 0);

  let screen: Screen = $state(initial?.finished && 'scorecard' in initial.steps ? 'scorecard' : 'home');

  const crowd = $derived(card === null ? null : crowdFor(card));
  const results = $derived(steps as unknown as EventResults);
  const reads = $derived({ door: (steps.spot as { door: number } | undefined)?.door ?? -1, read: (steps.read as { read: number[] } | undefined)?.read ?? [] } as Reads);
  const place = $derived(crowd && 'read' in steps ? scoreBeforeFlag(crowd, results, reads).place : 0);
  const score = $derived((steps.scorecard as Scorecard | undefined) ?? null);
  const streakLine = $derived(card === null || !attempt?.finished ? { current: 0, best: 0, played: 0 } : streak(store.finishedCards(card), card));

  function save(step: string, value: unknown) {
    if (card === null) return;
    store.record(card, step, value);
    attempt = store.load(card);
  }

  function saveFlag(r: { flag: number }) {
    if (card === null || !crowd) return;
    save('flag', r);
    const s = scorecard(crowd, results, reads, r.flag);
    save('scorecard', s);
    store.finish(card);
    attempt = store.load(card);
  }

  const next = () => (screen = firstUnplayed());

  function again() {
    if (card === null) return;
    store.clear(card);
    attempt = store.load(card);
    screen = 'home';
  }
</script>

{#if card === null || screen === 'home'}
  <Home {card} {date} {opensOn} {started} firstTime={card !== null && !started && !store.playedBefore(card)} onplay={next} />
{:else if screen === 'stop'}
  <Stop {card} {date} onresult={(r) => save('stop', r)} onnext={next} />
{:else if screen === 'count'}
  <Count {card} {date} onresult={(r) => save('count', r)} onnext={next} />
{:else if screen === 'repeat'}
  <Repeat {card} {date} onresult={(r) => save('repeat', r)} onnext={next} />
{:else if screen === 'pair'}
  <Pair {card} {date} onresult={(r) => save('pair', r)} onnext={next} />
{:else if screen === 'sort'}
  <Sort {card} {date} onresult={(r) => save('sort', r)} onnext={next} />
{:else if screen === 'spot' && crowd}
  <SpotIt {crowd} onresult={(r) => save('spot', r)} onnext={next} />
{:else if screen === 'read' && crowd}
  <Pour {crowd} {results} onresult={(r) => save('read', r)} onnext={next} />
{:else if screen === 'flag' && crowd}
  <Claim {crowd} {place} onresult={saveFlag} onnext={() => (screen = 'scorecard')} />
{:else if screen === 'scorecard' && score}
  <ScorecardScreen {score} streak={streakLine} {preview} onagain={again} />
{/if}
