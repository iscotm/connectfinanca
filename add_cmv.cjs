const fs = require('fs');

const path = 'src/pages/Dashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add state for showCMV
if (!content.includes('const [showCMV')) {
  content = content.replace(
    /const \[showLucro, setShowLucro\] = useState\(true\);/g,
    'const [showLucro, setShowLucro] = useState(true);\n  const [showCMV, setShowCMV] = useState(true);'
  );
}

// 2. Add cmv logic to chartDataAndMetrics
if (!content.includes('const cmv = ')) {
  content = content.replace(
    /const receita = sale\?\.totalLiquido \|\| 0;\s*const despesa = dailyDespesaRateio;\s*const lucro = receita - despesa;/g,
    `const receita = sale?.totalLiquido || 0;
      const despesa = dailyDespesaRateio;
      const cmv = receita * ((activeDREConfig.percentualCMV || 0) / 100);
      const fundo = receita > 0 ? (activeDREConfig.metaDiariaFundo || 0) : 0;
      const lucro = receita - despesa - cmv - fundo;`
  );

  content = content.replace(
    /receitas: receita,\s*despesas: despesa,\s*lucro: lucro,/g,
    `receitas: receita,\n        despesas: despesa,\n        cmv: cmv,\n        lucro: lucro,`
  );
}

// 3. Add toggle button for CMV in UI
if (!content.includes('setShowCMV(!showCMV)')) {
  content = content.replace(
    /<button \s*onClick=\{\(\) => setShowLucro\(!showLucro\)\}/g,
    `<button 
                  onClick={() => setShowCMV(!showCMV)} 
                  className={\`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all \${showCMV ? 'bg-amber-500/20 border-amber-500/30 text-amber-300' : 'opacity-40 grayscale bg-transparent border-transparent'}\`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span className="text-[11px]">CMV</span>
                </button>
                <button 
                  onClick={() => setShowLucro(!showLucro)}`
  );
}

// 4. Add Area for CMV in the chart
if (!content.includes('name="CMV"')) {
  content = content.replace(
    /\{showLucro && \(/g,
    `{showCMV && (
                  <Area 
                    type="monotone" 
                    name="CMV"
                    dataKey="cmv" 
                    stroke="#f59e0b" 
                    strokeWidth={2.5} 
                    fill="none" 
                    dot={{ r: 4, strokeWidth: 1, stroke: '#fff', fill: '#f59e0b' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                )}
                {showLucro && (`
  );
}

// 5. Update KPI Lucro Líquido to use the correct formula as well!
// The user asked "coloque o cmv para ficar os calulos certos".
// In the KPI cards on top, "Lucro Líquido" was:
// const lucroLiquido = totalSalesForSelectedMonth - metrics.despesasMes;
// Let's fix it to include CMV and Fundo
if (!content.includes('const totalCmvForSelectedMonth =')) {
  content = content.replace(
    /const lucroLiquido = useMemo\(\(\) => \{\n\s*return totalSalesForSelectedMonth - metrics\.despesasMes;\n\s*\}, \[totalSalesForSelectedMonth, metrics\.despesasMes\]\);/g,
    `const lucroLiquido = useMemo(() => {
    const cmv = totalSalesForSelectedMonth * ((activeDREConfig.percentualCMV || 0) / 100);
    const fundo = totalFundoSeparado;
    return totalSalesForSelectedMonth - metrics.despesasMes - cmv - fundo;
  }, [totalSalesForSelectedMonth, metrics.despesasMes, activeDREConfig.percentualCMV, totalFundoSeparado]);`
  );
}

fs.writeFileSync(path, content, 'utf8');
console.log('Dashboard.tsx updated with CMV.');
