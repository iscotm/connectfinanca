const fs = require('fs');

const filesToUpdate = [
  'src/pages/Separacoes.tsx',
  'src/components/separacoes/CaixaDiaDialog.tsx',
  'src/components/separacoes/ConfiguracoesDREDialog.tsx',
  'src/pages/ConfiguracoesDRE.tsx' 
];

filesToUpdate.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace exact UI labels:
    content = content.replace(/>Sobras</g, '>Lucro Líquido<');
    content = content.replace(/'Sobras'/g, "'Lucro Líquido'");
    content = content.replace(/"Sobras"/g, '"Lucro Líquido"');
    content = content.replace(/>Sobras Total</g, '>Lucro Líquido Total<');
    content = content.replace(/label="Sobras"/g, 'label="Lucro Líquido"');
    content = content.replace(/SOBRAS/g, 'LUCRO LÍQUIDO');
    
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
