import type { Snapshot } from '../core/types';

const SOURCE = 'liferay-toolkit';
const REQ = 'liferay-toolkit-req';

let latest: Snapshot | null = null;

// Passively keep the latest snapshot the bridge broadcasts.
window.addEventListener('message', (e) => {
  if (e.source !== window) return;
  const d = e.data;
  if (d && d.source === SOURCE && d.type === 'context') {
    latest = d.payload as Snapshot;
  }
});

export function getLatest(): Snapshot | null {
  return latest;
}

/** Ask the bridge for a fresh snapshot; resolves with it (or the last one on timeout). */
export function requestSnapshot(timeoutMs = 500): Promise<Snapshot | null> {
  return new Promise((resolve) => {
    let done = false;
    const finish = (value: Snapshot | null) => {
      if (done) return;
      done = true;
      window.removeEventListener('message', handler);
      resolve(value);
    };
    const handler = (e: MessageEvent) => {
      if (e.source !== window) return;
      const d = e.data;
      if (d && d.source === SOURCE && d.type === 'context') {
        latest = d.payload as Snapshot;
        finish(latest);
      }
    };
    window.addEventListener('message', handler);
    window.postMessage({ source: REQ, type: 'request' }, '*');
    setTimeout(() => finish(latest), timeoutMs);
  });
}
