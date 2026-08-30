const fs = require('fs');

const path = './src/pages/Dashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Remove selectedMonth and selectedMonthIndex states
content = content.replace(/const \[selectedMonth, setSelectedMonth\] = useState\([\s\S]*?\);\n/, '');

// Replace selectedMonthIndex and selectedYear useMemo
content = content.replace(/const \[selectedMonthIndex, selectedYear\] = useMemo\([\s\S]*?\}, \[selectedMonth\]\);\n/, 
`const dateRange = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let start = new Date(today);
    let end = new Date(today);
    
    if (chartPeriod === 'yesterday') {
      start.setDate(today.getDate() - 1);
      end.setDate(today.getDate() - 1);
    } else if (chartPeriod === '7days') {
      start.setDate(today.getDate() - 6);
    } else if (chartPeriod === '15days') {
      start.setDate(today.getDate() - 14);
    } else if (chartPeriod === '30days') {
      start.setDate(today.getDate() - 29);
    } else if (chartPeriod === 'custom') {
      if (customStartDate) {
        const [y, m, d] = customStartDate.split('-').map(Number);
        start = new Date(y, m - 1, d);
      }
      if (customEndDate) {
        const [y, m, d] = customEndDate.split('-').map(Number);
        end = new Date(y, m - 1, d);
      }
    }
    
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }, [chartPeriod, customStartDate, customEndDate]);

  const [selectedMonthIndex, selectedYear] = useMemo(() => {
    return [dateRange.end.getMonth(), dateRange.end.getFullYear()];
  }, [dateRange]);\n`);


// 2. Replace totalFundoSeparado
content = content.replace(/const totalFundoSeparado = useMemo\([\s\S]*?\}, \[dailySales, selectedMonthIndex, selectedYear, activeDREConfig\.metaDiariaFundo\]\);\n/,
`const totalFundoSeparado = useMemo(() => {
    const periodSales = dailySales.filter(s => {
      const saleDate = new Date(s.year, s.month, s.day);
      return saleDate >= dateRange.start && saleDate <= dateRange.end && s.totalLiquido > 0;
    });
    return periodSales.length * activeDREConfig.metaDiariaFundo;
  }, [dailySales, dateRange, activeDREConfig.metaDiariaFundo]);\n`);

// 3. Replace withdrawals
content = content.replace(/const withdrawals = useMemo\(\(\) => \{\n    return activeDREConfig\.withdrawals \|\| \[\];\n  \}, \[activeDREConfig\]\);\n/,
`const withdrawals = useMemo(() => {
    return (activeDREConfig.withdrawals || []).filter(w => {
      const d = new Date(w.date);
      d.setHours(12, 0, 0, 0);
      return d >= dateRange.start && d <= dateRange.end;
    });
  }, [activeDREConfig, dateRange]);\n`);


// 4. Replace totalSalesForSelectedMonth
content = content.replace(/const totalSalesForSelectedMonth = useMemo\([\s\S]*?\}, \[dailySales, selectedMonthIndex, selectedYear\]\);\n/,
`const totalSalesForSelectedMonth = useMemo(() => {
    return dailySales
      .filter(s => {
        const saleDate = new Date(s.year, s.month, s.day);
        return saleDate >= dateRange.start && saleDate <= dateRange.end;
      })
      .reduce((sum, s) => sum + s.totalLiquido, 0);
  }, [dailySales, dateRange]);\n`);


// 5. Replace activeItemsList filter
content = content.replace(/const matchesMonth = d\.getMonth\(\) === selectedMonthIndex && d\.getFullYear\(\) === selectedYear;/, 
`d.setHours(12, 0, 0, 0);
        const matchesMonth = d >= dateRange.start && d <= dateRange.end;`);

content = content.replace(/\[expenses, boletos, activeDetailsStatus, selectedMonthIndex, selectedYear\]/, 
`[expenses, boletos, activeDetailsStatus, dateRange]`);


