// Accept only fresh fixes whose device-reported uncertainty is suitable for booking.
export const BOOKING_LOCATION_ACCURACY_METERS = 50;
export const LOCATION_TIMEOUT_MS = 30000;

export function requestAccurateLocation(onSuccess, onError, {
  geolocation = globalThis.navigator?.geolocation,
  now = Date.now,
  schedule = setTimeout,
  unschedule = clearTimeout,
} = {}) {
  if (!geolocation?.watchPosition) {
    onError("Location is unavailable. Enable device location or enter coordinates manually.");
    return () => {};
  }
  const started = now();
  let stopped = false;
  let watchId;
  let bestAccuracy = Infinity;
  let timer;
  const cancel = () => {
    stopped = true;
    if (watchId !== undefined) geolocation.clearWatch(watchId);
    if (timer !== undefined) unschedule(timer);
  };
  const fail = message => {
    if (stopped) return;
    cancel();
    onError(message);
  };
  timer = schedule(() => fail(Number.isFinite(bestAccuracy)
    ? `Your location is only accurate to about ${Math.ceil(bestAccuracy)} metres. Enable precise location, move outdoors, and retry or enter coordinates manually.`
    : "Unable to get an accurate location. Enable precise location, move outdoors, and retry or enter coordinates manually."), LOCATION_TIMEOUT_MS);
  try {
    watchId = geolocation.watchPosition(position => {
      if (stopped) return;
      const { latitude, longitude, accuracy } = position.coords || {};
      if (!Number.isFinite(position.timestamp) || position.timestamp < started - 1000 || position.timestamp > now() + 1000 ||
          !Number.isFinite(latitude) || Math.abs(latitude) > 90 ||
          !Number.isFinite(longitude) || Math.abs(longitude) > 180 ||
          !Number.isFinite(accuracy) || accuracy < 0) return;
      bestAccuracy = Math.min(bestAccuracy, accuracy);
      if (accuracy > BOOKING_LOCATION_ACCURACY_METERS) return;
      cancel();
      onSuccess({ latitude, longitude, accuracy });
    }, error => {
      if (error.code === 1) fail("Location permission denied. Allow precise location access or enter coordinates manually.");
      // A temporary unavailable/timeout error can be followed by a better fix.
    }, { enableHighAccuracy: true, timeout: LOCATION_TIMEOUT_MS, maximumAge: 0 });
    // Also clean up if a provider invokes a callback synchronously.
    if (stopped) geolocation.clearWatch(watchId);
  } catch {
    fail("Unable to access location. Enable device location and allow location access or enter coordinates manually.");
  }
  return cancel;
}
