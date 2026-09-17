// Generates simple placeholder PNG icons for the extension (a leaf-like mark
// on a rounded square) with zero external dependencies, using Node's built-in
// zlib deflate to hand-roll minimal PNGs. Real product artwork should replace
// these before a store submission.
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "public", "icons");
mkdirSync(outDir, { recursive: true });

const BRAND = [16, 163, 74]; // a calm green, distinct from any single provider's brand color
const BG = [13, 17, 15];

function crc32(buf) {
  let c;
  const table = crc32.table ?? (crc32.table = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })());
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function pixelAt(x, y, size) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.46;
  const dx = x - cx + 0.5;
  const dy = y - cy + 0.5;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > r) return [0, 0, 0, 0];

  // A simple leaf/droplet mark: a circle with a smaller lighter inner circle offset up-left.
  const innerDx = x - size * 0.42 + 0.5;
  const innerDy = y - size * 0.4 + 0.5;
  const innerDist = Math.sqrt(innerDx * innerDx + innerDy * innerDy);
  const innerR = size * 0.22;

  if (innerDist < innerR) {
    return [...brighten(BRAND, 0.35), 255];
  }
  return [...BRAND, 255];
}

function brighten([r, g, b], amt) {
  return [Math.min(255, r + (255 - r) * amt), Math.min(255, g + (255 - g) * amt), Math.min(255, b + (255 - b) * amt)].map(Math.round);
}

function buildPng(size) {
  const rowBytes = size * 4;
  const raw = Buffer.alloc((rowBytes + 1) * size);
  for (let y = 0; y < size; y++) {
    const rowStart = y * (rowBytes + 1);
    raw[rowStart] = 0; // filter type: none
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = pixelAt(x, y, size);
      const px = rowStart + 1 + x * 4;
      raw[px] = r;
      raw[px + 1] = g;
      raw[px + 2] = b;
      raw[px + 3] = a;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const idat = deflateSync(raw);

  return Buffer.concat([signature, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

void BG;

for (const size of [16, 32, 48, 128]) {
  const png = buildPng(size);
  writeFileSync(join(outDir, `icon-${size}.png`), png);
  console.log(`wrote icon-${size}.png (${png.length} bytes)`);
}
