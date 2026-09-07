const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const srcPath = 'C:\\Users\\udayp\\.gemini\\antigravity\\brain\\8f287943-373d-4245-a239-0a6d76f91fc5\\.user_uploaded\\media_1788777333322.png';
const outDir = 'C:\\Users\\udayp\\.gemini\\antigravity\\scratch\\gomate-whatsapp-bot\\public\\assets\\icons';

async function extract() {
  const meta = await sharp(srcPath).metadata();
  console.log('Original image meta:', meta);

  const { data, info } = await sharp(srcPath).raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  let minX = width, minY = height, maxX = 0, maxY = 0;
  let darkCount = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;

      // Dark tractor strokes
      if (lum < 110) {
        darkCount++;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  console.log(`Detected tractor bbox: [${minX}, ${minY}, ${maxX}, ${maxY}], dark count: ${darkCount}`);

  // Add 2px margin
  const pad = 2;
  const left = Math.max(0, minX - pad);
  const top = Math.max(0, minY - pad);
  const cropW = Math.min(width - left, (maxX - minX + 1) + pad * 2);
  const cropH = Math.min(height - top, (maxY - minY + 1) + pad * 2);

  // Extract raw crop
  const croppedRaw = await sharp(srcPath)
    .extract({ left, top, width: cropW, height: cropH })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const cWidth = croppedRaw.info.width;
  const cHeight = croppedRaw.info.height;
  const cData = croppedRaw.data;
  const cChannels = croppedRaw.info.channels;

  // Generate 2 transparent buffers:
  // 1. White tractor with alpha
  // 2. Dark tractor with alpha
  const whiteBuf = Buffer.alloc(cWidth * cHeight * 4);
  const darkBuf = Buffer.alloc(cWidth * cHeight * 4);

  for (let i = 0; i < cWidth * cHeight; i++) {
    const srcIdx = i * cChannels;
    const dstIdx = i * 4;
    const r = cData[srcIdx];
    const g = cData[srcIdx + 1];
    const b = cData[srcIdx + 2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;

    // Threshold curve for anti-aliased transparency
    let alpha = 0;
    if (lum < 160) {
      alpha = Math.round(Math.min(255, Math.max(0, (1 - lum / 160) * 1.3 * 255)));
    }

    // White version
    whiteBuf[dstIdx] = 255;
    whiteBuf[dstIdx + 1] = 255;
    whiteBuf[dstIdx + 2] = 255;
    whiteBuf[dstIdx + 3] = alpha;

    // Dark Navy version
    darkBuf[dstIdx] = 10;
    darkBuf[dstIdx + 1] = 31;
    darkBuf[dstIdx + 2] = 68;
    darkBuf[dstIdx + 3] = alpha;
  }

  const whitePngPath = path.join(outDir, 'tractor_exact_white.png');
  const darkPngPath = path.join(outDir, 'tractor_exact_dark.png');

  await sharp(whiteBuf, { raw: { width: cWidth, height: cHeight, channels: 4 } })
    .png()
    .toFile(whitePngPath);

  await sharp(darkBuf, { raw: { width: cWidth, height: cHeight, channels: 4 } })
    .png()
    .toFile(darkPngPath);

  console.log(`Successfully generated:\n- ${whitePngPath}\n- ${darkPngPath}`);
}

extract().catch(console.error);
