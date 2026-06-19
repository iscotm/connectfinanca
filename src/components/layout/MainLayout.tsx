import { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-[#020617] text-slate-100 relative overflow-x-hidden font-sans">
        {/* Ambient glow effects */}
        <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] bg-glow-radial-blue pointer-events-none z-0"></div>
        <div className="absolute bottom-[10%] right-[5%] w-[700px] h-[700px] bg-glow-radial-cyan pointer-events-none z-0"></div>
        <div className="absolute top-[40%] right-[30%] w-[500px] h-[500px] bg-glow-radial-blue pointer-events-none z-0"></div>

        <AppSidebar />
        <main className="flex-1 flex flex-col min-h-screen overflow-hidden relative z-10 bg-transparent">
          <header className="h-14 border-b border-slate-900 bg-slate-950/40 backdrop-blur-xl flex items-center px-4 sticky top-0 z-20">
            <SidebarTrigger className="mr-4 text-slate-400 hover:text-white" />
            <div className="flex-1" />
          </header>
          <div className="flex-1 overflow-auto p-6 no-scrollbar">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
