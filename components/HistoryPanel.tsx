import React from 'react';
import { HistoryItem } from '../types.ts';
import { RestoreIcon, PhotoIcon, CodeBracketIcon, GlobeAltIcon } from './icons.tsx';

interface HistoryPanelProps {
    history: HistoryItem[];
    clearHistory: () => void;
    loadHistoryItem: (item: HistoryItem) => void;
}

const modeLabel: Record<string, { label: string; color: string }> = {
    modify:        { label: 'Remix',    color: 'text-violet-400 bg-violet-400/10 border-violet-400/20' },
    clone:         { label: 'Clone',    color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20' },
    blueprint:     { label: 'Blueprint',color: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
    design:        { label: 'Draw',     color: 'text-pink-400 bg-pink-400/10 border-pink-400/20' },
    'design-system':{ label: 'System', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
    description:   { label: 'Describe', color: 'text-white/40 bg-white/5 border-white/10' },
};

const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, clearHistory, loadHistoryItem }) => {
    const getBadge = (item: HistoryItem) => {
        const m = modeLabel[item.inputMode] || modeLabel.description;
        return (
            <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${m.color}`}>
                {m.label}
            </span>
        );
    };

    const getThumbnail = (item: HistoryItem) => {
        if (item.previewImage) {
            return <img src={item.previewImage} alt="Preview" className="w-12 h-12 object-cover rounded-lg flex-shrink-0 border border-white/[0.08]" />;
        }
        const Icon = item.inputMode === 'clone' ? GlobeAltIcon : item.inputMode === 'modify' ? CodeBracketIcon : PhotoIcon;
        return (
            <div className="w-12 h-12 rounded-lg flex-shrink-0 bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                <Icon className="w-5 h-5 text-white/20" />
            </div>
        );
    };

    return (
        <div className="glass flex h-full flex-col rounded-[30px] p-5 sm:p-6" id="history">
            <div className="mb-5 flex items-center justify-between">
                <div>
                    <div className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                        Restore
                    </div>
                    <h2 className="mt-4 font-display text-2xl font-bold tracking-tight text-white">Recent sessions</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{history.length} generations saved locally for quick recovery.</p>
                </div>
                <button
                    type="button"
                    onClick={clearHistory}
                    disabled={history.length === 0}
                    className="rounded-full px-3 py-2 text-xs font-medium text-slate-400 transition hover:bg-red-400/8 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    Clear all
                </button>
            </div>

            {history.length === 0 ? (
                <div className="flex flex-1 items-center justify-center rounded-[24px] border border-dashed border-white/12 bg-white/[0.02] p-6 text-center">
                    <div className="max-w-sm">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-brand-bg/40">
                            <RestoreIcon className="h-6 w-6 text-slate-400" />
                        </div>
                        <p className="mt-4 text-base font-semibold text-white">Nothing to restore yet</p>
                        <p className="mt-2 text-sm leading-6 text-slate-300">
                            Your recent builds will appear here after the first generation so you can jump back into previous ideas without losing momentum.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1">
                    {history.map(item => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => loadHistoryItem(item)}
                            className="group/item flex w-full items-center gap-3 rounded-[22px] border border-white/10 bg-white/[0.03] p-3 text-left transition hover:border-white/20 hover:bg-white/[0.05]"
                        >
                            {getThumbnail(item)}
                            <div className="min-w-0 flex-1">
                                <div className="mb-1 flex items-center gap-2">
                                    <p className="flex-1 truncate text-sm font-semibold text-white">
                                        {item.inputMode === 'clone' ? (item.urlInput || 'Web Clone') : (item.input || 'Generation')}
                                    </p>
                                    {getBadge(item)}
                                </div>
                                <p className="truncate text-xs leading-5 text-slate-400">
                                    {item.inputMode === 'description' ? `Style: ${item.style}` : 'Click to load this session back into the workspace.'}
                                </p>
                            </div>
                            <RestoreIcon className="h-4 w-4 flex-shrink-0 text-slate-500 transition group-hover/item:text-brand-primary" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default HistoryPanel;
