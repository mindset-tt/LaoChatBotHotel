/**
 * Cookie Management Utility
 * Provides secure cookie handling for token storage
 */

export interface CookieOptions {
  expires?: Date;
  maxAge?: number; // seconds
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  httpOnly?: boolean; // Note: httpOnly cookies can only be set by server
}

export class CookieManager {
  /**
   * Set a cookie with specified options
   */
  static setCookie(name: string, value: string, options: CookieOptions = {}): void {
    let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

    if (options.expires) {
      cookieString += `; expires=${options.expires.toUTCString()}`;
    }

    if (options.maxAge) {
      cookieString += `; max-age=${options.maxAge}`;
    }

    if (options.path) {
      cookieString += `; path=${options.path}`;
    }

    if (options.domain) {
      cookieString += `; domain=${options.domain}`;
    }

    if (options.secure) {
      cookieString += `; secure`;
    }

    if (options.sameSite) {
      cookieString += `; samesite=${options.sameSite}`;
    }

    // Note: httpOnly can only be set by server-side code
    if (options.httpOnly && typeof document === 'undefined') {
      cookieString += `; httponly`;
    }

    if (typeof document !== 'undefined') {
      document.cookie = cookieString;
    }
  }

  /**
   * Get a cookie value by name
   */
  static getCookie(name: string): string | null {
    if (typeof document === 'undefined') {
      return null; // Server-side rendering
    }

    const nameEQ = `${encodeURIComponent(name)}=`;
    const cookies = document.cookie.split(';');

    for (let cookie of cookies) {
      cookie = cookie.trim();
      if (cookie.indexOf(nameEQ) === 0) {
        return decodeURIComponent(cookie.substring(nameEQ.length));
      }
    }

    return null;
  }

  /**
   * Delete a cookie by setting it to expire in the past
   */
  static deleteCookie(name: string, path: string = '/', domain?: string): void {
    const options: CookieOptions = {
      expires: new Date(0),
      path,
    };

    if (domain) {
      options.domain = domain;
    }

    this.setCookie(name, '', options);
  }

  /**
   * Check if a cookie exists
   */
  static hasCookie(name: string): boolean {
    return this.getCookie(name) !== null;
  }

  /**
   * Get all cookies as an object
   */
  static getAllCookies(): Record<string, string> {
    if (typeof document === 'undefined') {
      return {};
    }

    const cookies: Record<string, string> = {};
    const cookieStrings = document.cookie.split(';');

    for (const cookieString of cookieStrings) {
      const [name, value] = cookieString.trim().split('=');
      if (name && value) {
        cookies[decodeURIComponent(name)] = decodeURIComponent(value);
      }
    }

    return cookies;
  }

  /**
   * Clear all cookies (client-side only, cannot clear httpOnly cookies)
   */
  static clearAllCookies(domain?: string): void {
    const cookies = this.getAllCookies();
    
    for (const name in cookies) {
      this.deleteCookie(name, '/', domain);
    }
  }

  /**
   * Set a secure token cookie with default security settings
   */
  static setSecureTokenCookie(
    name: string, 
    value: string, 
    expiresInSeconds: number,
    isProduction: boolean = false
  ): void {
    const expires = new Date(Date.now() + expiresInSeconds * 1000);
    
    this.setCookie(name, value, {
      expires,
      path: '/',
      secure: isProduction, // Only secure in production (HTTPS)
      sameSite: 'lax',
    });
  }

  /**
   * Set a refresh token cookie with maximum security
   */
  static setRefreshTokenCookie(
    name: string, 
    value: string, 
    expiresInSeconds: number,
    isProduction: boolean = false
  ): void {
    const expires = new Date(Date.now() + expiresInSeconds * 1000);
    
    this.setCookie(name, value, {
      expires,
      path: '/',
      secure: isProduction,
      sameSite: 'strict', // Stricter for refresh tokens
    });
  }
}
