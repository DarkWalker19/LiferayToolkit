// Styles live inside the panel's shadow root, so they can't leak to/from the page.
export const CSS = /* css */ `
:host { all: initial; }

.lt-fab {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 2147483646;
  width: 44px;
  height: 44px;
  padding: 0;
  overflow: hidden;
  border-radius: 50%;
  border: 1px solid #2f3a4a;
  background: #000;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.45);
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}
.lt-fab:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0, 0, 0, 0.55); }
.lt-fab img { width: 100%; height: 100%; display: block; object-fit: cover; border-radius: 50%; }

.lt-panel {
  position: fixed;
  top: 0;
  right: 0;
  z-index: 2147483647;
  width: 380px;
  max-width: 92vw;
  height: 100vh;
  background: #0d1117;
  color: #e6edf3;
  font: 13px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif;
  border-left: 1px solid #21262d;
  box-shadow: -8px 0 28px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  transform: translateX(105%);
  transition: transform 0.18s ease;
}
.lt-panel.open { transform: translateX(0); }

.lt-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid #21262d;
  background: #11161d;
}
.lt-title { font-weight: 700; font-size: 14px; color: #6cb6ff; }
.lt-actions { display: flex; gap: 6px; }

.lt-btn {
  background: #1b2230;
  color: #c9d1d9;
  border: 1px solid #2f3a4a;
  border-radius: 6px;
  padding: 4px 9px;
  font-size: 13px;
  cursor: pointer;
}
.lt-btn:hover { background: #232c3c; }
.lt-btn-auto { font-size: 10px; font-weight: 700; letter-spacing: 0.5px; }
.lt-btn.active { background: #1f6feb; color: #fff; border-color: #1f6feb; }
.lt-btn.active:hover { background: #2b7bf3; }
.lt-btn-ghost {
  background: transparent;
  border-color: transparent;
  color: #8b98a8;
  font-size: 11px;
  padding: 2px 6px;
}
.lt-btn-ghost:hover { color: #6cb6ff; background: #161d27; }

.lt-body { flex: 1; overflow-y: auto; padding: 10px 12px 40px; }

.lt-section {
  border: 1px solid #21262d;
  border-radius: 8px;
  margin-bottom: 10px;
  overflow: hidden;
  background: #11161d;
}
.lt-sec-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  background: #0f141b;
  border-bottom: 1px solid #21262d;
}
.lt-sec-head h3 { margin: 0; font-size: 12px; font-weight: 700; color: #adbac7; text-transform: uppercase; letter-spacing: 0.4px; }

.lt-fields { display: flex; flex-direction: column; }
.lt-row {
  display: grid;
  grid-template-columns: 120px 1fr auto;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-bottom: 1px solid #161c24;
}
.lt-row:last-child { border-bottom: none; }
.lt-row:hover { background: #141b24; }

.lt-label { color: #8b98a8; font-size: 12px; }
.lt-value {
  color: #e6edf3;
  cursor: pointer;
  word-break: break-all;
}
.lt-value:hover { color: #6cb6ff; }
.lt-mono { font-family: ui-monospace, "Cascadia Code", Consolas, monospace; font-size: 12px; }

.lt-copy {
  background: transparent;
  border: none;
  color: #586575;
  cursor: pointer;
  font-size: 14px;
  padding: 2px 4px;
}
.lt-copy:hover { color: #6cb6ff; }

.lt-error { color: #f0a37e; padding: 8px 10px; font-size: 12px; }
.lt-warn, .lt-empty, .lt-loading {
  color: #8b98a8;
  padding: 16px 10px;
  text-align: center;
  font-size: 12px;
}

.lt-toast {
  position: fixed;
  bottom: 18px;
  left: 50%;
  transform: translateX(-50%) translateY(20px);
  background: #1f6feb;
  color: #fff;
  padding: 7px 14px;
  border-radius: 6px;
  font: 12px/1 system-ui, sans-serif;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease, transform 0.15s ease;
  z-index: 2147483647;
}
.lt-toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
`;
