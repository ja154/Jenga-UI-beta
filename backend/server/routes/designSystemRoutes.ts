import { Router } from 'express';
import { generateDesignSystemFromQuery } from '../services/designSystemService.ts';
import { asyncHandler } from '../utils/asyncHandler.ts';
import { badRequest } from '../utils/errors.ts';
import { isNonEmptyString } from '../utils/validation.ts';

export const designSystemRouter = Router();

designSystemRouter.post('/design-system', asyncHandler(async (req, res) => {
    const { query } = req.body as { query?: unknown };

    if (!isNonEmptyString(query)) {
        throw badRequest('Query is required');
    }

    const result = await generateDesignSystemFromQuery(query);
    res.json(result);
}));
