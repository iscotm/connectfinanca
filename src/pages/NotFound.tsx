import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.warn("404 Error: Rota não encontrada:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-950 text-white overflow-hidden px-4">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-emerald-500/10 rounded-full blur-[90px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 max-w-md w-full p-8 rounded-2xl bg-slate-900/40 backdrop-blur-xl border border-white/10 shadow-2xl text-center"
      >
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-tr from-blue-600/20 to-emerald-500/20 border border-white/10 flex items-center justify-center text-blue-400">
          <Compass className="w-8 h-8 animate-pulse" />
        </div>

        <span className="inline-block text-xs uppercase tracking-widest font-bold px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-3">
          Erro 404
        </span>

        <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">
          Página não encontrada
        </h1>

        <p className="text-sm text-slate-400 mb-8 leading-relaxed">
          A rota <span className="font-mono text-xs text-blue-300 bg-slate-800/60 px-1.5 py-0.5 rounded">{location.pathname}</span> não existe ou foi movida.
        </p>

        <Button asChild className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25 transition-all duration-300">
          <Link to="/" className="flex items-center justify-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Início
          </Link>
        </Button>
      </motion.div>
    </div>
  );
};

export default NotFound;
