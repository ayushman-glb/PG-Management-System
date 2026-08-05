import { describe, it, expect } from '@jest/globals';
import { resolveFrontendUrl, normalizeFrontendUrl } from '../config/frontendUrl';
import { Request } from 'express';

describe('Frontend URL Resolver Unit Tests', () => {
  it('should resolve GitHub Pages production URL with subpath /PG-Management-System when host is ayushman-glb.github.io', () => {
    const mockReq = {
      headers: {
        referer: 'https://ayushman-glb.github.io/',
      },
    } as unknown as Request;

    const url = resolveFrontendUrl(mockReq);
    expect(url).toBe('https://ayushman-glb.github.io/PG-Management-System');
  });

  it('should preserve full subpath when referer contains /PG-Management-System/#/auth', () => {
    const mockReq = {
      headers: {
        referer: 'https://ayushman-glb.github.io/PG-Management-System/#/auth',
      },
    } as unknown as Request;

    const url = resolveFrontendUrl(mockReq);
    expect(url).toBe('https://ayushman-glb.github.io/PG-Management-System');
  });

  it('should return localhost URL when request originates from local development', () => {
    const mockReq = {
      headers: {
        referer: 'http://localhost:5173/auth',
      },
    } as unknown as Request;

    const url = resolveFrontendUrl(mockReq);
    expect(url).toBe('http://localhost:5173');
  });

  it('should normalize bare ayushman-glb.github.io string to append /PG-Management-System', () => {
    expect(normalizeFrontendUrl('https://ayushman-glb.github.io')).toBe(
      'https://ayushman-glb.github.io/PG-Management-System'
    );
    expect(normalizeFrontendUrl('https://ayushman-glb.github.io/')).toBe(
      'https://ayushman-glb.github.io/PG-Management-System'
    );
    expect(normalizeFrontendUrl('https://ayushman-glb.github.io/PG-Management-System/')).toBe(
      'https://ayushman-glb.github.io/PG-Management-System'
    );
  });
});
