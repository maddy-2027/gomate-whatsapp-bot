const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const targetDir = 'C:\\Users\\udayp\\.gemini\\antigravity\\scratch\\gomate-whatsapp-bot\\public';
const iconsDir = path.join(targetDir, 'icons');
const assetsIconsDir = path.join(targetDir, 'assets', 'icons');

// Source image from user upload
const userUploadedTractor = 'C:\\Users\\udayp\\.gemini\\antigravity\\brain\\8f287943-373d-4245-a239-0a6d76f91fc5\\.user_uploaded\\media_1788776890882.png';

async function processBlueTractorAsset() {
  console.log('🎨 Generating Blue Tractor Visual for public/assets/icons/tractor.png...');
  
  // 1. Vector blue tractor icon with transparent or subtle rounded background
  // Dimensions 128x128 with clean royal blue tractor lineart
  const blueTractorSvg = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <defs>
    <linearGradient id="blueCardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#EFF6FF" />
      <stop offset="100%" stop-color="#DBEAFE" />
    </linearGradient>
    <linearGradient id="blueStrokeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2563EB" />
      <stop offset="100%" stop-color="#1D4ED8" />
    </linearGradient>
  </defs>

  <!-- Rounded Squircle Card identical to user's uploaded visual style -->
  <rect x="8" y="8" width="112" height="112" rx="28" fill="url(#blueCardGrad)" stroke="#93C5FD" stroke-width="2.5" />

  <!-- Tractor Visual in Electric Royal Blue (#1D4ED8 / #2563EB) -->
  <g transform="translate(14, 12)">
    <!-- Tractor Body Frame -->
    <path d="M 36 34
             L 66 34
             A 6 6 0 0 1 72 40
             L 72 53
             A 5 5 0 0 1 67 58
             L 60 58
             A 4 4 0 0 1 56 54
             L 56 47
             A 6 6 0 0 0 50 41
             L 42 41
             A 8 8 0 0 0 34 49
             L 34 54
             A 4 4 0 0 1 30 58
             L 26 58
             A 4 4 0 0 1 22 54
             L 22 49
             A 14 14 0 0 1 36 34 Z"
          fill="#1E40AF" />

    <!-- Horizontal Seat Cushion -->
    <rect x="14" y="32" width="16" height="5.5" rx="2.75" fill="#1E40AF" />

    <!-- Steering Column & Steering Wheel -->
    <line x1="46" y1="36" x2="38" y2="24" stroke="#1E40AF" stroke-width="4" stroke-linecap="round" />
    <line x1="33" y1="21" x2="43" y2="29" stroke="#1E40AF" stroke-width="4" stroke-linecap="round" />

    <!-- Big Rear Wheel -->
    <circle cx="27" cy="55" r="15" fill="#DBEAFE" stroke="#1E40AF" stroke-width="5.5" />
    <circle cx="27" cy="55" r="5" fill="#1E40AF" />

    <!-- Small Front Wheel -->
    <circle cx="68" cy="59" r="10" fill="#DBEAFE" stroke="#1E40AF" stroke-width="4.5" />
    <circle cx="68" cy="59" r="3.5" fill="#1E40AF" />
  </g>
</svg>
  `);

  await sharp(blueTractorSvg).resize(128, 128).png().toFile(path.join(assetsIconsDir, 'tractor.png'));
  console.log('✅ Generated public/assets/icons/tractor.png in blue color!');
}

async function processBlueAppIcons() {
  console.log('🎨 Generating Blue Themed GoMate Capital G + Tractor App Icons...');

  // 1. Standard SVG Icon (512x512) with Blue Visuals & Blue G
  const standardSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Deep Navy/Sapphire Background Gradient -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0F172A" />
      <stop offset="50%" stop-color="#0A1F44" />
      <stop offset="100%" stop-color="#030712" />
    </linearGradient>

    <!-- Capital G Vibrant Royal-to-Cyan Blue Gradient -->
    <linearGradient id="gBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#60A5FA" />
      <stop offset="45%" stop-color="#3B82F6" />
      <stop offset="100%" stop-color="#1D4ED8" />
    </linearGradient>

    <!-- Tractor Blue Accent Gradient -->
    <linearGradient id="tractorBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#93C5FD" />
      <stop offset="100%" stop-color="#3B82F6" />
    </linearGradient>

    <!-- Shadow -->
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

  <!-- Subtle Outer Accent Ring in Blue -->
  <rect x="14" y="14" width="484" height="484" rx="102" fill="none" stroke="#3B82F6" stroke-width="3" stroke-opacity="0.3" />

  <!-- Ambient Blue Backlight behind the G -->
  <circle cx="256" cy="236" r="170" fill="#3B82F6" opacity="0.12" filter="url(#subtleGlow)" />

  <!-- The Capital 'G' + Tractor Composition -->
  <g filter="url(#mainShadow)">
    <!-- Pure Clean Capital 'G' Shape in Vibrant Blue -->
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
    " fill="url(#gBlueGrad)" fill-rule="evenodd" />

    <!-- TRACTOR VISUAL in Crisp White with Electric Blue Hubs and Chassis -->
    <g transform="translate(148, 175) scale(2.05)">
      <!-- Rounded Tractor Body Shell -->
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

      <!-- Big Rear Wheel with Deep Blue Tire and Brilliant Blue Hub -->
      <circle cx="37" cy="65" r="17" fill="#0A1F44" stroke="#FFFFFF" stroke-width="6.5" />
      <circle cx="37" cy="65" r="6.5" fill="#3B82F6" />

      <!-- Small Front Wheel with Deep Blue Tire and Brilliant Blue Hub -->
      <circle cx="82" cy="69" r="12" fill="#0A1F44" stroke="#FFFFFF" stroke-width="5.5" />
      <circle cx="82" cy="69" r="4.5" fill="#3B82F6" />
    </g>
  </g>

  <!-- GoMate Brand Baseline Tag -->
  <g transform="translate(256, 452)">
    <text text-anchor="middle" 
          font-family="system-ui, -apple-system, 'Inter', 'Segoe UI', Roboto, sans-serif" 
          font-size="34" 
          font-weight="900" 
          letter-spacing="4" 
          fill="#FFFFFF">GO<tspan fill="#60A5FA">MATE</tspan></text>
  </g>
</svg>
`;

  // 2. Maskable SVG Icon (512x512)
  const maskableSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="mBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0F172A" />
      <stop offset="50%" stop-color="#0A1F44" />
      <stop offset="100%" stop-color="#030712" />
    </linearGradient>

    <linearGradient id="mGBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#60A5FA" />
      <stop offset="45%" stop-color="#3B82F6" />
      <stop offset="100%" stop-color="#1D4ED8" />
    </linearGradient>

    <filter id="mShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#000000" flood-opacity="0.6" />
    </filter>
  </defs>

  <!-- Full-bleed background -->
  <rect width="512" height="512" fill="url(#mBgGrad)" />

  <!-- Centered in 80% Safe Zone -->
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
    " fill="url(#mGBlueGrad)" fill-rule="evenodd" />

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
      <circle cx="37" cy="65" r="17" fill="#0A1F44" stroke="#FFFFFF" stroke-width="6.5" />
      <circle cx="37" cy="65" r="6.5" fill="#3B82F6" />
      <circle cx="82" cy="69" r="12" fill="#0A1F44" stroke="#FFFFFF" stroke-width="5.5" />
      <circle cx="82" cy="69" r="4.5" fill="#3B82F6" />
    </g>

    <g transform="translate(256, 452)">
      <text text-anchor="middle" 
            font-family="system-ui, -apple-system, 'Inter', 'Segoe UI', Roboto, sans-serif" 
            font-size="38" 
            font-weight="900" 
            letter-spacing="4" 
            fill="#FFFFFF">GO<tspan fill="#60A5FA">MATE</tspan></text>
    </g>
  </g>
</svg>
`;

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

  // Root mirrors
  await sharp(stdBuffer).resize(180, 180).png().toFile(path.join(targetDir, 'apple-touch-icon.png'));
  await sharp(stdBuffer).resize(192, 192).png().toFile(path.join(targetDir, 'icon-192.png'));
  await sharp(stdBuffer).resize(512, 512).png().toFile(path.join(targetDir, 'icon-512.png'));
  await sharp(stdBuffer).resize(32, 32).png().toFile(path.join(targetDir, 'favicon.ico'));

  console.log('✅ All blue-themed app icons generated successfully!');
}

async function run() {
  await processBlueTractorAsset();
  await processBlueAppIcons();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
