import React, { useState, useEffect } from 'react';
import PreviewPanel from './PreviewPanel.tsx';
import OutputPanelContent from './OutputPanel.tsx';
import HtmlOutputPanelContent from './HtmlOutputPanel.tsx';
import CssOutputPanelContent from './CssOutputPanel.tsx';
import HtmlPreviewPanel from './HtmlPreviewPanel.tsx';
import BlueprintWireframe from './BlueprintWireframe.tsx';
import { 
    PhotoIcon, 
    SparkleIcon, 
    CodeBracketIcon, 
    CopyIcon, 
    CheckIcon, 
    GlobeAltIcon,
    DevicePhoneMobileIcon,
    DeviceTabletIcon,
    ComputerDesktopIcon,
    ArrowTopRightOnSquareIcon,
    LinkIcon
} from './icons.tsx';
import { InputMode, GroundingSource } from '../types.ts';

interface OutputTabsProps {
    previewImage: string | null;
    generatedPrompt: string;
    htmlOutput: string;
    cssOutput?: string;
    groundingSources?: GroundingSource[];
    isLoading: boolean;
    errors: {
        prompt?: string;
        image?: string;
        html?: string;
        css?: string;
    };
    inputMode: InputMode;
}

const GroundingSources: React.FC<{ sources: GroundingSource[] }> = ({ sources }) => {
    if (!sources || sources.length === 0) return null;
    return (
        <div className="mt-4 w-full rounded-[22px] border border-brand-primary/20 bg-brand-primary/6 p-4">
            <h4 className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.24em] text-brand-primary">
                <LinkIcon className="h-3.5 w-3.5" /> Sources analyzed
            </h4>
            <ul className="space-y-2">
                {sources.map((s, i) => s.web && (
                    <li key={i}>
                        <a
                            href={s.web.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block truncate rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-xs text-slate-300 transition hover:border-white/18 hover:text-white"
                        >
                            {s.web.title || s.web.uri}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
};

type Tab = 'preview' | 'prompt' | 'code' | 'css' | 'blueprint';
type Viewport = 'mobile' | 'tablet' | 'desktop';

const OutputTabs: React.FC<OutputTabsProps> = ({
    previewImage,
    generatedPrompt,
    htmlOutput,
    cssOutput,
    groundingSources = [],
    isLoading,
    errors,
    inputMode,
}) => {
    const [activeTab, setActiveTab] = useState<Tab>('preview');
    const [copiedStates, setCopiedStates] = useState({ prompt: false, code: false, css: false });
    const [viewport, setViewport] = useState<Viewport>('desktop');

    const isModifyOrClone = inputMode === 'modify' || inputMode === 'clone' || inputMode === 'design';

    useEffect(() => {
        if (isModifyOrClone && activeTab === 'prompt') {
            setActiveTab('preview');
        }
    }, [inputMode, activeTab, isModifyOrClone]);

    useEffect(() => {
        if (isLoading) setActiveTab('preview');
    }, [isLoading]);

    const handleCopy = (type: 'prompt' | 'code' | 'css') => {
        let textToCopy = '';
        if (type === 'prompt') textToCopy = generatedPrompt;
        else if (type === 'code') textToCopy = htmlOutput;
        else if (type === 'css') textToCopy = cssOutput || '';

        if (textToCopy) {
            navigator.clipboard.writeText(textToCopy);
            setCopiedStates(prev => ({ ...prev, [type]: true }));
            setTimeout(() => setCopiedStates(prev => ({ ...prev, [type]: false })), 2000);
        }
    };

    const isFullHtmlDocument = (html: string): boolean => {
        const trimmed = html.trimStart().toLowerCase();
        return trimmed.startsWith('<!doctype') || trimmed.startsWith('<html');
    };

    const handleOpenInNewTab = () => {
        if (!htmlOutput) return;
        let fullHtml: string;
        if (isFullHtmlDocument(htmlOutput)) {
            fullHtml = cssOutput && cssOutput.trim()
                ? htmlOutput.replace('</head>', `<style>${cssOutput}</style>\n</head>`)
                : htmlOutput;
        } else {
            fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        html, body { margin: 0; padding: 0; }
        body { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
        ${cssOutput || ''}
    </style>
    <title>JengaUI Preview</title>
</head>
<body>
    ${htmlOutput}
</body>
</html>`;
        }
        const blob = new Blob([fullHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    };

    const tabsConfig: { id: Tab; label: string; icon: React.FC<any>; description: string }[] = [];
    if (isModifyOrClone) {
        tabsConfig.push({ id: 'preview', label: 'Preview', icon: GlobeAltIcon, description: 'Inspect the rendered result in context.' });
        if (inputMode !== 'design') {
            tabsConfig.push({ id: 'blueprint', label: 'Blueprint', icon: PhotoIcon, description: 'See the structural layout reference.' });
        }
        tabsConfig.push({ id: 'code', label: 'HTML', icon: CodeBracketIcon, description: 'Review and copy the generated markup.' });
        tabsConfig.push({ id: 'css', label: 'CSS', icon: SparkleIcon, description: 'Review any custom styling output.' });
    } else {
        tabsConfig.push({ id: 'preview', label: 'Preview', icon: PhotoIcon, description: 'Compare the visual render before exporting code.' });
        tabsConfig.push({ id: 'blueprint', label: 'Blueprint', icon: PhotoIcon, description: 'Review the layout skeleton and system framing.' });
        tabsConfig.push({ id: 'prompt', label: 'Prompt', icon: SparkleIcon, description: 'See the prompt that drove the generated output.' });
        tabsConfig.push({ id: 'code', label: 'HTML', icon: CodeBracketIcon, description: 'Inspect the generated markup and copy it fast.' });
        tabsConfig.push({ id: 'css', label: 'CSS', icon: SparkleIcon, description: 'Keep any extra styling or animations alongside HTML.' });
    }

    const activeTabMeta = tabsConfig.find((tab) => tab.id === activeTab) ?? tabsConfig[0];
    const copyTarget = activeTab === 'prompt' || activeTab === 'code' || activeTab === 'css' ? activeTab : null;
    const statusLabel = isLoading
        ? 'Generating'
        : htmlOutput || previewImage
        ? 'Ready'
        : 'Waiting';

    const PreviewComponent = (inputMode === 'clone' || inputMode === 'modify') || htmlOutput ? (
        <HtmlPreviewPanel
            html={htmlOutput}
            css={cssOutput}
            isLoading={isLoading && !htmlOutput}
            error={errors.html || null}
            viewport={viewport}
        />
    ) : (
        <PreviewPanel
            imageUrl={previewImage}
            isLoading={isLoading && !previewImage}
            error={errors.image || null}
            viewport={viewport}
        />
    );

    return (
        <div className="glass overflow-hidden rounded-[30px]">
            <div className="border-b border-white/10 px-5 py-6 sm:px-6">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center rounded-full border border-brand-primary/20 bg-brand-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-primary">
                            Results workspace
                        </div>
                        <h2 className="mt-4 font-display text-2xl font-bold tracking-tight text-white">{activeTabMeta.label}</h2>
                        <p className="mt-2 text-sm leading-6 text-slate-300">{activeTabMeta.description}</p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Status</p>
                            <p className="mt-2 text-base font-semibold text-white">{statusLabel}</p>
                        </div>
                        <div className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Viewport</p>
                            <p className="mt-2 text-base font-semibold text-white">{viewport}</p>
                        </div>
                        <div className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Sources</p>
                            <p className="mt-2 text-base font-semibold text-white">{groundingSources.length}</p>
                        </div>
                    </div>
                </div>

                <div className="mt-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex flex-wrap gap-2">
                        {tabsConfig.map(tab => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;

                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                                        isActive
                                            ? 'border-brand-secondary/35 bg-brand-secondary/12 text-white'
                                            : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20 hover:bg-white/[0.05] hover:text-white'
                                    }`}
                                >
                                    <Icon className="h-4 w-4" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {activeTab === 'preview' && !isLoading && htmlOutput && (
                            <>
                                <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1">
                                    <button
                                        type="button"
                                        onClick={() => setViewport('mobile')}
                                        title="Mobile View"
                                        className={`rounded-full p-2 transition ${viewport === 'mobile' ? 'bg-white/[0.12] text-white' : 'text-slate-400 hover:text-white'}`}
                                    >
                                        <DevicePhoneMobileIcon className="h-4 w-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setViewport('tablet')}
                                        title="Tablet View"
                                        className={`rounded-full p-2 transition ${viewport === 'tablet' ? 'bg-white/[0.12] text-white' : 'text-slate-400 hover:text-white'}`}
                                    >
                                        <DeviceTabletIcon className="h-4 w-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setViewport('desktop')}
                                        title="Desktop View"
                                        className={`rounded-full p-2 transition ${viewport === 'desktop' ? 'bg-white/[0.12] text-white' : 'text-slate-400 hover:text-white'}`}
                                    >
                                        <ComputerDesktopIcon className="h-4 w-4" />
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleOpenInNewTab}
                                    title="Open in New Tab"
                                    className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-white/20 hover:text-white"
                                >
                                    <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                                    Open tab
                                </button>
                            </>
                        )}

                        {copyTarget && (
                            <button
                                type="button"
                                onClick={() => handleCopy(copyTarget)}
                                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-white/20 hover:text-white"
                            >
                                {copiedStates[copyTarget]
                                    ? <CheckIcon className="h-4 w-4 text-emerald-400" />
                                    : <CopyIcon className="h-4 w-4" />}
                                {copiedStates[copyTarget] ? 'Copied' : `Copy ${copyTarget.toUpperCase()}`}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="p-4 sm:p-6">
                <div className="min-h-[760px] w-full rounded-[26px] border border-white/10 bg-brand-bg/35 p-3 sm:p-4">
                    <div className="flex w-full flex-col items-start justify-start animate-fade-in">
                        {activeTab === 'preview' && PreviewComponent}
                        {activeTab === 'blueprint' && (
                            <div className="min-h-[600px] w-full overflow-hidden rounded-[22px] border border-white/10 bg-slate-950/70">
                                <BlueprintWireframe />
                            </div>
                        )}
                        {activeTab === 'prompt' && !isModifyOrClone && (
                            <OutputPanelContent prompt={generatedPrompt} isLoading={isLoading} error={errors.prompt || null} />
                        )}
                        {activeTab === 'code' && (
                            <HtmlOutputPanelContent html={htmlOutput} isLoading={isLoading} error={errors.html || null} />
                        )}
                        {activeTab === 'css' && (
                            <CssOutputPanelContent css={cssOutput || ''} isLoading={isLoading} error={errors.css || null} />
                        )}
                        
                        {!isLoading && groundingSources.length > 0 && inputMode === 'clone' && (
                             <GroundingSources sources={groundingSources} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OutputTabs;
