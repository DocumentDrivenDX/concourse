export function el<K extends keyof HTMLElementTagNameMap>(tag: K, content = '', className = ''): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag); node.textContent = content; if (className) node.className = className; return node;
}
export function button(label: string, action: () => void, className = ''): HTMLButtonElement {
  const b = el('button', label, className); b.type = 'button'; b.onclick = action; return b;
}
export function status(content = ''): HTMLParagraphElement {
  const p = el('p', content, 'notice'); p.setAttribute('role', 'status'); p.setAttribute('aria-live', 'polite'); return p;
}
export const title = (value: string) => value.replaceAll('_', ' ').replace(/^./, s => s.toUpperCase());
export const time = (value: string) => new Date(value).toLocaleString();
export function select(label: string, choices: string[], value = ''): { label: HTMLLabelElement; input: HTMLSelectElement } {
  const wrapper = el('label', label), input = el('select'); input.setAttribute('aria-label', label);
  for (const choice of choices) { const o = el('option', choice ? title(choice) : 'All'); o.value = choice; input.append(o); }
  input.value = value; wrapper.append(input); return { label: wrapper, input };
}
