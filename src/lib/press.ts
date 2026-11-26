// One activation per press, from any input (round-2 a8). Controls act on pointerdown for speed;
// the click that follows a pointer press is then ignored. A click that arrives with no pointer press
// before it (keyboard, VoiceOver, TalkBack, switch access) acts, whatever its `detail`.
export function pressOrClick() {
  let pressed = false;
  return {
    press(fn: () => void) {
      pressed = true;
      fn();
    },
    click(fn: () => void) {
      if (!pressed) fn();
      pressed = false;
    },
  };
}
