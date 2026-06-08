import type { CopyFn, FetchResult } from '../core/types';

/**
 * Default renderer: a titled section with copyable label/value rows and a
 * "Copy JSON" button. A Fetcher can supply its own `view` to override this.
 */
export function renderResult(result: FetchResult, copy: CopyFn): HTMLElement {
  const section = document.createElement('section');
  section.className = 'lt-section';

  const head = document.createElement('div');
  head.className = 'lt-sec-head';
  const h = document.createElement('h3');
  h.textContent = result.title;
  head.appendChild(h);
  if (result.raw !== undefined) {
    const jsonBtn = document.createElement('button');
    jsonBtn.className = 'lt-btn lt-btn-ghost';
    jsonBtn.textContent = 'Copy JSON';
    jsonBtn.addEventListener('click', () =>
      copy(JSON.stringify(result.raw, null, 2), 'JSON'),
    );
    head.appendChild(jsonBtn);
  }
  section.appendChild(head);

  if (result.error) {
    const err = document.createElement('div');
    err.className = 'lt-error';
    err.textContent = result.error;
    section.appendChild(err);
  }

  const list = document.createElement('div');
  list.className = 'lt-fields';
  for (const field of result.fields) {
    const row = document.createElement('div');
    row.className = 'lt-row';

    const label = document.createElement('span');
    label.className = 'lt-label';
    label.textContent = field.label;
    if (field.hint) label.title = field.hint;

    const value = document.createElement('span');
    value.className = 'lt-value' + (field.mono === false ? '' : ' lt-mono');
    const text = String(field.value);
    value.textContent = text;
    value.title = 'Click to copy';

    const doCopy = () => copy(text, field.label);
    value.addEventListener('click', doCopy);

    const copyBtn = document.createElement('button');
    copyBtn.className = 'lt-copy';
    copyBtn.title = 'Copy';
    copyBtn.textContent = '⧉';
    copyBtn.addEventListener('click', doCopy);

    row.append(label, value, copyBtn);
    list.appendChild(row);
  }
  section.appendChild(list);

  return section;
}
