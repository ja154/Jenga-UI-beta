import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import { scrapeWebsite, type ScrapeResult } from './scrapeService.ts';
import { ApiError } from '../utils/errors.ts';

const CLONE_MODEL = 'gemini-3.1-pro-preview';
const MAX_TOKENS = 32768;
const HTML_CONTEXT_CHARS = 40_000;

const UI_UX_PRO_MAX_RULES = `
CRITICAL UI/UX PRO MAX RULES:
1. Icons: NEVER use emojis for structural icons. Use vector icons (e.g., Lucide, Phosphor, Heroicons). Ensure consistent sizing (e.g., 24px) and stroke width.
2. Interaction: Use color, opacity, or elevation for hover/press states. DO NOT use layout-shifting transforms that move surrounding content.
3. Touch Targets: Ensure all interactive elements have a minimum 44x44px tap area.
4. Contrast & Theming: Maintain >=4.5:1 text contrast. Ensure borders and dividers are visible in both light and dark modes. Use semantic color tokens.
5. Spacing & Layout: Use a strict 4px/8px spacing rhythm (e.g., p-2, p-4, gap-4). Keep predictable content widths and readable text measures (max-w-prose for long text).
6. Accessibility: Ensure proper focus states, semantic HTML tags, and aria-labels for icon-only buttons.
`;

let cachedApiKey: string | null = null;
let cachedClient: GoogleGenAI | null = null;

const getAiClient = (): GoogleGenAI => {
    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (!apiKey) {
        throw new ApiError(500, 'GEMINI_API_KEY is not configured on the server');
    }

    if (!cachedClient || cachedApiKey !== apiKey) {
        cachedClient = new GoogleGenAI({ apiKey });
        cachedApiKey = apiKey;
    }

    return cachedClient;
};

export interface HtmlCssResult {
    html: string;
    css: string;
}

export interface CloneWebsiteResult extends HtmlCssResult {
    sources: unknown[];
}

const stripDataUriPrefix = (base64Value: string): string => {
    const commaIndex = base64Value.indexOf(',');
    return commaIndex !== -1 ? base64Value.slice(commaIndex + 1) : base64Value;
};

const safeHtmlTruncate = (html: string, maxChars: number): string => {
    if (html.length <= maxChars) {
        return html;
    }

    const slice = html.slice(0, maxChars);
    const lastClose = slice.lastIndexOf('>');
    return lastClose !== -1 ? slice.slice(0, lastClose + 1) : slice;
};

const extractJson = (raw: string): HtmlCssResult | null => {
    const attempts: string[] = [
        raw.trim(),
        raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim(),
        (() => {
            const start = raw.indexOf('{');
            const end = raw.lastIndexOf('}');
            return start !== -1 && end > start ? raw.slice(start, end + 1) : '';
        })(),
    ];

    for (const attempt of attempts) {
        if (!attempt) {
            continue;
        }

        try {
            const parsed = JSON.parse(attempt) as Partial<HtmlCssResult>;
            if (typeof parsed.html === 'string') {
                return {
                    html: parsed.html,
                    css: typeof parsed.css === 'string' ? parsed.css : '',
                };
            }
        } catch {
            // Try the next format.
        }
    }

    const htmlMatch = raw.match(/"html"\s*:\s*"([\s\S]*?)(?<!\\)",\s*"css"/);
    const cssMatch = raw.match(/"css"\s*:\s*"([\s\S]*?)(?<!\\)"[\s\n]*\}/);

    if (!htmlMatch) {
        return null;
    }

    return {
        html: htmlMatch[1]
            .replace(/\\n/g, '\n')
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, '\\'),
        css: cssMatch
            ? cssMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\')
            : '',
    };
};

const isHtmlComplete = (html: string): boolean => /<\/html\s*>/i.test(html.trimEnd());

const getMimeType = (base64Value: string): string => {
    const match = base64Value.match(/^data:([^;]+);base64,/);
    return match ? match[1] : 'image/png';
};

