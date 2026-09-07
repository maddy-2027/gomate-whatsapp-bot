const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const targetDir = 'C:\\Users\\udayp\\.gemini\\antigravity\\scratch\\gomate-whatsapp-bot\\public';
const iconsDir = path.join(targetDir, 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// 1. Standard App Icon SVG (512x512)
const standardSvg = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0F2552" />
      <stop offset="50%" stop-color="#0A1F44" />
      <stop offset="100%" stop-color="#040D1D" />
    </linearGradient>
    <linearGradient id="greenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4ADE80" />
      <stop offset="50%" stop-color="#22C55E" />
      <stop offset="100%" stop-color="#15803D" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FCD34D" />
      <stop offset="100%" stop-color="#F59E0B" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="12" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
    <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#000000" flood-opacity="0.4" />
    </filter>
  </defs>

  <!-- Base App Background with subtle rounded corners -->
  <rect width="512" height="512" rx="112" fill="url(#bgGrad)" />

  <!-- Subtle Outer Accent Ring -->
  <rect x="12" y="12" width="488" height="488" rx="104" fill="none" stroke="#22C55E" stroke-width="4" stroke-opacity="0.3" />

  <!-- Glowing Backdrop Circle -->
  <circle cx="256" cy="210" r="130" fill="#16A34A" opacity="0.15" filter="url(#glow)" />

  <!-- Hexagon Frame -->
  <g filter="url(#dropShadow)">
    <polygon points="256,60 375,130 375,270 256,340 137,270 137,130" 
             fill="none" 
             stroke="url(#greenGrad)" 
             stroke-width="18" 
             stroke-linejoin="round" 
             stroke-linecap="round" />
    
    <!-- Inner Glow Hexagon -->
    <polygon points="256,76 360,138 360,262 256,324 152,262 152,138" 
             fill="#0A1F44" 
             fill-opacity="0.7" />
  </g>

  <!-- Central Tractor & Forward Chevron Emblem -->
  <!-- Forward Chevron -->
  <path d="M226,130 L320,200 L226,270 L254,200 Z" 
        fill="url(#greenGrad)" 
        filter="url(#dropShadow)" />

  <!-- Tractor Outline Glyph inside -->
  <g transform="translate(180, 160) scale(0.75)" fill="#FFFFFF">
    <!-- Cabin & Hood -->
    <path d="M10,60 L40,60 L50,30 L85,30 L95,60 L140,60 L140,75 L125,75 L125,85 L85,85 L85,75 L10,75 Z" opacity="0.95" />
    <!-- Big Rear Wheel -->
    <circle cx="45" cy="90" r="26" fill="none" stroke="#FFFFFF" stroke-width="7" />
    <circle cx="45" cy="90" r="10" fill="#22C55E" />
    <!-- Small Front Wheel -->
    <circle cx="125" cy="96" r="18" fill="none" stroke="#FFFFFF" stroke-width="6" />
    <circle cx="125" cy="96" r="7" fill="#22C55E" />
    <!-- Exhaust Silencer -->
    <rect x="92" y="15" width="6" height="18" rx="2" fill="#F59E0B" />
  </g>

  <!-- Brand Wordmark GoMate -->
  <text x="256" y="412" 
        text-anchor="middle" 
        font-family="'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif" 
        font-size="56" 
        font-weight="800" 
        letter-spacing="-1.5"
        fill="#FFFFFF">Go<tspan fill="#4ADE80">Mate</tspan></text>

  <!-- Category subtitle: FARM EQUIPMENT -->
  <text x="256" y="446" 
        text-anchor="middle" 
        font-family="'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif" 
        font-size="16" 
        font-weight="700" 
        letter-spacing="4.5"
        fill="#94A3B8">FARM EQUIPMENT</text>

  <!-- Golden Quality Star -->
  <polygon points="256,462 260,470 269,471 262,477 264,486 256,481 248,486 250,477 243,471 252,470" fill="url(#goldGrad)" />
</svg>
`);

// 2. Maskable App Icon SVG (512x512) - Full-bleed with 20% safe-zone margin
const maskableSvg = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="mBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0F2552" />
      <stop offset="50%" stop-color="#0A1F44" />
      <stop offset="100%" stop-color="#040D1D" />
    </linearGradient>
    <linearGradient id="mGreen" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4ADE80" />
      <stop offset="50%" stop-color="#22C55E" />
      <stop offset="100%" stop-color="#15803D" />
    </linearGradient>
    <linearGradient id="mGold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FCD34D" />
      <stop offset="100%" stop-color="#F59E0B" />
    </linearGradient>
    <filter id="mShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000000" flood-opacity="0.5" />
    </filter>
  </defs>

  <!-- Full-bleed background (Edge to Edge for Adaptive Icons) -->
  <rect width="512" height="512" fill="url(#mBg)" />

  <!-- Scaled content centered within safe zone (80% / ~410px circle) -->
  <g transform="translate(51, 40) scale(0.80)">
    <!-- Hexagon Frame -->
    <polygon points="256,60 375,130 375,270 256,340 137,270 137,130" 
             fill="#0A1F44" 
             stroke="url(#mGreen)" 
             stroke-width="22" 
             stroke-linejoin="round" 
             stroke-linecap="round" 
             filter="url(#mShadow)" />

    <!-- Forward Chevron -->
    <path d="M226,130 L320,200 L226,270 L254,200 Z" 
          fill="url(#mGreen)" 
          filter="url(#mShadow)" />

    <!-- Tractor Outline Glyph inside -->
    <g transform="translate(180, 160) scale(0.75)" fill="#FFFFFF">
      <path d="M10,60 L40,60 L50,30 L85,30 L95,60 L140,60 L140,75 L125,75 L125,85 L85,85 L85,75 L10,75 Z" opacity="0.95" />
      <circle cx="45" cy="90" r="26" fill="none" stroke="#FFFFFF" stroke-width="7" />
      <circle cx="45" cy="90" r="10" fill="#22C55E" />
      <circle cx="125" cy="96" r="18" fill="none" stroke="#FFFFFF" stroke-width="6" />
      <circle cx="125" cy="96" r="7" fill="#22C55E" />
      <rect x="92" y="15" width="6" height="18" rx="2" fill="#F59E0B" />
    </g>

    <!-- Brand Wordmark GoMate -->
    <text x="256" y="412" 
          text-anchor="middle" 
          font-family="'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif" 
          font-size="64" 
          font-weight="800" 
          letter-spacing="-1.5"
          fill="#FFFFFF">Go<tspan fill="#4ADE80">Mate</tspan></text>

    <!-- Category subtitle -->
    <text x="256" y="450" 
          text-anchor="middle" 
          font-family="'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif" 
          font-size="18" 
          font-weight="700" 
          letter-spacing="5"
          fill="#94A3B8">FARM EQUIPMENT</text>
  </g>
</svg>
`);

