import { Injectable } from '@nestjs/common';

// Types
export interface InstagramCookie {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  expires?: Date;
  httpOnly?: boolean;
  secure?: boolean;
}

export interface InstagramSession {
  sessionid: string;
  csrftoken: string;
  ds_user_id: string;
  ig_did: string;
  rur?: string;
}

@Injectable()
export class InstagramCookieHelper {
  private readonly REQUIRED_COOKIES = [
    'sessionid',
    'csrftoken',
    'ds_user_id',
    'ig_did',
  ];
  private readonly INSTAGRAM_DOMAINS = [
    '.instagram.com',
    'instagram.com',
    'www.instagram.com',
    '.www.instagram.com',
    'i.instagram.com',
    '.i.instagram.com',
  ];

  /**
   * Parse a raw cookie string into structured cookie objects
   */
  parseCookies(cookieString: string): InstagramCookie[] {
    return cookieString
      .split(';')
      .map((pair) => pair.trim())
      .filter((pair) => pair.length > 0)
      .map((pair) => {
        const [rawName, ...rest] = pair.split('=');
        const name = rawName.trim();
        const value = rest.join('=').trim();

        // Extract domain and path if present
        const domain = this.INSTAGRAM_DOMAINS.find((d) =>
          pair.includes(`Domain=${d}`),
        );
        const path = pair.includes('Path=/') ? '/' : undefined;
        const httpOnly = pair.includes('HttpOnly');
        const secure = pair.includes('Secure');

        // Parse expires if present
        let expires: Date | undefined;
        const expiresMatch = pair.match(/expires=([^;]+)/i);
        if (expiresMatch) {
          expires = new Date(expiresMatch[1]);
        }

        return { name, value, domain, path, expires, httpOnly, secure };
      });
  }

  /**
   * Format cookies into a string suitable for HTTP headers
   */
  formatCookies(cookies: InstagramCookie[]): string {
    return cookies
      .filter((cookie) => cookie.name && cookie.value)
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join('; ');
  }

  /**
   * Extract Instagram session information from cookies
   */
  extractSession(cookieString: string): InstagramSession {
    const cookies = this.parseCookies(cookieString);
    const session: Partial<InstagramSession> = {};

    // Extract required cookies
    this.REQUIRED_COOKIES.forEach((name) => {
      const cookie = cookies.find((c) => c.name === name);
      if (cookie) {
        session[name] = cookie.value;
      }
    });

    // Extract optional rur cookie
    const rurCookie = cookies.find((c) => c.name === 'rur');
    if (rurCookie) {
      session.rur = rurCookie.value;
    }

    // Validate required cookies
    const missingCookies = this.REQUIRED_COOKIES.filter(
      (name) => !session[name],
    );

    if (missingCookies.length > 0) {
      throw new Error(
        `Missing required Instagram cookies: ${missingCookies.join(', ')}`,
      );
    }

    return session as InstagramSession;
  }

  /**
   * Validate if the cookie string contains all required Instagram cookies
   */
  validateCookies(cookieString: string): boolean {
    try {
      const cookies = this.parseCookies(cookieString);
      return this.REQUIRED_COOKIES.every((name) =>
        cookies.some((cookie) => cookie.name === name),
      );
    } catch {
      return false;
    }
  }

  /**
   * Clean and normalize Instagram cookies
   */
  cleanCookies(cookieString: string): string {
    const cookies = this.parseCookies(cookieString);

    // Filter out duplicate cookies (keep the last occurrence)
    const uniqueCookies = new Map<string, InstagramCookie>();
    cookies.forEach((cookie) => {
      uniqueCookies.set(cookie.name, cookie);
    });

    // Filter out non-Instagram cookies and format
    return this.formatCookies(
      Array.from(uniqueCookies.values()).filter((cookie) =>
        this.isInstagramCookie(cookie),
      ),
    );
  }

  /**
   * Check if a cookie is an Instagram-related cookie
   */
  private isInstagramCookie(cookie: InstagramCookie): boolean {
    const instagramCookiePrefixes = [
      'ig_',
      'ds_',
      'csrf',
      'mid',
      'rur',
      'session',
      'fb',
    ];

    return (
      this.REQUIRED_COOKIES.includes(cookie.name) ||
      instagramCookiePrefixes.some((prefix) => cookie.name.startsWith(prefix))
    );
  }

  /**
   * Update specific Instagram cookies while maintaining others
   */
  updateCookies(
    originalCookieString: string,
    updates: InstagramCookie[],
  ): string {
    const cookies = this.parseCookies(originalCookieString);
    const cookieMap = new Map(cookies.map((cookie) => [cookie.name, cookie]));

    updates.forEach((update) => {
      if (this.isInstagramCookie(update)) {
        cookieMap.set(update.name, update);
      }
    });

    return this.formatCookies(Array.from(cookieMap.values()));
  }

  /**
   * Extract CSRF token from cookies
   */
  extractCsrfToken(cookieString: string): string {
    const cookies = this.parseCookies(cookieString);
    const csrfCookie = cookies.find((cookie) => cookie.name === 'csrftoken');

    if (!csrfCookie) {
      throw new Error('CSRF token not found in cookies');
    }

    return csrfCookie.value;
  }
}
