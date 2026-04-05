import { useState, useCallback, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    enhancePrompt,
    generateImagePreview,
    modifyHtml, 
    generateHtmlFromPrompt, 
    cloneWebsite, 
    generateBlueprint, 
    generateFromWireframe,
    generateDesignSystem
} from '../services/geminiService.ts';
import { VisualStyle, HistoryItem, InputMode, Template, GroundingSource } from '../types.ts';

// These arrays are needed in both App.tsx and here depending on their usage, but the hook can accept them or import them.
// Let's pass VISUAL_STYLES from App to keep standard components aware of it if they need to.
// Actually, App imports VISUAL_STYLES and passing it is fine.
// Wait, we can define VISUAL_STYLES in constants or keep it where it is and pass it if we need to.

export function useAppLogic(VISUAL_STYLES: VisualStyle[]) {
    const location = useLocation();
    const navigate = useNavigate();

    const currentPath = location.pathname;
    let inputMode: InputMode = 'description';
    if (currentPath === '/blueprint') inputMode = 'blueprint';
    else if (currentPath === '/design-system') inputMode = 'design-system';
    else if (currentPath === '/draw') inputMode = 'design';
    else if (currentPath === '/remix') inputMode = 'modify';
    else if (currentPath === '/clone') inputMode = 'clone';
    else if (currentPath === '/describe') inputMode = 'description';
    // Fallback logic handled below or defaults to 'description'

    const setInputMode = useCallback((mode: InputMode) => {
        if (mode === 'description') navigate('/describe');
        else if (mode === 'blueprint') navigate('/blueprint');
        else if (mode === 'design-system') navigate('/design-system');
        else if (mode === 'design') navigate('/draw');
        else if (mode === 'modify') navigate('/remix');
        else if (mode === 'clone') navigate('/clone');
        else navigate('/describe');
    }, [navigate]);
    const [userInput, setUserInput] = useState<string>(''); 
    const [urlInput, setUrlInput] = useState<string>('');
    const [screenshots, setScreenshots] = useState<string[]>([]);
    const [pastedContent, setPastedContent] = useState<string>('');
    const [selectedStyle, setSelectedStyle] = useState<VisualStyle>(VISUAL_STYLES[0]);
    
    const [htmlInput, setHtmlInput] = useState<string>('');
    const [cloneHtmlInput, setCloneHtmlInput] = useState<string>('');
    
    const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
    const [htmlOutput, setHtmlOutput] = useState<string>('');
    const [cssOutput, setCssOutput] = useState<string>('');
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [groundingSources, setGroundingSources] = useState<GroundingSource[]>([]);
    
    const [generatedTemplates, setGeneratedTemplates] = useState<Record<string, string>>({});
    const [templateLoading, setTemplateLoading] = useState<Record<string, boolean>>({});

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<{ prompt?: string, image?: string, html?: string, css?: string }>({});
    const [history, setHistory] = useState<HistoryItem[]>([]);

    const isInitialMount = useRef(true);
    
    useEffect(() => {
        try {
            const storedHistory = localStorage.getItem('promptHistory');
            if (storedHistory) {
                setHistory(JSON.parse(storedHistory));
            }
        } catch (e) {
            console.error("Failed to parse history", e);
        }
    }, []);

    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        
        if (history.length > 0) {
            try {
                localStorage.setItem('promptHistory', JSON.stringify(history));
            } catch (e) {
                console.warn("Failed to save history to localStorage (quota exceeded). Attempting to save fewer items.", e);
                try {
                    // Try saving only the last 5 items
                    const reducedHistory = history.slice(0, 5);
                    localStorage.setItem('promptHistory', JSON.stringify(reducedHistory));
                } catch (e2) {
                     console.warn("Failed to save reduced history to localStorage. Attempting to save without heavy assets.", e2);
                     // If it still fails, strip images from the last 5 items
                     try {
                        const noImageHistory = history.slice(0, 5).map(item => ({
                            ...item,
                            previewImage: null,
                            screenshots: []
                        }));
                        localStorage.setItem('promptHistory', JSON.stringify(noImageHistory));
                     } catch (e3) {
                         console.error("Failed to save minimal history. Giving up.", e3);
                     }
                }
            }
        } else {
            localStorage.removeItem('promptHistory');
        }
    }, [history]);

    const resetOutputs = () => {
        setIsLoading(true);
        setError({});
        setGeneratedPrompt('');
        setHtmlOutput('');
        setCssOutput('');
        setPreviewImage(null);
        setGroundingSources([]);
    };

    const handleGenerateTemplate = useCallback(async (templateId: string, prompt: string, style: VisualStyle) => {
        setTemplateLoading(prev => ({ ...prev, [templateId]: true }));
        try {
            const { html } = await generateHtmlFromPrompt(`${prompt} Style: ${style}`);
            setGeneratedTemplates(prev => ({ ...prev, [templateId]: html }));
        } catch (err) {
            console.error(err);
        } finally {
            setTemplateLoading(prev => ({ ...prev, [templateId]: false }));
        }
    }, []);

    const handleUseTemplate = useCallback((html: string, target: 'base' | 'style') => {
        setInputMode('modify');
        if (target === 'base') setHtmlInput(html);
        else setCloneHtmlInput(html);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);


    const handleGenerateFromWireframe = useCallback(async (base64Image: string) => {
        resetOutputs();
        try {
            const { html, css } = await generateFromWireframe(base64Image);
            setHtmlOutput(html);
            setCssOutput(css);
            setPreviewImage(base64Image); // Use the drawn wireframe as the preview image
            setHistory(prev => [{
                id: Date.now().toString(),
                input: 'Interactive Wireframe',
                inputMode: 'design',
                previewImage: base64Image,
                htmlOutput: html,
                cssOutput: css,
            }, ...prev.slice(0, 19)]);
        } catch (err: any) {
            console.error(err);
            const errorMessage = err?.message || 'Generation failed';
            setError({ html: errorMessage });
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleGenerate = useCallback(async () => {
        resetOutputs();

        try {
            if (inputMode === 'description') {
                const finalPrompt = await enhancePrompt(userInput, selectedStyle);
                setGeneratedPrompt(finalPrompt);
                
                const [img, result] = await Promise.all([
                    generateImagePreview(finalPrompt).catch(() => null),
                    generateHtmlFromPrompt(finalPrompt).catch(() => null)
                ]);

                if (img) setPreviewImage(img);
                if (result) {
                    setHtmlOutput(result.html);
                    setCssOutput(result.css);
                }

                setHistory(prev => [{
                    id: Date.now().toString(),
                    input: userInput,
                    style: selectedStyle,
                    output: finalPrompt,
                    previewImage: img,
                    htmlOutput: result?.html || undefined,
                    cssOutput: result?.css || undefined,
                    inputMode,
                }, ...prev.slice(0, 19)]);

            } else if (inputMode === 'modify') {
                const { html, css } = await modifyHtml(htmlInput, cloneHtmlInput);
                setHtmlOutput(html);
                setCssOutput(css);
                setHistory(prev => [{
                    id: Date.now().toString(),
                    input: 'HTML Remix',
                    inputMode,
                    htmlInput,
                    cloneHtmlInput,
                    htmlOutput: html,
                    cssOutput: css,
                }, ...prev.slice(0, 19)]);
            } else if (inputMode === 'clone') {
                if (!urlInput.trim() && screenshots.length === 0 && !pastedContent.trim()) {
                    alert('Please enter a website URL, upload screenshots, or paste content to clone.');
                    setIsLoading(false);
                    return;
                }
                const { html, css, sources } = await cloneWebsite(urlInput, screenshots, pastedContent);
                setHtmlOutput(html);
                setCssOutput(css);
                setGroundingSources(sources);
                setHistory(prev => [{
                    id: Date.now().toString(),
                    input: urlInput ? `Clone: ${urlInput}` : 'Clone from Screenshots/Content',
                    inputMode,
                    urlInput,
                    screenshots,
                    pastedContent,
                    htmlOutput: html,
                    cssOutput: css,
                    groundingSources: sources,
                }, ...prev.slice(0, 19)]);
            } else if (inputMode === 'blueprint') {
                const { html, css } = await generateBlueprint(userInput);
                setHtmlOutput(html);
                setCssOutput(css);
                setHistory(prev => [{
                    id: Date.now().toString(),
                    input: `Blueprint: ${userInput}`,
                    inputMode,
                    htmlOutput: html,
                    cssOutput: css,
                }, ...prev.slice(0, 19)]);
            } else if (inputMode === 'design-system') {
                const designSystem = await generateDesignSystem(userInput);
                
                // Now use the design system to generate a prompt for Gemini
                const systemPrompt = `Generate a high-fidelity UI based on this design system:
                - Primary Color: ${designSystem.primary_color}
                - Secondary Color: ${designSystem.secondary_color}
                - Accent Color: ${designSystem.accent_color}
                - Foreground Color: ${designSystem.foreground_color}
                - Font Family: ${designSystem.font_family}
                - Layout Type: ${designSystem.layout_type}
                - Sections: ${designSystem.sections.join(', ')}
                
                The user wants: ${userInput}`;
                
                const { html, css } = await generateHtmlFromPrompt(systemPrompt);
                setHtmlOutput(html);
                setCssOutput(css);
                setGeneratedPrompt(systemPrompt);
                
                setHistory(prev => [{
                    id: Date.now().toString(),
                    input: `Design System: ${userInput}`,
                    inputMode,
                    htmlOutput: html,
                    cssOutput: css,
                }, ...prev.slice(0, 19)]);
            }
        } catch (err: any) {
            console.error(err);
            const errorMessage = err?.message || 'Generation failed';
            setError({ html: errorMessage });
        } finally {
            setIsLoading(false);
        }
    }, [userInput, selectedStyle, inputMode, htmlInput, cloneHtmlInput, urlInput, screenshots, pastedContent]);
    
    const loadFromHistory = (item: HistoryItem) => {
        window.scrollTo(0, 0);
        setInputMode(item.inputMode || 'description');
        setHtmlOutput(item.htmlOutput || '');
        setCssOutput(item.cssOutput || '');
        
        if (item.inputMode === 'description') {
            setUserInput(item.input || '');
            setSelectedStyle(item.style || VISUAL_STYLES[0]);
            setGeneratedPrompt(item.output || '');
            setPreviewImage(item.previewImage || null);
        } else if (item.inputMode === 'modify') {
            setHtmlInput(item.htmlInput || '');
            setCloneHtmlInput(item.cloneHtmlInput || '');
        } else if (item.inputMode === 'clone') {
            setUrlInput(item.urlInput || '');
            setScreenshots(item.screenshots || []);
            setPastedContent(item.pastedContent || '');
            setGroundingSources(item.groundingSources || []);
        } else if (item.inputMode === 'design-system') {
            setUserInput(item.input.replace('Design System: ', '') || '');
        } else if (item.inputMode === 'design') {
            setPreviewImage(item.previewImage || null);
        }
    };

    return {
        state: {
            inputMode, userInput, urlInput, screenshots, pastedContent, selectedStyle,
            htmlInput, cloneHtmlInput, generatedPrompt, htmlOutput, cssOutput,
            previewImage, groundingSources, generatedTemplates, templateLoading,
            isLoading, error, history
        },
        actions: {
            setInputMode, setUserInput, setUrlInput, setScreenshots, setPastedContent,
            setSelectedStyle, setHtmlInput, setCloneHtmlInput, setHistory,
            handleGenerateTemplate, handleUseTemplate, handleGenerateFromWireframe,
            handleGenerate, loadFromHistory
        }
    };
}