const requestContinuation = async (partialHtml: string, originalPrompt: string): Promise<string> => {
    const continuationSystem = `You are completing a partially generated HTML page.
You will receive the HTML generated so far. Continue from EXACTLY where it left
off and complete the page through to </html>. Output ONLY the continuation HTML
- no JSON, no fences, no repetition of what was already generated.
MANDATORY: Your output must end with </footer></body></html>.`;

    const continuationPrompt = `${originalPrompt}

The previous generation was cut off. Here is what was generated so far:
--- PARTIAL HTML (continue from here) ---
${partialHtml.slice(-8000)}
--- END OF PARTIAL ---

Complete the remaining HTML now, starting from where it cut off.
You MUST include the footer section and close all open tags before </body></html>.`;

    const response = await getAiClient().models.generateContent({
        model: CLONE_MODEL,
        contents: { role: 'user', parts: [{ text: continuationPrompt }] },
        config: {
            systemInstruction: continuationSystem,
            maxOutputTokens: MAX_TOKENS,
            temperature: 0.1,
        },
    });

    return response.text ?? '';
};

export const enhancePrompt = async (userInput: string, style: string): Promise<string> => {
    const systemInstruction = 'You are an expert UI/UX designer and prompt engineer. Your task is to expand simple UI descriptions into rich, detailed, and structured prompts.';
    const prompt = `
The user wants a UI for: "${userInput}"
The desired visual style is: "${style}"

Generate a prompt that includes detailed descriptions for:
- **## Overall Vibe & Style**
- **## Color Palette**
- **## Typography**
- **## Layout & Composition**
- **## Key UI Components**
- **## Iconography**
- **## Micro-interactions & Animations (Subtle)**

Your response should ONLY be the generated prompt text.
    `;

    try {
        const response = await getAiClient().models.generateContent({
            model: 'gemini-3.1-pro-preview',
            contents: prompt,
            config: {
                systemInstruction,
                thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
            },
        });

        return response.text || '';
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to enhance prompt';
        throw new ApiError(500, message);
    }
};

export const generateImagePreview = async (prompt: string): Promise<string> => {
    const imagePrompt = `A high-fidelity UI mockup for a web/mobile application, embodying the following description. Focus on realism and aesthetics. UI design, UX, user interface.\n\n${prompt}`;

    try {
        const response = await getAiClient().models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: imagePrompt }] },
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData?.data) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }

        throw new ApiError(500, 'No image was generated');
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }

        const message = error instanceof Error ? error.message : 'Failed to generate image preview';
        throw new ApiError(500, message);
    }
};

export const generateHtmlFromPrompt = async (prompt: string): Promise<HtmlCssResult> => {
    const systemInstruction = 'You are an expert front-end developer. Convert UI prompts into single, clean, accessible, and responsive HTML components using Tailwind CSS. Also provide any necessary custom CSS for animations, keyframes, or specific styles not covered by Tailwind.\n'
        + UI_UX_PRO_MAX_RULES;

    const userPrompt = `Convert this UI prompt into a single, clean, accessible, and responsive HTML snippet using Tailwind CSS.
**PROMPT:** ${prompt}
Return a JSON object with 'html' and 'css' fields. The 'html' field should contain the raw HTML code (no markdown fences). The 'css' field should contain any custom CSS needed (e.g., keyframes, custom classes).`;

    try {
        const response = await getAiClient().models.generateContent({
            model: 'gemini-3.1-pro-preview',
            contents: userPrompt,
            config: {
                systemInstruction,
                thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        html: { type: Type.STRING },
                        css: { type: Type.STRING },
                    },
                    required: ['html', 'css'],
                },
            },
        });

        const jsonResponse = JSON.parse(response.text || '{}') as Partial<HtmlCssResult>;
        return {
            html: jsonResponse.html || '',
            css: jsonResponse.css || '',
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to generate HTML';
        throw new ApiError(500, message);
    }
};

