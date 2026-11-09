import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getCaktoCheckoutUrl } from '@/config/cakto';
import Chart from 'chart.js/auto';
import { AuthCallback } from '@/components/auth/AuthCallback';
import { motion, AnimatePresence } from 'framer-motion';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthCallback, setIsAuthCallback] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && (hash.includes('error=') || hash.includes('access_token='))) {
      setIsAuthCallback(true);
    }
  }, []);

  // FAQ open/close states
  const [faqStates, setFaqStates] = useState<Record<number, boolean>>({});

  const toggleFaq = (index: number) => {
    setFaqStates(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleSelectPlan = (planCode: string) => {
    const checkoutUrl = getCaktoCheckoutUrl(planCode, {
      email: user?.email,
      name: user?.name,
      phone: user?.phone,
    });
    window.location.href = checkoutUrl;
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

  if (isAuthCallback) {
    return <AuthCallback />;
  }

  return (
    <div className="relative overflow-x-hidden antialiased bg-[#05060a] text-slate-100 min-h-screen selection:bg-pink-500/30 selection:text-white">
      {/* AMBIENT GLOW EFFECTS COM ILUMINAÇÃO LATERAL ROSA NEON E GRAFITE */}
      <div className="fixed top-[-10%] left-[-10%] w-[700px] h-[700px] bg-[radial-gradient(circle,rgba(37,99,235,0.14)_0%,rgba(5,6,10,0)_70%)] pointer-events-none z-0 blur-2xl" />
      <div className="fixed top-[25%] -left-[15%] w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(244,63,142,0.18)_0%,rgba(5,6,10,0)_70%)] pointer-events-none z-0 blur-3xl animate-pulse" />
      <div className="fixed top-[45%] -right-[15%] w-[700px] h-[700px] bg-[radial-gradient(circle,rgba(244,63,142,0.13)_0%,rgba(5,6,10,0)_70%)] pointer-events-none z-0 blur-3xl" />
      <div className="fixed bottom-[-10%] left-[25%] w-[900px] h-[900px] bg-[radial-gradient(circle,rgba(15,23,42,0.9)_0%,rgba(5,6,10,0)_70%)] pointer-events-none z-0 blur-3xl" />

      {/* 01. HEADER VIDRO FUMÊ */}
      <header className="sticky top-0 z-50 w-full fume-glass-navbar transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* LOGO CONNECT FINANÇAS */}
          <a href="#" className="flex items-center gap-3 group">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 border border-white/10"
            >
              <i className="fas fa-chart-line text-lg"></i>
            </motion.div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight text-white flex items-center gap-1">
                Connect <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 font-semibold">Finanças</span>
              </span>
              <span className="text-[9px] font-extrabold tracking-widest text-slate-400 uppercase">Gestão Empresarial</span>
            </div>
          </a>

          {/* NAVEGAÇÃO DESKTOP */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#inicio" className="text-xs font-semibold text-slate-300 hover:text-white transition-colors relative py-1 hover:after:w-full after:w-0 after:h-0.5 after:bg-blue-500 after:absolute after:bottom-0 after:left-0 after:transition-all">Início</a>
            <a href="#beneficios" className="text-xs font-semibold text-slate-300 hover:text-white transition-colors relative py-1 hover:after:w-full after:w-0 after:h-0.5 after:bg-blue-500 after:absolute after:bottom-0 after:left-0 after:transition-all">Benefícios</a>
            <a href="#recursos" className="text-xs font-semibold text-slate-300 hover:text-white transition-colors relative py-1 hover:after:w-full after:w-0 after:h-0.5 after:bg-blue-500 after:absolute after:bottom-0 after:left-0 after:transition-all">Recursos</a>
            <a href="#planos" className="text-xs font-semibold text-slate-300 hover:text-white transition-colors relative py-1 hover:after:w-full after:w-0 after:h-0.5 after:bg-blue-500 after:absolute after:bottom-0 after:left-0 after:transition-all">Planos</a>
            <a href="#faq" className="text-xs font-semibold text-slate-300 hover:text-white transition-colors relative py-1 hover:after:w-full after:w-0 after:h-0.5 after:bg-blue-500 after:absolute after:bottom-0 after:left-0 after:transition-all">FAQ</a>
          </nav>

          {/* BOTÕES DE AÇÃO */}
          <div className="hidden md:flex items-center gap-4">
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/login')} 
              className="text-xs font-bold text-slate-300 hover:text-white px-5 py-2.5 rounded-full border border-white/10 hover:border-white/20 bg-slate-900/40 backdrop-blur-md transition-all cursor-pointer hover:shadow-lg hover:shadow-slate-900/50"
            >
              ENTRAR
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate('/cadastro')} 
              className="text-xs font-bold text-white px-6 py-2.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-400 shadow-xl shadow-blue-600/30 transition-all uppercase tracking-wider cursor-pointer border border-white/10"
            >
              CRIAR CONTA
            </motion.button>
          </div>

          {/* BOTÃO MENU MOBILE */}
          <button 
            onClick={() => setMobileMenuOpen(prev => !prev)} 
            className="md:hidden w-10 h-10 rounded-xl bg-slate-900/80 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
          >
            <i className={`fas ${mobileMenuOpen ? 'fa-times' : 'fa-bars'} text-base`}></i>
          </button>

        </div>

        {/* MENU MOBILE OVERLAY */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="md:hidden border-b border-white/10 bg-slate-950/95 backdrop-blur-2xl px-4 pt-4 pb-6 space-y-4 overflow-hidden"
            >
              <div className="flex flex-col space-y-3">
                <a href="#inicio" onClick={() => setMobileMenuOpen(false)} className="text-sm font-semibold text-slate-300 hover:text-white py-1.5">Início</a>
                <a href="#beneficios" onClick={() => setMobileMenuOpen(false)} className="text-sm font-semibold text-slate-300 hover:text-white py-1.5">Benefícios</a>
                <a href="#recursos" onClick={() => setMobileMenuOpen(false)} className="text-sm font-semibold text-slate-300 hover:text-white py-1.5">Recursos</a>
                <a href="#planos" onClick={() => setMobileMenuOpen(false)} className="text-sm font-semibold text-slate-300 hover:text-white py-1.5">Planos</a>
                <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="text-sm font-semibold text-slate-300 hover:text-white py-1.5">FAQ</a>
              </div>
              <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
                <button 
                  onClick={() => { setMobileMenuOpen(false); navigate('/login'); }} 
                  className="text-center text-xs font-bold text-slate-300 py-3 rounded-full border border-white/10 bg-slate-900/80 w-full"
                >
                  ENTRAR
                </button>
                <button 
                  onClick={() => { setMobileMenuOpen(false); navigate('/cadastro'); }} 
                  className="text-center text-xs font-bold text-white py-3 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 uppercase tracking-wider w-full shadow-lg shadow-blue-600/30"
                >
                  CRIAR CONTA
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* MAIN WRAPPER */}
      <main className="relative z-10">

        {/* 02. HERO SECTION */}
        <section id="inicio" className="pt-16 md:pt-24 pb-16 md:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          
          {/* TAG PRINCIPAL */}
          <motion.div 
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 text-[11px] sm:text-xs font-extrabold uppercase tracking-wider mb-6 backdrop-blur-md shadow-lg shadow-blue-500/10"
          >
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
            GESTÃO FINANCEIRA INTELIGENTE PARA QUEM QUER CRESCER
          </motion.div>

          {/* HEADLINE PRINCIPAL */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-5xl lg:text-7xl font-black text-white tracking-tight max-w-5xl mx-auto leading-[1.12]"
          >
            ENTENDA OS NÚMEROS DO SEU NEGÓCIO.<br className="hidden sm:inline" /> 
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-300 bg-clip-text text-transparent">TOME DECISÕES COM SEGURANÇA.</span>
          </motion.h1>

          {/* SUBHEADLINE */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-base sm:text-lg text-slate-300/80 max-w-2xl mx-auto font-normal leading-relaxed"
          >
            Centralize entradas, saídas, despesas fixas e fundo de caixa em um único painel. Sem planilhas quebradas, com visão clara de lucros e resultados em tempo real.
          </motion.p>

          {/* BOTÕES CTA DA HERO */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto"
          >
            <motion.a 
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              href="#planos" 
              className="w-full sm:w-auto flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold px-8 py-4 rounded-full shadow-2xl shadow-blue-600/35 transition-all text-xs tracking-wider uppercase border border-white/15"
            >
              <span>ASSINAR AGORA</span>
              <i className="fas fa-arrow-right text-xs"></i>
            </motion.a>
            <motion.a 
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              href="#demonstracao" 
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 bg-slate-900/60 hover:bg-slate-800/80 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white font-bold px-7 py-4 rounded-full backdrop-blur-md transition-all text-xs tracking-wider uppercase"
            >
              <i className="fas fa-play text-[10px] text-blue-400"></i>
              <span>CONHECER A PLATAFORMA</span>
            </motion.a>
          </motion.div>

          {/* GARANTIA SUBTEXTO HERO */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.45 }}
            className="mt-5 flex items-center justify-center gap-2 text-xs font-medium text-slate-400"
          >
            <i className="fas fa-shield-alt text-emerald-400"></i>
            <span>7 dias de garantia incondicional • Cancele quando desejar</span>
          </motion.div>

        </section>

        {/* 03. MOCKUP DO CONNECT FINANÇAS COM VIDRO FUMÊ TRIDIMENSIONAL E MOTION */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-20 md:mb-32 relative fume-perspective-container">
          
          {/* FLOATING BADGES AROUND MOCKUP (VIDRO FUMÊ + ROSA NEON + REFLEXO PRATEADO) */}
          <motion.div 
            animate={{ y: [-8, 8, -8], rotateZ: [-0.5, 0.5, -0.5] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            className="hidden lg:flex items-center gap-3 absolute -top-8 left-8 z-30 fume-glass-pill px-4 py-2.5 rounded-2xl shadow-2xl border border-white/20 specular-drift-effect"
          >
            <div className="w-8 h-8 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center font-bold text-xs shadow-sm shadow-pink-500/30">
              <i className="fas fa-arrow-trend-up"></i>
            </div>
            <div className="text-left">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Crescimento Mensal</p>
              <p className="text-xs font-black text-white">+12,4% de Margem</p>
            </div>
          </motion.div>

          <motion.div 
            animate={{ y: [8, -8, 8], rotateZ: [0.5, -0.5, 0.5] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
            className="hidden lg:flex items-center gap-3 absolute -bottom-10 right-8 z-30 fume-glass-pill px-4 py-2.5 rounded-2xl shadow-2xl border border-white/20 specular-drift-effect"
          >
            <div className="w-8 h-8 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center font-bold text-xs shadow-sm shadow-pink-500/30">
              <i className="fas fa-shield-halved"></i>
            </div>
            <div className="text-left">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Fundo de Reserva</p>
              <p className="text-xs font-black text-white">R$ 4.820,00 Protegidos</p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 35, rotateX: 3 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative rounded-[32px] p-2.5 sm:p-5 fume-glass-card-premium shadow-2xl transition-all duration-500 hover:border-white/30 group"
          >
            {/* ILUMINAÇÃO LATERAL ROSA NEON NO MOCKUP */}
            <div className="absolute top-0 -left-12 w-48 h-full bg-pink-500/20 blur-3xl pointer-events-none rounded-full" />
            <div className="absolute -inset-1 rounded-[34px] bg-gradient-to-r from-pink-600/15 via-blue-500/10 to-indigo-600/15 blur-2xl opacity-70 pointer-events-none" />

            {/* CONTAINER REPLICANDO O DASHBOARD EM VIDRO FUMÊ PROFUNDO */}
            <div className="relative bg-[#090b10]/95 rounded-[24px] border border-white/10 overflow-hidden text-left shadow-2xl specular-drift-effect">
              
              {/* FAKE WINDOW HEADER */}
              <div className="h-11 bg-slate-950/90 border-b border-white/10 px-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80 shadow-sm shadow-rose-500/50"></span>
                  <span className="w-3 h-3 rounded-full bg-amber-500/80 shadow-sm shadow-amber-500/50"></span>
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80 shadow-sm shadow-emerald-500/50"></span>
                  <span className="ml-3 text-[11px] font-mono text-slate-400 flex items-center gap-2">
                    <i className="fas fa-lock text-pink-400 text-[9px]"></i> app.connectfinancas.com.br/dashboard
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 uppercase tracking-wider">Sistema Ativo</span>
                </div>
              </div>

              {/* MOCKUP BODY */}
              <div className="p-4 sm:p-6 lg:p-8 space-y-6">
                
                {/* CONTROLES SUPERIORES MOCKUP */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-white/5">
                  <div>
                    <h3 className="text-xl font-extrabold text-white tracking-tight">Dashboard Financeiro</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Junho 2026 • Visão geral do desempenho empresarial</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-slate-900/80 border border-white/10 text-slate-300 text-xs font-bold rounded-xl flex items-center gap-2 backdrop-blur-md">
                      <i className="fas fa-calendar-alt text-blue-400"></i> Junho 2026
                    </span>
                  </div>
                </div>

                {/* CARDS KPIS REALISTAS COM GLASS */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div className="glass-card-interactive rounded-2xl p-4">
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

                  <div className="glass-card-interactive rounded-2xl p-4">
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

                  <div className="glass-card-interactive rounded-2xl p-4">
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

                  <div className="glass-card-interactive rounded-2xl p-4">
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
                <div className="glass-panel rounded-2xl p-4 sm:p-6">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span> Fluxo Financeiro Integrado
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-900 border border-white/10 px-2.5 py-1 rounded-full uppercase">30 Dias</span>
                  </div>
                  <div className="h-[200px] sm:h-[240px] w-full relative">
                    <canvas id="heroMockupChart"></canvas>
                  </div>
                </div>

              </div>

            </div>
          </motion.div>
        </section>

        {/* 04. SEÇÃO DE PROBLEMA */}
        <section id="problema" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/5">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs font-extrabold uppercase tracking-wider mb-4"
            >
              O PROBLEMA
            </motion.div>
            <motion.h2 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl sm:text-4xl font-black text-white tracking-tight"
            >
              VENDER NÃO SIGNIFICA LUCRAR.
            </motion.h2>
            <p className="mt-4 text-slate-400 text-sm sm:text-base">
              Muitos empresários sabem quanto faturaram, mas não conseguem responder com precisão quanto realmente sobrou limpo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {[
              {
                icon: "fas fa-question-circle",
                color: "rose",
                title: "Para onde foi o dinheiro?",
                desc: "Entradas e saídas acontecem todos os dias, mas sem categorização fica impossível entender os vazamentos."
              },
              {
                icon: "fas fa-search-dollar",
                color: "amber",
                title: "Quanto realmente sobrou?",
                desc: "Faturamento alto não significa caixa saudável no fim do mês se o CMV e as despesas estiverem descontrolados."
              },
              {
                icon: "fas fa-balance-scale-left",
                color: "blue",
                title: "Posso gastar ou investir?",
                desc: "Sem reservas claras, qualquer decisão de expansão acaba sendo tomada no escuro e com risco de endividamento."
              },
              {
                icon: "fas fa-chart-bar",
                color: "indigo",
                title: "A empresa está crescendo?",
                desc: "Sem relatórios consolidados, você não sabe se sua operação está mais eficiente ou apenas girando capital."
              }
            ].map((item, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="glass-card-interactive rounded-2xl p-6"
              >
                <div className={`w-12 h-12 rounded-2xl bg-${item.color}-500/10 border border-${item.color}-500/20 text-${item.color}-400 flex items-center justify-center text-xl mb-5 shadow-sm`}>
                  <i className={item.icon}></i>
                </div>
                <h3 className="text-base font-extrabold text-white mb-2 uppercase tracking-wide">{item.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-card-premium rounded-3xl p-8 sm:p-10 text-center max-w-3xl mx-auto relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-blue-600/5 pointer-events-none" />
            <p className="text-lg sm:text-xl font-bold text-white tracking-tight relative z-10">
              "Você não precisa de mais planilhas confusas. Precisa entender os números que já possui."
            </p>
          </motion.div>
        </section>

        {/* 05. APRESENTAÇÃO DA SOLUÇÃO */}
        <section id="demonstracao" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/5">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-extrabold uppercase tracking-wider mb-4">
              CONHEÇA O CONNECT FINANÇAS
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              SUA GESTÃO FINANCEIRA.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">SIMPLES DE ENTENDER.</span>
            </h2>
            <p className="mt-4 text-slate-400 text-sm sm:text-base">
              Centralize as informações financeiras do seu negócio e transforme números em decisões inteligentes.
            </p>
          </div>

          <div className="space-y-16 lg:space-y-24">
            {/* COMPOSIÇÃO 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="space-y-6"
              >
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
                    <span>Indicadores de margem de lucro calculados na hora</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <i className="fas fa-check-circle text-emerald-400 text-sm"></i>
                    <span>Filtro por períodos flexíveis (Ontem, 7 dias, 15 dias, 30 dias)</span>
                  </li>
                </ul>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="glass-card-premium rounded-3xl p-5 relative"
              >
                <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <i className="fas fa-chart-line text-blue-400"></i> Resumo Diário de Caixa
                  </span>
                  <span className="text-[9px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-extrabold uppercase">Atualizado</span>
                </div>
                
                <div className="grid grid-cols-3 gap-3 mb-4 text-center">
                  <div className="glass-panel p-3 rounded-2xl">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Entradas</span>
                    <span className="text-sm font-black text-emerald-400 block mt-1">R$ 1.250,00</span>
                  </div>
                  <div className="glass-panel p-3 rounded-2xl">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Saídas</span>
                    <span className="text-sm font-black text-rose-400 block mt-1">R$ 420,00</span>
                  </div>
                  <div className="glass-panel p-3 rounded-2xl">
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
              </motion.div>
            </div>

            {/* COMPOSIÇÃO 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="order-2 lg:order-1 glass-card-premium rounded-3xl p-5"
              >
                <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <i className="fas fa-file-invoice-dollar text-indigo-400"></i> Despesas Fixas CNPJ & Boletos
                  </span>
                  <span className="text-[9px] text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 rounded-full font-extrabold uppercase">Automatizado</span>
                </div>

                <div className="space-y-3">
                  <div className="p-3 rounded-2xl bg-slate-950/80 border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center font-bold text-xs text-blue-400">BR</div>
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

                  <div className="p-3 rounded-2xl bg-slate-950/80 border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center font-bold text-xs text-amber-400">EN</div>
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

                  <div className="p-3 rounded-2xl bg-slate-950/80 border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center font-bold text-xs text-rose-400">HU</div>
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
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="order-1 lg:order-2 space-y-6"
              >
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
              </motion.div>
            </div>
          </div>
        </section>

        {/* 06. BENEFÍCIOS */}
        <section id="beneficios" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/5">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-extrabold uppercase tracking-wider mb-4">
              POR QUE CONNECT FINANÇAS?
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              MAIS CLAREZA PARA QUEM QUER CRESCER
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: "fas fa-eye", color: "blue", title: "Visão do Negócio", desc: "Tenha os principais números da sua empresa organizados em um só lugar, acessíveis de forma rápida e descomplicada." },
              { icon: "fas fa-sliders-h", color: "emerald", title: "Controle Financeiro", desc: "Acompanhe entradas, saídas e resultados de maneira simples, sem perder tempo com classificações confusas." },
              { icon: "fas fa-brain", color: "indigo", title: "Decisões Melhores", desc: "Utilize seus próprios números para tomar decisões estratégicas com mais segurança e previsibilidade." },
              { icon: "fas fa-file-excel", color: "cyan", title: "Menos Planilhas", desc: "Reduza a dependência de controles espalhados, anotações perdidas e planilhas lentas que quebram a todo momento." },
              { icon: "fas fa-chart-line", color: "rose", title: "Acompanhamento", desc: "Entenda como os números do seu negócio evoluem ao longo do tempo através de comparativos reais." },
              { icon: "fas fa-clock", color: "amber", title: "Mais Tempo", desc: "Simplifique sua gestão diária para dedicar mais energia ao crescimento da operação e ao atendimento dos clientes." }
            ].map((item, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: idx * 0.08 }}
                className="glass-card-interactive rounded-3xl p-8"
              >
                <div className={`w-12 h-12 rounded-2xl bg-${item.color}-500/10 border border-${item.color}-500/20 text-${item.color}-400 flex items-center justify-center text-xl mb-6 shadow-sm`}>
                  <i className={item.icon}></i>
                </div>
                <h3 className="text-lg font-extrabold text-white mb-3">{item.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* 07. FUNCIONALIDADES REAIS */}
        <section id="recursos" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/5">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-extrabold uppercase tracking-wider mb-4">
              RECURSOS DO SISTEMA
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              TUDO QUE VOCÊ PRECISA PARA GERIR SEU NEGÓCIO
            </h2>
            <p className="mt-4 text-slate-400 text-sm">
              Ferramentas projetadas especificamente para a rotina prática da empresa moderna.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: "fas fa-tachometer-alt", color: "blue", title: "Dashboard & Fluxo Financeiro", desc: "Painel central com métricas em tempo real de faturamento, despesas operacionais e cálculo imediato de lucro líquido.", tag: "Módulo Principal" },
              { icon: "fas fa-building", color: "indigo", title: "Despesas Fixas CNPJ", desc: "Organização e separação rigorosa de todas as despesas recorrentes da empresa para nunca misturar contas pessoais com o negócio.", tag: "Gestão Fiscal & Operacional" },
              { icon: "fas fa-barcode", color: "cyan", title: "Boletos & Vencimentos", desc: "Controle total de boletos emitidos e recebidos com alertas visuais de contas a vencer hoje, amanhã ou pendentes.", tag: "Controle de Datas" },
              { icon: "fas fa-shopping-cart", color: "amber", title: "Controle de Compras", desc: "Registro estruturado de aquisição de insumos, mercadorias e investimentos para manter o teto de gastos no limite correto.", tag: "Gestão de Suprimentos" },
              { icon: "fas fa-tags", color: "emerald", title: "Cotação de Produtos", desc: "Ferramenta estratégica para registrar e comparar orçamentos entre fornecedores antes de autorizar a compra.", tag: "Economia Estratégica" },
              { icon: "fas fa-piggy-bank", color: "rose", title: "Separações & Fundo de Caixa", desc: "Gestão de reservas financeiras para emergências, capital de giro e distribuição planejada de pro-labore.", tag: "Segurança de Capital" }
            ].map((feature, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: idx * 0.08 }}
                className="glass-card-interactive rounded-3xl p-6 flex flex-col justify-between"
              >
                <div>
                  <div className={`w-10 h-10 rounded-xl bg-${feature.color}-600/20 text-${feature.color}-400 flex items-center justify-center text-base mb-4 border border-${feature.color}-500/20`}>
                    <i className={feature.icon}></i>
                  </div>
                  <h3 className="text-base font-extrabold text-white mb-2">{feature.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-white/5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {feature.tag}
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* 08. ANTES X DEPOIS */}
        <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/5">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              MUDE A FORMA COMO VOCÊ ENXERGA SEU NEGÓCIO
            </h2>
            <p className="mt-3 text-slate-400 text-sm">
              A diferença entre gerenciar no escuro e liderar com total clareza.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-slate-950/40 rounded-[32px] p-8 sm:p-10 border border-rose-500/20 relative backdrop-blur-xl"
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-500/10 text-rose-400 text-xs font-black uppercase tracking-wider mb-6 border border-rose-500/20">
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
                  <span>Decisões tomadas com base em intuição e achismo</span>
                </li>
                <li className="flex items-start gap-3">
                  <i className="fas fa-times text-rose-400 mt-1"></i>
                  <span>Falta de histórico consolidado para comparar períodos</span>
                </li>
              </ul>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="glass-card-premium rounded-[32px] p-8 sm:p-10 border border-emerald-500/30 relative"
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-black uppercase tracking-wider mb-6 border border-emerald-500/25">
                <i className="fas fa-check-circle"></i> COM O CONNECT FINANÇAS
              </div>
              <ul className="space-y-4 text-xs sm:text-sm text-slate-200">
                <li className="flex items-start gap-3">
                  <i className="fas fa-check text-emerald-400 mt-1"></i>
                  <span>Tudo centralizado em um dashboard visual intuitivo</span>
                </li>
                <li className="flex items-start gap-3">
                  <i className="fas fa-check text-emerald-400 mt-1"></i>
                  <span>Cálculo automático de receitas, despesas e lucro real</span>
                </li>
                <li className="flex items-start gap-3">
                  <i className="fas fa-check text-emerald-400 mt-1"></i>
                  <span>Segurança nas decisões utilizando dados precisos</span>
                </li>
                <li className="flex items-start gap-3">
                  <i className="fas fa-check text-emerald-400 mt-1"></i>
                  <span>Gráficos e comparativos simples de entender a qualquer momento</span>
                </li>
              </ul>
            </motion.div>
          </div>
        </section>

        {/* 09. TABELA DE PREÇOS / PLANOS COM DESTAQUE GLASS E MOTION */}
        <section id="planos" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/5">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-extrabold uppercase tracking-wider mb-4">
              NOSSAS OFERTAS
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              ESCOLHA O PLANO IDEAL PARA A SUA EMPRESA
            </h2>
            <p className="mt-3 text-slate-400 text-sm">
              Sem taxas ocultas ou multas de fidelidade. Acesso imediato após confirmação.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch max-w-6xl mx-auto">
            {/* PLANO MENSAL */}
            <motion.div 
              whileHover={{ y: -5 }}
              transition={{ duration: 0.3 }}
              className="glass-card-interactive rounded-[28px] p-6 flex flex-col justify-between"
            >
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
                className="w-full bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white font-extrabold py-3.5 px-4 rounded-full transition-all text-xs tracking-wider uppercase cursor-pointer"
              >
                ASSINAR AGORA
              </button>
            </motion.div>

            {/* PLANO TRIMESTRAL */}
            <motion.div 
              whileHover={{ y: -5 }}
              transition={{ duration: 0.3 }}
              className="glass-card-interactive rounded-[28px] p-6 flex flex-col justify-between"
            >
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
                className="w-full bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white font-extrabold py-3.5 px-4 rounded-full transition-all text-xs tracking-wider uppercase cursor-pointer"
              >
                ASSINAR AGORA
              </button>
            </motion.div>

            {/* PLANO ANUAL (DESTAQUE VIP COM NEON E VIDRO FUMÊ) */}
            <motion.div 
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ duration: 0.3 }}
              className="fume-glass-card-premium specular-drift-effect rounded-[28px] p-6 border-2 border-pink-500/50 flex flex-col justify-between relative shadow-2xl shadow-pink-500/25 ring-1 ring-pink-500/20"
            >
              <div className="absolute top-0 right-6 transform -translate-y-1/2 bg-gradient-to-r from-pink-500 via-indigo-600 to-blue-600 text-white text-[9px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-lg border border-white/25 flex items-center gap-1">
                <span>✦</span> MAIS POPULAR • ECONOMIZE 50%
              </div>
              <div>
                <span className="text-[9px] font-black text-pink-400 uppercase tracking-widest block mb-2">Anual VIP</span>
                <h3 className="text-lg font-bold text-white mb-4">Plano Anual</h3>
                <div className="mb-6">
                  <span className="text-3xl font-black text-white">R$ 797,00</span>
                  <span className="text-xs text-slate-400 font-medium"> / ano</span>
                </div>
                <ul className="space-y-3.5 text-xs text-slate-200 font-medium mb-8">
                  <li className="flex items-center gap-2.5">
                    <i className="fas fa-check text-pink-400 text-[10px]"></i>
                    <span>Acesso anual garantido</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <i className="fas fa-check text-pink-400 text-[10px]"></i>
                    <span>Todos os módulos liberados</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <i className="fas fa-check text-pink-400 text-[10px]"></i>
                    <span>Suporte VIP WhatsApp & E-mail</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <i className="fas fa-check text-pink-400 text-[10px]"></i>
                    <span>Atualizações inclusas</span>
                  </li>
                </ul>
              </div>
              <button 
                onClick={() => handleSelectPlan('yearly')}
                className="w-full bg-gradient-to-r from-pink-500 via-indigo-600 to-blue-600 hover:from-pink-400 hover:to-blue-500 text-white font-extrabold py-3.5 px-4 rounded-full transition-all text-xs tracking-wider uppercase shadow-xl shadow-pink-500/25 cursor-pointer border border-white/20 active:scale-95"
              >
                ASSINAR AGORA
              </button>
            </motion.div>

            {/* PLANO VITALÍCIO */}
            <motion.div 
              whileHover={{ y: -5 }}
              transition={{ duration: 0.3 }}
              className="glass-card-interactive rounded-[28px] p-6 flex flex-col justify-between"
            >
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Acesso Único</span>
                <h3 className="text-lg font-bold text-white mb-4">Plano Vitalício</h3>
                <div className="mb-6">
                  <span className="text-3xl font-black text-white">R$ 4.997,00</span>
                  <span className="text-xs text-slate-500 font-medium"> / pagamento único</span>
                </div>
                <ul className="space-y-3.5 text-xs text-slate-300 font-medium mb-8">
                  <li className="flex items-center gap-2.5">
                    <i className="fas fa-check text-blue-400 text-[10px]"></i>
                    <span>Acesso vitalício ilimitado</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <i className="fas fa-check text-blue-400 text-[10px]"></i>
                    <span>Sem mensalidades futuras</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <i className="fas fa-check text-blue-400 text-[10px]"></i>
                    <span>Suporte VIP vitalício</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <i className="fas fa-check text-blue-400 text-[10px]"></i>
                    <span>Bônus exclusivos</span>
                  </li>
                </ul>
              </div>
              <button 
                onClick={() => handleSelectPlan('lifetime')}
                className="w-full bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white font-extrabold py-3.5 px-4 rounded-full transition-all text-xs tracking-wider uppercase cursor-pointer"
              >
                ASSINAR AGORA
              </button>
            </motion.div>
          </div>
        </section>

        {/* 10. SEÇÃO DE GARANTIA */}
        <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/5">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-card-premium rounded-[32px] p-8 sm:p-12 max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-8 relative overflow-hidden"
          >
            <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-3xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-4xl sm:text-5xl flex-shrink-0 shadow-lg shadow-blue-500/10">
              <i className="fas fa-shield-alt"></i>
            </div>
            <div className="space-y-4 text-center md:text-left relative z-10">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">RISCO ZERO COM NOSSA GARANTIA DE 7 DIAS</h2>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                Você pode experimentar o Connect Finanças por 7 dias inteiros. Se por qualquer motivo não se adaptar ou achar que a ferramenta não é para você, basta solicitar o reembolso. Devolveremos 100% do seu dinheiro, sem burocracias.
              </p>
            </div>
          </motion.div>
        </section>

        {/* 11. FAQ SECTION COM ANIMAÇÃO FLUIDA */}
        <section id="faq" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/5 mb-12">
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
                a: "A garantia é 100% incondicional. Após a contratação, você tem 7 dias corridos para navegar e cadastrar seus dados. Se desejar cancelar, basta solicitar por e-mail e estornaremos todo o valor pago."
              },
              {
                q: "Meus dados financeiros estão seguros?",
                a: "Totalmente seguros. Utilizamos criptografia padrão bancário em trânsito e em repouso, com servidores seguros na nuvem Supabase e proteção individual por PIN para suas áreas mais sensíveis."
              },
              {
                q: "Posso utilizar no celular?",
                a: "Sim! Toda a plataforma do Connect Finanças foi construída responsiva para smartphones, tablets e computadores, permitindo lançar e conferir dados onde você estiver."
              },
              {
                q: "Qual a diferença dos planos?",
                a: "O plano Mensal é ideal para quem quer flexibilidade. O Trimestral e o Anual oferecem grande economia (o Anual economiza 50%). O Vitalício dá acesso ilimitado sem mensalidades futuras."
              }
            ].map((faq, index) => {
              const isOpen = !!faqStates[index];
              return (
                <div key={index} className="glass-card-interactive rounded-2xl overflow-hidden transition-all">
                  <button 
                    onClick={() => toggleFaq(index)}
                    className="w-full flex items-center justify-between p-5 text-left font-bold text-white text-xs sm:text-sm hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <motion.i 
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.25 }}
                      className="fas fa-chevron-down text-blue-400 text-xs ml-4"
                    />
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden border-t border-white/5 bg-slate-950/40"
                      >
                        <div className="p-5 text-slate-300/80 text-xs sm:text-sm leading-relaxed">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </section>

      </main>

      {/* 12. FOOTER */}
      <footer className="border-t border-white/10 bg-[#06070c]/90 py-12 px-4 sm:px-6 lg:px-8 text-center relative z-10 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-600 to-pink-500 flex items-center justify-center text-white shadow-md shadow-pink-500/20 border border-white/10">
              <i className="fas fa-chart-line text-sm"></i>
            </div>
            <span className="text-sm font-black tracking-tight text-white">
              Connect <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-pink-400 font-semibold">Finanças</span>
            </span>
          </div>
          <p className="text-slate-500 text-[11px] font-medium uppercase tracking-wider">
            &copy; {new Date().getFullYear()} Connect Finanças • Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
