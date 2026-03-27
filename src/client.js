const _seen = new Map();
const DEDUP_WINDOW = 300_000; // 5 minutes in ms

function isDuplicate(payload) {
  const key = `${payload.user_id}:${payload.page}:${payload.description}`;
  const now = Date.now();
  for (const [k, t] of _seen) {
    if (now - t > DEDUP_WINDOW) _seen.delete(k);
  }
  if (_seen.has(key)) return true;
  _seen.set(key, now);
  return false;
}

export async function sendPayload(config, payload) {
  if (isDuplicate(payload)) return;
  try {
    await fetch(`${config.url}/feedback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": config.apiKey,
      },
      body: JSON.stringify(payload),
      keepalive: true, // survives page unload
    });
  } catch {
    // Silent — never surface feedback errors to the user
  }
}

export function sendPayloadFireAndForget(config, payload) {
  // Non-blocking — caller does not await
  sendPayload(config, payload).catch(() => {});
}
