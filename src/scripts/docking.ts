// Pixel docking sim. In-plane Clohessy–Wiltshire dynamics in LVLH:
//   x = radial (up on screen), y = along-track (right on screen = ahead of the target).
//   x'' = 3n^2 x + 2n y' + a_x,   y'' = -2n x' + a_y
// The autopilot is textbook multi-impulse CW targeting along the V-bar, re-planned at each waypoint.
// It is a simple stand-in for the paper's adaptive MPC, which also has to deal with a defending Guard.

type S = { x: number; y: number; vx: number; vy: number };
const N = 0.00113; // rad/s, roughly a 93-minute orbit
const W = 320, H = 200;
const SCALE = 1; // px per meter
const TGT = { px: 262, py: 96 };
const KOZ = 30; // m
const CORRIDOR = (15 * Math.PI) / 180;
const ACC = 0.02; // m/s^2 while a thruster is held
const DOCK_R = 3, DOCK_V = 0.15;
const START: S = { x: 25, y: -200, vx: 0, vy: 0 };

const C = {
  bg: '#07061a', star: '#4a4570', star2: '#d9ccb6', earth1: '#1b2f6b', earth2: '#2c7f8a', cloud: '#f6ecdb',
  gold: '#e8b33e', gold2: '#a8752a', panel: '#2a2660', panel2: '#5b54a8', white: '#f6ecdb', grey: '#aa9f8c',
  orange: '#ff7a2f', cyan: '#4fd1bf', red: '#e0453a', green: '#5fd39a', dim: '#3a3678',
};

function deriv(s: S, ax: number, ay: number): S {
  return { x: s.vx, y: s.vy, vx: 3 * N * N * s.x + 2 * N * s.vy + ax, vy: -2 * N * s.vx + ay };
}
function rk4(s: S, dt: number, ax: number, ay: number): S {
  const add = (a: S, b: S, k: number): S => ({ x: a.x + b.x * k, y: a.y + b.y * k, vx: a.vx + b.vx * k, vy: a.vy + b.vy * k });
  const k1 = deriv(s, ax, ay), k2 = deriv(add(s, k1, dt / 2), ax, ay), k3 = deriv(add(s, k2, dt / 2), ax, ay), k4 = deriv(add(s, k3, dt), ax, ay);
  return {
    x: s.x + (dt / 6) * (k1.x + 2 * k2.x + 2 * k3.x + k4.x),
    y: s.y + (dt / 6) * (k1.y + 2 * k2.y + 2 * k3.y + k4.y),
    vx: s.vx + (dt / 6) * (k1.vx + 2 * k2.vx + 2 * k3.vx + k4.vx),
    vy: s.vy + (dt / 6) * (k1.vy + 2 * k2.vy + 2 * k3.vy + k4.vy),
  };
}
// Velocity needed now to arrive at (xf, yf) after T seconds (CW two-impulse targeting).
function targetVel(s: S, xf: number, yf: number, T: number) {
  const c = Math.cos(N * T), sn = Math.sin(N * T);
  const rrx = (4 - 3 * c) * s.x;
  const rry = 6 * (sn - N * T) * s.x + s.y;
  const a = sn / N, b = (2 * (1 - c)) / N, cc = (-2 * (1 - c)) / N, d = (4 * sn - 3 * N * T) / N;
  const bx = xf - rrx, by = yf - rry;
  const det = a * d - b * cc;
  return { vx: (d * bx - b * by) / det, vy: (-cc * bx + a * by) / det };
}

