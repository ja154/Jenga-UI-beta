import React, { useRef, useState, useEffect, useCallback } from 'react';
import { GlobeAltIcon } from './icons.tsx';

type Viewport = 'mobile' | 'tablet' | 'desktop';

interface HtmlPreviewPanelProps {
    html: string;
    css?: string;
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
        <div className="bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.1),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] p-4">
            {children}
        </div>
    </div>
);

const isFullHtmlDocument = (html: string): boolean => {
    const trimmed = html.trimStart().toLowerCase();
    return trimmed.startsWith('<!doctype') || trimmed.startsWith('<html');
};

const SCROLL_OVERRIDE_CSS = `
<style id="__jenga_scroll_fix__">
  html { height: auto !important; min-height: 100% !important; overflow-x: hidden !important; overflow-y: visible !important; }
  body { height: auto !important; min-height: 100% !important; overflow-x: hidden !important; overflow-y: visible !important; }
</style>`;

const HEIGHT_REPORTER_SCRIPT = `
<script id="__jenga_height_reporter__">
  function reportHeight() {
    var h = Math.max(
      document.body.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight
    );
    parent.postMessage({ type: 'iframeHeight', height: h }, '*');
  }
  window.addEventListener('load', function() {
    reportHeight();
    setTimeout(reportHeight, 300);
    setTimeout(reportHeight, 1000);
    var ro = new ResizeObserver(reportHeight);
    ro.observe(document.body);
    ro.observe(document.documentElement);
  });
  document.addEventListener('DOMContentLoaded', reportHeight);
<\/script>`;

const injectIntoHead = (html: string, injections: string): string => {
    const headCloseIdx = html.search(/<\/head\s*>/i);
    if (headCloseIdx !== -1) {
        return html.slice(0, headCloseIdx) + injections + html.slice(headCloseIdx);
    }
    const htmlOpenIdx = html.search(/<html[^>]*>/i);
    if (htmlOpenIdx !== -1) {
        const afterHtml = html.indexOf('>', htmlOpenIdx) + 1;
        return html.slice(0, afterHtml) + '<head>' + injections + '</head>' + html.slice(afterHtml);
    }
    return injections + html;
};

const getSrcDoc = (html: string, css?: string): string => {
    const injections = SCROLL_OVERRIDE_CSS + HEIGHT_REPORTER_SCRIPT;

    if (isFullHtmlDocument(html)) {
        let doc = html;
        if (css && css.trim()) {
            doc = injectIntoHead(doc, `<style>${css}</style>`);
        }
        return injectIntoHead(doc, injections);
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"><\/script>
    ${SCROLL_OVERRIDE_CSS}
    <style>
        body { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; background: white; margin: 0; padding: 0; }
        ${css || ''}
    </style>
    ${HEIGHT_REPORTER_SCRIPT}
    <title>Preview</title>
</head>
<body>
    ${html}
</body>
</html>`;
};

const DeviceFrame: React.FC<{ children: React.ReactNode; device: 'mobile' | 'tablet' }> = ({ children, device }) => {
    const frameClasses = {
        mobile: 'w-[395px] h-[797px] p-3 bg-slate-950 border border-white/10 rounded-[40px] shadow-[0_28px_70px_rgba(2,6,23,0.38)] transition-all duration-300',
        tablet: 'w-[808px] h-[1064px] p-3 bg-slate-950 border border-white/10 rounded-[28px] shadow-[0_28px_70px_rgba(2,6,23,0.38)] transition-all duration-300',
    };
    return (
        <div className={frameClasses[device]}>
            <div className="h-full w-full overflow-auto rounded-[24px] border border-white/6 bg-white">
                {children}
            </div>
        </div>
    );
};

const MIN_IFRAME_HEIGHT = 600;

const HtmlPreviewPanel: React.FC<HtmlPreviewPanelProps> = ({ html, css, isLoading, error, viewport }) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [iframeHeight, setIframeHeight] = useState(MIN_IFRAME_HEIGHT);

    const handleMessage = useCallback((e: MessageEvent) => {
        if (e.data && e.data.type === 'iframeHeight' && typeof e.data.height === 'number') {
            const h = Math.max(e.data.height, MIN_IFRAME_HEIGHT);
            setIframeHeight(h);
        }
    }, []);

    useEffect(() => {
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [handleMessage]);

    useEffect(() => {
        setIframeHeight(MIN_IFRAME_HEIGHT);
    }, [html]);

    const handleIframeLoad = () => {
        try {
            const iframe = iframeRef.current;
            if (!iframe) return;
            const doc = iframe.contentDocument || iframe.contentWindow?.document;
            if (doc) {
                const h = Math.max(
                    doc.body?.scrollHeight || 0,
                    doc.body?.offsetHeight || 0,
                    doc.documentElement?.scrollHeight || 0,
                    doc.documentElement?.offsetHeight || 0,
                    MIN_IFRAME_HEIGHT
                );
                setIframeHeight(h);
            }
        } catch {
            // cross-origin fallback — postMessage handles it
        }
    };

    if (isLoading) {
        return (
            <div className="flex min-h-[600px] w-full flex-col items-center justify-center rounded-[20px] border border-dashed border-white/12 bg-brand-surface animate-pulse-fast">
                <GlobeAltIcon className="mb-4 h-16 w-16 text-slate-500" />
                <div className="mt-2 h-4 w-1/3 rounded bg-slate-800"></div>
                <div className="mt-2 h-3 w-1/4 rounded bg-slate-800"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex min-h-[600px] w-full flex-col items-center justify-center rounded-[20px] border border-dashed border-red-500/50 bg-red-900/20 p-4 text-red-200">
                <h3 className="text-lg font-semibold">Error</h3>
                <p className="text-sm text-center mt-2">{error}</p>
            </div>
        );
    }

    if (!html) {
        return (
            <div className="flex min-h-[600px] w-full flex-col items-center justify-center rounded-[20px] border border-dashed border-white/12 bg-brand-bg/60 text-brand-muted">
                <GlobeAltIcon className="mb-4 h-16 w-16 opacity-50" />
                <h3 className="text-lg font-semibold text-slate-200">Rendered preview</h3>
                <p className="text-sm text-slate-400 opacity-80">Generated HTML will be rendered here for inspection.</p>
            </div>
        );
    }

    const iframeEl = (
        <iframe
            ref={iframeRef}
            key={html.slice(0, 100)}
            srcDoc={getSrcDoc(html, css)}
            title="HTML Preview"
            sandbox="allow-scripts allow-same-origin"
            onLoad={handleIframeLoad}
            style={{
                width: '100%',
                height: `${iframeHeight}px`,
                border: 'none',
                display: 'block',
                background: 'white',
                overflow: 'hidden',
            }}
        />
    );

    if (viewport === 'mobile' || viewport === 'tablet') {
        return (
            <div className="origin-top scale-[0.6] transform sm:scale-75">
                <DeviceFrame device={viewport}>{iframeEl}</DeviceFrame>
            </div>
        );
    }

    return <BrowserFrame label="Rendered output">{iframeEl}</BrowserFrame>;
};

export default HtmlPreviewPanel;
