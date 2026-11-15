// One shared tooltip for every chart mark carrying data-tip. Works with mouse, touch, and keyboard focus.
export function initTooltips() {
  const tip = document.createElement('div');
  tip.className = 'chart-tip';
  tip.setAttribute('role', 'presentation');
  document.body.appendChild(tip);

  const place = (x: number, y: number) => {
    const r = tip.getBoundingClientRect();
    let left = x + 14;
    let top = y - r.height - 12;
    if (left + r.width > window.innerWidth - 8) left = x - r.width - 14;
    if (top < 8) top = y + 18;
    tip.style.left = `${Math.max(8, left)}px`;
    tip.style.top = `${top}px`;
  };
  const show = (el: Element, x: number, y: number) => {
    tip.textContent = el.getAttribute('data-tip') || '';
    tip.dataset.show = 'true';
    place(x, y);
  };
  const hide = () => { tip.dataset.show = 'false'; };

  document.addEventListener('pointermove', (e) => {
    const el = (e.target as Element)?.closest?.('[data-tip]');
    if (el) show(el, e.clientX, e.clientY); else hide();
  });
  document.addEventListener('focusin', (e) => {
    const el = (e.target as Element)?.closest?.('[data-tip]');
    if (el) { const r = el.getBoundingClientRect(); show(el, r.left + r.width / 2, r.top); }
  });
  document.addEventListener('focusout', hide);
  window.addEventListener('scroll', hide, { passive: true });
}
