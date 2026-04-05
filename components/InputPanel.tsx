import React, { useRef } from 'react';
import { VisualStyle, InputMode } from '../types.ts';
import {
    GenerateIcon,
    CodeBracketIcon,
    LoadingSpinner,
    GlobeAltIcon,
    PhotoIcon,
    XMarkIcon,
    SparkleIcon,
    DocumentDuplicateIcon,
} from './icons.tsx';

interface InputPanelProps {
    inputMode: InputMode;
    setInputMode: (mode: InputMode) => void;
    userInput: string;
    setUserInput: (value: string) => void;
    urlInput: string;
    setUrlInput: (value: string) => void;
    screenshots: string[];
    setScreenshots: React.Dispatch<React.SetStateAction<string[]>>;
    pastedContent: string;
    setPastedContent: (value: string) => void;
    htmlInput: string;
    setHtmlInput: (value: string) => void;
    cloneHtmlInput: string;
    setCloneHtmlInput: (value: string) => void;
    selectedStyle: VisualStyle;
    setSelectedStyle: (style: VisualStyle) => void;
    visualStyles: VisualStyle[];
    onGenerate: () => void;
    isLoading: boolean;
}

const inputBase = 'w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-sm text-slate-100 placeholder:text-slate-400/70 outline-none transition duration-200 focus:border-brand-secondary/60 focus:ring-4 focus:ring-brand-secondary/10';

const modeCards: {
    mode: InputMode;
    label: string;
    description: string;
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
}[] = [
    { mode: 'description', label: 'Describe', description: 'Turn a product idea into an image, prompt, HTML and CSS.', icon: GenerateIcon },
    { mode: 'blueprint', label: 'Blueprint', description: 'Draft the layout before styling details take over.', icon: DocumentDuplicateIcon },
    { mode: 'design-system', label: 'Design System', description: 'Generate from brand colors, typography and section structure.', icon: SparkleIcon },
    { mode: 'design', label: 'Draw', description: 'Sketch a wireframe on canvas and convert it into a UI.', icon: PhotoIcon },
    { mode: 'modify', label: 'Remix', description: 'Apply a new design language to existing markup.', icon: CodeBracketIcon },
    { mode: 'clone', label: 'Clone', description: 'Rebuild from a website URL, screenshots or pasted content.', icon: GlobeAltIcon },
];

