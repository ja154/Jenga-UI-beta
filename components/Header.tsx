import React from 'react';
import { Link } from 'react-router-dom';

const Header: React.FC = () => {
    return (
        <header
            className="sticky top-0 z-30 border-b border-white/10"
            style={{ background: 'rgba(7, 17, 31, 0.74)', backdropFilter: 'blur(24px) saturate(160%)', WebkitBackdropFilter: 'blur(24px) saturate(160%)' }}
        >
            <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                <Link to="/" className="group flex items-center gap-4">
                    <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-cta-gradient shadow-[0_14px_32px_rgba(34,197,94,0.28)]">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                            <path d="M2 17l10 5 10-5"/>
                            <path d="M2 12l10 5 10-5"/>
                        </svg>
                        <div className="absolute inset-0 -z-10 rounded-2xl bg-emerald-400/40 blur-xl transition-opacity duration-300 group-hover:opacity-90"></div>
                    </div>

                    <div>
                        <div className="flex items-baseline gap-1">
                            <span className="font-display text-2xl font-bold tracking-tight text-white">Jenga</span>
                            <span className="font-display text-2xl font-bold tracking-tight text-emerald-300">UI</span>
                        </div>
                        <p className="text-xs text-slate-400">Structured AI workspace for prompts, code, and remixes</p>
                    </div>
                </Link>

                <nav className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-2 py-2 lg:flex">
                    <a href="#workspace" className="rounded-full px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/[0.05] hover:text-white">
                        Workspace
                    </a>
                    <a href="#library" className="rounded-full px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/[0.05] hover:text-white">
                        Templates
                    </a>
                    <a href="#history" className="rounded-full px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/[0.05] hover:text-white">
                        History
                    </a>
                </nav>

                <div className="flex items-center gap-3">
                    <div className="hidden rounded-full border border-emerald-400/20 bg-emerald-400/8 px-3 py-2 sm:flex sm:items-center sm:gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                        <span className="text-xs font-medium text-emerald-200">Local workspace ready</span>
                    </div>
                    <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-[11px] font-mono uppercase tracking-[0.2em] text-slate-400">
                        Developer Preview
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
