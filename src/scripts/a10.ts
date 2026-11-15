import { a10Svg } from '../lib/a10sprite';

const reduce = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let flying = false;

function announce(msg: string) {
  const live = document.getElementById('sr-live');
  if (live) { live.textContent = ''; requestAnimationFrame(() => { live.textContent = msg; }); }
}

function toast(msg: string) {
  const t = document.createElement('div');
  t.className = 'a10-toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2600);
}

export function flyover() {
  if (flying) return;
  flying = true;
  const parked = document.querySelectorAll<HTMLElement>('[data-a10-parked]');
  parked.forEach((p) => p.setAttribute('data-away', 'true'));
  announce('BRRRT. The A-10 made a low pass over the page.');

  const done = () => {
    flying = false;
    setTimeout(() => parked.forEach((p) => p.removeAttribute('data-away')), 400);
  };

  if (reduce()) {
    toast('BRRRT. (Reduced motion is on, so the jet stayed on the ramp.)');
    setTimeout(done, 1200);
    return;
  }

  const vw = window.innerWidth;
  const scale = vw < 640 ? 3 : 5;
  const jet = document.createElement('div');
  jet.className = 'a10-jet';
  jet.innerHTML = a10Svg({ scale });
  const y = Math.round(window.innerHeight * (0.28 + Math.random() * 0.2));
  jet.style.top = `${y}px`;
  document.body.appendChild(jet);
  const w = 38 * scale;
  const dur = 1900;
  const anim = jet.animate(
    [
      { transform: `translate(${-w - 40}px, 30px) rotate(-4deg)` },
      { transform: `translate(${vw * 0.35}px, 0px) rotate(0deg)`, offset: 0.4 },
      { transform: `translate(${vw + 60}px, -60px) rotate(-7deg)` },
    ],
    { duration: dur, easing: 'cubic-bezier(.3,.1,.5,1)' },
  );

  // gun run: BRRRT text and impact puffs trail behind the jet
  const brrt = document.createElement('div');
  brrt.className = 'a10-brrrt';
  brrt.textContent = 'BRRRRT';
  brrt.style.top = `${y + 12 * scale}px`;
  brrt.style.left = `${Math.round(vw * 0.3)}px`;
  setTimeout(() => document.body.appendChild(brrt), dur * 0.3);
  for (let i = 0; i < 9; i++) {
    setTimeout(() => {
      const puff = document.createElement('div');
      puff.className = 'a10-puff';
      puff.style.left = `${Math.round(vw * (0.25 + i * 0.06))}px`;
      puff.style.top = `${y + 22 * scale + Math.round(Math.random() * 20)}px`;
      document.body.appendChild(puff);
      setTimeout(() => puff.remove(), 700);
    }, dur * 0.28 + i * 45);
  }
  (document.getElementById('main') ?? document.body).animate(
    [{ transform: 'translate(0,0)' }, { transform: 'translate(-2px,1px)' }, { transform: 'translate(2px,-1px)' }, { transform: 'translate(0,0)' }],
    { duration: 120, iterations: 4, delay: dur * 0.3 },
  );

  anim.onfinish = () => {
    jet.remove();
    setTimeout(() => brrt.remove(), 300);
    done();
  };
}

export function initA10() {
  document.querySelectorAll<HTMLElement>('[data-a10-launch]').forEach((el) => {
    el.addEventListener('click', () => flyover());
  });
  // Typing "brrrt" anywhere (outside form fields) also works.
  let buf = '';
  window.addEventListener('keydown', (e) => {
    const t = e.target as HTMLElement | null;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.closest('[data-game]'))) return;
    if (e.key.length !== 1) return;
    buf = (buf + e.key.toLowerCase()).slice(-8);
    if (/br{3,}t$/.test(buf)) { buf = ''; flyover(); }
  });
}