export const modifyHtml = async (originalHtml: string, styleHtml: string): Promise<HtmlCssResult> => {
    const systemInstruction = 'You are an expert UI developer specializing in design system migration and restyling.\n'
        + UI_UX_PRO_MAX_RULES;

    const userPrompt = `
Re-style the following "Original HTML" using the design language and Tailwind CSS classes from the "Style HTML".
Preserve original content and improve accessibility.
ORIGINAL: ${originalHtml}
STYLE: ${styleHtml}
Return a JSON object with 'html' and 'css' fields. The 'html' field should contain the raw HTML code. The 'css' field should contain any custom CSS needed.
`;

    try {
        const response = await getAiClient().models.generateContent({
            model: 'gemini-3.1-pro-preview',
            contents: userPrompt,
            config: {
                systemInstruction,
                thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        html: { type: Type.STRING },
                        css: { type: Type.STRING },
                    },
                    required: ['html', 'css'],
                },
            },
        });

        const jsonResponse = JSON.parse(response.text || '{}') as Partial<HtmlCssResult>;
        return {
            html: jsonResponse.html || '',
            css: jsonResponse.css || '',
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to modify HTML';
        throw new ApiError(500, message);
    }
};

export const generateBlueprint = async (prompt: string): Promise<HtmlCssResult> => {
    const systemInstruction = 'You are an expert UX designer. Convert UI prompts into low-fidelity, structural wireframes/blueprints using HTML and Tailwind CSS. Focus on layout, hierarchy, and content placement. Use a grayscale palette, simple boxes, and placeholder text (Lorem Ipsum). Avoid high-fidelity styles, images, or complex colors.\n'
        + UI_UX_PRO_MAX_RULES;

    const userPrompt = `Convert this UI prompt into a clean, structural wireframe/blueprint using HTML and Tailwind CSS.
**PROMPT:** ${prompt}
Return a JSON object with 'html' and 'css' fields. The 'html' field should contain the raw HTML code (no markdown fences). The 'css' field should contain any custom CSS needed.`;

    try {
        const response = await getAiClient().models.generateContent({
            model: 'gemini-3.1-pro-preview',
            contents: userPrompt,
            config: {
                systemInstruction,
                thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        html: { type: Type.STRING },
                        css: { type: Type.STRING },
                    },
                    required: ['html', 'css'],
                },
            },
        });

        const jsonResponse = JSON.parse(response.text || '{}') as Partial<HtmlCssResult>;
        return {
            html: jsonResponse.html || '',
            css: jsonResponse.css || '',
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to generate blueprint';
        throw new ApiError(500, message);
    }
};

export const generateFromWireframe = async (base64Image: string): Promise<HtmlCssResult> => {
    const systemInstruction = `You are an expert UI/UX designer and Frontend Developer. Your mission is to transform a low-fidelity wireframe into a beautiful, high-fidelity, production-ready UI using HTML and Tailwind CSS.

CRITICAL GUIDELINES:
1. INTERPRET THE WIREFRAME: Understand the layout, hierarchy, and intent of the wireframe. Replace generic placeholders (like boxes with "IMAGE" or "TEXT") with appropriate, realistic content and high-quality placeholder images (e.g., using picsum.photos).
2. ELEVATE THE DESIGN: Do not just make a gray box. Apply modern UI/UX principles, beautiful color palettes, typography, shadows, and spacing. Make it look like a premium product.
3. RESPONSIVE DESIGN: Ensure the output is fully responsive using Tailwind's mobile-first breakpoints (sm:, md:, lg:).
4. OUTPUT FORMAT: Return a JSON object with 'html' and 'css' fields. The 'html' field should contain the raw HTML content. The 'css' field should contain any custom CSS needed.

${UI_UX_PRO_MAX_RULES}`;

    const mimeType = getMimeType(base64Image);
    const data = stripDataUriPrefix(base64Image);

    const parts = [
        { text: 'Transform this wireframe into a high-fidelity, beautiful UI using HTML and Tailwind CSS. Add realistic placeholder content, modern styling, and ensure it is fully responsive.' },
        {
            inlineData: {
                data,
                mimeType,
            },
        },
    ];

    try {
        const response = await getAiClient().models.generateContent({
            model: 'gemini-3.1-pro-preview',
            contents: { parts },
            config: {
                systemInstruction,
                thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        html: { type: Type.STRING },
                        css: { type: Type.STRING },
                    },
                    required: ['html', 'css'],
                },
            },
        });

        const jsonResponse = JSON.parse(response.text || '{}') as Partial<HtmlCssResult>;
        return {
            html: jsonResponse.html || '',
            css: jsonResponse.css || '',
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to generate UI from wireframe';
        throw new ApiError(500, message);
    }
};

