/** Haptics, subtle sound, and screen wake lock. All opt-in and silent on unsupported platforms. */

export function haptic(pattern: number | number[] = 12): void {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(pattern);
  } catch {
    /* ignore */
  }
}

let audioCtx: AudioContext | null = null;

/** A soft wooden tick, quieter than a keyboard. Off by default. */
export function softTick(): void {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    audioCtx = audioCtx ?? new Ctx();
    const ctx = audioCtx;
    if (ctx.state === "suspended") void ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 900;
    osc.type = "sine";
    osc.frequency.setValueAtTime(520, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(380, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.06, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.13);
  } catch {
    /* ignore */
  }
}

type WakeLockSentinelLike = { release: () => Promise<void>; addEventListener?: (t: string, cb: () => void) => void };

export async function requestWakeLock(): Promise<(() => void) | null> {
  try {
    const nav = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<WakeLockSentinelLike> } };
    if (!nav.wakeLock) return null;
    let sentinel: WakeLockSentinelLike | null = await nav.wakeLock.request("screen");
    const reacquire = async () => {
      if (document.visibilityState === "visible" && sentinel === null) {
        try {
          sentinel = await nav.wakeLock!.request("screen");
        } catch {
          /* ignore */
        }
      }
    };
    document.addEventListener("visibilitychange", reacquire);
    return () => {
      document.removeEventListener("visibilitychange", reacquire);
      void sentinel?.release();
      sentinel = null;
    };
  } catch {
    return null;
  }
}

export function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}
