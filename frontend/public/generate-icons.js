const fs = require('fs');
const path = require('path');

// Simple SVG to PNG converter using canvas (for Node.js)
// This creates placeholder PNGs with the icon dimensions
// In production, you'd use a proper tool like sharp or Inkscape

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

const createPlaceholderPNG = (size) => {
  // Create a simple base64 encoded 1x1 transparent PNG
  // In a real scenario, you'd convert the SVG properly
  const placeholderSVG = `<svg width="${size}" height="${size}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="sunGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#fbbf24;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#f59e0b;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="115" fill="url(#bgGradient)"/>
  <circle cx="200" cy="180" r="70" fill="url(#sunGradient)"/>
  <g fill="url(#sunGradient)" opacity="0.8">
    <circle cx="200" cy="70" r="12"/>
    <circle cx="200" cy="290" r="12"/>
    <circle cx="90" cy="180" r="12"/>
    <circle cx="310" cy="180" r="12"/>
    <circle cx="120" cy="100" r="10"/>
    <circle cx="280" cy="100" r="10"/>
    <circle cx="120" cy="260" r="10"/>
    <circle cx="280" cy="260" r="10"/>
  </g>
  <g fill="white" opacity="0.95">
    <ellipse cx="330" cy="320" rx="90" ry="65"/>
    <ellipse cx="260" cy="330" rx="70" ry="55"/>
    <ellipse cx="380" cy="340" rx="75" ry="50"/>
    <rect x="260" y="320" width="120" height="60" />
  </g>
  <g fill="#60a5fa" opacity="0.7">
    <ellipse cx="270" cy="400" rx="8" ry="18"/>
    <ellipse cx="310" cy="420" rx="8" ry="18"/>
    <ellipse cx="350" cy="405" rx="8" ry="18"/>
  </g>
</svg>`;

  return placeholderSVG;
};

// Generate icons
sizes.forEach(size => {
  const svg = createPlaceholderPNG(size);
  const filename = `icon-${size}x${size}.svg`;
  const filepath = path.join(__dirname, 'icons', filename);

  fs.writeFileSync(filepath, svg);
  console.log(`Generated ${filename}`);
});

console.log('\n✅ All icon files generated!');
console.log('📝 Note: These are SVG files. For production, convert them to PNG using:');
console.log('   - Online tools like https://svgtopng.com');
console.log('   - Or CLI tools like ImageMagick: convert icon.svg icon.png');
