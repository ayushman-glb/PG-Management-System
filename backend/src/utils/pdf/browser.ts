import puppeteer, { Browser, PDFOptions } from 'puppeteer-core';

/**
 * Production-Grade Puppeteer Browser Lifecycle Manager.
 * Reuses a single headless Chromium instance across PDF generation requests with auto-restart on crash.
 * Uses @sparticuz/chromium for pre-compiled serverless/Render Chromium binary resolution.
 */
export class PdfBrowserManager {
  private static browserInstance: Browser | null = null;
  private static isLaunching = false;

  static async getBrowser(): Promise<Browser> {
    if (this.browserInstance && (this.browserInstance as any).connected) {
      return this.browserInstance;
    }

    if (this.isLaunching) {
      // Wait for launch currently in progress
      for (let i = 0; i < 25; i++) {
        await new Promise((res) => setTimeout(res, 150));
        if (this.browserInstance && (this.browserInstance as any).connected) {
          return this.browserInstance;
        }
      }
    }

    this.isLaunching = true;
    try {
      console.log('🚀 [PdfBrowserManager] Launching shared Puppeteer Chromium instance...');

      let chromium: any = null;
      try {
        const mod = await import('@sparticuz/chromium');
        chromium = mod.default || mod;
      } catch (e) {
        console.warn('⚠️ [PdfBrowserManager] @sparticuz/chromium not loaded via dynamic import, falling back to local runner.');
      }

      let executablePath: string | undefined;
      const args: string[] = chromium?.args || [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-zygote',
      ];
      const headless: boolean | 'shell' = typeof chromium?.headless !== 'undefined' ? chromium.headless : true;

      if (process.platform === 'linux' && chromium) {
        executablePath = await chromium.executablePath();
      } else {
        // On Windows / macOS local development:
        try {
          const fullPuppeteer = require('puppeteer');
          const localBrowser = await fullPuppeteer.launch({
            headless: true,
            args: [
              '--no-sandbox',
              '--disable-setuid-sandbox',
              '--disable-dev-shm-usage',
              '--disable-gpu',
              '--no-zygote',
              '--font-render-hinting=medium',
            ],
          });

          localBrowser.on('disconnected', () => {
            console.warn('⚠️ [PdfBrowserManager] Puppeteer browser disconnected.');
            this.browserInstance = null;
          });

          this.browserInstance = localBrowser;
          console.log('✅ [PdfBrowserManager] Puppeteer Chromium instance ready (local dev).');
          return localBrowser;
        } catch {
          if (chromium) {
            executablePath = await chromium.executablePath();
          }
        }
      }

      const browser = await puppeteer.launch({
        args,
        executablePath,
        headless,
      });

      browser.on('disconnected', () => {
        console.warn('⚠️ [PdfBrowserManager] Puppeteer browser disconnected.');
        this.browserInstance = null;
      });

      this.browserInstance = browser;
      console.log('✅ [PdfBrowserManager] Puppeteer Chromium instance ready.');
      return browser;
    } catch (err: any) {
      console.error('❌ [PdfBrowserManager] Failed to launch Puppeteer Chromium:', err);
      this.browserInstance = null;
      throw new Error(`PDF Engine Initialization Error: ${err.message || err}`);
    } finally {
      this.isLaunching = false;
    }
  }

  /**
   * Renders an HTML string into an A4 PDF Buffer using headless Chrome.
   */
  static async generatePdfFromHtml(html: string, options: PDFOptions = {}): Promise<Buffer> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    try {
      await page.setContent(html, { waitUntil: 'load' });
      const pdfUint8 = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '12mm',
          right: '12mm',
          bottom: '12mm',
          left: '12mm',
        },
        ...options,
      });

      return Buffer.from(pdfUint8);
    } finally {
      await page.close().catch(() => {});
    }
  }

  /**
   * Graceful shutdown hook
   */
  static async closeBrowser(): Promise<void> {
    if (this.browserInstance) {
      try {
        await this.browserInstance.close();
      } catch {}
      this.browserInstance = null;
    }
  }
}
