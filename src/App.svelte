<script lang="ts">
  // The card, start to finish: home, the five events, the three reads, the Scorecard. Each step's
  // result is stored the moment it is made (one attempt, R6). An event is marked started at Ready;
  // left before its end, it counts as played with its worst result (R11). A reload resumes at the
  // first step not yet played; a finished card opens on its Scorecard, fixed at finish. If the local
  // date changes while the page is open or asleep, the page reloads onto the new card (review 7).
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
  import { abandonedResult } from './lib/abandon';
  import { boardDate, cardNumber, localDay, parseDay } from './lib/card';
  import { config, game } from './lib/config';
  import { crowdFor } from './lib/crowd';
  import type { EventResults } from './lib/results';
  import { scoreBeforeFlag, scorecard, type Reads, type Scorecard } from './lib/score';
  import { deviceStore } from './lib/store';
  import { streak } from './lib/streak';
  import { EVENTS, type EventId } from './lib/week';

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
  let notice = $state('');
  const steps = $derived((attempt?.steps ?? {}) as Record<string, unknown>);
  const started = $derived(Object.keys(steps).length > 0);
  const closed = $derived(!!attempt?.finished && !('scorecard' in steps));

  let screen: Screen = $state(initial?.finished && 'scorecard' in initial.steps ? 'scorecard' : 'home');

  const crowd = $derived(card === null ? null : crowdFor(card));
  const results = $derived(steps as unknown as EventResults);
  const reads = $derived({ door: (steps.spot as { door: number } | undefined)?.door ?? -1, read: (steps.read as { read: number[] } | undefined)?.read ?? [] } as Reads);
  const place = $derived(crowd && 'read' in steps ? scoreBeforeFlag(crowd, results, reads).place : 0);
  const score = $derived(
    (steps.scorecard as Scorecard | undefined) ??
      (crowd && 'flag' in steps ? scorecard(crowd, results, reads, (steps.flag as { flag: number }).flag) : null),
  );
  const streakLine = $derived(card === null || !attempt?.finished ? { current: 0, best: 0, played: 0 } : streak(store.finishedCards(card), card));

  function refresh() {
    if (card !== null) attempt = store.load(card);
  }

  function save(step: string, value: unknown) {
    if (card === null) return;
    store.record(card, step, value);
    refresh();
  }

  function saveFlag(r: { flag: number }) {
    if (card === null || !crowd) return;
    save('flag', r);
    save('scorecard', scorecard(crowd, results, reads, r.flag));
    store.finish(card);
    refresh();
  }

  /** The next screen: the first step not played. An event started and not finished is closed with
   *  its worst result first (R11), and the next screen says so. */
  function next() {
    notice = '';
    if (card === null) return;
    refresh();
    if (attempt?.finished) {
      screen = 'scorecard' in steps ? 'scorecard' : 'home';
      return;
    }
    for (const s of STEPS) {
      if (s in steps) continue;
      if ((EVENTS as string[]).includes(s) && `${s}:started` in steps) {
        save(s, abandonedResult(s as EventId, card));
        notice = `You left ${game(s).name} before it finished, so it counts as played.`;
        continue;
      }
      screen = s;
      return;
    }
    screen = 'scorecard';
  }

  const start = (s: string) => () => save(`${s}:started`, true);

  function again() {
    if (card === null) return;
    store.clear(card);
    refresh();
    screen = 'home';
  }

  // a new local day while the page is open or asleep: load the new card
  $effect(() => {
    const check = () => {
      const now = localDay(new Date());
      if (now.y !== today.y || now.m !== today.m || now.d !== today.d) location.reload();
    };
    const onVisible = () => document.visibilityState === 'visible' && check();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('pageshow', check);
    const t = setInterval(check, 30_000);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('pageshow', check);
      clearInterval(t);
    };
  });
</script>

{#if notice}<p class="notice" role="status">{notice}</p>{/if}

{#if card === null || screen === 'home'}
  <Home {card} {date} {opensOn} {started} {closed} saving={store.persistent} firstTime={card !== null && !started && !store.playedBefore(card)} onplay={next} />
{:else if screen === 'stop'}
  <Stop {card} {date} onstart={start('stop')} onresult={(r) => save('stop', r)} onnext={next} />
{:else if screen === 'count'}
  <Count {card} {date} onstart={start('count')} onresult={(r) => save('count', r)} onnext={next} />
{:else if screen === 'repeat'}
  <Repeat {card} {date} onstart={start('repeat')} onresult={(r) => save('repeat', r)} onnext={next} />
{:else if screen === 'pair'}
  <Pair {card} {date} onstart={start('pair')} onresult={(r) => save('pair', r)} onnext={next} />
{:else if screen === 'sort'}
  <Sort {card} {date} onstart={start('sort')} onresult={(r) => save('sort', r)} onnext={next} />
{:else if screen === 'spot' && crowd}
  <SpotIt {crowd} onresult={(r) => save('spot', r)} onnext={next} />
{:else if screen === 'read' && crowd}
  <Pour {crowd} {results} onresult={(r) => save('read', r)} onnext={next} />
{:else if screen === 'flag' && crowd}
  <Claim {crowd} {place} onresult={saveFlag} onnext={() => (screen = 'scorecard')} />
{:else if screen === 'scorecard' && score}
  <ScorecardScreen {score} streak={streakLine} {preview} onagain={again} />
{:else}
  <Home {card} {date} {opensOn} {started} closed={true} saving={store.persistent} firstTime={false} onplay={next} />
{/if}

<style>
  .notice {
    margin: var(--space-3) var(--space-5) 0;
    padding: var(--space-2) var(--space-3);
    border: var(--line-thin) solid var(--ink);
    border-radius: var(--r-m);
    background: var(--chalk);
    font-weight: var(--w-semi);
    font-size: var(--size-s);
  }
</style>
