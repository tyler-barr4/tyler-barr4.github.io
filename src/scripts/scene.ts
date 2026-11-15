// "Trajectory": one WebGL scene behind the homepage. Scrolling moves the camera from the LEO debris
// environment, down to a rendezvous, then out toward deep space. Earth radius = 1 scene unit.
import * as THREE from 'three';
import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import land110 from 'world-atlas/land-110m.json';

// focus: how much each highlight is on in this shot (0..1). Interpolated along with the camera.
type Focus = { labels: number; shell: number; transfer: number; rpo: number; far: number };
type Shot = { target: THREE.Vector3; dir: THREE.Vector3; dist: number; fov: number; focus: Focus };
// far: the labels on Earth, the Moon and the comet in the last shot, seen from Mars
const F = (f: Partial<Focus> = {}): Focus => ({ labels: 0, shell: 0, transfer: 0, rpo: 0, far: 0, ...f });

const SUN = new THREE.Vector3(1, 0.28, 0.55).normalize();
// Orientation of the Milky Way band on the sky, and the direction of its bright core.
const GAL_N = new THREE.Vector3(0.32, 0.86, 0.4).normalize();
const GAL_C = new THREE.Vector3(0.75, -0.2, -0.62).normalize();
const EARTH_R = 1;
const RE_KM = 6371;

// Where the rendezvous happens: a point on a ~450 km circular orbit.
const RPO_R = 1 + 450 / RE_KM;
const RPO_POS = new THREE.Vector3(0.55, 0.42, 0.72).normalize().multiplyScalar(RPO_R);
// Local LVLH-ish frame at that point: radial (up), along-track (velocity), cross-track.
const R_HAT = RPO_POS.clone().normalize();
const H_HAT = new THREE.Vector3(0.12, 1, -0.2).normalize().cross(R_HAT).normalize(); // orbit normal-ish
const V_HAT = H_HAT.clone().cross(R_HAT).normalize();

function shot(target: THREE.Vector3, from: THREE.Vector3, fov = 45, focus: Focus = F()): Shot {
  const off = from.clone().sub(target);
  return { target, dir: off.clone().normalize(), dist: off.length(), fov, focus };
}

// Point on the rendezvous orbit plane at angle phi (rad) from the target, radius r (Earth radii).
function inPlane(r: number, phi: number) {
  return R_HAT.clone().multiplyScalar(r * Math.cos(phi)).addScaledVector(V_HAT, r * Math.sin(phi));
}

function local(r: number, v: number, h: number) {
  return RPO_POS.clone().addScaledVector(R_HAT, r).addScaledVector(V_HAT, v).addScaledVector(H_HAT, h);
}

const MOON_POS = new THREE.Vector3(9.5, 1.4, -3.5);
const COMET_POS = new THREE.Vector3(24, 5, -15);
// Mars: the last stop. Far out on the sunlit side, so from behind it both Mars and Earth show a lit face.
const MARS_AWAY = new THREE.Vector3(0.35, 0.22, 0.91).normalize();
const MARS_POS = MARS_AWAY.clone().multiplyScalar(46);
const MARS_SIDE = new THREE.Vector3(0, 1, 0).cross(MARS_AWAY).normalize();
const MARS_R = 0.55;
const MOON_AWAY = MOON_POS.clone().normalize();
const MOON_SIDE = new THREE.Vector3(0, 1, 0).cross(MOON_AWAY).normalize();
// Where the camera looks in the transfer chapter: the middle of the illustrative multiphase arc.
const XFER_MID = inPlane(1.06, -0.75);

function shots(aspect: number): Record<string, Shot> {
  const narrow = aspect < 0.9; // phones: no side offset, subjects lower and pulled back
  const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
  const up = H_HAT.clone();
  return {
    // The whole system in one frame: Earth and its debris, the Moon, the comet.
    overview: narrow
      ? shot(v(0.25, -1.5, 0), v(-1.3, 1.5, 7.3), 50, F({ labels: 1 }))
      : shot(v(3.4, 0.55, -1.6), v(-2.6, 1.9, 5.6), 42, F({ labels: 1 })),
    research: narrow ? shot(v(0.1, -0.5, 0), v(1.6, 2.4, 5.4), 50) : shot(v(0.1, 0.0, 0.1), v(1.4, 2.0, 4.6), 42),
    debris: narrow ? shot(v(0.2, -0.7, 0), v(2.6, 1.6, 3.6), 50) : shot(v(0.1, 0.05, 0.1), v(1.6, 1.9, 3.2), 42),
    shell: narrow
      ? shot(v(0.3, -0.3, 0.3), v(2.4, 0.9, 2.2), 50, F({ shell: 1 }))
      : shot(v(0.0, 0.05, 0.0), v(2.6, 1.6, 3.9), 36, F({ shell: 1 })),
    // close-ups are framed like a photo from orbit: horizon level, Earth along the bottom
    rpo: shot(local(-0.003, -0.013, 0), local(0.006, -0.026, narrow ? -0.072 : -0.05), narrow ? 55 : 42, F({ rpo: 1 })),
    transfer: shot(XFER_MID.clone().multiplyScalar(0.96), XFER_MID.clone().addScaledVector(up, narrow ? 2.2 : 1.55).addScaledVector(R_HAT, 0.5), narrow ? 52 : 42, F({ transfer: 1 })),
    archive: narrow ? shot(v(0.4, -0.5, 0), v(-0.6, 1.0, 6.0), 50) : shot(v(0.2, 0.0, 0), v(-1.2, 1.0, 5.4), 45),
    flight: shot(MOON_POS.clone().multiplyScalar(0.45), v(-4.5, 4.0, 11), 45),
    // from beyond the Moon looking back: the sunlit far side of the Moon in front, Earth rising behind it.
    // On wide screens the two stack vertically to fit the open column beside the panels.
    moon: narrow
      ? shot(
          MOON_POS.clone().addScaledVector(MOON_AWAY, -1.0).addScaledVector(MOON_SIDE, -0.15),
          MOON_POS.clone().addScaledVector(MOON_AWAY, 2.6).addScaledVector(MOON_SIDE, -0.6).add(v(0, 0.35, 0)),
          50,
        )
      : shot(
          MOON_POS.clone().addScaledVector(MOON_AWAY, -4).add(v(0, -0.3, 0)),
          MOON_POS.clone().addScaledVector(MOON_AWAY, 3.5).addScaledVector(MOON_SIDE, -0.25).add(v(0, 1.1, 0)),
          30,
        ),
    // alongside the comet, its tail streaming away from the Sun
    comet: shot(COMET_POS.clone().add(v(-1.7, -0.4, -0.5)), COMET_POS.clone().add(v(-5, 0.9, 6.5)), narrow ? 60 : 45),
    // the end of the road: from just past Mars, looking back at Earth, the Moon and the comet
    // (phones: everything sits in the top of the screen, above the contact card)
    mars: narrow
      ? shot(
          MARS_POS.clone().addScaledVector(MARS_AWAY, -6).add(v(0, -3, 0)),
          MARS_POS.clone().addScaledVector(MARS_AWAY, 5).addScaledVector(MARS_SIDE, -1).add(v(0, 0.6, 0)),
          45,
          F({ far: 1 }),
        )
      : shot(
          MARS_POS.clone().addScaledVector(MARS_AWAY, -14),
          MARS_POS.clone().addScaledVector(MARS_AWAY, 2.7).addScaledVector(MARS_SIDE, -1.0).add(v(0, 0.75, 0)),
          40,
          F({ far: 1 }),
        ),
  };
}

