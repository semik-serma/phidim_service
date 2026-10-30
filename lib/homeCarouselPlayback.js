// Each new selection or pause state starts a fresh eight-second countdown.
export function startCarouselPlayback({ paused, onAdvance, page = document, clock = globalThis }) {
  let timer;
  const stop = () => {
    if (timer !== undefined) clock.clearTimeout(timer);
    timer = undefined;
  };
  const schedule = () => {
    stop();
    if (!paused && !page.hidden) timer = clock.setTimeout(onAdvance, 8000);
  };
  page.addEventListener("visibilitychange", schedule);
  schedule();
  return () => {
    stop();
    page.removeEventListener("visibilitychange", schedule);
  };
}
