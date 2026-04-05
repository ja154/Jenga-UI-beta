import { VisualStyle, GroundingSource } from '../types.ts';

interface HtmlCssPayload {
    html?: string;
    css?: string;
}

interface ClonePayload extends HtmlCssPayload {
    sources?: GroundingSource[];
}

const postJson = async <T>(url: string, body: unknown): Promise<T> => {
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    const responseText = await response.text();
    const safeJson = responseText ? (() => {
        try {
            return JSON.parse(responseText) as Record<string, unknown>;
        } catch {
            return null;
        }
    })() : null;

    if (!response.ok) {
        const errorMessage =
            (safeJson && typeof safeJson.error === 'string' && safeJson.error)
            || responseText
            || `Request failed with status ${response.status}`;

        throw new Error(errorMessage);
    }

    if (!safeJson) {
        throw new Error('Server returned an invalid JSON response');
    }

    return safeJson as T;
};

export const enhancePrompt = async (userInput: string, style: VisualStyle): Promise<string> => {
    const response = await postJson<{ prompt?: string }>('/api/ai/enhance-prompt', {
        userInput,
        style,
    });

    return response.prompt || '';
};

export const generateImagePreview = async (prompt: string): Promise<string> => {
    const response = await postJson<{ image?: string }>('/api/ai/generate-image', { prompt });

    if (!response.image) {
        throw new Error('No image was generated.');
    }

    return response.image;
};

export const generateHtmlFromPrompt = async (prompt: string): Promise<{ html: string; css: string }> => {
    const response = await postJson<HtmlCssPayload>('/api/ai/generate-html', { prompt });
    return {
        html: response.html || '',
        css: response.css || '',
    };
};

export const modifyHtml = async (originalHtml: string, styleHtml: string): Promise<{ html: string; css: string }> => {
    const response = await postJson<HtmlCssPayload>('/api/ai/modify-html', {
        originalHtml,
        styleHtml,
    });

    return {
        html: response.html || '',
        css: response.css || '',
    };
};

export const generateBlueprint = async (prompt: string): Promise<{ html: string; css: string }> => {
    const response = await postJson<HtmlCssPayload>('/api/ai/generate-blueprint', { prompt });
    return {
        html: response.html || '',
        css: response.css || '',
    };
};

export const generateFromWireframe = async (base64Image: string): Promise<{ html: string; css: string }> => {
    const response = await postJson<HtmlCssPayload>('/api/ai/generate-from-wireframe', { base64Image });
    return {
        html: response.html || '',
        css: response.css || '',
    };
};

export const generateDesignSystem = async (query: string): Promise<any> => {
    return await postJson('/api/design-system', { query });
};

export const cloneWebsite = async (
    url: string,
    screenshots: string[] = [],
    pastedContent = ''
): Promise<{ html: string; css: string; sources: GroundingSource[] }> => {
    const response = await postJson<ClonePayload>('/api/ai/clone', {
        url,
        screenshots,
        pastedContent,
    });

    return {
        html: response.html || '',
        css: response.css || '',
        sources: Array.isArray(response.sources) ? response.sources : [],
    };
};
