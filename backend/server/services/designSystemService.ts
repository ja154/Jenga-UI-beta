import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { ApiError } from '../utils/errors.ts';

const execFileAsync = promisify(execFile);

export interface DesignSystemResult {
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    foreground_color: string;
    font_family: string;
    layout_type: string;
    sections: string[];
}

export const generateDesignSystemFromQuery = async (query: string): Promise<DesignSystemResult> => {
    const scriptPath = path.join(process.cwd(), 'backend', 'core.py');
    const pythonBin = process.env.PYTHON_BIN || 'python3';

    try {
        const { stdout, stderr } = await execFileAsync(pythonBin, [scriptPath, query], {
            maxBuffer: 1024 * 1024,
        });

        if (stderr?.trim()) {
            console.warn(`[api] /api/design-system python stderr: ${stderr.trim()}`);
        }

        let parsed: unknown;
        try {
            parsed = JSON.parse(stdout);
        } catch {
            throw new ApiError(500, 'Failed to parse design system output');
        }

        if (!parsed || typeof parsed !== 'object') {
            throw new ApiError(500, 'Design system output is invalid');
        }

        return parsed as DesignSystemResult;
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }

        const message = error instanceof Error ? error.message : 'Failed to generate design system';
        throw new ApiError(500, `Failed to generate design system: ${message}`);
    }
};
