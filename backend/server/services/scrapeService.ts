import puppeteer from 'puppeteer';

export interface ScrapeResult {
    title: string;
    html: string;
    screenshot: string;
    fullPageScreenshot: string;
    cssVariables?: Record<string, string>;
}

export const scrapeWebsite = async (url: string): Promise<ScrapeResult> => {
    let browser: Awaited<ReturnType<typeof puppeteer.launch>> | undefined;

    try {
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
            ],
        });

        const page = await browser.newPage();

        await page.setRequestInterception(true);
        page.on('request', (request) => {
            const type = request.resourceType();
            if (['media', 'font'].includes(type)) {
                request.abort();
            } else {
                request.continue();
            }
        });

        await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
        await page.setUserAgent(
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) '
            + 'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
        );

        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30_000 });

        await page.evaluate(`(async () => {
            await new Promise((resolve) => {
                const SCROLL_STEP = 600;
                const TICK_MS = 300;
                const STABLE_NEEDED = 3;

                let lastHeight = 0;
                let stableCount = 0;

                const tick = () => {
                    const currentHeight = document.body.scrollHeight;

                    if (currentHeight === lastHeight) {
                        stableCount++;
                        if (stableCount >= STABLE_NEEDED) {
                            resolve();
                            return;
                        }
                    } else {
                        stableCount = 0;
                        lastHeight = currentHeight;
                    }

                    window.scrollBy(0, SCROLL_STEP);
                    setTimeout(tick, TICK_MS);
                };

                setTimeout(tick, TICK_MS);
            });
        })()`);

        try {
            await page.waitForSelector('footer, [role="contentinfo"], .footer, #footer', {
                timeout: 5_000,
            });
        } catch {
            // Footer is optional; continue gracefully when it is not found.
        }

        await new Promise((resolve) => setTimeout(resolve, 500));

        const html = await page.content();
        const title = await page.title();

        const cssVariables = await page.evaluate(() => {
            const styles = getComputedStyle(document.documentElement);
            const vars: Record<string, string> = {};

            for (const sheet of Array.from(document.styleSheets)) {
                try {
                    for (const rule of Array.from(sheet.cssRules ?? [])) {
                        if (rule instanceof CSSStyleRule && rule.selectorText === ':root') {
                            const ruleStyle = rule.style;
                            for (let index = 0; index < ruleStyle.length; index += 1) {
                                const prop = ruleStyle[index];
                                if (prop.startsWith('--')) {
                                    vars[prop] = styles.getPropertyValue(prop).trim();
                                }
                            }
                        }
                    }
                } catch {
                    // Skip cross-origin stylesheets.
                }
            }

            return vars;
        });

        await page.evaluate('window.scrollTo(0, 0)');
        await new Promise((resolve) => setTimeout(resolve, 300));

        const screenshotBuffer = await page.screenshot({
            encoding: 'base64',
            fullPage: false,
        });

        const fullPageBuffer = await page.screenshot({
            encoding: 'base64',
            fullPage: true,
        });

        await browser.close();
        browser = undefined;

        return {
            title,
            html,
            screenshot: screenshotBuffer as string,
            fullPageScreenshot: fullPageBuffer as string,
            cssVariables: Object.keys(cssVariables).length > 0 ? cssVariables : undefined,
        };
    } catch (error) {
        if (browser) {
            await browser.close().catch(() => {});
        }
        throw error;
    }
};
