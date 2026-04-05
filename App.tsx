
import React, { Suspense } from 'react';
import Header from './components/Header.tsx';
import InputPanel from './components/InputPanel.tsx';
import HistoryPanel from './components/HistoryPanel.tsx';
import InspirationPanel from './components/InspirationPanel.tsx';
import OutputTabs from './components/OutputTabs.tsx';
import { VisualStyle, InputMode, Template } from './types.ts';
import { useAppLogic } from './hooks/useAppLogic.ts';

const WireframeEditor = React.lazy(() => import('./components/WireframeEditor.tsx'));

const VISUAL_STYLES: VisualStyle[] = [
    VisualStyle.Minimalist,
    VisualStyle.Neumorphic,
    VisualStyle.Cyberpunk,
    VisualStyle.Glassmorphism,
    VisualStyle.Brutalist,
    VisualStyle.Corporate,
    VisualStyle.Playful,
    VisualStyle.Vintage,
];

const TEMPLATES: Template[] = [
    { id: 'jengaui-wireframe', name: 'JengaUI Wireframe', prompt: 'A UI builder dashboard with a left panel for inputs (tabs for Describe, Blueprint, Remix, Clone), a right panel for outputs (tabs for Preview, Code, Prompt), and a bottom section for inspiration and history.', style: VisualStyle.Minimalist },
    { id: 'login-form', name: 'Minimalist Login Form', prompt: 'A clean, simple login form with email, password fields, and a submit button.', style: VisualStyle.Minimalist },
    { id: 'product-card', name: 'Cyberpunk Product Card', prompt: 'A futuristic product card with a holographic image placeholder, glowing text, and sharp angles.', style: VisualStyle.Cyberpunk },
    { id: 'pricing-table', name: 'Corporate Pricing Table', prompt: 'A professional pricing table with three tiers (Basic, Pro, Enterprise), feature lists, and clear call-to-action buttons.', style: VisualStyle.Corporate },
    { id: 'user-profile', name: 'Playful User Profile', prompt: 'A fun user profile card with a circular avatar, progress bars for stats, and bright, cheerful colors.', style: VisualStyle.Playful },
];

const MODE_META: Record<InputMode, { label: string; description: string }> = {
    description: { label: 'Describe', description: 'Start from a product idea and shape the first visual direction.' },
    blueprint: { label: 'Blueprint', description: 'Map the structure before styling decisions take over.' },
    'design-system': { label: 'Design System', description: 'Generate from brand colors, typography, and sections.' },
    design: { label: 'Draw', description: 'Sketch a wireframe directly on canvas and translate it into code.' },
    modify: { label: 'Remix', description: 'Take existing markup and re-style it with a stronger design language.' },
    clone: { label: 'Clone', description: 'Reconstruct a reference site from URL, screenshots, or pasted content.' },
};

