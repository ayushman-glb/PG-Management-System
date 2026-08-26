import { env } from '../../config/env';
import { logger } from '../../utils/logger';
import { GeoapifyRawResponse } from './geoapify.types';

export class GeoapifyClient {
  private readonly baseUrl = 'https://api.geoapify.com/v1/geocode';
  private readonly timeoutMs = 5000;

  private get apiKey(): string {
    return env.GEOAPIFY_API_KEY || process.env.GEOAPIFY_API_KEY || '';
  }

  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  async autocomplete(text: string, limit: number = 8, bias?: string): Promise<GeoapifyRawResponse | null> {
    if (!this.isConfigured()) {
      return null;
    }

    const params = new URLSearchParams({
      text: text.trim(),
      apiKey: this.apiKey,
      filter: 'countrycode:in', // Bias / filter to India for RoomBae PG management
      limit: limit.toString(),
      format: 'geojson',
    });

    if (bias) {
      params.append('bias', bias);
    }

    const url = `${this.baseUrl}/autocomplete?${params.toString()}`;
    return this.fetchWithTimeout(url, 'autocomplete');
  }

  async geocode(text: string, limit: number = 5): Promise<GeoapifyRawResponse | null> {
    if (!this.isConfigured()) {
      return null;
    }

    const params = new URLSearchParams({
      text: text.trim(),
      apiKey: this.apiKey,
      filter: 'countrycode:in',
      limit: limit.toString(),
      format: 'geojson',
    });

    const url = `${this.baseUrl}/search?${params.toString()}`;
    return this.fetchWithTimeout(url, 'geocode');
  }

  async reverseGeocode(lat: number, lon: number): Promise<GeoapifyRawResponse | null> {
    if (!this.isConfigured()) {
      return null;
    }

    const params = new URLSearchParams({
      lat: lat.toString(),
      lon: lon.toString(),
      apiKey: this.apiKey,
      format: 'geojson',
    });

    const url = `${this.baseUrl}/reverse?${params.toString()}`;
    return this.fetchWithTimeout(url, 'reverseGeocode');
  }

  private async fetchWithTimeout(url: string, operation: string): Promise<GeoapifyRawResponse | null> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'User-Agent': 'RoomBae-PG-Management/1.0',
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        if (response.status === 429) {
          logger.warn(`[GeoapifyClient] Rate limit hit on ${operation} (HTTP 429). Falling back gracefully.`);
        } else if (response.status === 401 || response.status === 403) {
          logger.warn(`[GeoapifyClient] Invalid or unconfigured API key on ${operation} (HTTP ${response.status}).`);
        } else {
          logger.warn(`[GeoapifyClient] External API returned error HTTP ${response.status} on ${operation}.`);
        }
        return null;
      }

      const json = await response.json();
      return json as GeoapifyRawResponse;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        logger.warn(`[GeoapifyClient] Request timeout after ${this.timeoutMs}ms on ${operation}.`);
      } else {
        logger.warn(`[GeoapifyClient] Network error on ${operation}: ${error.message}`);
      }
      return null;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

export const geoapifyClient = new GeoapifyClient();
