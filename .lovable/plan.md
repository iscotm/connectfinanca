
# Plano: Corrigir Calculo de Sobras

## Problema
O card de Sobras na pagina de Separacoes esta mostrando valores negativos (-R$ 10.300,91) quando nao ha vendas registradas. Isso acontece porque o calculo atual subtrai as despesas totais (14.000) mesmo quando `totalSales = 0`.

**Calculo atual (incorreto):**
```text
sobras = totalSales - cmv - despesasRestantes - fundoCaixa
sobras = 0 - 0 - 14000 - 0 = -14000
```

## Solucao
As sobras so devem ser calculadas quando existem vendas. Se nao ha vendas no mes, o valor de sobras deve ser `R$ 0,00`.

**Formula corrigida:**
```text
SE totalSales > 0 ENTAO
  sobras = totalSales - cmv - despesasRestantes - fundoCaixa
SENAO
  sobras = 0
```

## Arquivo a Modificar
`src/pages/Separacoes.tsx` - linha 67

## Mudanca
De:
```javascript
const sobras = totalSales - cmv - despesasRestantes - fundoCaixa;
```

Para:
```javascript
const sobras = totalSales > 0 
  ? totalSales - cmv - despesasRestantes - fundoCaixa 
  : 0;
```

## Resultado Esperado
- Sem vendas: Sobras = R$ 0,00 (verde)
- Com vendas: Sobras = Venda - CMV - Despesas - Fundo (pode ser positivo ou negativo dependendo do resultado)
