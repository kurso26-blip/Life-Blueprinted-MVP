
import React from 'react';
import { LayoutDashboard, Library, Info, Menu, X } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'library' | 'dashboard' | 'info';
  onNavigate: (tab: 'library' | 'dashboard' | 'info') => void;
}

const Logo: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className} fill="currentColor">
    <circle cx="15" cy="15" r="10" />
    <circle cx="32.5" cy="15" r="4" />
    <circle cx="50" cy="15" r="7.5" />
    <circle cx="67.5" cy="15" r="4" />
    <circle cx="85" cy="15" r="10" />
    <circle cx="15" cy="32.5" r="4" />
    <circle cx="32.5" cy="32.5" r="7.5" />
    <circle cx="50" cy="32.5" r="4" />
    <circle cx="67.5" cy="32.5" r="7.5" />
    <circle cx="85" cy="32.5" r="4" />
    <circle cx="15" cy="50" r="7.5" />
    <circle cx="32.5" cy="50" r="4" />
    <circle cx="50" cy="50" r="12" />
    <circle cx="67.5" cy="50" r="4" />
    <circle cx="85" cy="50" r="7.5" />
    <circle cx="15" cy="67.5" r="4" />
    <circle cx="32.5" cy="67.5" r="7.5" />
    <circle cx="50" cy="67.5" r="4" />
    <circle cx="67.5" cy="67.5" r="7.5" />
    <circle cx="85" cy="67.5" r="4" />
    <circle cx="15" cy="85" r="10" />
    <circle cx="32.5" cy="85" r="4" />
    <circle cx="50" cy="85" r="7.5" />
    <circle cx="67.5" cy="85" r="4" />
    <circle cx="85" cy="85" r="10" />
  </svg>
);

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onNavigate }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Active Timelines', icon: LayoutDashboard },
    { id: 'library', label: 'Blueprint Library', icon: Library },
    { id: 'info', label: 'Blueprint Handbook', icon: Info },
  ] as const;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-[#0f172a] text-white p-6 sticky top-0 h-screen border-r border-white/5">
        <div className="flex items-center gap-3 mb-12 group cursor-pointer" onClick={() => onNavigate('dashboard')}>
          <div className="w-10 h-10 text-[#c69f4b]">
            <Logo className="w-full h-full" />
          </div>
          <span className="text-xl font-black tracking-tighter leading-none">
            Life<br/>
            <span className="text-[#06b6d4]">Blueprinted</span>
          </span>
        </div>

        <nav className="space-y-2 flex-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === item.id 
                ? 'bg-[#06b6d4] text-[#0f172a] shadow-lg shadow-[#06b6d4]/20' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-white/5">
          <div className="bg-white/5 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-2 h-2 rounded-full bg-[#06b6d4] animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Project Progress</span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
              Site foundation active and blueprints loaded.
            </p>
          </div>
        </div>
      </aside>

      {/* Header - Mobile */}
      <header className="md:hidden bg-[#0f172a] text-white p-4 flex items-center justify-between sticky top-0 z-[50]">
        <div className="flex items-center gap-2">
          <Logo className="w-8 h-8 text-[#c69f4b]" />
          <span className="font-black text-lg tracking-tight">Life <span className="text-[#06b6d4]">Blueprinted</span></span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-400">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-[#0f172a] z-[40] md:hidden pt-24 px-6 flex flex-col gap-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { onNavigate(item.id); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-4 p-5 rounded-2xl text-lg font-black tracking-tight transition-all ${
                activeTab === item.id 
                ? 'bg-[#06b6d4] text-[#0f172a]' 
                : 'text-slate-400 border border-white/5'
              }`}
            >
              <item.icon size={24} />
              {item.label}
            </button>
          ))}
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-12 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
};

export default Layout;
