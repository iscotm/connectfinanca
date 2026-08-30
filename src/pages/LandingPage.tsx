import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Chart from 'chart.js/auto';

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // FAQ open/close states
  const [faqStates, setFaqStates] = useState<Record<number, boolean>>({});

  const toggleFaq = (index: number) => {
    setFaqStates(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleSelectPlan = (planCode: string) => {
    localStorage.setItem('selectedPlan', planCode);
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/cadastro');
    }
  };

  useEffect(() => {
    // Render chart in mockup
    const ctxHero = document.getElementById('heroMockupChart') as HTMLCanvasElement | null;
    if (!ctxHero) return;

    const chartInstance = new Chart(ctxHero, {
      type: 'line',
      data: {
        labels: ['01/Jun', '05/Jun', '10/Jun', '15/Jun', '20/Jun', '25/Jun', '30/Jun'],
        datasets: [
          {
            label: 'Receitas',
            data: [3200, 4800, 4100, 5900, 6200, 7800, 8450],
            borderColor: '#3b82f6',
            backgroundColor: 'transparent',
            borderWidth: 3,
            tension: 0.35,
            pointBackgroundColor: '#3b82f6',
            pointBorderColor: '#ffffff',
            pointRadius: 4,
            pointHoverRadius: 6
          },
          {
            label: 'Despesas',
            data: [1500, 2200, 1800, 2900, 2600, 3100, 3280],
            borderColor: '#f43f5e',
            backgroundColor: 'transparent',
            borderWidth: 2.5,
            tension: 0.35,
            pointBackgroundColor: '#f43f5e',
            pointBorderColor: '#ffffff',
            pointRadius: 3,
            pointHoverRadius: 5
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            grid: { color: 'rgba(30, 41, 59, 0.4)' },
            ticks: { color: '#64748b', font: { size: 10, weight: '600' } }
          },
          y: {
            grid: { color: 'rgba(30, 41, 59, 0.4)' },
            ticks: {
              color: '#64748b',
              font: { size: 10, weight: '600' },
              callback: function(value) { return 'R$ ' + value; }
            }
          }
        }
      }
    });

    return () => {
      chartInstance.destroy();
    };
  }, []);

  return (
    <div className="relative overflow-x-hidden antialiased bg-[#020617] text-slate-100 min-h-screen">
      {/* GLOW DE FUNDO SUTIL DA IDENTIDADE VISUAL */}
      <div className="fixed top-[-10%] left-[-10%] w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(59,130,246,0.15)_0%,rgba(2,6,23,0)_70%)] pointer-events-none z-0"></div>
      <div className="fixed top-[40%] right-[-15%] w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(6,182,212,0.12)_0%,rgba(2,6,23,0)_70%)] pointer-events-none z-0"></div>
      <div className="fixed bottom-[-10%] left-[20%] w-[900px] h-[900px] bg-[radial-gradient(circle,rgba(59,130,246,0.15)_0%,rgba(2,6,23,0)_70%)] pointer-events-none z-0"></div>

      {/* 01. HEADER */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-900 bg-slate-950/70 backdrop-blur-xl transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* LOGO CONNECT FINANÇAS */}
          <a href="#" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/30 group-hover:scale-105 transition-transform">
              <i className="fas fa-chart-line text-lg"></i>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight text-white flex items-center gap-1">
                Connect <span className="text-blue-500 font-medium">Finanças</span>
              </span>
              <span className="text-[9px] font-extrabold tracking-widest text-slate-400 uppercase">Gestão Empresarial</span>
            </div>
          </a>

          {/* NAVEGAÇÃO DESKTOP */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#inicio" className="text-xs font-semibold text-slate-300 hover:text-white transition-colors">Início</a>
            <a href="#beneficios" className="text-xs font-semibold text-slate-300 hover:text-white transition-colors">Benefícios</a>
            <a href="#recursos" className="text-xs font-semibold text-slate-300 hover:text-white transition-colors">Recursos</a>
            <a href="#planos" className="text-xs font-semibold text-slate-300 hover:text-white transition-colors">Planos</a>
            <a href="#faq" className="text-xs font-semibold text-slate-300 hover:text-white transition-colors">FAQ</a>
          </nav>

          {/* BOTÕES DE AÇÃO */}
          <div className="hidden md:flex items-center gap-4">
            <button 
              onClick={() => navigate('/login')} 
              className="text-xs font-bold text-slate-300 hover:text-white px-4 py-2.5 rounded-full border border-slate-800 hover:border-slate-700 bg-slate-900/60 transition-all cursor-pointer"
            >
              ENTRAR
            </button>
            <button 
              onClick={() => navigate('/cadastro')} 
              className="text-xs font-bold text-white px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-600/20 active:scale-95 transition-all uppercase tracking-wider cursor-pointer"
            >
              CRIAR CONTA
            </button>
          </div>

          {/* BOTÃO MENU MOBILE */}
          <button 
            onClick={() => setMobileMenuOpen(prev => !prev)} 
            className="md:hidden w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white"
          >
            <i className={`fas ${mobileMenuOpen ? 'fa-times' : 'fa-bars'} text-base`}></i>
          </button>

        </div>

        {/* MENU MOBILE OVERLAY */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-800 bg-slate-950/95 backdrop-blur-2xl px-4 pt-4 pb-6 space-y-4">
            <div className="flex flex-col space-y-3">
              <a href="#inicio" onClick={() => setMobileMenuOpen(false)} className="text-sm font-semibold text-slate-300 hover:text-white py-1">Início</a>
              <a href="#beneficios" onClick={() => setMobileMenuOpen(false)} className="text-sm font-semibold text-slate-300 hover:text-white py-1">Benefícios</a>
              <a href="#recursos" onClick={() => setMobileMenuOpen(false)} className="text-sm font-semibold text-slate-300 hover:text-white py-1">Recursos</a>
              <a href="#planos" onClick={() => setMobileMenuOpen(false)} className="text-sm font-semibold text-slate-300 hover:text-white py-1">Planos</a>
              <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="text-sm font-semibold text-slate-300 hover:text-white py-1">FAQ</a>
            </div>
            <div className="pt-4 border-t border-slate-800/80 flex flex-col gap-3">
              <button 
                onClick={() => { setMobileMenuOpen(false); navigate('/login'); }} 
                className="text-center text-xs font-bold text-slate-300 py-3 rounded-full border border-slate-800 bg-slate-900/80 w-full"
              >
                ENTRAR
              </button>
              <button 
                onClick={() => { setMobileMenuOpen(false); navigate('/cadastro'); }} 
                className="text-center text-xs font-bold text-white py-3 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 uppercase tracking-wider w-full"
              >
                CRIAR CONTA
              </button>
            </div>
          </div>
        )}
      </header>

      {/* MAIN WRAPPER */}
      <main className="relative z-10">

        {/* 02. HERO SECTION */}
        <section id="inicio" className="pt-12 md:pt-20 pb-16 md:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          
          {/* TAG PRINCIPAL */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] sm:text-xs font-extrabold uppercase tracking-wider mb-6">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
            GESTÃO FINANCEIRA PARA QUEM QUER CRESCER
          </div>

          {/* HEADLINE PRINCIPAL */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight max-w-4xl mx-auto leading-[1.15]">
            ENTENDA OS NÚMEROS DO SEU NEGÓCIO.<br className="hidden sm:inline" /> 
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">TOME DECISÕES MELHORES.</span>
          </h1>

          {/* SUBHEADLINE */}
          <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto font-normal leading-relaxed">
            Tenha suas finanças organizadas em um só lugar e acompanhe de forma simples o que realmente está acontecendo com o seu negócio.
          </p>

          {/* BOTÕES CTA DA HERO */}
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <a href="#planos" className="w-full sm:w-auto flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold px-8 py-4 rounded-full shadow-xl shadow-blue-600/25 active:scale-95 transition-all text-xs tracking-wider uppercase">
              <span>ASSINAR AGORA</span>
              <i className="fas fa-arrow-right text-xs"></i>
            </a>
            <a href="#demonstracao" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-extrabold px-7 py-4 rounded-full transition-all text-xs tracking-wider uppercase">
              <i className="fas fa-play text-[10px] text-blue-400 mr-1"></i>
              <span>CONHECER A PLATAFORMA</span>
            </a>
          </div>

          {/* GARANTIA SUBTEXTO HERO */}
          <div className="mt-5 flex items-center justify-center gap-2 text-xs font-medium text-slate-400">
            <i className="fas fa-shield-alt text-emerald-400"></i>
            <span>7 dias de garantia • Cancele quando quiser</span>
          </div>

        </section>

        {/* 03. MOCKUP DO CONNECT FINANÇAS (DASHBOARD REAL) */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-20 md:mb-32">
          <div className="relative rounded-[28px] p-2 sm:p-4 bg-slate-900/60 border border-slate-800/80 shadow-2xl backdrop-blur-2xl transition-all duration-300 hover:border-blue-500/30">
            
            {/* BORDAS E BRILHOS DO CONTAINER DE PREVIEW */}
            <div className="absolute -inset-1 rounded-[32px] bg-gradient-to-r from-blue-600/20 via-cyan-500/10 to-indigo-600/20 blur-xl opacity-50 pointer-events-none"></div>

            {/* CONTAINER REPLICANDO O DASHBOARD DE FORMA COMPACTA */}
            <div className="relative bg-[#020617] rounded-[22px] border border-slate-800/90 overflow-hidden text-left shadow-2xl">
              
              {/* FAKE WINDOW HEADER */}
              <div className="h-11 bg-slate-950/90 border-b border-slate-900 px-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80"></span>
                  <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
                  <span className="ml-3 text-[11px] font-mono text-slate-400 flex items-center gap-2">
                    <i className="fas fa-lock text-blue-400 text-[9px]"></i> app.connectfinancas.com.br/dashboard
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 uppercase">Sistema Ativo</span>
                </div>
              </div>

              {/* MOCKUP BODY */}
              <div className="p-4 sm:p-6 lg:p-8 space-y-6">
                
                {/* CONTROLES SUPERIORES MOCKUP */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-900">
                  <div>
                    <h3 className="text-xl font-extrabold text-white tracking-tight">Dashboard Financeiro</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Junho 2026 • Visão geral do desempenho empresarial</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold rounded-xl flex items-center gap-2">
                      <i className="fas fa-calendar-alt text-blue-400"></i> Junho 2026
                    </span>
                  </div>
                </div>

                {/* CARDS KPIS REALISTAS */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-4">
                    <div className="flex items-center justify-between text-slate-400 mb-2">
                      <span className="text-[9px] font-black uppercase tracking-wider">Faturamento</span>
                      <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-xs">
                        <i className="fas fa-wallet"></i>
                      </div>
                    </div>
                    <div className="text-lg sm:text-2xl font-black text-white">R$ 8.450,00</div>
                    <span className="text-[9px] font-bold text-emerald-400 flex items-center gap-1 mt-1">
                      <i className="fas fa-arrow-up"></i> 12,4% <span className="text-slate-500 font-normal">vs mês ant.</span>
                    </span>
                  </div>

                  <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-4">
                    <div className="flex items-center justify-between text-slate-400 mb-2">
                      <span className="text-[9px] font-black uppercase tracking-wider">Despesas</span>
                      <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 text-xs">
                        <i className="fas fa-arrow-down-left"></i>
                      </div>
                    </div>
                    <div className="text-lg sm:text-2xl font-black text-white">R$ 3.280,00</div>
                    <span className="text-[9px] font-bold text-emerald-400 flex items-center gap-1 mt-1">
                      <i className="fas fa-arrow-down"></i> 4,2% <span className="text-slate-500 font-normal">controle ok</span>
                    </span>
                  </div>

                  <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-4">
                    <div className="flex items-center justify-between text-slate-400 mb-2">
                      <span className="text-[9px] font-black uppercase tracking-wider">Lucro Líquido</span>
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs">
                        <i className="fas fa-chart-line"></i>
                      </div>
                    </div>
                    <div className="text-lg sm:text-2xl font-black text-white">R$ 5.170,00</div>
                    <span className="text-[9px] font-bold text-slate-400 mt-1 block">
                      Margem: <span className="text-emerald-400 font-extrabold">61,2%</span>
                    </span>
                  </div>

                  <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-4">
                    <div className="flex items-center justify-between text-slate-400 mb-2">
                      <span className="text-[9px] font-black uppercase tracking-wider">Fundo de Caixa</span>
                      <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-xs">
                        <i className="fas fa-piggy-bank"></i>
                      </div>
                    </div>
                    <div className="text-lg sm:text-2xl font-black text-white">R$ 4.820,00</div>
                    <span className="text-[9px] font-bold text-indigo-400 flex items-center gap-1 mt-1">
                      <i className="fas fa-check-circle"></i> Disponível
                    </span>
                  </div>
                </div>

                {/* GRÁFICO REALISTA DENTRO DO MOCKUP */}
                <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-4 sm:p-6">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span> Fluxo Financeiro Integrado
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-full uppercase">30 Dias</span>
                  </div>
                  <div className="h-[200px] sm:h-[240px] w-full relative">
                    <canvas id="heroMockupChart"></canvas>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </section>

        {/* 04. SEÇÃO DE PROBLEMA */}
        <section id="problema" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-900/80">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-extrabold uppercase tracking-wider mb-4">
              O PROBLEMA
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              VENDER NÃO SIGNIFICA LUCRAR.
            </h2>
            <p className="mt-4 text-slate-400 text-sm sm:text-base">
              Muitos empresários sabem quanto venderam, mas não conseguem responder com segurança quanto realmente lucraram.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-6 transition-all duration-300 hover:border-blue-500/40">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center text-xl mb-5">
                <i className="fas fa-question-circle"></i>
              </div>
              <h3 className="text-base font-extrabold text-white mb-2 uppercase tracking-wide">Para onde está indo o dinheiro?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Entradas e saídas acontecem todos os dias, mas sem organização fica difícil enxergar o resultado real.
              </p>
            </div>

            <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-6 transition-all duration-300 hover:border-blue-500/40">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-xl mb-5">
                <i className="fas fa-search-dollar"></i>
              </div>
              <h3 className="text-base font-extrabold text-white mb-2 uppercase tracking-wide">Quanto realmente sobrou?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Faturamento alto não significa necessariamente lucro alto ao final do mês no seu caixa.
              </p>
            </div>

            <div className="bg-slate-950/40 border border-blue-500/10 rounded-2xl p-6 transition-all duration-300 hover:border-blue-500/40">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-xl mb-5">
                <i className="fas fa-balance-scale-left"></i>
              </div>
              <h3 className="text-base font-extrabold text-white mb-2 uppercase tracking-wide">Posso gastar ou investir?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Sem entender o caixa, decisões importantes acabam sendo tomadas na intuição e no achismo.
              </p>
            </div>

            <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-6 transition-all duration-300 hover:border-blue-500/40">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-xl mb-5">
                <i className="fas fa-chart-bar"></i>
              </div>
              <h3 className="text-base font-extrabold text-white mb-2 uppercase tracking-wide">Meu negócio está crescendo?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Sem histórico e indicadores claros, fica difícil comparar períodos e entender a evolução da empresa.
              </p>
            </div>
          </div>

          <div className="bg-slate-950/40 border border-blue-500/20 rounded-3xl p-8 sm:p-10 text-center max-w-3xl mx-auto relative overflow-hidden">
            <div className="absolute inset-0 bg-blue-600/5 pointer-events-none"></div>
            <p className="text-lg sm:text-xl font-bold text-white tracking-tight relative z-10">
              "Você não precisa de mais números. Precisa entender os números que já possui."
            </p>
          </div>
        </section>

        {/* 05. APRESENTAÇÃO DA SOLUÇÃO */}
        <section id="demonstracao" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-900/80">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-extrabold uppercase tracking-wider mb-4">
              CONHEÇA O CONNECT FINANÇAS
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              SUA GESTÃO FINANCEIRA.<br />
              <span className="text-blue-400">SIMPLES DE ENTENDER.</span>
            </h2>
            <p className="mt-4 text-slate-400 text-sm sm:text-base">
              Centralize as informações financeiras do seu negócio e transforme números em uma visão clara da sua operação.
            </p>
          </div>

          <div className="space-y-16 lg:space-y-24">
            {/* COMPOSIÇÃO 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-extrabold text-sm">
                  01
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Dashboard Intuitivo com Visão Consolidada
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Sem planilhas complexas ou fórmulas difíceis. Visualize instantaneamente seu Faturamento, Despesas Totais, Lucro Líquido Real e Fundo de Caixa disponível em uma única tela.
                </p>
                <ul className="space-y-3 text-xs text-slate-300 font-medium">
                  <li className="flex items-center gap-3">
                    <i className="fas fa-check-circle text-emerald-400 text-sm"></i>
                    <span>Gráficos automáticos de fluxo de caixa (Receitas vs Despesas)</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <i className="fas fa-check-circle text-emerald-400 text-sm"></i>
                    <span>Indicadores de margem de lucro percentual calculados na hora</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <i className="fas fa-check-circle text-emerald-400 text-sm"></i>
                    <span>Filtro por períodos flexíveis (7 dias, 30 dias, mensal)</span>
                  </li>
                </ul>
              </div>

              <div className="bg-slate-950/40 rounded-3xl p-5 border border-slate-800 shadow-2xl relative">
                <div className="flex items-center justify-between pb-3 border-b border-slate-900 mb-4">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <i className="fas fa-chart-line text-blue-400"></i> Resumo Diário de Caixa
                  </span>
                  <span className="text-[9px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-extrabold uppercase">Atualizado</span>
                </div>
                
                <div className="grid grid-cols-3 gap-3 mb-4 text-center">
                  <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-900">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Entradas</span>
                    <span className="text-sm font-black text-emerald-400 block mt-1">R$ 1.250,00</span>
                  </div>
                  <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-900">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Saídas</span>
                    <span className="text-sm font-black text-rose-400 block mt-1">R$ 420,00</span>
                  </div>
                  <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-900">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Resultado</span>
                    <span className="text-sm font-black text-emerald-400 block mt-1">+ R$ 830,00</span>
                  </div>
                </div>

                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                    <i className="fas fa-exclamation-triangle"></i>
                    <span>2 contas vencem hoje • R$ 350,00</span>
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase">Alertas</span>
                </div>
              </div>
            </div>

            {/* COMPOSIÇÃO 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1 bg-slate-950/40 rounded-3xl p-5 border border-slate-800 shadow-2xl">
                <div className="flex items-center justify-between pb-3 border-b border-slate-900 mb-4">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <i className="fas fa-file-invoice-dollar text-indigo-400"></i> Despesas Fixas CNPJ & Boletos
                  </span>
                  <span className="text-[9px] text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 rounded-full font-extrabold uppercase">Automatizado</span>
                </div>

                <div className="space-y-3">
                  <div className="p-3 rounded-2xl bg-[#020617] border border-slate-900 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-xs text-white">BR</div>
                      <div>
                        <p className="text-xs font-bold text-white uppercase">Brisanet Internet</p>
                        <p className="text-[9px] text-slate-500 font-bold uppercase">Boleto • Vence em 2 dias</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-extrabold text-white">R$ 92,39</p>
                      <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Processado</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#020617] border border-slate-900 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-xs text-white">EN</div>
                      <div>
                        <p className="text-xs font-bold text-white uppercase">Enel Energia</p>
                        <p className="text-[9px] text-slate-500 font-bold uppercase">Energia Elétrica</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-extrabold text-white">R$ 412,80</p>
                      <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">Pendente</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#020617] border border-slate-900 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-xs text-white">HU</div>
                      <div>
                        <p className="text-xs font-bold text-white uppercase">Hudson Contabilidade</p>
                        <p className="text-[9px] text-slate-500 font-bold uppercase">Honorários CNPJ</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-extrabold text-white">R$ 500,00</p>
                      <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase bg-rose-500/10 text-rose-400 border border-rose-500/20">Atrasado</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="order-1 lg:order-2 space-y-6">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-extrabold text-sm">
                  02
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Controle Rigoroso de Obrigações & Boletos
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Mantenha o controle de cada compromisso financeiro. Nunca mais esqueça de pagar uma conta ou perca o prazo de despesas recorrentes da sua empresa.
                </p>
                <ul className="space-y-3 text-xs text-slate-300 font-medium">
                  <li className="flex items-center gap-3">
                    <i className="fas fa-check-circle text-emerald-400 text-sm"></i>
                    <span>Módulo dedicado para Despesas Fixas CNPJ</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <i className="fas fa-check-circle text-emerald-400 text-sm"></i>
                    <span>Gestão completa de Boletos pendentes, processados e em atraso</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <i className="fas fa-check-circle text-emerald-400 text-sm"></i>
                    <span>Visibilidade do impacto futuro no caixa projetado</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 06. BENEFÍCIOS */}
        <section id="beneficios" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-900/80">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-extrabold uppercase tracking-wider mb-4">
              POR QUE CONNECT FINANÇAS?
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              MAIS CLAREZA PARA QUEM QUER CRESCER
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-slate-950/40 rounded-3xl p-8 border border-slate-800/80 transition-all duration-300 hover:border-blue-500/40 hover:-translate-y-1">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-xl mb-6">
                <i className="fas fa-eye"></i>
              </div>
              <h3 className="text-lg font-extrabold text-white mb-3">Visão do Negócio</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tenha os principais números da sua empresa organizados em um só lugar, acessíveis de forma rápida e descomplicada.
              </p>
            </div>

            <div className="bg-slate-950/40 rounded-3xl p-8 border border-slate-800/80 transition-all duration-300 hover:border-blue-500/40 hover:-translate-y-1">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl mb-6">
                <i className="fas fa-sliders-h"></i>
              </div>
              <h3 className="text-lg font-extrabold text-white mb-3">Controle Financeiro</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Acompanhe entradas, saídas e resultados de maneira simples, sem perder tempo com classificações confusas.
              </p>
            </div>

            <div className="bg-slate-950/40 rounded-3xl p-8 border border-slate-800/80 transition-all duration-300 hover:border-blue-500/40 hover:-translate-y-1">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-xl mb-6">
                <i className="fas fa-brain"></i>
              </div>
              <h3 className="text-lg font-extrabold text-white mb-3">Decisões Melhores</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Utilize seus próprios números para tomar decisões estratégicas com mais segurança e previsibilidade.
              </p>
            </div>

            <div className="bg-slate-950/40 rounded-3xl p-8 border border-slate-800/80 transition-all duration-300 hover:border-blue-500/40 hover:-translate-y-1">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center text-xl mb-6">
                <i className="fas fa-file-excel"></i>
              </div>
              <h3 className="text-lg font-extrabold text-white mb-3">Menos Planilhas</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Reduza a dependência de controles espalhados, anotações perdidas e planilhas lentas que quebram a todo momento.
              </p>
            </div>

            <div className="bg-slate-950/40 rounded-3xl p-8 border border-slate-800/80 transition-all duration-300 hover:border-blue-500/40 hover:-translate-y-1">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center text-xl mb-6">
                <i className="fas fa-chart-line"></i>
              </div>
              <h3 className="text-lg font-extrabold text-white mb-3">Acompanhamento</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Entenda como os números do seu negócio evoluem ao longo do tempo através de comparativos reais.
              </p>
            </div>

            <div className="bg-slate-950/40 rounded-3xl p-8 border border-slate-800/80 transition-all duration-300 hover:border-blue-500/40 hover:-translate-y-1">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-xl mb-6">
                <i className="fas fa-clock"></i>
              </div>
              <h3 className="text-lg font-extrabold text-white mb-3">Mais Tempo</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Simplifique sua gestão diária para dedicar mais energia ao crescimento da operação e ao atendimento dos seus clientes.
              </p>
            </div>
          </div>
        </section>

        {/* 07. FUNCIONALIDADES REAIS */}
        <section id="recursos" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-900/80">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-extrabold uppercase tracking-wider mb-4">
              RECURSOS DO SISTEMA
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              TUDO QUE VOCÊ PRECISA PARA ENTENDER MELHOR SEU NEGÓCIO
            </h2>
            <p className="mt-4 text-slate-400 text-sm">
              Ferramentas projetadas especificamente para a rotina do empresário moderno.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-slate-950/40 rounded-3xl p-6 border border-slate-800/80 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center text-base mb-4">
                  <i className="fas fa-tachometer-alt"></i>
                </div>
                <h3 className="text-base font-extrabold text-white mb-2">Dashboard & Fluxo Financeiro</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Painel central com métricas em tempo real de faturamento, despesas operacionais e cálculo imediato de lucro líquido.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-900 text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                Módulo Principal
              </div>
            </div>

            <div className="bg-slate-950/40 rounded-3xl p-6 border border-slate-800/80 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center text-base mb-4">
                  <i className="fas fa-building"></i>
                </div>
                <h3 className="text-base font-extrabold text-white mb-2">Despesas Fixas CNPJ</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Organização e separação rigorosa de todas as despesas recorrentes da empresa para nunca misturar contas pessoais com o negócio.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-900 text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                Gestão Fiscal & Operacional
              </div>
            </div>

            <div className="bg-slate-950/40 rounded-3xl p-6 border border-slate-800/80 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center text-base mb-4">
                  <i className="fas fa-barcode"></i>
                </div>
                <h3 className="text-base font-extrabold text-white mb-2">Boletos & Vencimentos</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Controle total de boletos emitidos e recebidos com alertas visuais de contas a vencer hoje, amanhã ou pendentes.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-900 text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                Controle de Datas
              </div>
            </div>

            <div className="bg-slate-950/40 rounded-3xl p-6 border border-slate-800/80 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center text-base mb-4">
                  <i className="fas fa-shopping-cart"></i>
                </div>
                <h3 className="text-base font-extrabold text-white mb-2">Controle de Compras</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Registro estruturado de aquisição de insumos, mercadorias e investimentos para manter o teto de gastos no limite correto.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-900 text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                Gestão de Suprimentos
              </div>
            </div>

            <div className="bg-slate-950/40 rounded-3xl p-6 border border-slate-800/80 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center text-base mb-4">
                  <i className="fas fa-tags"></i>
                </div>
                <h3 className="text-base font-extrabold text-white mb-2">Cotação de Produtos</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Ferramenta estratégica para registrar e comparar orçamentos entre fornecedores antes de autorizar a compra.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-900 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                Economia Estratégica
              </div>
            </div>

            <div className="bg-slate-950/40 rounded-3xl p-6 border border-slate-800/80 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-rose-600/20 text-rose-400 flex items-center justify-center text-base mb-4">
                  <i className="fas fa-piggy-bank"></i>
                </div>
                <h3 className="text-base font-extrabold text-white mb-2">Separações & Fundo de Caixa</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Gestão de reservas financeiras para emergências, capital de giro e distribuição planejada de pro-labore.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-900 text-[10px] font-bold text-rose-400 uppercase tracking-wider">
                Security de Capital
              </div>
            </div>
          </div>
        </section>

        {/* 08. ANTES X DEPOIS */}
        <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-900/80">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              MUDE A FORMA COMO VOCÊ ENXERGA SEU NEGÓCIO
            </h2>
            <p className="mt-3 text-slate-400 text-sm">
              A diferença entre gerenciar no escuro e liderar com clareza.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="bg-slate-950/40 rounded-[32px] p-8 sm:p-10 border border-rose-500/20 relative">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-500/10 text-rose-400 text-xs font-black uppercase tracking-wider mb-6">
                <i className="fas fa-times-circle"></i> SEM O CONNECT FINANÇAS
              </div>
              <ul className="space-y-4 text-xs sm:text-sm text-slate-300">
                <li className="flex items-start gap-3">
                  <i className="fas fa-times text-rose-400 mt-1"></i>
                  <span>Números espalhados em caderno, WhatsApp e planilhas</span>
                </li>
                <li className="flex items-start gap-3">
                  <i className="fas fa-times text-rose-400 mt-1"></i>
                  <span>Controles manuais que demandam horas e geram erros</span>
                </li>
                <li className="flex items-start gap-3">
                  <i className="fas fa-times text-rose-400 mt-1"></i>
                  <span>Decisões tomadas com base em intuição e "achismo"</span>
                </li>
                <li className="flex items-start gap-3">
                  <i className="fas fa-times text-rose-400 mt-1"></i>
                  <span>Falta de histórico consolidado para comparar períodos</span>
                </li>
              </ul>
            </div>

            <div className="bg-slate-950/40 rounded-[32px] p-8 sm:p-10 border border-emerald-500/20 relative">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-black uppercase tracking-wider mb-6">
                <i className="fas fa-check-circle"></i> COM O CONNECT FINANÇAS
              </div>
              <ul className="space-y-4 text-xs sm:text-sm text-slate-300">
                <li className="flex items-start gap-3">
                  <i className="fas fa-check text-emerald-400 mt-1"></i>
                  <span>Tudo centralizado em um dashboard visual intuitivo</span>
                </li>
                <li className="flex items-start gap-3">
                  <i className="fas fa-check text-emerald-400 mt-1"></i>
                  <span>Cálculo automático de receitas, despesas e lucro</span>
                </li>
                <li className="flex items-start gap-3">
                  <i className="fas fa-check text-emerald-400 mt-1"></i>
                  <span>Segurança nas decisões utilizando dados precisos e reais</span>
                </li>
                <li className="flex items-start gap-3">
                  <i className="fas fa-check text-emerald-400 mt-1"></i>
                  <span>Gráficos e comparativos simples de entender a qualquer momento</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* 09. TABELA DE PREÇOS / PLANOS */}
        <section id="planos" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-900/80">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-extrabold uppercase tracking-wider mb-4">
              NOSSAS OFERTAS
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              ESCOLHA O PLANO IDEAL PARA O MOMENTO DA SUA EMPRESA
            </h2>
            <p className="mt-3 text-slate-400 text-sm">
              Sem taxas ocultas ou multas de cancelamento. Cancele ou altere seu plano quando desejar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch max-w-6xl mx-auto">
            {/* PLANO MENSAL */}
            <div className="bg-slate-950/40 rounded-[28px] p-6 border border-slate-800 flex flex-col justify-between hover:border-slate-700/60 transition-all">
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Mensal</span>
                <h3 className="text-lg font-bold text-white mb-4">Plano Mensal</h3>
                <div className="mb-6">
                  <span className="text-3xl font-black text-white">R$ 129,90</span>
                  <span className="text-xs text-slate-500 font-medium"> / mês</span>
                </div>
                <ul className="space-y-3.5 text-xs text-slate-300 font-medium mb-8">
                  <li className="flex items-center gap-2.5">
                    <i className="fas fa-check text-blue-400 text-[10px]"></i>
                    <span>Dashboard completo</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <i className="fas fa-check text-blue-400 text-[10px]"></i>
                    <span>Despesas Fixas CNPJ</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <i className="fas fa-check text-blue-400 text-[10px]"></i>
                    <span>Controle de Boletos</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <i className="fas fa-check text-blue-400 text-[10px]"></i>
                    <span>Suporte via e-mail</span>
                  </li>
                </ul>
              </div>
              <button 
                onClick={() => handleSelectPlan('monthly')}
                className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-extrabold py-3.5 px-4 rounded-full transition-all text-xs tracking-wider uppercase cursor-pointer"
              >
                ASSINAR AGORA
              </button>
            </div>

            {/* PLANO TRIMESTRAL */}
            <div className="bg-slate-950/40 rounded-[28px] p-6 border border-slate-800 flex flex-col justify-between hover:border-slate-700/60 transition-all">
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Trimestral</span>
                <h3 className="text-lg font-bold text-white mb-4">Plano Trimestral</h3>
                <div className="mb-6">
                  <span className="text-3xl font-black text-white">R$ 247,00</span>
                  <span className="text-xs text-slate-500 font-medium"> / trimestre</span>
                </div>
                <ul className="space-y-3.5 text-xs text-slate-300 font-medium mb-8">
                  <li className="flex items-center gap-2.5">
                    <i className="fas fa-check text-blue-400 text-[10px]"></i>
                    <span>Todos os recursos liberados</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <i className="fas fa-check text-blue-400 text-[10px]"></i>
                    <span>Controle de Compras</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <i className="fas fa-check text-blue-400 text-[10px]"></i>
                    <span>Cotação de Produtos</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <i className="fas fa-check text-blue-400 text-[10px]"></i>
                    <span>Suporte prioritário</span>
                  </li>
                </ul>
              </div>
              <button 
                onClick={() => handleSelectPlan('quarterly')}
                className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-extrabold py-3.5 px-4 rounded-full transition-all text-xs tracking-wider uppercase cursor-pointer"
              >
                ASSINAR AGORA
              </button>
            </div>

            {/* PLANO ANUAL */}
            <div className="bg-slate-950/40 rounded-[28px] p-6 border border-blue-500/50 flex flex-col justify-between relative hover:border-blue-500 transition-all shadow-xl shadow-blue-500/5">
              <div className="absolute top-0 right-6 transform -translate-y-1/2 bg-blue-600 text-white text-[9px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full">
                MAIS POPULAR • SALVE 50%
              </div>
              <div>
                <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest block mb-2">Anual</span>
                <h3 className="text-lg font-bold text-white mb-4">Plano Anual</h3>
                <div className="mb-6">
                  <span className="text-3xl font-black text-white">R$ 797,00</span>
                  <span className="text-xs text-slate-500 font-medium"> / ano</span>
                </div>
                <ul className="space-y-3.5 text-xs text-slate-300 font-medium mb-8">
                  <li className="flex items-center gap-2.5">
                    <i className="fas fa-check text-blue-400 text-[10px]"></i>
                    <span>Acesso anual garantido</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <i className="fas fa-check text-blue-400 text-[10px]"></i>
                    <span>Todos os módulos e extras</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <i className="fas fa-check text-blue-400 text-[10px]"></i>
                    <span>Suporte via e-mail e Whats</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <i className="fas fa-check text-blue-400 text-[10px]"></i>
                    <span>Atualizações inclusas</span>
                  </li>
                </ul>
              </div>
              <button 
                onClick={() => handleSelectPlan('yearly')}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold py-3.5 px-4 rounded-full transition-all text-xs tracking-wider uppercase shadow-lg shadow-blue-600/20 cursor-pointer"
              >
                ASSINAR AGORA
              </button>
            </div>

            {/* PLANO VITALÍCIO */}
            <div className="bg-slate-950/40 rounded-[28px] p-6 border border-slate-800 flex flex-col justify-between hover:border-slate-700/60 transition-all">
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Acesso Único</span>
                <h3 className="text-lg font-bold text-white mb-4">Plano Vitalício</h3>
                <div className="mb-6">
                  <span className="text-3xl font-black text-white">R$ 4.997,00</span>
                  <span className="text-xs text-slate-500 font-medium"> / único</span>
                </div>
                <ul className="space-y-3.5 text-xs text-slate-300 font-medium mb-8">
                  <li className="flex items-center gap-2.5">
                    <i className="fas fa-check text-blue-400 text-[10px]"></i>
                    <span>Acesso vitalício ilimitado</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <i className="fas fa-check text-blue-400 text-[10px]"></i>
                    <span>Nenhuma mensalidade futura</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <i className="fas fa-check text-blue-400 text-[10px]"></i>
                    <span>Suporte VIP dedicado</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <i className="fas fa-check text-blue-400 text-[10px]"></i>
                    <span>Bônus exclusivos</span>
                  </li>
                </ul>
              </div>
              <button 
                onClick={() => handleSelectPlan('lifetime')}
                className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-extrabold py-3.5 px-4 rounded-full transition-all text-xs tracking-wider uppercase cursor-pointer"
              >
                ASSINAR AGORA
              </button>
            </div>
          </div>
        </section>

        {/* 10. SEÇÃO DE GARANTIA */}
        <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-900/80">
          <div className="bg-slate-950/40 rounded-[32px] p-8 sm:p-12 border border-slate-800 max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-blue-600/5 pointer-events-none"></div>
            <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-3xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-4xl sm:text-5xl flex-shrink-0">
              <i className="fas fa-shield-alt"></i>
            </div>
            <div className="space-y-4 text-center md:text-left relative z-10">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">RISCO ZERO COM NOSSA GARANTIA DE 7 DIAS</h2>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                Você pode experimentar o Connect Finanças por 7 dias inteiros. Se por qualquer motivo não se adaptar ou achar que a ferramenta não é para você, basta enviar um e-mail solicitando o reembolso. Devolveremos 100% do seu dinheiro, sem burocracias ou perguntas.
              </p>
            </div>
          </div>
        </section>

        {/* 11. FAQ SECTION */}
        <section id="faq" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-900/80 mb-12">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-extrabold uppercase tracking-wider mb-4">
              DÚVIDAS FREQUENTES
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              PERGUNTAS FREQUENTES
            </h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {[
              {
                q: "Como funciona a garantia de 7 dias?",
                a: "A garantia é incondicional. Após a assinatura, você tem 7 dias para testar a ferramenta. Se quiser cancelar, basta solicitar por e-mail e reembolsaremos o valor integral."
              },
              {
                q: "Meus dados financeiros estão seguros?",
                a: "Sim. A segurança dos seus dados é nossa prioridade. Utilizamos criptografia de nível militar e infraestrutura segura do Supabase para armazenar suas informações com total privacidade."
              },
              {
                q: "Posso utilizar no celular?",
                a: "Sim, o Connect Finanças foi desenvolvido de forma 100% responsiva para que você possa acompanhar o seu fluxo de caixa e registrar despesas de onde estiver pelo smartphone."
              },
              {
                q: "Qual a diferença dos planos?",
                a: "O plano Mensal é ideal para quem quer testar mês a mês. O Trimestral e o Anual oferecem descontos progressivos (o Anual economiza 50%). O Vitalício dá acesso eterno sem mensalidades futuras."
              }
            ].map((faq, index) => {
              const isOpen = !!faqStates[index];
              return (
                <div key={index} className="bg-slate-950/40 border border-slate-800 rounded-2xl overflow-hidden transition-all">
                  <button 
                    onClick={() => toggleFaq(index)}
                    className="w-full flex items-center justify-between p-5 text-left font-bold text-white text-xs sm:text-sm hover:bg-slate-900/40 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <i className={`fas ${isOpen ? 'fa-chevron-up' : 'fa-chevron-down'} text-blue-400 text-xs`}></i>
                  </button>
                  {isOpen && (
                    <div className="p-5 pt-0 text-slate-400 text-xs sm:text-sm leading-relaxed border-t border-slate-900 bg-slate-950/20">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

      </main>

      {/* 12. FOOTER */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-12 px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white">
              <i className="fas fa-chart-line text-sm"></i>
            </div>
            <span className="text-sm font-black tracking-tight text-white">
              Connect <span className="text-blue-500 font-medium">Finanças</span>
            </span>
          </div>
          <p className="text-slate-500 text-[11px] font-medium uppercase tracking-wider">
            &copy; 2026 Connect Finanças • Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
