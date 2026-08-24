/**
 * capacitor.js
 * Thin wrapper to detect Capacitor environment and route browser/OAuth actions
 * to the native Custom Tab (@capacitor/browser) instead of the WebView.
 *
 * USAGE:
 *   import { isCapacitor, openBrowserUrl, getOAuthRedirectUrl } from '@/lib/capacitor'
 *
 * GUARDRAILS:
 * - Do NOT change Supabase schema, RLS, RPC, payment, subscription, or logger logic.
 * - This file only wraps browser-launch behavior for the native Android shell.
 */

/**
 * Returns true when running inside a Capacitor native shell (Android/iOS).
 * Safe to call on web — returns false.
 */
export function isCapacitor() {
  return typeof window !== 'undefined' && !!window.Capacitor?.isNativePlatform?.();
}

/**
 * Returns the correct OAuth redirectTo URL:
 * - On web: use current origin (https://ternakos.my.id/auth/callback)
 * - On Capacitor Android: use the production web URL directly so Google OAuth
 *   can redirect back to our domain. The Capacitor WebView will intercept the
 *   navigation via Deep Links / App Links.
 */
export function getOAuthRedirectUrl() {
  if (isCapacitor()) {
    // Always use production URL on native — do NOT use capacitor:// or http://localhost
    // Supabase will redirect to this URL after OAuth, and Android App Links will
    // route it back into the app automatically.
    return 'https://ternakos.my.id/auth/callback';
  }
  // On web: use current origin (works in localhost dev + production)
  return window.location.origin + '/auth/callback';
}

/**
 * Opens a URL in:
 * - Capacitor native: Chrome Custom Tab (via @capacitor/browser)
 * - Web browser: same tab (window.location.assign)
 *
 * Use this for:
 * 1. Midtrans payment redirect
 * 2. Any external URL that must NOT open in the WebView
 *
 * @param {string} url - The URL to open
 * @param {boolean} [preferExternal=false] - On web, force window.open instead of assign
 */
export async function openBrowserUrl(url, preferExternal = false) {
  if (isCapacitor()) {
    try {
      const NativeBrowser = window.Capacitor?.Plugins?.Browser
      if (NativeBrowser?.open) {
        await NativeBrowser.open({
          url,
          windowName: '_blank',
          presentationStyle: 'popover', // Use Custom Tab on Android
          toolbarColor: '#06090F',
        })
        return
      }
    } catch (err) {
      console.warn('[Capacitor] Browser.open failed, falling back to window.open:', err)
    }
    window.open(url, '_blank', 'noopener,noreferrer')
  } else if (preferExternal) {
    window.open(url, '_blank', 'noopener,noreferrer')
  } else {
    window.location.assign(url)
  }
}

