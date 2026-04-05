import { Router } from 'express';
import {
    enhancePrompt,
    generateImagePreview,
    generateHtmlFromPrompt,
    modifyHtml,
    generateBlueprint,
    generateFromWireframe,
    cloneWebsite,
} from '../services/geminiService.ts';
import { asyncHandler } from '../utils/asyncHandler.ts';
import { badRequest } from '../utils/errors.ts';
import { asStringArray, isNonEmptyString } from '../utils/validation.ts';

export const aiRouter = Router();

aiRouter.post('/enhance-prompt', asyncHandler(async (req, res) => {
    const { userInput, style } = req.body as { userInput?: unknown; style?: unknown };

    if (!isNonEmptyString(userInput)) {
        throw badRequest('userInput is required');
    }

    if (!isNonEmptyString(style)) {
        throw badRequest('style is required');
    }

    const prompt = await enhancePrompt(userInput, style);
    res.json({ prompt });
}));

aiRouter.post('/generate-image', asyncHandler(async (req, res) => {
    const { prompt } = req.body as { prompt?: unknown };

    if (!isNonEmptyString(prompt)) {
        throw badRequest('prompt is required');
    }

    const image = await generateImagePreview(prompt);
    res.json({ image });
}));

aiRouter.post('/generate-html', asyncHandler(async (req, res) => {
    const { prompt } = req.body as { prompt?: unknown };

    if (!isNonEmptyString(prompt)) {
        throw badRequest('prompt is required');
    }

    const result = await generateHtmlFromPrompt(prompt);
    res.json(result);
}));

aiRouter.post('/modify-html', asyncHandler(async (req, res) => {
    const { originalHtml, styleHtml } = req.body as { originalHtml?: unknown; styleHtml?: unknown };

    if (!isNonEmptyString(originalHtml)) {
        throw badRequest('originalHtml is required');
    }

    if (!isNonEmptyString(styleHtml)) {
        throw badRequest('styleHtml is required');
    }

    const result = await modifyHtml(originalHtml, styleHtml);
    res.json(result);
}));

aiRouter.post('/generate-blueprint', asyncHandler(async (req, res) => {
    const { prompt } = req.body as { prompt?: unknown };

    if (!isNonEmptyString(prompt)) {
        throw badRequest('prompt is required');
    }

    const result = await generateBlueprint(prompt);
    res.json(result);
}));

aiRouter.post('/generate-from-wireframe', asyncHandler(async (req, res) => {
    const { base64Image } = req.body as { base64Image?: unknown };

    if (!isNonEmptyString(base64Image)) {
        throw badRequest('base64Image is required');
    }

    const result = await generateFromWireframe(base64Image);
    res.json(result);
}));

aiRouter.post('/clone', asyncHandler(async (req, res) => {
    const { url, screenshots, pastedContent } = req.body as {
        url?: unknown;
        screenshots?: unknown;
        pastedContent?: unknown;
    };

    const normalizedUrl = typeof url === 'string' ? url.trim() : '';
    const normalizedScreenshots = asStringArray(screenshots);
    const normalizedPastedContent = typeof pastedContent === 'string' ? pastedContent : '';

    if (!normalizedUrl && normalizedScreenshots.length === 0 && !normalizedPastedContent.trim()) {
        throw badRequest('At least one input is required: url, screenshots, or pastedContent');
    }

    if (normalizedUrl && !/^https?:\/\//i.test(normalizedUrl)) {
        throw badRequest('A valid http/https URL is required when url is provided');
    }

    const result = await cloneWebsite(normalizedUrl, normalizedScreenshots, normalizedPastedContent);
    res.json(result);
}));
