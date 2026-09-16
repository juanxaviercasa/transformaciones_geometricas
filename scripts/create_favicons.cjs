const fs = require('fs');
const zlib = require('zlib');

// 1. Create crisp SVG favicon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <defs>
    <linearGradient id="gtGradPre" x1="8" y1="8" x2="38" y2="38" gradientUnits="userSpaceOnUse">
      <stop stop-color="#3b82f6" />
      <stop offset="1" stop-color="#6366f1" />
    </linearGradient>
    <linearGradient id="gtGradPost" x1="24" y1="24" x2="58" y2="58" gradientUnits="userSpaceOnUse">
      <stop stop-color="#8b5cf6" />
      <stop offset="1" stop-color="#d946ef" />
    </linearGradient>
    <linearGradient id="gtRay" x1="12" y1="52" x2="54" y2="16" gradientUnits="userSpaceOnUse">
      <stop stop-color="#f59e0b" />
      <stop offset="1" stop-color="#ec4899" />
    </linearGradient>
  </defs>
  <!-- Background Card -->
  <rect width="64" height="64" rx="16" fill="#0f172a" />
  <rect x="1" y="1" width="62" height="62" rx="15" stroke="#334155" stroke-width="1.5" fill="none" />
  
  <!-- Preimage Triangle -->
  <polygon points="10,48 28,14 38,42" fill="url(#gtGradPre)" fill-opacity="0.9" stroke="#60a5fa" stroke-width="2" stroke-linejoin="round" />
  
  <!-- Transformed Triangle -->
  <polygon points="26,54 50,20 58,44" fill="url(#gtGradPost)" fill-opacity="0.8" stroke="#c084fc" stroke-width="2" stroke-linejoin="round" />
  
  <!-- Transformation Vector / Axis Ray -->
  <line x1="12" y1="52" x2="54" y2="16" stroke="url(#gtRay)" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="4 3" />
  
  <!-- Vertices -->
  <circle cx="28" cy="14" r="3.5" fill="#93c5fd" stroke="#ffffff" stroke-width="1.5" />
  <circle cx="50" cy="20" r="3.5" fill="#e9d5ff" stroke="#ffffff" stroke-width="1.5" />
  <circle cx="34" cy="34" r="2.8" fill="#fde047" stroke="#b45309" stroke-width="1" />