const InputPanel: React.FC<InputPanelProps> = (props) => {
    const {
        inputMode, setInputMode, userInput, setUserInput, urlInput, setUrlInput,
        screenshots, setScreenshots, pastedContent, setPastedContent,
        htmlInput, setHtmlInput, cloneHtmlInput, setCloneHtmlInput,
        selectedStyle, setSelectedStyle, visualStyles, onGenerate, isLoading
    } = props;

    const fileInputRef = useRef<HTMLInputElement>(null);

    const isGenerateDisabled = isLoading || (
        (inputMode === 'description'   && !userInput.trim()) ||
        (inputMode === 'blueprint'     && !userInput.trim()) ||
        (inputMode === 'design-system' && !userInput.trim()) ||
        (inputMode === 'modify'        && (!htmlInput.trim() || !cloneHtmlInput.trim())) ||
        (inputMode === 'clone'         && (!urlInput.trim() && screenshots.length === 0 && !pastedContent.trim()))
    );

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const fileList = e.target.files;
        if (fileList) {
            (Array.from(fileList) as File[]).forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => setScreenshots(prev => [...prev, reader.result as string].slice(-4));
                reader.readAsDataURL(file);
            });
        }
    };

    const getButtonText = () => {
        if (isLoading) {
            if (inputMode === 'clone')         return 'Cloning website…';
            if (inputMode === 'modify')        return 'Remixing…';
            if (inputMode === 'blueprint')     return 'Drafting…';
            if (inputMode === 'design-system') return 'Generating…';
            return 'Building UI…';
        }
        if (inputMode === 'modify')        return 'Remix HTML';
        if (inputMode === 'clone')         return 'Clone Website';
        if (inputMode === 'blueprint')     return 'Generate Blueprint';
        if (inputMode === 'design-system') return 'Build with Design System';
        return 'Build UI';
    };

    const placeholder = inputMode === 'blueprint'
        ? 'e.g. A multi-step checkout form with progress indicator'
        : inputMode === 'design-system'
        ? 'e.g. A modern fintech app for Gen Z — focused on trust and speed'
        : 'e.g. A premium project dashboard for product teams with clear hierarchy and calm visuals';

    const currentMode = modeCards.find((item) => item.mode === inputMode);

    const helperPills = inputMode === 'clone'
        ? ['URL snapshot', 'Up to 4 screenshots', 'Optional pasted content']
        : inputMode === 'modify'
        ? ['Existing markup', 'Reference style', 'Rewrite without losing content']
        : inputMode === 'blueprint'
        ? ['Page sections', 'Navigation flow', 'Primary actions']
        : inputMode === 'design-system'
        ? ['Brand mood', 'Colors and type', 'Section architecture']
        : ['Audience', 'Feature focus', 'Visual tone'];

    return (
        <div className="glass flex flex-col overflow-hidden rounded-[30px]">
            <div className="border-b border-white/10 px-5 py-6 sm:px-6">
                <div className="inline-flex items-center rounded-full border border-brand-secondary/20 bg-brand-secondary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-secondary">
                    Build inputs
                </div>
                <h2 className="mt-4 font-display text-2xl font-bold tracking-tight text-white">Control room</h2>
                <p className="mt-2 max-w-lg text-sm leading-6 text-slate-300">
                    Pick the workflow that matches your starting point, then feed the model the right context so the output feels intentional from the first pass.
                </p>
            </div>

            <div className="flex-1 space-y-6 p-5 sm:p-6">
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Workflow</p>
                            <p className="mt-1 text-sm text-slate-300">Six ways to generate, refine, or reconstruct a UI.</p>
                        </div>
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-medium text-slate-300">
                            {modeCards.length} modes
                        </span>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        {modeCards.map((mode) => {
                            const Icon = mode.icon;
                            const isActive = inputMode === mode.mode;

                            return (
                                <button
                                    key={mode.mode}
                                    type="button"
                                    onClick={() => setInputMode(mode.mode)}
                                    className={`group rounded-[22px] border px-4 py-4 text-left transition duration-200 ${
                                        isActive
                                            ? 'border-brand-secondary/40 bg-brand-secondary/10 shadow-[0_16px_36px_rgba(14,165,233,0.12)]'
                                            : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]'
                                    }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl border transition ${
                                            isActive
                                                ? 'border-brand-secondary/30 bg-brand-secondary/12 text-brand-secondary'
                                                : 'border-white/10 bg-brand-bg/40 text-slate-400 group-hover:text-white'
                                        }`}>
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-semibold text-white">{mode.label}</p>
                                                {isActive && (
                                                    <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-200">
                                                        Active
                                                    </span>
                                                )}
                                            </div>
                                            <p className="mt-1 text-sm leading-5 text-slate-400">{mode.description}</p>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </section>

                <section className="space-y-3">
                    <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                        <div className="flex flex-wrap gap-2">
                            {helperPills.map((pill) => (
                                <span key={pill} className="rounded-full border border-white/10 bg-brand-bg/50 px-3 py-1 text-[11px] font-medium text-slate-300">
                                    {pill}
                                </span>
                            ))}
                        </div>
                        {currentMode && (
                            <p className="mt-3 text-sm leading-6 text-slate-300">
                                <span className="font-semibold text-white">{currentMode.label} mode:</span> {currentMode.description}
                            </p>
                        )}
                    </div>
                </section>

                {(inputMode === 'description' || inputMode === 'blueprint' || inputMode === 'design-system') && (
                    <section className="space-y-5">
                        <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                                {inputMode === 'blueprint'     ? 'Describe the layout'         :
                                 inputMode === 'design-system' ? 'Describe your brand / product' :
                                 'Describe your UI idea'}
                            </label>
                            <textarea
                                value={userInput}
                                onChange={e => setUserInput(e.target.value)}
                                placeholder={placeholder}
                                rows={4}
                                disabled={isLoading}
                                className={`${inputBase} min-h-[150px] resize-none`}
                            />
                        </div>

                        {inputMode === 'description' && (
                            <div>
                                <label className="mb-3 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                                    Visual style
                                </label>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    {visualStyles.map(style => (
                                        <button
                                            key={style}
                                            type="button"
                                            onClick={() => setSelectedStyle(style)}
                                            disabled={isLoading}
                                            className={`min-h-[68px] rounded-[20px] border px-4 py-3 text-left transition duration-200 ${
                                                selectedStyle === style
                                                    ? 'border-brand-primary/45 bg-brand-primary/10 text-white shadow-[0_16px_32px_rgba(34,197,94,0.12)]'
                                                    : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20 hover:bg-white/[0.05] hover:text-white'
                                            }`}
                                        >
                                            <div className="text-sm font-semibold">{style}</div>
                                            <div className="mt-1 text-xs text-slate-400">
                                                {style === selectedStyle ? 'Selected as the current visual direction.' : 'Use this as the overall aesthetic cue.'}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </section>
                )}

                {inputMode === 'modify' && (
                    <section className="space-y-5">
                        <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Your existing HTML</label>
                            <textarea
                                value={htmlInput}
                                onChange={e => setHtmlInput(e.target.value)}
                                placeholder="Paste your HTML here…"
                                rows={6}
                                className={`${inputBase} resize-none font-mono text-xs`}
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Style to apply</label>
                            <textarea
                                value={cloneHtmlInput}
                                onChange={e => setCloneHtmlInput(e.target.value)}
                                placeholder="Paste the HTML with the style you want to apply…"
                                rows={6}
                                className={`${inputBase} resize-none font-mono text-xs`}
                            />
                        </div>
                    </section>
                )}

                {inputMode === 'clone' && (
                    <section className="space-y-5">
                        <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Website URL</label>
                            <div className="relative">
                                <GlobeAltIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="url"
                                    value={urlInput}
                                    onChange={e => setUrlInput(e.target.value)}
                                    placeholder="https://stripe.com"
                                    disabled={isLoading}
                                    className={`${inputBase} pl-10`}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                                Screenshots
                                <span className="ml-2 text-[10px] font-medium normal-case tracking-normal text-brand-primary/70">optional</span>
                            </label>
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleFileUpload} />
                            <div className="grid grid-cols-2 gap-2">
                                {screenshots.map((src, i) => (
                                    <div key={i} className="group/img relative aspect-video overflow-hidden rounded-2xl border border-white/10">
                                        <img src={src} className="w-full h-full object-cover" alt="" />
                                        <button
                                            type="button"
                                            onClick={() => setScreenshots(prev => prev.filter((_, idx) => idx !== i))}
                                            className="absolute right-2 top-2 rounded-full bg-slate-950/80 p-1 text-white opacity-0 transition group-hover/img:opacity-100 hover:bg-red-500"
                                        >
                                            <XMarkIcon className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                                {screenshots.length < 4 && (
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex aspect-video flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/12 text-slate-400 transition hover:border-brand-primary/40 hover:bg-brand-primary/5 hover:text-brand-primary"
                                    >
                                        <PhotoIcon className="w-5 h-5" />
                                        <span className="text-[11px] font-semibold">Add screenshot</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Paste content</label>
                            <textarea
                                value={pastedContent}
                                onChange={e => setPastedContent(e.target.value)}
                                placeholder="Paste any HTML, CSS, or text for extra context…"
                                rows={4}
                                disabled={isLoading}
                                className={`${inputBase} resize-none`}
                            />
                        </div>
                    </section>
                )}

                {inputMode !== 'design' && (
                    <section className="space-y-3 border-t border-white/10 pt-6">
                        <button
                            type="button"
                            onClick={onGenerate}
                            disabled={isGenerateDisabled}
                            className="btn-cta flex min-h-[56px] w-full items-center justify-center gap-2.5 rounded-2xl px-4 py-3.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                        >
                            {isLoading
                                ? <><LoadingSpinner className="h-4 w-4" />{getButtonText()}</>
                                : inputMode === 'modify'
                                ? <><CodeBracketIcon className="h-4 w-4" />{getButtonText()}</>
                                : inputMode === 'clone'
                                ? <><GlobeAltIcon className="h-4 w-4" />{getButtonText()}</>
                                : <><GenerateIcon className="h-4 w-4" />{getButtonText()}</>
                            }
                        </button>

                        <div className="rounded-[22px] border border-white/10 bg-brand-bg/40 p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">What happens next</p>
                            <p className="mt-2 text-sm leading-6 text-slate-300">
                                You&apos;ll get a live preview plus the generated prompt, HTML, and CSS so you can review design quality before moving into code.
                            </p>
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
};

export default InputPanel;
