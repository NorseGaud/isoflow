import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { chromium } from 'playwright';
import { getAppUrl } from './config';

export type ScreenshotOptions = {
  workspaceId: string;
  projectId: string;
  projectName: string;
  savePath?: string;
  width?: number;
  height?: number;
};

const defaultScreenshotPath = (projectName: string): string => {
  const safe = projectName
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'project';
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return path.join(
    os.homedir(),
    '.isoflow',
    'screenshots',
    `${safe}-${stamp}.png`
  );
};

/**
 * Open the project editor in headless Chromium and capture the canvas.
 * Returns the absolute path to the written PNG.
 */
export const captureProjectScreenshot = async (
  options: ScreenshotOptions
): Promise<string> => {
  const appUrl = getAppUrl();
  const width = options.width ?? 1600;
  const height = options.height ?? 1000;
  const outPath = path.resolve(
    options.savePath ?? defaultScreenshotPath(options.projectName)
  );

  await fs.mkdir(path.dirname(outPath), { recursive: true });

  const pageUrl = `${appUrl}/workspaces/${encodeURIComponent(options.workspaceId)}/projects/${encodeURIComponent(options.projectId)}`;

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Failed to launch Chromium for screenshot. Install browsers with: npx playwright install chromium\n${message}`
    );
  }

  try {
    const page = await browser.newPage({
      viewport: { width, height }
    });

    try {
      await page.goto(pageUrl, {
        waitUntil: 'networkidle',
        timeout: 60_000
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(
        `Failed to load editor at ${pageUrl} (ISOFLOW_APP_URL=${appUrl}). Is the web app running?\n${message}`
      );
    }

    const renderer = page.getByTestId('isoflow-renderer');
    try {
      await renderer.waitFor({ state: 'visible', timeout: 60_000 });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(
        `Canvas renderer did not become ready at ${pageUrl}.\n${message}`
      );
    }

    // Allow fit-to-view / first paint after mount.
    await page.waitForTimeout(750);

    await renderer.screenshot({
      path: outPath,
      type: 'png'
    });

    return outPath;
  } finally {
    await browser.close();
  }
};