// ---------- Earth ----------
// Land mask from Natural Earth (public domain, 1:110m), drawn once into an equirectangular canvas.
function landTexture() {
  const W = 2048, H = 1024;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d')!;
  g.fillStyle = '#000';
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#fff';
  const geo = feature(land110 as unknown as Topology, (land110 as unknown as Topology).objects.land as GeometryCollection);
  const polys: number[][][][] = [];
  for (const f of geo.features) {
    const gm = f.geometry;
    if (gm.type === 'Polygon') polys.push(gm.coordinates as number[][][]);
    else if (gm.type === 'MultiPolygon') polys.push(...(gm.coordinates as number[][][][]));
  }
  g.beginPath();
  for (const poly of polys) {
    for (const ring of poly) {
      ring.forEach(([lon, lat], i) => {
        const x = ((lon + 180) / 360) * W;
        const y = ((90 - lat) / 180) * H;
        if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
      });
      g.closePath();
    }
  }
  g.fill('evenodd');
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  t.minFilter = THREE.LinearFilter;
  t.generateMipmaps = false;
  return t;
}

function makeEarth() {
  const geo = new THREE.SphereGeometry(EARTH_R, 128, 96);
  const mat = new THREE.ShaderMaterial({
    uniforms: { uSun: { value: SUN }, uLand: { value: landTexture() }, uPx: { value: 1 } },
    vertexShader: /* glsl */ `
      varying vec3 vN; varying vec3 vW; varying vec3 vObj;
      void main(){
        vObj = normalize(position);
        vN = normalize(mat3(modelMatrix) * normal);
        vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    // Retro print look: the continents as a halftone dot screen, the way a 1960s atlas or mission
    // poster would print a globe. The screen keeps a steady size on screen: as the camera closes in,
    // finer screens fade in, so the dots never balloon into a golf ball.
    fragmentShader: /* glsl */ `
      uniform vec3 uSun; uniform sampler2D uLand; uniform float uPx;
      varying vec3 vN; varying vec3 vW; varying vec3 vObj;
      const float PI = 3.14159265;
      float landAt(float lat, float lon){
        return texture2D(uLand, vec2(lon / (2.0*PI) + 0.5, lat / PI + 0.5)).r;
      }
      // one staggered dot screen with cells of 'cell' radians; returns coverage for this pixel
      float screen(float lat, float lon, float cell, float day, float pxCell){
        float row = floor(lat / cell);
        float latC = (row + 0.5) * cell;
        float nLon = max(6.0, floor(2.0 * PI * cos(latC) / cell));
        float cLon = 2.0 * PI / nLon;
        float off = mod(row, 2.0) * 0.5 * cLon;
        float lonC = (floor((lon + off) / cLon) + 0.5) * cLon - off;
        vec2 q = vec2((lon - lonC) * cos(lat), lat - latC) / cell;
        float land = landAt(latC, lonC);
        float r = mix(mix(0.07, 0.15, day), mix(0.24, 0.45, day), land);
        float aa = max(pxCell, 0.02);
        float m = 1.0 - smoothstep(r - aa, r + aa, length(q));
        // tiny cells alias: use their average coverage instead
        return mix(m, PI * r * r, smoothstep(0.16, 0.4, pxCell));
      }
      void main(){
        vec3 n = normalize(vN);
        vec3 v = normalize(cameraPosition - vW);
        float lat = asin(clamp(vObj.y,-1.0,1.0));
        float lon = atan(-vObj.z, vObj.x);
        float d = dot(n, uSun);
        float day = smoothstep(-0.12, 0.5, d);

        // pick a screen whose cells are ~7 px wide, blending between powers of two
        float pix = max(length(fwidth(vObj)), 1e-6);
        float maxCell = radians(1.5);
        float k = clamp(log2(maxCell / (pix * 7.0 * uPx)), 0.0, 9.0);
        float kf = floor(k), kt = fract(k);
        float cA = maxCell * exp2(-kf), cB = cA * 0.5;
        float dots = mix(screen(lat, lon, cA, day, pix / cA), screen(lat, lon, cB, day, pix / cB), smoothstep(0.0, 1.0, kt));

        float landHere = landAt(lat, lon);
        vec3 ocean = mix(vec3(0.028,0.024,0.085), vec3(0.05,0.055,0.16), day);
        vec3 base = mix(ocean, mix(vec3(0.05,0.06,0.13), vec3(0.16,0.13,0.17), day), landHere * 0.55);
        vec3 inkLand = mix(vec3(0.10,0.30,0.32), vec3(0.96,0.86,0.66), smoothstep(0.0, 0.8, d));
        vec3 inkSea = mix(vec3(0.06,0.20,0.26), vec3(0.20,0.62,0.62), day);
        vec3 ink = mix(inkSea, inkLand, landHere);
        vec3 col = mix(base, ink, dots * mix(0.55, 1.0, landHere) * (0.35 + 0.65 * day));

        // faint graticule every 15 degrees, like a printed globe
        float st = radians(15.0);
        float gLat = abs(fract(lat/st + 0.5) - 0.5) * st;
        float gLon = abs(fract(lon/st + 0.5) - 0.5) * st * cos(lat);
        float lw = pix * 1.2;
        float grid = 1.0 - min(smoothstep(0.0, lw, gLat), smoothstep(0.0, lw, gLon));
        col += vec3(0.30,0.80,0.74) * grid * (0.05 + 0.10*day);
        // warm glow along the terminator, cool rim on the night side
        col += vec3(1.0,0.42,0.12) * exp(-pow(d / 0.12, 2.0)) * 0.14;
        float fr = pow(1.0 - max(dot(n, v), 0.0), 4.0);
        col += mix(vec3(0.12,0.45,0.55), vec3(1.0,0.72,0.45), day) * fr * (0.10 + 0.45 * day);
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const earth = new THREE.Mesh(geo, mat);

  const atmo = new THREE.Mesh(
    new THREE.SphereGeometry(EARTH_R * 1.06, 96, 64),
    new THREE.ShaderMaterial({
      uniforms: { uSun: { value: SUN } },
      transparent: true,
      depthWrite: false,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */ `varying vec3 vN; varying vec3 vW;
        void main(){ vN = normalize(mat3(modelMatrix)*normal); vec4 w = modelMatrix*vec4(position,1.0); vW=w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
      fragmentShader: /* glsl */ `uniform vec3 uSun; varying vec3 vN; varying vec3 vW;
        void main(){ vec3 v = normalize(cameraPosition - vW); float r = 1.0 - abs(dot(normalize(vN), v));
          float k = pow(smoothstep(0.0,1.0,r), 2.0) * smoothstep(1.0, 0.55, r);
          float lit = 0.3 + 0.7*smoothstep(-0.3, 0.5, dot(normalize(vN), uSun));
          gl_FragColor = vec4(mix(vec3(0.18,0.55,0.62), vec3(1.0,0.66,0.4), smoothstep(0.2,0.9,lit)) * k * 0.5 * lit, 1.0); }`,
    }),
  );
  const g = new THREE.Group();
  g.add(earth, atmo);
  return { group: g, earthMat: mat };
}

// ---------- Debris field: 19,085 objects, the initial state of the E-MOCAT campaign ----------
function gauss(rng: () => number) {
  let u = 0, v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
function mulberry(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeDebris(count: number) {
  const rng = mulberry(19085);
  const orbit = new Float32Array(count * 4);
  const kind = new Float32Array(count);
  const altBands: [number, number, number][] = [ // [weight, mean km, sd km]
    [0.30, 550, 25], [0.32, 820, 90], [0.14, 1000, 120], [0.12, 1400, 150], [0.07, 450, 40], [0.05, 1800, 150],
  ];
  const incBands: [number, number, number][] = [ // [weight, mean deg, sd deg]
    [0.26, 53, 0.8], [0.34, 98, 1.2], [0.1, 74, 3], [0.1, 86, 1.5], [0.2, 50, 30],
  ];
  const pick = (bands: [number, number, number][]) => {
    let x = rng();
    for (const b of bands) { if ((x -= b[0]) <= 0) return b; }
    return bands[bands.length - 1];
  };
  for (let i = 0; i < count; i++) {
    const a = pick(altBands);
    const alt = Math.max(300, a[1] + gauss(rng) * a[2]);
    const ib = pick(incBands);
    const inc = THREE.MathUtils.degToRad(Math.min(110, Math.max(0, ib[1] + gauss(rng) * ib[2])));
    orbit[i * 4] = 1 + alt / RE_KM;
    orbit[i * 4 + 1] = inc;
    orbit[i * 4 + 2] = rng() * Math.PI * 2; // RAAN
    orbit[i * 4 + 3] = rng() * Math.PI * 2; // phase
    const r = rng();
    kind[i] = r < 0.55 ? 0 : r < 0.92 ? 1 : 2; // fragment, payload, rocket body (illustrative mix)
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  geo.setAttribute('aOrbit', new THREE.BufferAttribute(orbit, 4));
  geo.setAttribute('aKind', new THREE.BufferAttribute(kind, 1));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 2);
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uPx: { value: 1 }, uSun: { value: SUN }, uFade: { value: 1 }, uShell: { value: 0 } },
    vertexShader: /* glsl */ `
      attribute vec4 aOrbit; attribute float aKind;
      uniform float uTime; uniform float uPx; uniform vec3 uSun; uniform float uShell;
      varying vec3 vCol; varying float vLit;
      void main(){
        float r = aOrbit.x, inc = aOrbit.y, raan = aOrbit.z, ph = aOrbit.w;
        float n = 0.1763 / pow(r, 1.5);  // ~40 s period at 500 km: time-warped Kepler
        float u = ph + n * uTime;
        vec3 p = vec3(r*cos(u), 0.0, -r*sin(u));
        float ci = cos(inc), si = sin(inc);
        p = vec3(p.x, -p.z*si, p.z*ci);
        float cr = cos(raan), sr = sin(raan);
        p = vec3(p.x*cr + p.z*sr, p.y, -p.x*sr + p.z*cr);
        // in Earth's shadow? (cylindrical shadow)
        float s = dot(p, uSun);
        float perp = length(p - s*uSun);
        vLit = (s < 0.0 && perp < 1.0) ? 0.25 : 1.0;
        vCol = aKind < 0.5 ? vec3(0.78,0.74,0.68) : (aKind < 1.5 ? vec3(0.30,0.86,0.76) : vec3(1.0,0.50,0.20));
        // chapter 2: light up the 500-600 km shell, dim everything else
        float alt = (r - 1.0) * 6371.0;
        float inShell = step(500.0, alt) * step(alt, 600.0);
        vCol = mix(vCol, mix(vCol * 0.22, vec3(1.0,0.48,0.16) * 1.8, inShell), uShell);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        float size = (aKind < 0.5 ? 1.7 : 2.4) * (1.0 + 0.8 * inShell * uShell) * uPx * (4.2 / -mv.z);
        gl_PointSize = clamp(size, 1.0, 5.0 * uPx);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uFade; varying vec3 vCol; varying float vLit;
      void main(){
        vec2 c = gl_PointCoord - 0.5; float d = length(c);
        if (d > 0.5) discard;
        float a = smoothstep(0.5, 0.1, d);
        gl_FragColor = vec4(vCol * vLit, a * 0.95 * uFade);
      }`,
  });
  return { points: new THREE.Points(geo, mat), mat };
}

// ---------- Stars ----------
function makeStars(count: number) {
  const rng = mulberry(7);
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const size = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    let v = new THREE.Vector3(gauss(rng), gauss(rng), gauss(rng)).normalize();
    if (rng() < 0.5) {
      // pull toward the Milky Way plane so the band reads as a band of stars, not just a glow
      const lat = gauss(rng) * 0.12;
      v.addScaledVector(GAL_N, -v.dot(GAL_N)).normalize().multiplyScalar(Math.cos(lat)).addScaledVector(GAL_N, Math.sin(lat));
    }
    v = v.normalize().multiplyScalar(420);
    pos.set([v.x, v.y, v.z], i * 3);
    const t = rng();
    const c = t < 0.2 ? [1, 0.8, 0.6] : t < 0.35 ? [0.72, 0.9, 0.92] : [1, 0.96, 0.88];
    const b = 0.35 + rng() * 0.65;
    col.set([c[0] * b, c[1] * b, c[2] * b], i * 3);
    size[i] = rng() < 0.04 ? 2.4 : 0.8 + rng() * 1.0;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uPx: { value: 1 } },
    transparent: true,
    depthWrite: false,
    vertexShader: /* glsl */ `attribute float aSize; attribute vec3 color; uniform float uPx; varying vec3 vC;
      void main(){ vC = color; gl_PointSize = aSize * uPx; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: /* glsl */ `varying vec3 vC; void main(){ float d = length(gl_PointCoord-0.5); if(d>0.5) discard; gl_FragColor = vec4(vC, smoothstep(0.5,0.0,d)); }`,
  });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  pts.renderOrder = -1;
  return { points: pts, mat };
}

// ---------- Rendezvous: target, chaser, keep-out zone, approach path ----------
let panelTex: THREE.CanvasTexture | null = null;
function solarPanelTexture() {
  if (panelTex) return panelTex;
  const c = document.createElement('canvas');
  c.width = 256; c.height = 96;
  const g = c.getContext('2d')!;
  g.fillStyle = '#121a4a';
  g.fillRect(0, 0, 256, 96);
  g.strokeStyle = '#4d5fa8';
  g.lineWidth = 2;
  for (let x = 0; x <= 256; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 96); g.stroke(); }
  for (let y = 0; y <= 96; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke(); }
  g.strokeStyle = '#c9b48a';
  g.lineWidth = 6;
  g.strokeRect(0, 0, 256, 96);
  panelTex = new THREE.CanvasTexture(c);
  panelTex.colorSpace = THREE.SRGBColorSpace;
  return panelTex;
}

function makeSpacecraft(kind: 'target' | 'chaser') {
  const g = new THREE.Group();
  const s = kind === 'target' ? 1 : 0.65;
  // gold foil blanket on the target, bare aluminium on the chaser
  const bodyMat = new THREE.MeshStandardMaterial({
    color: kind === 'target' ? 0xd29a32 : 0xdfe3ea,
    metalness: 0.75,
    roughness: kind === 'target' ? 0.42 : 0.3,
    emissive: kind === 'target' ? 0x2a1606 : 0x111522,
  });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.0022 * s, 0.0022 * s, 0.0032 * s), bodyMat);
  const panelMat = new THREE.MeshStandardMaterial({ map: solarPanelTexture(), metalness: 0.3, roughness: 0.5, emissive: 0x0a1030, side: THREE.DoubleSide });
  const panelGeo = new THREE.BoxGeometry(0.0055 * s, 0.00008, 0.0021 * s);
  const boomMat = new THREE.MeshStandardMaterial({ color: 0x9aa3b0, metalness: 0.7, roughness: 0.35 });
  const boomGeo = new THREE.CylinderGeometry(0.00007 * s, 0.00007 * s, 0.0012 * s, 6);
  for (const side of [1, -1]) {
    const p = new THREE.Mesh(panelGeo, panelMat);
    p.position.x = side * 0.0045 * s;
    const boom = new THREE.Mesh(boomGeo, boomMat);
    boom.rotation.z = Math.PI / 2;
    boom.position.x = side * 0.0015 * s;
    g.add(p, boom);
  }
  g.add(body);
  if (kind === 'chaser') {
    const flame = new THREE.Mesh(
      new THREE.ConeGeometry(0.0005, 0.0018, 10),
      new THREE.MeshBasicMaterial({ color: 0xff7a2f, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    flame.rotation.x = Math.PI / 2;
    flame.position.z = -0.0024;
    flame.name = 'flame';
    g.add(flame);
  } else {
    const port = new THREE.Mesh(new THREE.CylinderGeometry(0.0005, 0.0005, 0.0006, 16), boomMat);
    port.rotation.x = Math.PI / 2;
    port.position.z = -0.0018;
    // high-gain antenna on the zenith face
    const dish = new THREE.Mesh(
      new THREE.SphereGeometry(0.0009, 20, 8, 0, Math.PI * 2, 0, Math.PI / 3.2),
      new THREE.MeshStandardMaterial({ color: 0xf1e7d6, metalness: 0.2, roughness: 0.6, side: THREE.DoubleSide }),
    );
    dish.rotation.x = Math.PI;
    dish.position.y = 0.0022;
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.00006, 0.00006, 0.0008, 6), boomMat);
    mast.position.y = 0.0014;
    g.add(port, dish, mast);
  }
  return g;
}

function makeRendezvous() {
  const group = new THREE.Group();
  // orientation: local +Z along -V (docking port faces the approaching chaser), +Y radial
  const basis = new THREE.Matrix4().makeBasis(H_HAT.clone().negate(), R_HAT, V_HAT.clone().negate());
  const q = new THREE.Quaternion().setFromRotationMatrix(basis);

  const target = makeSpacecraft('target');
  target.position.copy(RPO_POS);
  target.quaternion.copy(q);
  const chaser = makeSpacecraft('chaser');
  chaser.quaternion.copy(q);

  // keep-out sphere drawn as three great circles, the way it would appear on a mission diagram
  const koz = new THREE.Group();
  const kozMats: THREE.LineBasicMaterial[] = [];
  for (const nrm of [R_HAT, V_HAT, H_HAT]) {
    const r = ring(0.008, nrm, 0xff7a2f, 0.3, 128);
    kozMats.push(r.material as THREE.LineBasicMaterial);
    koz.add(r);
  }
  koz.position.copy(RPO_POS);

  // Approach path in (radial, along-track) offsets: two V-bar hops, then a straight-line final approach.
  const pts: THREE.Vector3[] = [];
  const hop = (v0: number, v1: number, hgt: number, nSeg: number) => {
    for (let i = 0; i <= nSeg; i++) {
      const t = i / nSeg;
      const v = v0 + (v1 - v0) * (t - Math.sin(2 * Math.PI * t) / (2 * Math.PI));
      const r = hgt * (1 - Math.cos(2 * Math.PI * t)) * 0.5;
      pts.push(local(r, v, 0));
    }
  };
  hop(-0.032, -0.021, 0.0032, 40);
  hop(-0.021, -0.011, 0.0022, 40);
  for (let i = 1; i <= 30; i++) pts.push(local(0, -0.011 + (0.011 - 0.0028) * (i / 30), 0));
  const curve = new THREE.CatmullRomCurve3(pts);
  const pathGeo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(400));
  const path = new THREE.Line(pathGeo, new THREE.LineDashedMaterial({ color: 0x4fd1bf, dashSize: 0.0005, gapSize: 0.0004, transparent: true, opacity: 0.8 }));
  path.computeLineDistances();

  group.add(target, chaser, koz, path);
  return { group, chaser, curve, koz, kozMats };
}

// ---------- Deep space: the Moon, a comet, and Mars ----------
// Moon and Mars share Earth's halftone print style: dark regions get small dots, bright ones big dots.
function makeBodyMat(o: { ink: THREE.Color; rim: THREE.Color; seed: number; dark: number; cap: number }) {
  return new THREE.ShaderMaterial({
    uniforms: { uSun: { value: SUN }, uPx: { value: 1 }, uInk: { value: o.ink }, uRim: { value: o.rim }, uSeed: { value: o.seed }, uDark: { value: o.dark }, uCap: { value: o.cap } },
    vertexShader: /* glsl */ `varying vec3 vN; varying vec3 vO; varying vec3 vW;
      void main(){ vO = normalize(position); vN = normalize(mat3(modelMatrix)*normal); vec4 w = modelMatrix*vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: /* glsl */ `uniform vec3 uSun; uniform float uPx; uniform vec3 uInk; uniform vec3 uRim; uniform float uSeed; uniform float uDark; uniform float uCap;
      varying vec3 vN; varying vec3 vO; varying vec3 vW;
      const float PI = 3.14159265;
      float h(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,45.164)))*43758.5453); }
      float vn(vec3 x){ vec3 i=floor(x); vec3 f=fract(x); f=f*f*(3.0-2.0*f);
        return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),
                   mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z); }
      float albedo(vec3 p){
        float maria = smoothstep(0.52, 0.62, vn(p*2.2 + uSeed) * 0.7 + vn(p*5.0 + uSeed*0.37) * 0.3);
        return mix(1.0, uDark, maria) * (0.85 + 0.15 * vn(p*14.0));
      }
      float screen(float lat, float lon, float cell, float tone, float pxCell){
        float row = floor(lat / cell);
        float latC = (row + 0.5) * cell;
        float nLon = max(6.0, floor(2.0 * PI * cos(latC) / cell));
        float cLon = 2.0 * PI / nLon;
        float off = mod(row, 2.0) * 0.5 * cLon;
        float lonC = (floor((lon + off) / cLon) + 0.5) * cLon - off;
        vec2 q = vec2((lon - lonC) * cos(lat), lat - latC) / cell;
        float r = 0.5 * sqrt(clamp(tone, 0.0, 1.0));
        float aa = max(pxCell, 0.02);
        float m = 1.0 - smoothstep(r - aa, r + aa, length(q));
        return mix(m, PI * r * r, smoothstep(0.16, 0.4, pxCell));
      }
      void main(){
        vec3 n = normalize(vN);
        float lit = max(dot(n, uSun), 0.0);
        float lat = asin(clamp(vO.y,-1.0,1.0));
        float lon = atan(-vO.z, vO.x);
        // polar caps (Mars only): solid cream above about 72 degrees latitude
        float cap = uCap * smoothstep(1.22, 1.30, abs(lat) + 0.05 * vn(vO * 9.0));
        float tone = albedo(vO) * pow(lit, 0.8);
        float pix = max(length(fwidth(vO)), 1e-6);
        float maxCell = radians(4.0);
        float k = clamp(log2(maxCell / (pix * 5.0 * uPx)), 0.0, 9.0);
        float kf = floor(k), kt = fract(k);
        float cA = maxCell * exp2(-kf), cB = cA * 0.5;
        float dots = mix(screen(lat, lon, cA, tone, pix / cA), screen(lat, lon, cB, tone, pix / cB), smoothstep(0.0, 1.0, kt));
        vec3 base = vec3(0.04, 0.035, 0.10) + vec3(0.06, 0.05, 0.08) * tone;
        vec3 col = mix(base, uInk, dots * 0.92);
        col = mix(col, vec3(0.97, 0.93, 0.86), cap * smoothstep(0.0, 0.25, lit));
        vec3 v = normalize(cameraPosition - vW);
        col += uRim * pow(1.0 - max(dot(n, v), 0.0), 3.0) * 0.18;
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
}