const buildClonePrompt = (url: string, scrapedData: Partial<ScrapeResult>, pastedContent: string): string => {
    const hasFullPage = !!scrapedData.fullPageScreenshot;
    let userPrompt = url
        ? `Reconstruct the website at ${url} as a complete, pixel-perfect, fully-scrollable HTML page.`
        : 'Reconstruct the website shown in the provided screenshots as a complete, fully-scrollable HTML page.';

    if (hasFullPage) {
        userPrompt += '\nYou have been provided TWO screenshots: a viewport screenshot showing the hero/nav area, and a FULL-PAGE screenshot showing every section from top to bottom. Use the full-page screenshot as your primary guide to reconstruct ALL sections in the correct order.';
    }

    if (scrapedData.title) {
        userPrompt += `\nPage title: "${scrapedData.title}"`;
    }

    if (scrapedData.html) {
        const safeHtml = safeHtmlTruncate(scrapedData.html, HTML_CONTEXT_CHARS);
        userPrompt += `\n\nScraped HTML Structure (for structure/content reference):\n${safeHtml}`;
    }

    if (scrapedData.cssVariables) {
        userPrompt += `\n\nCSS Custom Properties (Reference):\n${JSON.stringify(scrapedData.cssVariables, null, 2)}`;
    }

    if (pastedContent.trim()) {
        userPrompt += `\n\nAdditional context provided by user:\n${pastedContent.trim()}`;
    }

    userPrompt += '\n\nReturn ONLY a JSON object: { "html": "...", "css": "..." }';
    return userPrompt;
};

const cloneSystemInstruction = `You are a Pixel-Perfect Web Reconstructor.

Your task: reproduce the provided website as a single self-contained HTML file
with an embedded <style> block. The output must cover the COMPLETE PAGE from the
very first element to the very last - including NAVIGATION, HERO, ALL SECTIONS,
and the FOOTER with all its columns, links, and copyright line.

MANDATORY RULES:
1. Output ONLY valid JSON. No markdown fences, no prose, no comments outside JSON.
2. JSON schema: { "html": "<full HTML string>", "css": "<all CSS as a string>" }
3. The html value MUST end with </html>. Never truncate.
4. Reproduce every visible section. If you are running low on space, compress
   whitespace and shorten comments - but NEVER omit the footer or any section.
5. Use semantic HTML5 elements: <header>, <nav>, <main>, <section>, <footer>.
6. Inline all CSS inside a <style> tag in <head>. The css field may be empty "".
7. Use CSS custom properties (variables) for all colors and spacing.
8. All interactive elements must have cursor:pointer and visible focus states.
9. The footer must contain: logo/brand, navigation columns, social links, and
   a copyright line with the current year.
10. NEVER stop generating before the closing </html> tag.
11. CRITICAL - SCROLLABILITY: NEVER set overflow:hidden on <html> or <body>. The page MUST be fully scrollable. Set: html, body { margin: 0; padding: 0; overflow-x: hidden; overflow-y: auto; } - never overflow:hidden on the y-axis.
12. CRITICAL - FULL PAGE HEIGHT: Every section of the page (hero, features, pricing, about, footer, etc.) must be rendered at full height. Do NOT clip, truncate, or use fixed viewport heights (height:100vh with overflow:hidden) that would hide content below the fold.

${UI_UX_PRO_MAX_RULES}`;

