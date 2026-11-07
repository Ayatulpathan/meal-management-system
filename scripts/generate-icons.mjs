import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

/**
 * Generates an uncompressed/deflated valid PNG image buffer
 * width, height, and RGBA pixel generator
 */
function createPng(width, height, pixelFn) {
  // Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // bit depth 8
  ihdr.writeUInt8(6, 9); // RGBA
  ihdr.writeUInt8(0, 10); // compression
  ihdr.writeUInt8(0, 11); // filter
  ihdr.writeUInt8(0, 12); // interlace

  const ihdrChunk = createChunk('IHDR', ihdr);

  // Raw image data with filter byte (0) before each scanline
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData.writeUInt8(0, rowOffset); // Filter type None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = pixelFn(x, y, width, height);
      const pxOffset = rowOffset + 1 + x * 4;
      rawData.writeUInt8(r, pxOffset);
      rawData.writeUInt8(g, pxOffset + 1);
      rawData.writeUInt8(b, pxOffset + 2);
      rawData.writeUInt8(a, pxOffset + 3);
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function crc32(buf) {
  let table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = crc32(typeAndData);
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

// Ensure public directory exists
const publicDir = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Emerald theme color (#059669 = 5, 150, 105) with rounded badge styling
function cartPixel(x, y, w, h) {
  // Center coordinates
  const cx = w / 2;
  const cy = h / 2;
  const r = w * 0.45;
  const dist = Math.hypot(x - cx, y - cy);

  // Background circle
  if (dist > r) {
    return [0, 0, 0, 0]; // transparent outside
  }

  // Inner shopping cart silhouette or white icon
  const relX = (x - cx) / (w * 0.5);
  const relY = (y - cy) / (h * 0.5);

  // Check if pixel is within cart basket / handle
  const inCart =
    (relY >= -0.15 && relY <= 0.25 && relX >= -0.35 && relX <= 0.35) ||
    (relX >= -0.45 && relX <= -0.35 && relY >= -0.4 && relY <= 0.25) ||
    (Math.hypot(relX - -0.2, relY - 0.42) <= 0.12) ||
    (Math.hypot(relX - 0.2, relY - 0.42) <= 0.12);

  if (inCart) {
    return [255, 255, 255, 255]; // white cart
  }

  // Emerald background
  return [5, 150, 105, 255];
}

const icon192 = createPng(192, 192, cartPixel);
fs.writeFileSync(path.join(publicDir, 'icon-192.png'), icon192);

const icon512 = createPng(512, 512, cartPixel);
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), icon512);

const badge72 = createPng(72, 72, (x, y, w, h) => {
  const dist = Math.hypot(x - w / 2, y - h / 2);
  if (dist <= w * 0.4) return [5, 150, 105, 255];
  return [0, 0, 0, 0];
});
fs.writeFileSync(path.join(publicDir, 'badge-72.png'), badge72);

console.log('Successfully generated public/icon-192.png, icon-512.png, and badge-72.png');