// 6. Replace metrics despesas filtering
content = content.replace(/const currentMonth = selectedMonthIndex;\n    const currentYear = selectedYear;\n\n    const filterByMonth = \(items: \(Expense \| Boleto\)\[\]\) => items\.filter\(item => \{\n      if \(!item\.dueDate\) return false;\n      const d = new Date\(item\.dueDate\);\n      return d\.getMonth\(\) === currentMonth && d\.getFullYear\(\) === currentYear;\n    \}\);\n\n    const currentExpenses = filterByMonth\(expenses\) as Expense\[\];\n    const currentBoletos = filterByMonth\(boletos\) as Boleto\[\];/,
`const filterByDateRange = (items: (Expense | Boleto)[]) => items.filter(item => {
      if (!item.dueDate) return false;
      const d = new Date(item.dueDate);
      d.setHours(12, 0, 0, 0);
      return d >= dateRange.start && d <= dateRange.end;
    });

    const currentExpenses = filterByDateRange(expenses) as Expense[];
    const currentBoletos = filterByDateRange(boletos) as Boleto[];`);

content = content.replace(/\[expenses, boletos, dailySales, selectedMonthIndex, selectedYear\]/, 
`[expenses, boletos, dailySales, dateRange]`);


// 7. Replace comparisonMetrics
const comparisonMetricsReplacement = `const comparisonMetrics = useMemo(() => {
    const currentSales = totalSalesForSelectedMonth;

    // Previous period
    const durationInMs = dateRange.end.getTime() - dateRange.start.getTime();
    const prevEnd = new Date(dateRange.start.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - durationInMs);

    const prevMonthSales = dailySales
      .filter(s => {
        const saleDate = new Date(s.year, s.month, s.day);
        return saleDate >= prevStart && saleDate <= prevEnd;
      })
      .reduce((sum, s) => sum + s.totalLiquido, 0);

    const salesDiffPercent = prevMonthSales > 0 
      ? ((currentSales - prevMonthSales) / prevMonthSales) * 100 
      : 0;

    const filterByDateRange = (items: (Expense | Boleto)[]) => items.filter(item => {
      if (!item.dueDate) return false;
      const d = new Date(item.dueDate);
      d.setHours(12, 0, 0, 0);
      return d >= prevStart && d <= prevEnd;
    });

    const prevExpenses = filterByDateRange(expenses) as Expense[];
    const prevBoletos = filterByDateRange(boletos) as Boleto[];
    const prevTotalDespesas = prevExpenses.reduce((sum, e) => sum + e.value, 0) +
      prevBoletos.reduce((sum, b) => sum + b.value, 0);

    const despesasDiffPercent = prevTotalDespesas > 0 
      ? ((metrics.despesasMes - prevTotalDespesas) / prevTotalDespesas) * 100 
      : 0;

    return {
      salesDiffPercent,
      despesasDiffPercent
    };
  }, [totalSalesForSelectedMonth, dailySales, dateRange, expenses, boletos, metrics.despesasMes]);`;

content = content.replace(/const comparisonMetrics = useMemo\([\s\S]*?\}, \[totalSalesForSelectedMonth, dailySales, selectedMonthIndex, selectedYear, expenses, boletos, metrics\.despesasMes\]\);/, comparisonMetricsReplacement);


// 8. Remove month dropdown UI from return
content = content.replace(/<div className="relative inline-block mt-0\.5">\s*<button\s*onClick=\{.*?\}\s*className=".*?">\s*<span><i className=".*?"><\/i>\{selectedMonth\}<\/span>\s*<i className=".*?"><\/i>\s*<\/button>\s*\{isMonthDropdownOpen && \(\s*<div className=".*?">\s*\{monthsList\.map\(m => \(\s*<button\s*key=\{m\}\s*onClick=\{.*?\}\s*className=".*?"\s*>\s*\{m\}\s*<\/button>\s*\)\)\}\s*<\/div>\s*\)\}\s*<\/div>/, '');

// 9. Update the labels for 'vs. mês anterior' to 'vs. período anterior'
content = content.replace(/vs\. mês anterior/g, 'vs. período anterior');


fs.writeFileSync(path, content, 'utf8');
console.log('Dashboard.tsx updated successfully');
