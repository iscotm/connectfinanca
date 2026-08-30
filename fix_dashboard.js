const fs = require('fs');
const path = './src/pages/Dashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/\{selectedMonth\}/g, '');
content = content.replace(/Listando lançamentos para \{selectedMonth\}\./g, 'Listando lançamentos para o período.');

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed');
