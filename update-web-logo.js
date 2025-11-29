const fs = require('fs');
const path = require('path');

console.log('🔄 Updating web app logo...\n');

const sourceLogo = path.join(__dirname, 'uigeslogo.png');
const publicImagesDir = path.join(__dirname, 'public', 'images');

// Check if source exists
if (!fs.existsSync(sourceLogo)) {
  console.error('❌ Source logo file not found:', sourceLogo);
  process.exit(1);
}

// Ensure public/images directory exists
if (!fs.existsSync(publicImagesDir)) {
  fs.mkdirSync(publicImagesDir, { recursive: true });
  console.log('✅ Created public/images directory');
}

// Copy to all required locations
const targets = [
  path.join(publicImagesDir, 'logo.png'),
  path.join(publicImagesDir, 'logo.svg'), // Will actually be a PNG
  path.join(publicImagesDir, 'logo-sm.png')
];

let successCount = 0;
targets.forEach(target => {
  try {
    fs.copyFileSync(sourceLogo, target);
    console.log(`✅ Copied to ${path.basename(target)}`);
    successCount++;
  } catch (error) {
    console.error(`❌ Failed to copy to ${target}:`, error.message);
  }
});

console.log(`\n📊 Summary: ${successCount}/${targets.length} files copied successfully`);

if (successCount === targets.length) {
  console.log('\n✨ Done! Please refresh your browser to see the new logo.');
  console.log('   If you don\'t see changes, do a hard refresh: Ctrl+Shift+R (or Ctrl+F5)');
} else {
  console.log('\n⚠️  Some files failed to copy. Please copy manually.');
}

