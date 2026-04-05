import React from 'react';
import { PhotoIcon } from './icons.tsx';

type Viewport = 'mobile' | 'tablet' | 'desktop';

interface PreviewPanelProps {
    imageUrl: string | null;
    isLoading: boolean;
    error: string | null;
    viewport: Viewport;
}

const BrowserFrame: React.FC<{ children: React.ReactNode; label: string }> = ({ children, label }) => (
    <div className="w-full overflow-hidden rounded-[24px] border border-white/10 bg-slate-950/80 shadow-[0_28px_70px_rgba(2,6,23,0.35)]">
        <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-4 py-3">
            <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80"></span>
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80"></span>
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80"></span>
            </div>
            <div className="rounded-full border border-white/10 bg-brand-bg/45 px-3 py-1 text-[11px] font-medium text-slate-300">
                {label}
            </div>
        </div>
        <div className="bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.12),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] p-4">
            {children}
        </div>
    </div>
);

const DeviceFrame: React.FC<{ children: React.ReactNode, device: 'mobile' | 'tablet' }> = ({ children, device }) => {
    const frameClasses = {
        mobile: 'w-[395px] h-[797px] p-3 bg-slate-950 border border-white/10 rounded-[40px] shadow-[0_28px_70px_rgba(2,6,23,0.38)] transition-all duration-300',
        tablet: 'w-[808px] h-[1064px] p-3 bg-slate-950 border border-white/10 rounded-[28px] shadow-[0_28px_70px_rgba(2,6,23,0.38)] transition-all duration-300'
    };
    const screenClasses = 'h-full w-full overflow-hidden rounded-[24px] border border-white/6 bg-slate-950';

    return (
        <div className={frameClasses[device]}>
            <div className={screenClasses}>
                {children}
            </div>
        </div>
    );
};

const PreviewPanel: React.FC<PreviewPanelProps> = ({ imageUrl, isLoading, error, viewport }) => {
    
    const content = () => {
        if (isLoading) {
             return (
                <div className="flex min-h-[560px] w-full flex-col items-center justify-center rounded-[20px] border border-dashed border-white/12 bg-brand-bg/60 animate-pulse-fast">
                    <PhotoIcon className="mb-4 h-16 w-16 text-slate-500" />
                    <div className="h-4 w-1/3 rounded bg-slate-800"></div>
                </div>
            );
        }
        
        if (error) {
            return (
                <div className="flex min-h-[560px] w-full flex-col items-center justify-center rounded-[20px] border border-dashed border-red-400/50 bg-red-900/20 p-4 text-red-200">
                    <h3 className="text-lg font-semibold">Image preview error</h3>
                    <p className="mt-2 text-sm text-center">{error}</p>
                </div>
            );
        }

        if (imageUrl) {
            return (
                <div className="overflow-hidden rounded-[20px] border border-white/10 bg-brand-surface">
                    <img 
                        src={imageUrl} 
                        alt="AI Generated UI Preview" 
                        className="h-full w-full object-cover bg-brand-surface"
                    />
                </div>
            );
        }

        return (
            <div className="flex min-h-[560px] w-full flex-col items-center justify-center rounded-[20px] border border-dashed border-white/12 bg-brand-bg/60 text-brand-muted">
                <PhotoIcon className="mb-4 h-16 w-16 opacity-50" />
                <h3 className="text-lg font-semibold text-slate-200">Visual preview</h3>
                <p className="mt-2 text-sm text-slate-400">A rendered concept image will appear here after generation.</p>
            </div>
        );
    };

    if (viewport === 'mobile' || viewport === 'tablet') {
        return <div className="origin-top scale-[0.6] transform sm:scale-75"><DeviceFrame device={viewport}>{content()}</DeviceFrame></div>;
    }
    
    return (
        <BrowserFrame label="Concept preview">{content()}</BrowserFrame>
    );
};

export default PreviewPanel;
