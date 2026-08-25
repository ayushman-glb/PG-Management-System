import puppeteer, { Browser, PDFOptions } from 'puppeteer';

/**
 * Production-Grade Puppeteer Browser Lifecycle Manager.
 * Reuses a single headless Chromium instance across PDF generation requests with auto-restart on crash.
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
      const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || undefined;

      const browser = await puppeteer.launch({
        headless: true,
        executablePath,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--font-render-hinting=medium',
        ],
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