async function generateAllIcons() {
  console.log('🎨 Generating GoMate Web App Icons...');

  fs.writeFileSync(path.join(iconsDir, 'app-icon.svg'), standardSvg);
  fs.writeFileSync(path.join(iconsDir, 'app-icon-maskable.svg'), maskableSvg);

  const sizes = [
    { name: 'favicon-16x16.png', size: 16, svg: standardSvg },
    { name: 'favicon-32x32.png', size: 32, svg: standardSvg },
    { name: 'favicon-48x48.png', size: 48, svg: standardSvg },
    { name: 'icon-72x72.png', size: 72, svg: standardSvg },
    { name: 'icon-96x96.png', size: 96, svg: standardSvg },
    { name: 'icon-128x128.png', size: 128, svg: standardSvg },
    { name: 'icon-144x144.png', size: 144, svg: standardSvg },
    { name: 'icon-152x152.png', size: 152, svg: standardSvg },
    { name: 'apple-touch-icon.png', size: 180, svg: standardSvg },
    { name: 'icon-192x192.png', size: 192, svg: standardSvg },
    { name: 'icon-384x384.png', size: 384, svg: standardSvg },
    { name: 'icon-512x512.png', size: 512, svg: standardSvg },
    { name: 'icon-maskable-192x192.png', size: 192, svg: maskableSvg },
    { name: 'icon-maskable-512x512.png', size: 512, svg: maskableSvg }
  ];

  for (const item of sizes) {
    const outPath = path.join(iconsDir, item.name);
    await sharp(item.svg)
      .resize(item.size, item.size)
      .png()
      .toFile(outPath);
    console.log(`✅ Generated ${item.name} (${item.size}x${item.size})`);
  }

  // Also copy apple-touch-icon and 192/512 to root public/ for legacy web crawlers and shortcuts
  await sharp(standardSvg).resize(180, 180).png().toFile(path.join(targetDir, 'apple-touch-icon.png'));
  await sharp(standardSvg).resize(192, 192).png().toFile(path.join(targetDir, 'icon-192.png'));
  await sharp(standardSvg).resize(512, 512).png().toFile(path.join(targetDir, 'icon-512.png'));
  await sharp(standardSvg).resize(32, 32).png().toFile(path.join(targetDir, 'favicon.ico'));

  console.log('🎉 ALL GoMate Web App Icons Generated Successfully!');
}

generateAllIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