const App: React.FC = () => {
    const { state, actions } = useAppLogic(VISUAL_STYLES);
    const { 
        inputMode, userInput, urlInput, screenshots, pastedContent, selectedStyle,
        htmlInput, cloneHtmlInput, generatedPrompt, htmlOutput, cssOutput,
        previewImage, groundingSources, generatedTemplates, templateLoading,
        isLoading, error, history
    } = state;
    const {
        setInputMode, setUserInput, setUrlInput, setScreenshots, setPastedContent,
        setSelectedStyle, setHtmlInput, setCloneHtmlInput, setHistory,
        handleGenerateTemplate, handleUseTemplate, handleGenerateFromWireframe,
        handleGenerate, loadFromHistory
    } = actions;

    const activeMode = MODE_META[inputMode];
    const quickStats = [
        { label: 'Workflows', value: '6', helper: 'Generate, clone, remix, blueprint, draw, and system-driven creation.' },
        { label: 'Templates', value: String(TEMPLATES.length).padStart(2, '0'), helper: 'Starter prompts you can expand into working HTML and CSS.' },
        { label: 'Saved sessions', value: String(history.length).padStart(2, '0'), helper: history.length ? 'Your recent builds stay close so iteration is faster.' : 'Recent builds will appear here after your first generation.' },
    ];

    const workflowSteps = [
        { title: '1. Brief', copy: 'Choose the right input mode and add as much context as you have.' },
        { title: '2. Build', copy: 'Generate prompt, preview, HTML and CSS in one organized run.' },
        { title: '3. Refine', copy: 'Use templates, restore history, or remix markup without losing momentum.' },
    ];

    return (
        <div className="min-h-screen">
            <Header />
            <main className="px-4 pb-20 pt-8 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl space-y-10">
                    <section className="section-shell px-6 py-8 sm:px-8 lg:px-10">
                        <div className="relative z-10 grid gap-10 lg:grid-cols-[1.2fr,0.9fr] lg:items-end">
                            <div className="space-y-6">
                                <div className="inline-flex items-center rounded-full border border-brand-secondary/20 bg-brand-secondary/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-secondary">
                                    AI workspace for cleaner UI generation
                                </div>

                                <div className="space-y-4">
                                    <h1 className="max-w-3xl font-display text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                                        Build sharper interfaces from rough ideas without losing structure.
                                    </h1>
                                    <p className="max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
                                        JengaUI combines prompt generation, layout planning, cloning, remixing, and live code output in one organized workspace so the experience feels guided instead of chaotic.
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-3">
                                    <a href="#workspace" className="btn-cta rounded-full px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(34,197,94,0.22)]">
                                        Open workspace
                                    </a>
                                    <a href="#library" className="rounded-full border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white">
                                        Browse templates
                                    </a>
                                    <div className="rounded-full border border-white/10 bg-brand-bg/35 px-4 py-3 text-sm text-slate-300">
                                        Active mode: <span className="font-semibold text-white">{activeMode.label}</span>
                                    </div>
                                </div>

                                <dl className="grid gap-3 sm:grid-cols-3">
                                    {quickStats.map((stat) => (
                                        <div key={stat.label} className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
                                            <dt className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">{stat.label}</dt>
                                            <dd className="mt-3 font-display text-3xl font-bold text-white">{stat.value}</dd>
                                            <p className="mt-2 text-sm leading-6 text-slate-300">{stat.helper}</p>
                                        </div>
                                    ))}
                                </dl>
                            </div>

                            <div className="space-y-4">
                                <div className="rounded-[28px] border border-white/10 bg-brand-bg/50 p-6 shadow-[0_28px_70px_rgba(2,6,23,0.3)]">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-primary">Current workflow</p>
                                            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-white">{activeMode.label}</h2>
                                            <p className="mt-2 text-sm leading-6 text-slate-300">{activeMode.description}</p>
                                        </div>
                                        <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${
                                            isLoading ? 'border border-brand-secondary/25 bg-brand-secondary/10 text-brand-secondary' : 'border border-emerald-400/20 bg-emerald-400/10 text-emerald-200'
                                        }`}>
                                            {isLoading ? 'Running' : 'Ready'}
                                        </span>
                                    </div>

                                    <div className="mt-6 grid gap-3">
                                        {workflowSteps.map((step) => (
                                            <div key={step.title} className="rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-3">
                                                <p className="text-sm font-semibold text-white">{step.title}</p>
                                                <p className="mt-1 text-sm leading-6 text-slate-300">{step.copy}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="rounded-[24px] border border-brand-primary/20 bg-brand-primary/8 p-5">
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-primary">Selected style</p>
                                        <p className="mt-3 text-xl font-semibold text-white">{selectedStyle}</p>
                                        <p className="mt-2 text-sm leading-6 text-slate-300">Swap styles in the control room whenever you want a different visual direction.</p>
                                    </div>
                                    <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Output stack</p>
                                        <p className="mt-3 text-xl font-semibold text-white">Preview + Prompt + Code</p>
                                        <p className="mt-2 text-sm leading-6 text-slate-300">Review the rendered result, inspect HTML/CSS, and keep the prompt in sync.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section id="workspace" className="space-y-6">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                            <div className="max-w-3xl">
                                <div className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                                    Workspace
                                </div>
                                <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
                                    A clearer build flow from brief to rendered output
                                </h2>
                                <p className="mt-3 text-base leading-7 text-slate-300">
                                    Use the left side to shape the input and keep the right side focused on review, inspection, and export.
                                </p>
                            </div>

                            <div className="rounded-[22px] border border-white/10 bg-white/[0.04] px-5 py-4">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Workspace status</p>
                                <p className="mt-2 text-sm text-slate-300">
                                    {history.length > 0 ? `${history.length} saved versions ready to restore.` : 'No saved versions yet. Your first generation will appear in history.'}
                                </p>
                            </div>
                        </div>

                        {inputMode === 'design' ? (
                            <div className="space-y-6 animate-slide-up">
                                <div className="grid gap-4 lg:grid-cols-[1.05fr,0.95fr]">
                                    <div className="glass rounded-[30px] p-6">
                                        <div className="inline-flex items-center rounded-full border border-brand-secondary/20 bg-brand-secondary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-secondary">
                                            Draw mode
                                        </div>
                                        <h3 className="mt-4 font-display text-2xl font-bold text-white">Sketch the structure before styling it</h3>
                                        <p className="mt-2 text-sm leading-6 text-slate-300">
                                            Drop cards, text blocks, forms, and other primitives onto the canvas. When the shape feels right, generate a full interface from that wireframe.
                                        </p>
                                    </div>
                                    <div className="glass rounded-[30px] p-6">
                                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Quick tips</p>
                                        <div className="mt-4 grid gap-3">
                                            {[
                                                'Use larger blocks first, then refine with smaller details.',
                                                'Keep spacing and grouping simple so the generated UI reads clearly.',
                                                'Switch back to another mode any time from the workspace controls.',
                                            ].map((tip) => (
                                                <div key={tip} className="rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-slate-300">
                                                    {tip}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <Suspense
                                    fallback={(
                                        <div className="glass rounded-[30px] p-6">
                                            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Loading editor</p>
                                            <p className="mt-3 text-sm leading-6 text-slate-300">
                                                Preparing the wireframe canvas and drawing tools.
                                            </p>
                                        </div>
                                    )}
                                >
                                    <WireframeEditor onGenerate={handleGenerateFromWireframe} isGenerating={isLoading} setInputMode={setInputMode} />
                                </Suspense>

                                {(htmlOutput || isLoading) && (
                                    <OutputTabs
                                        previewImage={previewImage}
                                        generatedPrompt={generatedPrompt}
                                        htmlOutput={htmlOutput}
                                        cssOutput={cssOutput}
                                        groundingSources={groundingSources}
                                        isLoading={isLoading}
                                        errors={error}
                                        inputMode={inputMode}
                                    />
                                )}
                            </div>
                        ) : (
                            <div className="grid items-start gap-6 xl:grid-cols-[390px,minmax(0,1fr)]">
                                <div className="animate-slide-up xl:sticky xl:top-24">
                                    <InputPanel
                                        inputMode={inputMode}
                                        setInputMode={setInputMode}
                                        userInput={userInput}
                                        setUserInput={setUserInput}
                                        urlInput={urlInput}
                                        setUrlInput={setUrlInput}
                                        screenshots={screenshots}
                                        setScreenshots={setScreenshots}
                                        pastedContent={pastedContent}
                                        setPastedContent={setPastedContent}
                                        htmlInput={htmlInput}
                                        setHtmlInput={setHtmlInput}
                                        cloneHtmlInput={cloneHtmlInput}
                                        setCloneHtmlInput={setCloneHtmlInput}
                                        selectedStyle={selectedStyle}
                                        setSelectedStyle={setSelectedStyle}
                                        visualStyles={VISUAL_STYLES}
                                        onGenerate={handleGenerate}
                                        isLoading={isLoading}
                                    />
                                </div>

                                <div className="animate-slide-up">
                                    <OutputTabs
                                        previewImage={previewImage}
                                        generatedPrompt={generatedPrompt}
                                        htmlOutput={htmlOutput}
                                        cssOutput={cssOutput}
                                        groundingSources={groundingSources}
                                        isLoading={isLoading}
                                        errors={error}
                                        inputMode={inputMode}
                                    />
                                </div>
                            </div>
                        )}
                    </section>

                    <section id="library" className="space-y-6">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                            <div className="max-w-3xl">
                                <div className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                                    Explore and restore
                                </div>
                                <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
                                    Reuse what works and keep iteration moving
                                </h2>
                                <p className="mt-3 text-base leading-7 text-slate-300">
                                    Start from a curated template, then lean on local history to compare directions, restore a stronger pass, or branch into a remix.
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
                            <InspirationPanel
                                templates={TEMPLATES}
                                generatedTemplates={generatedTemplates}
                                loadingStates={templateLoading}
                                onGenerate={handleGenerateTemplate}
                                onUse={handleUseTemplate}
                            />

                            <HistoryPanel
                                history={history}
                                clearHistory={() => setHistory([])}
                                loadHistoryItem={loadFromHistory}
                            />
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
};

export default App;