</svg>`;

fs.writeFileSync('public/favicon.svg', svgContent, 'utf-8');
console.log('Saved public/favicon.svg');

// 2. Generate PNG favicon (rasterizing mathematically onto 64x64 RGBA buffer)
function makeCRCTable() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c >>> 0;
  }
  return table;
}
const CRC_TABLE = makeCRCTable();
function crc32(bytes) {
  let crc = 0 ^ (-1);
  for (let i = 0; i < bytes.length; i++) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ bytes[i]) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
}

function createPng(width, height, rgbaBuffer) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bits per channel
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  
  const ihdrTypeAndData = Buffer.concat([Buffer.from('IHDR'), ihdrData]);
  const ihdrCrc = Buffer.alloc(4);
  ihdrCrc.writeUInt32BE(crc32(ihdrTypeAndData));
  const ihdrLen = Buffer.alloc(4);
  ihdrLen.writeUInt32BE(13);
  const ihdr = Buffer.concat([ihdrLen, ihdrTypeAndData, ihdrCrc]);
  
  const rawRows = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    rawRows[y * (1 + width * 4)] = 0;
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4;
      const dstIdx = y * (1 + width * 4) + 1 + x * 4;
      rawRows[dstIdx] = rgbaBuffer[srcIdx];
      rawRows[dstIdx + 1] = rgbaBuffer[srcIdx + 1];
      rawRows[dstIdx + 2] = rgbaBuffer[srcIdx + 2];
      rawRows[dstIdx + 3] = rgbaBuffer[srcIdx + 3];
    }
  }
  
  const compressed = zlib.deflateSync(rawRows);
  const idatTypeAndData = Buffer.concat([Buffer.from('IDAT'), compressed]);
  const idatCrc = Buffer.alloc(4);
  idatCrc.writeUInt32BE(crc32(idatTypeAndData));
  const idatLen = Buffer.alloc(4);
  idatLen.writeUInt32BE(compressed.length);
  const idat = Buffer.concat([idatLen, idatTypeAndData, idatCrc]);
  
  const iendType = Buffer.from('IEND');
  const iendCrc = Buffer.alloc(4);
  iendCrc.writeUInt32BE(crc32(iendType));
  const iendLen = Buffer.alloc(4);
  iendLen.writeUInt32BE(0);
  const iend = Buffer.concat([iendLen, iendType, iendCrc]);
  
  return Buffer.concat([sig, ihdr, idat, iend]);
}

function renderLogoBuffer(size) {
  const buf = Buffer.alloc(size * size * 4);
  const s = size / 64; // scale factor

  // Helper point in triangle
  function pointInTriangle(px, py, ax, ay, bx, by, cx, cy) {
    const v0x = cx - ax, v0y = cy - ay;
    const v1x = bx - ax, v1y = by - ay;
    const v2x = px - ax, v2y = py - ay;
    const dot00 = v0x * v0x + v0y * v0y;
    const dot01 = v0x * v1x + v0y * v1y;
    const dot02 = v0x * v2x + v0y * v2y;
    const dot11 = v1x * v1x + v1y * v1y;
    const dot12 = v1x * v2x + v1y * v2y;
    const invDenom = 1 / (dot00 * dot11 - dot01 * dot01);
    const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
    const v = (dot00 * dot12 - dot01 * dot02) * invDenom;
    return (u >= 0) && (v >= 0) && (u + v < 1);
  }

  function distToSegment(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
  }

  const rCorner = 14 * s;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;

      // Check rounded rect boundary
      const dx = Math.max(0, Math.max(rCorner - x, x - (size - 1 - rCorner)));
      const dy = Math.max(0, Math.max(rCorner - y, y - (size - 1 - rCorner)));
      const distCorner = Math.hypot(dx, dy);

      if (distCorner > rCorner) {
        // Transparent outside rounded rect
        buf[idx] = 0;
        buf[idx + 1] = 0;
        buf[idx + 2] = 0;
        buf[idx + 3] = 0;
        continue;
      }

      // Default background: #0f172a (Dark Slate)
      let r = 15, g = 23, b = 42, a = 255;

      // Sub-pixel sampling or check shapes
      const px = x / s;
      const py = y / s;

      // Triangle 1: (10, 48), (28, 14), (38, 42) -> Blue/Indigo
      if (pointInTriangle(px, py, 10, 48, 28, 14, 38, 42)) {
        const t = (py - 14) / 34;
        r = Math.round(59 + t * (99 - 59));
        g = Math.round(130 + t * (102 - 130));
        b = Math.round(246 + t * (241 - 246));
      }

      // Triangle 2: (26, 54), (50, 20), (58, 44) -> Violet/Fuchsia
      if (pointInTriangle(px, py, 26, 54, 50, 20, 58, 44)) {
        const t = (py - 20) / 34;
        const r2 = Math.round(139 + t * (217 - 139));
        const g2 = Math.round(92 + t * (70 - 92));
        const b2 = Math.round(246 + t * (239 - 246));
        // Alpha blend 0.85
        r = Math.round(r * 0.15 + r2 * 0.85);
        g = Math.round(g * 0.15 + g2 * 0.85);
        b = Math.round(b * 0.15 + b2 * 0.85);
      }

      // Dashed Axis line: (12, 52) to (54, 16)
      const dLine = distToSegment(px, py, 12, 52, 54, 16);
      if (dLine < 1.6) {
        const lineDist = Math.hypot(px - 12, py - 52);
        if ((lineDist % 7) < 4.2) {
          r = 245; g = 158; b = 11; // Amber
        }
      }

      // Vertices:
      // Vertex A: (28, 14)
      if (Math.hypot(px - 28, py - 14) < 4) {
        r = 147; g = 197; b = 253; // light blue
      }
      // Vertex A': (50, 20)
      if (Math.hypot(px - 50, py - 20) < 4) {
        r = 233; g = 213; b = 255; // light purple
      }
      // Center O: (34, 34)
      if (Math.hypot(px - 34, py - 34) < 3.2) {
        r = 253; g = 224; b = 71; // gold
      }

      buf[idx] = r;
      buf[idx + 1] = g;
      buf[idx + 2] = b;
      buf[idx + 3] = a;
    }
  }
  return buf;
}

// Generate 64x64 PNG
const png64 = createPng(64, 64, renderLogoBuffer(64));
fs.writeFileSync('public/favicon.png', png64);
console.log('Saved public/favicon.png (64x64)');

// Generate 32x32 PNG for ICO
const png32 = createPng(32, 32, renderLogoBuffer(32));

// Create ICO file with embedded PNG
const icoHeader = Buffer.alloc(6);
icoHeader.writeUInt16LE(0, 0); // reserved
icoHeader.writeUInt16LE(1, 2); // image type 1 = icon
icoHeader.writeUInt16LE(1, 4); // 1 image

const icoEntry = Buffer.alloc(16);
icoEntry.writeUInt8(32, 0); // width
icoEntry.writeUInt8(32, 1); // height
icoEntry.writeUInt8(0, 2); // colors
icoEntry.writeUInt8(0, 3); // reserved
icoEntry.writeUInt16LE(1, 4); // color planes
icoEntry.writeUInt16LE(32, 6); // bits per pixel
icoEntry.writeUInt32LE(png32.length, 8); // size
icoEntry.writeUInt32LE(22, 12); // offset (6 + 16 = 22)

const icoFile = Buffer.concat([icoHeader, icoEntry, png32]);
fs.writeFileSync('public/favicon.ico', icoFile);
console.log('Saved public/favicon.ico');
