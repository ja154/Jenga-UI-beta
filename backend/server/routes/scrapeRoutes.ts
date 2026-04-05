import { Router } from 'express';
import { scrapeWebsite } from '../services/scrapeService.ts';
import { asyncHandler } from '../utils/asyncHandler.ts';
import { badRequest } from '../utils/errors.ts';
import { isNonEmptyString } from '../utils/validation.ts';

export const scrapeRouter = Router();

scrapeRouter.post('/scrape', asyncHandler(async (req, res) => {
    const { url } = req.body as { url?: unknown };

    if (!isNonEmptyString(url) || !/^https?:\/\//i.test(url)) {
        throw badRequest('A valid http/https URL is required');
    }

    const result = await scrapeWebsite(url);
    res.json(result);
}));
