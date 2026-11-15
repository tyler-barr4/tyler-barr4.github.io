// Pixel A-10C, side view, nose to the right. One character per pixel.
// a outline · b body · c highlight · e intake · g canopy · k gun · r streamer
export const A10_ROWS = [
  '.aaaaa................................',
  '.abbbba...............................',
  '.abbbba....aaaaaaaaaa.................',
  '.abbbba...abbbbbbbbcca................',
  '.abbbba...abbbbbbbbbea................',
  '.abbbba...abbbbbbbbcca.....aaaa.......',
  '.abbbbba...aaaaaaaaaa.....agggga......',
  'aaabbbbba.....aba........agggcgaa.....',
  'acccbbbbbaaaaaabaaaaaaaaabbbbbbbbaa...',
  'aabbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbaa.',
  '.aaaabbbbbbbbbbbbbbbbbbbbbbbbbbbbbakkk',
  '....aaaaabbbbccccccccccccbbbaaaaaaaa..',
  '.........aaaaaaaaaaaaaaaaaaaa.........',
];
export const A10_GEAR = [
  '...........aba.........aba............',
  '...........aaa.........aaa............',
];
export const A10_PALETTE: Record<string, string> = {
  a: '#283040',
  b: '#8d96a3',
  c: '#bec7d2',
  e: '#3c424e',
  g: '#6ebeff',
  k: '#191c22',
  r: '#e0453a',
};

/** Build an SVG string of the sprite (crisp pixels via shape-rendering). */
export function a10Svg(opts: { gear?: boolean; scale?: number; title?: string } = {}): string {
  const rows = opts.gear ? [...A10_ROWS, ...A10_GEAR] : A10_ROWS;
  const w = Math.max(...rows.map((r) => r.length));
  const h = rows.length;
  let rects = '';
  rows.forEach((row, y) => {
    // merge horizontal runs of the same color to keep the markup small
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      if (ch === '.' || !A10_PALETTE[ch]) { x++; continue; }
      let run = 1;
      while (row[x + run] === ch) run++;
      rects += `<rect x="${x}" y="${y}" width="${run}" height="1" fill="${A10_PALETTE[ch]}"/>`;
      x += run;
    }
  });
  const s = opts.scale ?? 3;
  const title = opts.title ? `<title>${opts.title}</title>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w * s}" height="${h * s}" shape-rendering="crispEdges" aria-hidden="${opts.title ? 'false' : 'true'}">${title}${rects}</svg>`;
}
