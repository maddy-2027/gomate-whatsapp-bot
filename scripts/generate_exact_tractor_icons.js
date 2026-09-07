const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const targetDir = 'C:\\Users\\udayp\\.gemini\\antigravity\\scratch\\gomate-whatsapp-bot\\public';
const iconsDir = path.join(targetDir, 'icons');
const whiteTractorPath = path.join(targetDir, 'assets', 'icons', 'tractor_exact_white.png');

async function generatePerfectIcons() {
  console.log('Generating GoMate Web App Icons with exact user tractor graphic...');

  // SVG Base with Capital G (no placeholder tractor - tractor will be layered via sharp composite)
  // 512x512 with rich deep navy and bold geometric G
  const baseStandardSvg = Buffer.from(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0E234D" />
        <stop offset="50%" stop-color="#071733" />
        <stop offset="100%" stop-color="#030A17" />
      </linearGradient>

      <linearGradient id="gGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#4ADE80" />
        <stop offset="50%" stop-color="#22C55E" />
        <stop offset="100%" stop-color="#16A34A" />
      </linearGradient>

      <filter id="mainShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="12" stdDeviation="14" flood-color="#000000" flood-opacity="0.6" />
      </filter>

      <filter id="subtleGlow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="18" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>

    <!-- App Rounded Squircle Base -->
    <rect width="512" height="512" rx="114" fill="url(#bgGrad)" />

    <!-- Outer Accent Ring -->
    <rect x="14" y="14" width="484" height="484" rx="100" fill="none" stroke="#22C55E" stroke-width="3" stroke-opacity="0.3" />

    <!-- Ambient Green Glow -->
    <circle cx="256" cy="235" r="170" fill="#22C55E" opacity="0.12" filter="url(#subtleGlow)" />

    <!-- Capital G Emblem -->
    <g filter="url(#mainShadow)">
      <path d="
        M 382 126
        A 175 175 0 1 0 431 245
        L 431 240
        L 265 240
        L 265 304
        L 367 304
        A 111 111 0 1 1 334 162
        L 370 120
        A 175 175 0 0 0 382 126
        Z
      " fill="url(#gGrad)" fill-rule="evenodd" />
    </g>

    <!-- Wordmark -->
    <g transform="translate(256, 452)">
      <text text-anchor="middle" 
            font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" 
            font-size="34" 
            font-weight="900" 
            letter-spacing="4" 
            fill="#FFFFFF">GO<tspan fill="#4ADE80">MATE</tspan></text>
    </g>
  </svg>
  `);

  // Maskable SVG Base (Full bleed with safe zone scaling)
  const baseMaskableSvg = Buffer.from(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
    <defs>
      <linearGradient id="mBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0E234D" />
        <stop offset="50%" stop-color="#071733" />
        <stop offset="100%" stop-color="#030A17" />
      </linearGradient>

      <linearGradient id="mGGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#4ADE80" />
        <stop offset="50%" stop-color="#22C55E" />
        <stop offset="100%" stop-color="#16A34A" />
      </linearGradient>

      <filter id="mShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#000000" flood-opacity="0.6" />
      </filter>
    </defs>

    <!-- Full-bleed background -->
    <rect width="512" height="512" fill="url(#mBgGrad)" />

    <g transform="translate(64, 46) scale(0.75)" filter="url(#mShadow)">
      <path d="
        M 382 126
        A 175 175 0 1 0 431 245
        L 431 240
        L 265 240
        L 265 304
        L 367 304
        A 111 111 0 1 1 334 162
        L 370 120
        A 175 175 0 0 0 382 126
        Z
      " fill="url(#mGGrad)" fill-rule="evenodd" />

      <g transform="translate(256, 452)">
        <text text-anchor="middle" 
              font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" 
              font-size="38" 
              font-weight="900" 
              letter-spacing="4" 
              fill="#FFFFFF">GO<tspan fill="#4ADE80">MATE</tspan></text>
      </g>
    </g>
  </svg>
  `);

  // Resize the extracted user tractor graphic with cubic interpolation for ultra-crisp display
  // For standard: ~140px width, placed inside the G counter (cx ~ 240, cy ~ 245)
  const tractorStd = await sharp(whiteTractorPath)
    .resize(135, null, { kernel: sharp.kernel.lanczos3 })
    .toBuffer({ resolveWithObject: true });

  const tractorStdLeft = Math.round(242 - tractorStd.info.width / 2);
  const tractorStdTop = Math.round(242 - tractorStd.info.height / 2);

  // Render 512x512 standard base PNG with tractor composited
  const fullStandardPng = await sharp(baseStandardSvg)
    .composite([
      {
        input: tractorStd.data,
        left: tractorStdLeft,
        top: tractorStdTop,
        blend: 'over'
      }
    ])
    .png()
    .toBuffer();

  // For maskable (scaled by 0.75 inside safe zone)
  const tractorMask = await sharp(whiteTractorPath)
    .resize(Math.round(135 * 0.75), null, { kernel: sharp.kernel.lanczos3 })
    .toBuffer({ resolveWithObject: true });

  const tractorMaskLeft = Math.round(64 + (242 * 0.75) - tractorMask.info.width / 2);
  const tractorMaskTop = Math.round(46 + (242 * 0.75) - tractorMask.info.height / 2);

  const fullMaskablePng = await sharp(baseMaskableSvg)
    .composite([
      {
        input: tractorMask.data,
        left: tractorMaskLeft,
        top: tractorMaskTop,
        blend: 'over'
      }
    ])
    .png()
    .toBuffer();

  // Save 512x512 masters
  fs.writeFileSync(path.join(iconsDir, 'icon-512x512.png'), fullStandardPng);
  fs.writeFileSync(path.join(iconsDir, 'icon-maskable-512x512.png'), fullMaskablePng);
  fs.writeFileSync(path.join(targetDir, 'icon-512.png'), fullStandardPng);

  // Generate all sizes
  const targets = [
    { name: 'favicon-16x16.png', size: 16, src: fullStandardPng },
    { name: 'favicon-32x32.png', size: 32, src: fullStandardPng },
    { name: 'favicon-48x48.png', size: 48, src: fullStandardPng },
    { name: 'icon-72x72.png', size: 72, src: fullStandardPng },
    { name: 'icon-96x96.png', size: 96, src: fullStandardPng },
    { name: 'icon-128x128.png', size: 128, src: fullStandardPng },
    { name: 'icon-144x144.png', size: 144, src: fullStandardPng },
    { name: 'icon-152x152.png', size: 152, src: fullStandardPng },
    { name: 'apple-touch-icon.png', size: 180, src: fullStandardPng },
    { name: 'icon-192x192.png', size: 192, src: fullStandardPng },
    { name: 'icon-384x384.png', size: 384, src: fullStandardPng },
    { name: 'icon-maskable-192x192.png', size: 192, src: fullMaskablePng }
  ];

  for (const t of targets) {
    const out = path.join(iconsDir, t.name);
    await sharp(t.src).resize(t.size, t.size).png().toFile(out);
    console.log(`Exported ${t.name}`);
  }

  // Root copies
  await sharp(fullStandardPng).resize(180, 180).png().toFile(path.join(targetDir, 'apple-touch-icon.png'));
  await sharp(fullStandardPng).resize(192, 192).png().toFile(path.join(targetDir, 'icon-192.png'));
  await sharp(fullStandardPng).resize(32, 32).png().toFile(path.join(targetDir, 'favicon.ico'));

  console.log('✅ ALL GoMate Web App Icons generated with exact user tractor image!');
}

generatePerfectIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