export function initDocking(root: HTMLElement) {
  const canvas = root.querySelector('canvas')!;
  const ctx = canvas.getContext('2d')!;
  const status = root.querySelector<HTMLElement>('[data-status]')!;
  const result = root.querySelector<HTMLElement>('[data-result]')!;
  canvas.width = W; canvas.height = H;
  ctx.imageSmoothingEnabled = false;

  // stars
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const stars = Array.from({ length: 70 }, () => ({ x: Math.floor(rnd() * W), y: Math.floor(rnd() * (H - 40)), b: rnd() < 0.2 }));

  let s: S = { ...START };
  let t = 0, dv = 0, warn = 0, enteredBad = false, wasInside = false;
  let mode: 'idle' | 'play' | 'auto' | 'done' = 'idle';
  let outcome = '';
  const keys = { up: false, down: false, left: false, right: false };
  const trail: { x: number; y: number }[] = [];
  let auto: { legs: { x: number; y: number; T: number }[]; leg: number; legT: number; dv: number } | null = null;
  let best: number | null = null;
  try { const b = localStorage.getItem('dock-best'); if (b) best = parseFloat(b); } catch {}

  const toPx = (p: { x: number; y: number }) => ({ px: Math.round(TGT.px + p.y * SCALE), py: Math.round(TGT.py - p.x * SCALE) });

  function reset(m: 'idle' | 'play' | 'auto' = 'idle') {
    s = { ...START }; t = 0; dv = 0; warn = 0; enteredBad = false; wasInside = false; outcome = ''; trail.length = 0; auto = null;
    mode = m;
    result.textContent = '';
    if (m === 'auto') {
      auto = { legs: [{ x: 0, y: -100, T: 500 }, { x: 0, y: -40, T: 350 }, { x: 0, y: -12, T: 250 }, { x: 0, y: -1.5, T: 180 }], leg: 0, legT: 0, dv: 0 };
      burnToward(auto.legs[0]);
    }
  }
  function burnToward(w: { x: number; y: number; T: number }) {
    const v = targetVel(s, w.x, w.y, w.T);
    const d = Math.hypot(v.vx - s.vx, v.vy - s.vy);
    dv += d; if (auto) auto.dv += d;
    s.vx = v.vx; s.vy = v.vy;
  }

  function finish(text: string, ok: boolean) {
    mode = 'done';
    outcome = text;
    let msg = `${text} Δv used: ${dv.toFixed(2)} m/s.`;
    if (ok && !auto) {
      if (best === null || dv < best) { best = dv; try { localStorage.setItem('dock-best', String(best)); } catch {} msg += ' New personal best.'; }
      msg += ' Now press Autopilot to see how much CW targeting spends.';
    }
    if (ok && auto) msg = `Autopilot docked using ${dv.toFixed(2)} m/s of Δv with four planned burns and a final brake.${best !== null ? ` Your best: ${best.toFixed(2)} m/s.` : ''}`;
    result.textContent = msg;
  }

  function step(dtReal: number) {
    if (mode === 'idle' || mode === 'done') return;
    const warp = mode === 'auto' ? 45 : 30;
    let rem = dtReal * warp;
    while (rem > 0) {
      const h = Math.min(0.5, rem); rem -= h;
      let ax = 0, ay = 0;
      if (mode === 'play') {
        ax = (keys.up ? ACC : 0) - (keys.down ? ACC : 0);
        ay = (keys.right ? ACC : 0) - (keys.left ? ACC : 0);
        dv += (Math.abs(ax) + Math.abs(ay)) * h;
      }
      s = rk4(s, h, ax, ay); t += h;
      if (auto) {
        auto.legT += h;
        const L = auto.legs[auto.leg];
        if (auto.legT >= L.T) {
          auto.leg++; auto.legT = 0;
          if (auto.leg < auto.legs.length) burnToward(auto.legs[auto.leg]);
          else { const d = Math.hypot(s.vx - 0, s.vy - 0.05); dv += d; auto.dv += d; s.vx = 0; s.vy = 0.05; auto.legs.push({ x: 0, y: 0, T: 1e9 }); }
        }
      }
      const r = Math.hypot(s.x, s.y);
      const v = Math.hypot(s.vx, s.vy);
      const inside = r < KOZ;
      if (inside && !wasInside) {
        const ang = Math.atan2(Math.abs(s.x), -s.y); // angle from the -V-bar axis
        if (s.y > 0 || ang > CORRIDOR) { warn = 1.2; enteredBad = true; }
      }
      wasInside = inside;
      if (r < DOCK_R) {
        if (v < DOCK_V && !enteredBad) return finish('Docked.', true);
        if (v >= DOCK_V) return finish(`Too fast at contact (${v.toFixed(2)} m/s) and bounced off.`, false);
        return finish('Docked, but you entered the keep-out zone outside the approach corridor.', false);
      }
      if (r > 420) return finish('Lost the target. You drifted out of range.', false);
    }
    if (trail.length === 0 || Math.hypot(trail[trail.length - 1].x - s.x, trail[trail.length - 1].y - s.y) > 3) trail.push({ x: s.x, y: s.y });
    if (trail.length > 400) trail.shift();
    warn = Math.max(0, warn - dtReal);
  }

  // ---------- drawing ----------
  const px = (x: number, y: number, c: string, w = 1, h = 1) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
  function sprite(rows: string[], x: number, y: number, pal: Record<string, string>, k = 2) {
    rows.forEach((r, j) => [...r].forEach((ch, i) => { if (pal[ch]) px(x + i * k, y + j * k, pal[ch], k, k); }));
  }
  const TARGET = [
    '....aaaaaaa.....',
    'pppp.ggggg.pppp.',
    'PPPP.gGGGg.PPPP.',
    'pppp=ggggg=pppp.',
    'PPPP.gGGGg.PPPP.',
    'pppp.ggggg.pppp.',
    '....aaaaaaa.....',
  ];
  const CHASER = [
    'pp.ww.pp',
    'PP=wW=PP',
    'pp.ww.pp',
  ];
  const pal = { a: C.grey, g: C.gold, G: C.gold2, p: C.panel, P: C.panel2, '=': C.grey, w: C.white, W: C.grey };

  function draw() {
    px(0, 0, C.bg, W, H);
    for (const st of stars) px(st.x, st.y, st.b ? C.star2 : C.star);
    // Earth limb (radial down)
    for (let i = 0; i < W; i++) {
      const y = Math.round(H - 14 + 10 * Math.pow((i - W / 2) / (W / 2), 2));
      px(i, y, C.earth2, 1, 2);
      px(i, y + 2, C.earth1, 1, H - y);
      if ((i * 7) % 23 < 3) px(i, y + 3 + ((i * 13) % 5), C.cloud);
    }
    // keep-out zone and approach corridor
    for (let a = 0; a < 360; a += 6) {
      const r = (a * Math.PI) / 180;
      px(Math.round(TGT.px + Math.cos(r) * KOZ), Math.round(TGT.py + Math.sin(r) * KOZ), warn > 0 ? C.red : C.orange);
    }
    for (let d = 6; d < KOZ + 30; d += 4) {
      px(Math.round(TGT.px - d * Math.cos(CORRIDOR)), Math.round(TGT.py - d * Math.sin(CORRIDOR)), C.dim);
      px(Math.round(TGT.px - d * Math.cos(CORRIDOR)), Math.round(TGT.py + d * Math.sin(CORRIDOR)), C.dim);
    }
    // predicted coast arc (next ~25 minutes, no thrust)
    if (mode !== 'done') {
      let p: S = { ...s };
      for (let i = 0; i < 30; i++) { for (let k = 0; k < 10; k++) p = rk4(p, 5, 0, 0); const q = toPx(p); if (q.px >= 0 && q.px < W && q.py >= 0 && q.py < H) px(q.px, q.py, C.cyan); }
    }
    // trail
    for (const tr of trail) { const q = toPx(tr); px(q.px, q.py, C.dim); }
    // target: its docking port (left edge) sits exactly at the target point and faces −V-bar
    sprite(TARGET, TGT.px + 1, TGT.py - 7, pal);
    px(TGT.px - 1, TGT.py - 1, C.green, 2, 2);
    // chaser: its nose (right edge) sits at its position, so contact looks like contact
    const q = toPx(s);
    sprite(CHASER, q.px - 16, q.py - 3, pal);
    if (mode === 'play') {
      const f = (Date.now() / 60) % 2 < 1 ? C.orange : '#ffd08a';
      if (keys.right) px(q.px - 20, q.py - 1, f, 4, 2);
      if (keys.left) px(q.px + 1, q.py - 1, f, 3, 2);
      if (keys.up) px(q.px - 9, q.py + 3, f, 2, 4);
      if (keys.down) px(q.px - 9, q.py - 7, f, 2, 4);
    }
    // HUD
    const r = Math.hypot(s.x, s.y);
    const rate = (s.x * s.vx + s.y * s.vy) / Math.max(r, 1e-6);
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.textBaseline = 'top';
    const hud = (txt: string, x: number, y: number, c = C.white) => { ctx.fillStyle = '#000'; ctx.fillText(txt, x + 1, y + 1); ctx.fillStyle = c; ctx.fillText(txt, x, y); };
    hud(`RNG ${r.toFixed(1)}M`, 6, 6);
    hud(`RATE ${rate >= 0 ? '+' : ''}${rate.toFixed(2)}`, 6, 18, Math.abs(rate) > DOCK_V && r < KOZ ? C.red : C.white);
    hud(`DV ${dv.toFixed(2)}`, 214, 6, C.orange);
    const mm = Math.floor(t / 60), ss = Math.floor(t % 60);
    hud(`T+${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`, 214, 18, C.cyan);
    if (mode === 'auto') hud('AUTOPILOT', 6, 30, C.green);
    if (warn > 0) hud('KOZ VIOLATION', 110, 44, C.red);
    if (mode === 'idle') {
      ctx.fillStyle = 'rgba(11,15,36,0.75)'; ctx.fillRect(40, 70, 240, 54);
      hud('PRESS START', 116, 80, C.orange);
      hud('DOCK UNDER 0.15 M/S', 84, 96);
      hud('ENTER VIA THE CORRIDOR', 72, 108, C.cyan);
    }
    if (mode === 'done') {
      ctx.fillStyle = 'rgba(11,15,36,0.78)'; ctx.fillRect(30, 70, 260, 40);
      hud(outcome.startsWith('Docked.') || outcome.startsWith('Autopilot') ? 'DOCKED' : 'MISSION FAILED', outcome.startsWith('Docked.') ? 136 : 104, 80, outcome.startsWith('Docked.') ? C.green : C.red);
      hud('R = RESET', 124, 96, C.white);
    }
  }

  // ---------- loop ----------
  let last = performance.now();
  let raf = 0;
  let visible = false;
  function loop(now: number) {
    // On a slow frame, take several small physics steps so the game keeps real time instead of slowing down.
    let left = Math.min(0.25, (now - last) / 1000); last = now;
    while (left > 1e-4) { const dt = Math.min(0.05, left); step(dt); left -= dt; }
    draw();
    status.textContent = mode === 'idle' ? 'Ready' : mode === 'auto' ? 'Autopilot flying' : mode === 'play' ? 'Flying' : 'Finished';
    if (visible) raf = requestAnimationFrame(loop);
  }
  new IntersectionObserver((es) => {
    visible = es[0].isIntersecting;
    if (visible) { last = performance.now(); raf = requestAnimationFrame(loop); } else cancelAnimationFrame(raf);
  }).observe(canvas);

  // ---------- input ----------
  const map: Record<string, keyof typeof keys> = { ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down', ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right' };
  canvas.addEventListener('keydown', (e) => {
    if (map[e.key]) { e.preventDefault(); if (mode === 'idle') reset('play'); if (mode === 'play') keys[map[e.key]] = true; }
    if (e.key === 'r' || e.key === 'R') reset('idle');
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (mode === 'idle' || mode === 'done') reset('play'); }
  });
  canvas.addEventListener('keyup', (e) => { if (map[e.key]) keys[map[e.key]] = false; });
  canvas.addEventListener('blur', () => { keys.up = keys.down = keys.left = keys.right = false; });

  root.querySelectorAll<HTMLButtonElement>('[data-thrust]').forEach((b) => {
    const k = b.dataset.thrust as keyof typeof keys;
    const on = (e: Event) => { e.preventDefault(); if (mode === 'idle' || mode === 'done') reset('play'); if (mode === 'play') keys[k] = true; b.setPointerCapture?.((e as PointerEvent).pointerId); };
    const off = () => { keys[k] = false; };
    b.addEventListener('pointerdown', on);
    b.addEventListener('pointerup', off);
    b.addEventListener('pointercancel', off);
    b.addEventListener('lostpointercapture', off);
    b.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') on(e); });
    b.addEventListener('keyup', off);
  });
  root.querySelector('[data-start]')?.addEventListener('click', () => { reset('play'); canvas.focus(); });
  root.querySelector('[data-auto]')?.addEventListener('click', () => reset('auto'));
  root.querySelector('[data-reset]')?.addEventListener('click', () => reset('idle'));

  document.fonts?.load('8px "Press Start 2P"').finally(draw);
  draw();
}
