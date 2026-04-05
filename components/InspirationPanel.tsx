import React from 'react';
import { Template, VisualStyle } from '../types.ts';
import { LoadingSpinner, GenerateIcon, CodeBracketIcon, SparkleIcon } from './icons.tsx';

interface TemplatesPanelProps {
    templates: Template[];
    generatedTemplates: Record<string, string>;
    loadingStates: Record<string, boolean>;
    onGenerate: (templateId: string, prompt: string, style: VisualStyle) => void;
    onUse: (html: string, target: 'base' | 'style') => void;
}

const TemplatesPanel: React.FC<TemplatesPanelProps> = ({ templates, generatedTemplates, loadingStates, onGenerate, onUse }) => {
    return (
        <div className="glass h-full rounded-[30px] p-5 sm:p-6">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <div className="inline-flex items-center rounded-full border border-brand-secondary/20 bg-brand-secondary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-secondary">
                        Starters
                    </div>
                    <h2 className="mt-4 font-display text-2xl font-bold tracking-tight text-white">Curated starting points</h2>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
                        Generate a draft from a well-shaped template, then use it as a base or a visual reference when you want the workspace to feel less blank.
                    </p>
                </div>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-medium text-slate-300">
                    {templates.length} templates
                </span>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {templates.map(template => {
                    const isLoading = loadingStates[template.id];
                    const generatedHtml = generatedTemplates[template.id];
                    const promptPreview = template.prompt.length > 108 ? `${template.prompt.slice(0, 108)}…` : template.prompt;

                    return (
                        <div
                            key={template.id}
                            className="flex flex-col gap-4 rounded-[24px] border border-white/10 bg-white/[0.03] p-5 transition duration-300 hover:border-white/20 hover:bg-white/[0.05]"
                        >
                            <div>
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-base font-semibold text-white">{template.name}</p>
                                    <span className="rounded-full border border-brand-primary/20 bg-brand-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-primary">
                                        {template.style}
                                    </span>
                                </div>
                                <p className="mt-3 text-sm leading-6 text-slate-300">{promptPreview}</p>
                            </div>

                            {isLoading ? (
                                <button
                                    disabled
                                    className="flex w-full cursor-wait items-center justify-center gap-2 rounded-2xl bg-white/[0.04] py-3 text-sm font-semibold text-slate-300"
                                >
                                    <LoadingSpinner className="h-4 w-4" /> Generating…
                                </button>
                            ) : generatedHtml ? (
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => onUse(generatedHtml, 'base')}
                                        className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/[0.06]"
                                    >
                                        <CodeBracketIcon className="h-4 w-4" /> Use as base
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onUse(generatedHtml, 'style')}
                                        className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-brand-secondary/20 bg-brand-secondary/10 px-4 py-3 text-sm font-semibold text-brand-secondary transition hover:border-brand-secondary/35 hover:bg-brand-secondary/15"
                                    >
                                        <SparkleIcon className="h-4 w-4" /> Apply style
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => onGenerate(template.id, template.prompt, template.style)}
                                    className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-brand-primary/20 bg-brand-primary/8 px-4 py-3 text-sm font-semibold text-brand-primary transition hover:border-brand-primary/35 hover:bg-brand-primary/12"
                                >
                                    <GenerateIcon className="h-4 w-4" /> Generate draft
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TemplatesPanel;