function makeDeep() {
  const g = new THREE.Group();
  const moonMat = makeBodyMat({ ink: new THREE.Color(0.95, 0.88, 0.74), rim: new THREE.Color(0.30, 0.80, 0.74), seed: 1.7, dark: 0.45, cap: 0 });
  const moon = new THREE.Mesh(new THREE.SphereGeometry(0.27, 96, 64), moonMat);
  moon.position.copy(MOON_POS);

  // Comet: nucleus, coma, and a particle tail pointing away from the Sun
  const comet = new THREE.Group();
  comet.position.copy(COMET_POS);
  const nucleus = new THREE.Mesh(new THREE.IcosahedronGeometry(0.12, 1), new THREE.MeshStandardMaterial({ color: 0x5a5550, roughness: 1, flatShading: true }));
  comet.add(nucleus);
  const N = 2600;
  const rng = mulberry(42);
  const pos = new Float32Array(N * 3);
  const seed = new Float32Array(N);
  for (let i = 0; i < N; i++) { pos.set([gauss(rng), gauss(rng), gauss(rng)], i * 3); seed[i] = rng(); }
  const tailGeo = new THREE.BufferGeometry();
  tailGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  tailGeo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  const tailMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uAnti: { value: SUN.clone().negate() }, uPx: { value: 1 } },
    vertexShader: /* glsl */ `attribute float aSeed; uniform float uTime; uniform vec3 uAnti; uniform float uPx; varying float vA; varying float vDust;
      void main(){
        float t = fract(aSeed + uTime*0.04);
        float len = 9.0 * t;
        vDust = step(0.55, aSeed);
        vec3 side = normalize(cross(uAnti, vec3(0.0,1.0,0.0)));
        vec3 dir = normalize(uAnti + side * (vDust*0.35*t));
        vec3 p = dir * len + position * (0.08 + 0.45*t);
        vA = (1.0 - t) * 0.55;
        vec4 mv = modelViewMatrix * vec4(p,1.0);
        gl_PointSize = clamp((1.5 + 2.5*t) * uPx * (12.0 / -mv.z), 1.0, 5.0*uPx);
        gl_Position = projectionMatrix * mv; }`,
    fragmentShader: /* glsl */ `varying float vA; varying float vDust;
      void main(){ float d = length(gl_PointCoord-0.5); if(d>0.5) discard;
        vec3 c = mix(vec3(0.45,0.8,1.0), vec3(1.0,0.86,0.65), vDust);
        gl_FragColor = vec4(c, vA * smoothstep(0.5,0.0,d)); }`,
  });
  const tail = new THREE.Points(tailGeo, tailMat);
  tail.frustumCulled = false;
  comet.add(tail);
  // drawn over the nucleus so the head reads as a bright coma, not a dark disc
  const coma = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xcfeee8, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false }));
  coma.scale.setScalar(0.8);
  coma.renderOrder = 3;
  comet.add(coma);
  // Mars: rust ink, darker albedo features, a polar cap, and a warm limb
  const marsMat = makeBodyMat({ ink: new THREE.Color(0.95, 0.5, 0.28), rim: new THREE.Color(1.0, 0.55, 0.35), seed: 7.3, dark: 0.35, cap: 1 });
  const mars = new THREE.Mesh(new THREE.SphereGeometry(MARS_R, 128, 96), marsMat);
  mars.position.copy(MARS_POS);
  mars.rotation.z = 0.44; // axial tilt, about 25 degrees
  g.add(moon, comet, mars);
  return { group: g, tailMat, nucleus, moonMat, marsMat, mars };
}

function glowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const x = c.getContext('2d')!;
  const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.25, 'rgba(255,255,255,0.45)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = gr;
  x.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}


// ---------- Sky: a soft Milky Way band behind the stars ----------
function makeSky() {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: { uN: { value: GAL_N }, uC: { value: GAL_C } },
    vertexShader: /* glsl */ `varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uN; uniform vec3 uC; varying vec3 vD;
      float h(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,45.164)))*43758.5453); }
      float vn(vec3 x){ vec3 i=floor(x); vec3 f=fract(x); f=f*f*(3.0-2.0*f);
        return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),
                   mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z); }
      float fbm(vec3 p){ float a=0.5, s=0.0; for(int i=0;i<5;i++){ s+=a*vn(p); p*=2.03; a*=0.5; } return s; }
      void main(){
        vec3 d = normalize(vD);
        float lat = asin(clamp(dot(d, uN), -1.0, 1.0));
        float core = pow(max(dot(d, uC), 0.0), 3.0);
        float width = 0.16 + 0.12 * core;
        float band = exp(-lat*lat / (2.0*width*width));
        float cloud = fbm(d * 5.0 + 1.7);
        float dust = smoothstep(0.45, 0.75, fbm(d * 11.0 + 4.2)) * exp(-lat*lat/(2.0*0.035*0.035));
        float k = band * (0.35 + 0.9*cloud) * (1.0 - 0.75*dust) * (0.55 + 1.2*core);
        vec3 col = mix(vec3(0.45,0.42,0.78), vec3(1.0,0.74,0.52), core) * k * 0.09;
        col += vec3(0.08,0.05,0.18) * 0.14 * fbm(d * 2.0);  // faint large-scale nebulosity
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const m = new THREE.Mesh(new THREE.SphereGeometry(460, 48, 32), mat);
  m.renderOrder = -2;
  m.frustumCulled = false;
  return m;
}

// ---------- Orbit guides: a few faint reference orbits and the Moon's path ----------
function ring(radius: number, normal: THREE.Vector3, color: number, opacity: number, segs = 256) {
  const n = normal.clone().normalize();
  const a = new THREE.Vector3(0, 1, 0).cross(n);
  if (a.lengthSq() < 1e-6) a.set(1, 0, 0);
  a.normalize();
  const b = n.clone().cross(a).normalize();
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= segs; i++) {
    const t = (i / segs) * Math.PI * 2;
    pts.push(a.clone().multiplyScalar(Math.cos(t) * radius).addScaledVector(b, Math.sin(t) * radius));
  }
  return new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(pts),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false }),
  );
}
function makeOrbitGuides() {
  const g = new THREE.Group();
  const incl = (deg: number, raan: number) => {
    const i = THREE.MathUtils.degToRad(deg), o = THREE.MathUtils.degToRad(raan);
    return new THREE.Vector3(Math.sin(i) * Math.sin(o), Math.cos(i), Math.sin(i) * Math.cos(o));
  };
  g.add(ring(1 + 420 / RE_KM, incl(51.6, 30), 0x4fd1bf, 0.16)); // ISS-like
  g.add(ring(1 + 780 / RE_KM, incl(98.2, 120), 0x4fd1bf, 0.12)); // sun-synchronous
  g.add(ring(1 + 1200 / RE_KM, incl(74, 250), 0x4fd1bf, 0.08));
  const moonN = MOON_POS.clone().cross(new THREE.Vector3(0.1, 1, 0.05)).cross(MOON_POS).normalize();
  g.add(ring(MOON_POS.length(), moonN, 0x8f9ab2, 0.14, 512));
  return g;
}

// ---------- Multiphase transfer (illustrative, not Turion data) ----------
// Three phases in the rendezvous orbit plane: coast in a lower parking orbit, a phasing transfer up
// to the target's altitude, then a final along-track approach. Boundary nodes mark the phase links.
function makeTransfer() {
  const g = new THREE.Group();
  const r1 = 1 + 300 / RE_KM;
  const r2 = RPO_R;
  const phases: { pts: THREE.Vector3[]; color: number }[] = [];
  const arc = (p0: number, p1: number, rf: (u: number) => number, n = 160) => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= n; i++) { const u = i / n; pts.push(inPlane(rf(u), p0 + (p1 - p0) * u)); }
    return pts;
  };
  const sm = (u: number) => u * u * (3 - 2 * u);
  phases.push({ pts: arc(-1.75, -1.2, () => r1), color: 0x26a596 });
  phases.push({ pts: arc(-1.2, -0.18, (u) => r1 + (r2 - r1) * sm(u)), color: 0x9a7ae6 });
  phases.push({ pts: arc(-0.18, -0.004, () => r2, 60), color: 0xff7a2f });
  const mats: THREE.MeshBasicMaterial[] = [];
  for (const ph of phases) {
    const curve = new THREE.CatmullRomCurve3(ph.pts);
    const mat = new THREE.MeshBasicMaterial({ color: ph.color, transparent: true, opacity: 0.3, depthWrite: false, blending: THREE.AdditiveBlending });
    mats.push(mat);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, ph.pts.length, 0.0032, 6, false), mat));
  }
  const glow = glowTexture();
  const nodes: THREE.Sprite[] = [];
  for (const p of [phases[0].pts[0], phases[1].pts[0], phases[2].pts[0]]) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: 0xffffff, transparent: true, opacity: 0.3, depthWrite: false, blending: THREE.AdditiveBlending }));
    sp.position.copy(p);
    sp.scale.setScalar(0.05);
    nodes.push(sp);
    g.add(sp);
  }
  return { group: g, mats, nodes };
}

// ---------- The Sun, as a glow far away along the light direction ----------
function makeSunGlow() {
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xffe2b8, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending }));
  sp.position.copy(SUN).multiplyScalar(300);
  sp.scale.setScalar(26);
  return sp;
}

// ---------- Boot ----------
export function initScene(canvas: HTMLCanvasElement, sections: HTMLElement[], labels: HTMLElement[] = []) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  const px = Math.min(window.devicePixelRatio || 1, 1.75);
  renderer.setPixelRatio(px);
  renderer.setClearColor(0x07061a, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 1200);

  scene.add(new THREE.AmbientLight(0x8fa6d0, 0.25));
  const sun = new THREE.DirectionalLight(0xffffff, 2.4);
  sun.position.copy(SUN).multiplyScalar(50);
  scene.add(sun);

  const sky = makeSky();
  const stars = makeStars(6000);
  const { group: earth, earthMat } = makeEarth();
  const debris = makeDebris(19085);
  const rpo = makeRendezvous();
  const deep = makeDeep();
  const guides = makeOrbitGuides();
  const xfer = makeTransfer();
  const sunGlow = makeSunGlow();
  scene.add(sky, stars.points, sunGlow, earth, guides, debris.points, xfer.group, rpo.group, deep.group);

  // Map labels: HTML links pinned to 3D points in the opening shot.
  const anchors: Record<string, THREE.Vector3> = {
    debris: new THREE.Vector3(-0.35, 1.3, 0.35),
    xai: new THREE.Vector3(0.95, 0.15, 0.85),
    rpo: RPO_POS.clone(),
    transfer: XFER_MID.clone(),
    moon: MOON_POS.clone().add(new THREE.Vector3(0, 0.4, 0)),
    comet: COMET_POS.clone().add(new THREE.Vector3(0, 0.35, 0)),
    // seen from Mars, the labels sit just beside each small body
    'far-earth': new THREE.Vector3(0, 1.1, 0),
    'far-moon': MOON_POS.clone().add(new THREE.Vector3(0, 0.3, 0)),
    'far-comet': COMET_POS.clone().add(new THREE.Vector3(0, 0.3, 0)),
  };
  const pins = labels
    .map((el) => ({ el, at: anchors[el.dataset.anchor || ''], far: el.dataset.layer === 'far' }))
    .filter((p) => p.at);
  const tmp = new THREE.Vector3();

  let SHOTS = shots(1);
  const order = sections.map((s) => s.dataset.scene || 'overview');

  // free: on wide screens, the fraction of the screen width taken by panels on the left of each section.
  // The projection shifts so the 3D subject sits in the middle of the open space to their right.
  const cur = { target: new THREE.Vector3(), dir: new THREE.Vector3(), logDist: 0, fov: 45, free: 0.4, focus: F() };
  const want = { target: new THREE.Vector3(), dir: new THREE.Vector3(), logDist: 0, fov: 45, free: 0.4, focus: F() };
  let freeBy: number[] = [];
  function measureFree() {
    freeBy = sections.map((sec) => {
      let right = 0;
      sec.querySelectorAll<HTMLElement>('[data-occlude]').forEach((el) => {
        const b = el.getBoundingClientRect();
        if (b.width > 0) right = Math.max(right, b.right);
      });
      return right > 0 ? Math.min(0.75, right / window.innerWidth) : 0.4;
    });
  }
  let firstFrame = true;

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    SHOTS = shots(camera.aspect);
    measureFree();
    debris.mat.uniforms.uPx.value = px;
    earthMat.uniforms.uPx.value = px;
    stars.mat.uniforms.uPx.value = px;
    deep.tailMat.uniforms.uPx.value = px;
    deep.moonMat.uniforms.uPx.value = px;
    deep.marsMat.uniforms.uPx.value = px;
    computeWant();
  }

  const smooth = (t: number) => t * t * (3 - 2 * t);
  function computeWant() {
    // The current section is the last one whose top has reached the top of the screen. The camera holds its
    // shot, then travels to the next section's shot while that section scrolls up from the bottom edge.
    const h = window.innerHeight;
    let idx = 0;
    for (let i = 0; i < sections.length; i++) if (sections[i].getBoundingClientRect().top <= 2) idx = i;
    const nextEl = sections[idx + 1];
    const frac = nextEl ? Math.min(1, Math.max(0, (h - nextEl.getBoundingClientRect().top) / h)) : 0;
    const a = SHOTS[order[idx]] || SHOTS.overview;
    const b = SHOTS[order[Math.min(idx + 1, order.length - 1)]] || a;
    // hold the shot for most of a section, then travel to the next one
    const t = smooth(frac);
    want.target.copy(a.target).lerp(b.target, t);
    want.dir.copy(a.dir).lerp(b.dir, t).normalize();
    want.logDist = THREE.MathUtils.lerp(Math.log(a.dist), Math.log(b.dist), t);
    want.fov = THREE.MathUtils.lerp(a.fov, b.fov, t);
    const fa = freeBy[idx] ?? 0.4, fb = freeBy[Math.min(idx + 1, sections.length - 1)] ?? fa;
    want.free = THREE.MathUtils.lerp(fa, fb, t);
    for (const k of Object.keys(want.focus) as (keyof Focus)[]) want.focus[k] = THREE.MathUtils.lerp(a.focus[k], b.focus[k], t);
    if (firstFrame || reduce) {
      cur.target.copy(want.target); cur.dir.copy(want.dir); cur.logDist = want.logDist; cur.fov = want.fov; cur.free = want.free;
      Object.assign(cur.focus, want.focus);
      firstFrame = false;
    }
  }

  const clock = new THREE.Clock();
  let simTime = 0;
  let running = true;
  let paused = false;
  let raf = 0;
  const still = () => reduce || paused;

  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05);
    if (!still()) simTime += dt;
    const k = still() ? 1 : 1 - Math.exp(-dt * 2.6);
    cur.target.lerp(want.target, k);
    cur.dir.lerp(want.dir, k).normalize();
    cur.logDist += (want.logDist - cur.logDist) * k;
    cur.fov += (want.fov - cur.fov) * k;
    cur.free += (want.free - cur.free) * k;
    for (const key of Object.keys(cur.focus) as (keyof Focus)[]) cur.focus[key] += (want.focus[key] - cur.focus[key]) * k;

    const dist = Math.exp(cur.logDist);
    camera.position.copy(cur.target).addScaledVector(cur.dir, dist);
    camera.near = Math.max(0.0004, dist * 0.02);
    camera.fov = cur.fov;
    // On wide screens the panels sit on the left, so shift the projection to center the subject in the space beside them.
    const vw = window.innerWidth, vh = window.innerHeight;
    if (camera.aspect > 1.1) camera.setViewOffset(vw, vh, -vw * cur.free * 0.5, 0, vw, vh);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();
    // near the spacecraft, roll the camera so local vertical is up and the horizon sits level
    camera.up.set(0, 1, 0).lerp(R_HAT, cur.focus.rpo).normalize();
    camera.lookAt(cur.target);
    stars.points.position.copy(camera.position);
    sky.position.copy(camera.position);

    debris.mat.uniforms.uTime.value = simTime;
    // fade debris when we are right next to the spacecraft so the close-up stays readable
    debris.mat.uniforms.uFade.value = THREE.MathUtils.clamp((dist - 0.04) / 0.5, 0.25, 1);
    debris.mat.uniforms.uShell.value = cur.focus.shell;
    const xf = cur.focus.transfer;
    // the transfer tubes are drawn at planet scale; hide them in the spacecraft close-ups
    const xv = 1 - cur.focus.rpo;
    xfer.mats.forEach((m) => (m.opacity = (0.22 + 0.78 * xf) * xv));
    xfer.nodes.forEach((n, i) => {
      (n.material as THREE.SpriteMaterial).opacity = (0.25 + 0.75 * xf) * xv;
      n.scale.setScalar((0.03 + 0.03 * xf) * (1 + 0.15 * Math.sin(simTime * 3 + i)));
    });

    // pin the map labels to their 3D anchors while the opening shot is on screen
    camera.updateMatrixWorld();
    for (const p of pins) {
      const lv = p.far ? cur.focus.far : cur.focus.labels;
      tmp.copy(p.at).project(camera);
      const onScreen = tmp.z < 1 && Math.abs(tmp.x) < 1.05 && Math.abs(tmp.y) < 1.05;
      const show = lv > 0.05 && onScreen;
      p.el.style.visibility = show ? 'visible' : 'hidden';
      if (!show) continue;
      const x = ((tmp.x + 1) / 2) * window.innerWidth;
      const y = ((1 - tmp.y) / 2) * window.innerHeight;
      p.el.classList.toggle('pin-flip', x > window.innerWidth - 170);
      p.el.style.opacity = String(lv);
      // while the labels fade out they must not catch clicks meant for the content underneath
      p.el.style.pointerEvents = lv > 0.5 ? '' : 'none';
      p.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    }
    earth.rotation.y = simTime * 0.01;
    deep.tailMat.uniforms.uTime.value = simTime;
    deep.nucleus.rotation.y = simTime * 0.2;

    // chaser follows the approach path on a 16 s loop, pausing at the hop points
    const loop = (simTime % 16) / 16;
    const u = Math.min(1, loop * 1.12);
    const p = rpo.curve.getPointAt(u);
    rpo.chaser.position.copy(p);
    const flame = rpo.chaser.getObjectByName('flame') as THREE.Mesh | undefined;
    if (flame) {
      const burn = [0.0, 0.47, 0.94].some((b) => Math.abs(u - b) < 0.025) ? 0.9 : 0;
      (flame.material as THREE.MeshBasicMaterial).opacity = burn;
    }
    rpo.kozMats.forEach((m) => (m.opacity = 0.28 + 0.1 * Math.sin(simTime * 2)));

    renderer.render(scene, camera);
    if (running && !still()) raf = requestAnimationFrame(frame);
  }

  const onScroll = () => {
    computeWant();
    if (still()) frame();
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => { resize(); if (still()) frame(); });
  // panel sizes change once the web fonts arrive
  document.fonts?.ready.then(() => { measureFree(); computeWant(); if (still()) frame(); });
  document.addEventListener('visibilitychange', () => {
    if (still()) return;
    running = !document.hidden;
    if (running) { clock.getDelta(); raf = requestAnimationFrame(frame); } else cancelAnimationFrame(raf);
  });

  resize();
  if (reduce) simTime = 6;
  frame();
  canvas.dataset.ready = 'true';
  return {
    reduced: reduce,
    setPaused(p: boolean) {
      paused = p;
      cancelAnimationFrame(raf);
      clock.getDelta();
      if (still()) { computeWant(); frame(); } else raf = requestAnimationFrame(frame);
    },
  };
}
