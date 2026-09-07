const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const targetDir = 'C:\\Users\\udayp\\.gemini\\antigravity\\scratch\\gomate-whatsapp-bot\\public';
const iconsDir = path.join(targetDir, 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// 1. Standard SVG Icon (512x512)
// Features a prominent, bold, modern Capital G with a tractor inside the counter
const standardSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Background Gradient (Deep Luxury Navy) -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0E234D" />
      <stop offset="60%" stop-color="#071733" />
      <stop offset="100%" stop-color="#030A17" />
    </linearGradient>

    <!-- Capital G Vibrant Emerald-to-Mint Gradient -->
    <linearGradient id="gGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4ADE80" />
      <stop offset="50%" stop-color="#22C55E" />
      <stop offset="100%" stop-color="#16A34A" />
    </linearGradient>

    <!-- Deep Drop Shadow -->
    <filter id="mainShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="14" flood-color="#000000" flood-opacity="0.55" />
    </filter>

    <filter id="subtleGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="18" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- App Rounded Squircle Base (standard Android / Web launcher shape) -->
  <rect width="512" height="512" rx="114" fill="url(#bgGrad)" />

  <!-- Subtle Outer Accent Ring -->
  <rect x="14" y="14" width="484" height="484" rx="102" fill="none" stroke="#22C55E" stroke-width="3" stroke-opacity="0.25" />

  <!-- Ambient Green Backlight behind the G -->
  <circle cx="256" cy="236" r="170" fill="#22C55E" opacity="0.10" filter="url(#subtleGlow)" />

  <!-- The Capital 'G' + Tractor Composition -->
  <g filter="url(#mainShadow)">
    <!-- 
      Modern Geometric Capital 'G'
      Outer circle R=172 (cx=256, cy=234)
      Inner circle R=108
      Right spur at cy=234 extending from x=256 to x=428
      Gap at upper quadrant from 45deg (x=377, y=113) down to inner
    -->
    <path d="
      M 370 115
      A 172 172 0 1 0 428 234
      L 428 206
      A 28 28 0 0 0 400 178
      L 396 178
      A 28 28 0 0 0 368 206
      L 368 234
      A 112 112 0 1 1 324 150
      L 348 122
      A 20 20 0 0 0 346 94
      L 345 93
      A 20 20 0 0 0 317 93
      Z
    " fill="none" />

    <!-- Pure Clean Capital 'G' Shape via Exact Path -->
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

    <!-- 
      TRACTOR VISUAL:
      Faithful reproduction of the user's provided tractor icon:
      - Clean rounded bonnet & dashboard
      - Slanted steering wheel column
      - Horizontal seat bar cushion
      - Big rear wheel with hub
      - Small front wheel with hub
    -->
    <g transform="translate(148, 175) scale(2.05)">
      <!-- Tractor Body Outline -->
      <path d="M 45 42
               L 80 42
               A 6 6 0 0 1 86 48
               L 86 63
               A 5 5 0 0 1 81 68
               L 74 68
               A 4 4 0 0 1 70 64
               L 70 57
               A 6 6 0 0 0 64 51
               L 52 51
               A 8 8 0 0 0 44 59
               L 44 64
               A 4 4 0 0 1 40 68
               L 36 68
               A 4 4 0 0 1 32 64
               L 32 59
               A 16 16 0 0 1 45 42 Z"
            fill="#FFFFFF" />

      <!-- Horizontal Seat Cushion -->
      <rect x="23" y="39" width="18" height="6" rx="3" fill="#FFFFFF" />

      <!-- Slanted Steering Column & Wheel -->
      <line x1="56" y1="44" x2="47" y2="31" stroke="#FFFFFF" stroke-width="4.5" stroke-linecap="round" />
      <line x1="43" y1="28" x2="54" y2="36" stroke="#FFFFFF" stroke-width="4.5" stroke-linecap="round" />

      <!-- Big Rear Wheel (outer white rim, navy tire, bright green hub) -->
      <circle cx="37" cy="65" r="17" fill="#071733" stroke="#FFFFFF" stroke-width="6.5" />
      <circle cx="37" cy="65" r="6" fill="#22C55E" />

      <!-- Small Front Wheel (outer white rim, navy tire, bright green hub) -->
      <circle cx="82" cy="69" r="12" fill="#071733" stroke="#FFFFFF" stroke-width="5.5" />
      <circle cx="82" cy="69" r="4.5" fill="#22C55E" />
    </g>
  </g>

  <!-- GoMate Brand Baseline Tag -->
  <g transform="translate(256, 452)">
    <text text-anchor="middle" 
          font-family="system-ui, -apple-system, 'Inter', 'Segoe UI', Roboto, sans-serif" 
          font-size="34" 
          font-weight="900" 
          letter-spacing="4" 
          fill="#FFFFFF">GO<tspan fill="#4ADE80">MATE</tspan></text>
  </g>
</svg>
`;

// 2. Maskable App Icon (512x512 with safe-zone scaling)
const maskableSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="mBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0E234D" />
      <stop offset="60%" stop-color="#071733" />
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

  <!-- Centered in 80% Safe Zone (r=205px circle around 256,256) -->
  <g transform="translate(64, 46) scale(0.75)" filter="url(#mShadow)">
    <!-- Capital 'G' Shape -->
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

    <!-- Tractor Visual -->
    <g transform="translate(148, 175) scale(2.05)">
      <path d="M 45 42
               L 80 42
               A 6 6 0 0 1 86 48
               L 86 63
               A 5 5 0 0 1 81 68
               L 74 68
               A 4 4 0 0 1 70 64
               L 70 57
               A 6 6 0 0 0 64 51
               L 52 51
               A 8 8 0 0 0 44 59
               L 44 64
               A 4 4 0 0 1 40 68
               L 36 68
               A 4 4 0 0 1 32 64
               L 32 59
               A 16 16 0 0 1 45 42 Z"
            fill="#FFFFFF" />

      <rect x="23" y="39" width="18" height="6" rx="3" fill="#FFFFFF" />
      <line x1="56" y1="44" x2="47" y2="31" stroke="#FFFFFF" stroke-width="4.5" stroke-linecap="round" />
      <line x1="43" y1="28" x2="54" y2="36" stroke="#FFFFFF" stroke-width="4.5" stroke-linecap="round" />
      <circle cx="37" cy="65" r="17" fill="#071733" stroke="#FFFFFF" stroke-width="6.5" />
      <circle cx="37" cy="65" r="6" fill="#22C55E" />
      <circle cx="82" cy="69" r="12" fill="#071733" stroke="#FFFFFF" stroke-width="5.5" />
      <circle cx="82" cy="69" r="4.5" fill="#22C55E" />
    </g>

    <!-- Wordmark -->
    <g transform="translate(256, 452)">
      <text text-anchor="middle" 
            font-family="system-ui, -apple-system, 'Inter', 'Segoe UI', Roboto, sans-serif" 
            font-size="38" 
            font-weight="900" 
            letter-spacing="4" 
            fill="#FFFFFF">GO<tspan fill="#4ADE80">MATE</tspan></text>
    </g>
  </g>
</svg>
`;

async function main() {
  console.log('Generating Capital G + Tractor visual icons...');

  const stdBuffer = Buffer.from(standardSvg);
  const maskBuffer = Buffer.from(maskableSvg);

  fs.writeFileSync(path.join(iconsDir, 'app-icon.svg'), stdBuffer);
  fs.writeFileSync(path.join(iconsDir, 'app-icon-maskable.svg'), maskBuffer);
  fs.writeFileSync(path.join(targetDir, 'favicon.svg'), stdBuffer);

  const targets = [
    { name: 'favicon-16x16.png', size: 16, buf: stdBuffer },
    { name: 'favicon-32x32.png', size: 32, buf: stdBuffer },
    { name: 'favicon-48x48.png', size: 48, buf: stdBuffer },
    { name: 'icon-72x72.png', size: 72, buf: stdBuffer },
    { name: 'icon-96x96.png', size: 96, buf: stdBuffer },
    { name: 'icon-128x128.png', size: 128, buf: stdBuffer },
    { name: 'icon-144x144.png', size: 144, buf: stdBuffer },
    { name: 'icon-152x152.png', size: 152, buf: stdBuffer },
    { name: 'apple-touch-icon.png', size: 180, buf: stdBuffer },
    { name: 'icon-192x192.png', size: 192, buf: stdBuffer },
    { name: 'icon-384x384.png', size: 384, buf: stdBuffer },
    { name: 'icon-512x512.png', size: 512, buf: stdBuffer },
    { name: 'icon-maskable-192x192.png', size: 192, buf: maskBuffer },
    { name: 'icon-maskable-512x512.png', size: 512, buf: maskBuffer },
  ];

  for (const t of targets) {
    const p = path.join(iconsDir, t.name);
    await sharp(t.buf).resize(t.size, t.size).png().toFile(p);
    console.log(`Exported ${t.name}`);
  }

  // Also root mirrors
  await sharp(stdBuffer).resize(180, 180).png().toFile(path.join(targetDir, 'apple-touch-icon.png'));
  await sharp(stdBuffer).resize(192, 192).png().toFile(path.join(targetDir, 'icon-192.png'));
  await sharp(stdBuffer).resize(512, 512).png().toFile(path.join(targetDir, 'icon-512.png'));
  await sharp(stdBuffer).resize(32, 32).png().toFile(path.join(targetDir, 'favicon.ico'));

  console.log('All icons generated successfully!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