export const cloneWebsite = async (url: string, screenshots: string[] = [], pastedContent = ''): Promise<CloneWebsiteResult> => {
    let scrapedData: Partial<ScrapeResult> = {};

    if (url.trim()) {
        try {
            scrapedData = await scrapeWebsite(url);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'unknown scraper error';
            console.warn(`[api] clone scrape failed; continuing without scraped HTML context: ${message}`);
        }
    }

    const userPrompt = buildClonePrompt(url, scrapedData, pastedContent);

    const parts: any[] = [{ text: userPrompt }];

    if (scrapedData.screenshot) {
        const rawBase64 = stripDataUriPrefix(scrapedData.screenshot);
        if (rawBase64) {
            parts.push({ text: 'SCREENSHOT 1 - Viewport (top of page, hero & navigation):' });
            parts.push({ inlineData: { data: rawBase64, mimeType: 'image/png' } });
        }
    }

    if (scrapedData.fullPageScreenshot) {
        const rawBase64 = stripDataUriPrefix(scrapedData.fullPageScreenshot);
        if (rawBase64) {
            parts.push({ text: 'SCREENSHOT 2 - Full page (all sections top to bottom including footer). Use this to reconstruct every section visible on the page:' });
            parts.push({ inlineData: { data: rawBase64, mimeType: 'image/png' } });
        }
    }

    screenshots.forEach((shot, index) => {
        const rawBase64 = stripDataUriPrefix(shot);
        if (rawBase64) {
            parts.push({ text: `USER SCREENSHOT ${index + 1}:` });
            parts.push({ inlineData: { data: rawBase64, mimeType: getMimeType(shot) } });
        }
    });

    try {
        const firstResponse = await getAiClient().models.generateContent({
            model: CLONE_MODEL,
            contents: { role: 'user', parts },
            config: {
                systemInstruction: cloneSystemInstruction,
                tools: [{ googleSearch: {} }],
                thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
                maxOutputTokens: MAX_TOKENS,
                temperature: 0.15,
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        html: { type: Type.STRING },
                        css: { type: Type.STRING },
                    },
                    required: ['html', 'css'],
                },
            },
        });

        const rawText = firstResponse.text ?? '';
        const parsed = extractJson(rawText);

        if (!parsed) {
            throw new ApiError(500, 'Gemini returned an unparseable clone response. Please try again.');
        }

        if (!isHtmlComplete(parsed.html)) {
            try {
                const continuation = await requestContinuation(parsed.html, userPrompt);
                const overlapCheck = parsed.html.slice(-200).trim();
                const continuationTrimmed = continuation.trimStart();

                if (continuationTrimmed.startsWith(overlapCheck.slice(-40))) {
                    parsed.html += continuationTrimmed.slice(overlapCheck.slice(-40).length);
                } else {
                    parsed.html += continuationTrimmed;
                }

                if (!isHtmlComplete(parsed.html)) {
                    parsed.html = parsed.html.trimEnd();
                    if (!parsed.html.endsWith('</footer>')) parsed.html += '\n</footer>';
                    if (!parsed.html.includes('</body>')) parsed.html += '\n</body>';
                    if (!parsed.html.includes('</html>')) parsed.html += '\n</html>';
                }
            } catch {
                parsed.html = `${parsed.html.trimEnd()}\n<!-- generation was truncated -->\n</section></main></body></html>`;
            }
        }

        const sources = firstResponse.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        return { html: parsed.html, css: parsed.css || '', sources };
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }

        const message = error instanceof Error ? error.message : 'Failed to clone website';
        throw new ApiError(500, message);
    }
};
