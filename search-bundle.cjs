const fs = require('fs');
const s = fs.readFileSync('c:/Users/shiva/OneDrive/Desktop/VB2/frontend/dist/assets/index-Cu0UHREZ.js', 'utf8');
const needles = [
  'activity-ledger-section',
  "dashTab === 'trade'",
  "view === 'auth'",
  'dropdownStyles',
  'btn-hero-primary',
  'Secure Order Checkout',
];
needles.forEach((n) => console.log(n, s.includes(n)));
