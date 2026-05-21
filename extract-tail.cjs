const fs = require('fs');
const s = fs.readFileSync('c:/Users/shiva/OneDrive/Desktop/VB2/frontend/dist/assets/index-Cu0UHREZ.js', 'utf8');
const marker = 'Recent Vault Activity';
const idx = s.indexOf(marker);
console.log('idx', idx);
if (idx >= 0) {
  // dump a large chunk - might contain escaped jsx as strings
  const chunk = s.substring(Math.max(0, idx - 2000), idx + 80000);
  fs.writeFileSync('c:/Users/shiva/OneDrive/Desktop/VB2/frontend/dist/extract-chunk.txt', chunk);
  console.log('wrote chunk', chunk.length);
}
