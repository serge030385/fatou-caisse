import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { deflateSync } from "node:zlib";

const outputs = [
  ["public/splash/splash-1170x2532.png", 1170, 2532],
  ["public/splash/splash-1290x2796.png", 1290, 2796],
];

const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n += 1) {
  let c = n;
  for (let k = 0; k < 8; k += 1) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC_TABLE[n] = c >>> 0;
}

for (const [file, width, height] of outputs) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, makeSplash(width, height));
}

function makeSplash(width, height) {
  const pixels = new Uint8Array(width * height * 4);
  fill(pixels, width, height, [255, 249, 243, 255]);
  circle(pixels, width, height, width * 0.82, height * 0.11, width * 0.16, [243, 167, 52, 58]);
  circle(pixels, width, height, width * 0.12, height * 0.86, width * 0.24, [21, 122, 99, 28]);

  const icon = width * 0.42;
  const x = (width - icon) / 2;
  const y = height * 0.36 - icon / 2;
  roundedRect(pixels, width, height, x, y, icon, icon, icon * 0.22, [201, 65, 47, 255]);
  circle(pixels, width, height, x + icon * 0.74, y + icon * 0.22, icon * 0.13, [
    243,
    167,
    52,
    255,
  ]);
  roundedRect(
    pixels,
    width,
    height,
    x + icon * 0.24,
    y + icon * 0.28,
    icon * 0.52,
    icon * 0.5,
    icon * 0.11,
    [255, 249, 243, 255],
  );
  roundedRect(
    pixels,
    width,
    height,
    x + icon * 0.33,
    y + icon * 0.4,
    icon * 0.38,
    icon * 0.06,
    icon * 0.03,
    [36, 32, 28, 255],
  );
  roundedRect(
    pixels,
    width,
    height,
    x + icon * 0.33,
    y + icon * 0.53,
    icon * 0.32,
    icon * 0.06,
    icon * 0.03,
    [21, 122, 99, 255],
  );
  roundedRect(
    pixels,
    width,
    height,
    x + icon * 0.33,
    y + icon * 0.66,
    icon * 0.25,
    icon * 0.06,
    icon * 0.03,
    [36, 119, 168, 255],
  );

  return encodePng(width, height, pixels);
}

function fill(pixels, width, height, color) {
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      setPixel(pixels, width, x, y, color);
    }
  }
}

function circle(pixels, width, height, cx, cy, radius, color) {
  const left = Math.max(0, Math.floor(cx - radius));
  const right = Math.min(width - 1, Math.ceil(cx + radius));
  const top = Math.max(0, Math.floor(cy - radius));
  const bottom = Math.min(height - 1, Math.ceil(cy + radius));
  const r2 = radius * radius;
  for (let y = top; y <= bottom; y += 1) {
    for (let x = left; x <= right; x += 1) {
      if ((x - cx) ** 2 + (y - cy) ** 2 <= r2) {
        setPixel(pixels, width, x, y, color);
      }
    }
  }
}

function roundedRect(pixels, width, height, x, y, rectWidth, rectHeight, radius, color) {
  const left = Math.max(0, Math.floor(x));
  const right = Math.min(width - 1, Math.ceil(x + rectWidth));
  const top = Math.max(0, Math.floor(y));
  const bottom = Math.min(height - 1, Math.ceil(y + rectHeight));

  for (let py = top; py <= bottom; py += 1) {
    for (let px = left; px <= right; px += 1) {
      const dx = Math.max(x + radius - px, 0, px - (x + rectWidth - radius));
      const dy = Math.max(y + radius - py, 0, py - (y + rectHeight - radius));
      if (dx * dx + dy * dy <= radius * radius) {
        setPixel(pixels, width, px, py, color);
      }
    }
  }
}

function setPixel(pixels, width, x, y, color) {
  const index = (y * width + x) * 4;
  const alpha = color[3] / 255;
  const inverse = 1 - alpha;
  pixels[index] = Math.round(color[0] * alpha + pixels[index] * inverse);
  pixels[index + 1] = Math.round(color[1] * alpha + pixels[index + 1] * inverse);
  pixels[index + 2] = Math.round(color[2] * alpha + pixels[index + 2] * inverse);
  pixels[index + 3] = 255;
}

function encodePng(width, height, pixels) {
  const stride = width * 4;
  const scanlines = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (stride + 1);
    scanlines[rowStart] = 0;
    scanlines.set(pixels.subarray(y * stride, (y + 1) * stride), rowStart + 1);
  }

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr(width, height)),
    chunk("IDAT", deflateSync(scanlines, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function ihdr(width, height) {
  const data = Buffer.alloc(13);
  data.writeUInt32BE(width, 0);
  data.writeUInt32BE(height, 4);
  data[8] = 8;
  data[9] = 6;
  data[10] = 0;
  data[11] = 0;
  data[12] = 0;
  return data;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ byte) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}
