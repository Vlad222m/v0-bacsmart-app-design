'use client'

/**
 * Hook that handles OAuth deep link callbacks on native platforms (Capacitor).
 *
 * When the user authenticates via Google on a native Android device:
 * 1. @capacitor/browser deschide Chrome Custom Tab
 * 2. Custom Tab-ul se închide la URL-ul de redirect (HTTPS App Link)
 * 3. Dacă App Link-ul e verificat (assetlinks.json), URL-ul ajunge în app
 *    prin evenimentul 'appUrlOpen' de la @capacitor/app
 * 4. Hook-ul extrage codul de auth, face exchangeCodeForSession, și reîncarcă
 *
 * Must be called inside AuthProvider (client-side, once).
 */

import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { isNativePlatform } from '@/lib/capacitor-storage'

/**
 * Parse OAuth callback parameters from a deep link URL.
 * Suportă URL-uri HTTPS (App Links): https://v0-bacsmart-app-design.vercel.app/auth/callback?code=xxx
 */
function parseOAuthCallback(url: string): { code: string | null; error: string | null } {
  try {
    const parsed = new URL(url)
    const code = parsed.searchParams.get('code')
    const error = parsed.searchParams.get('error')
    return { code, error }
  } catch {
    console.error('[OAuthDeepLink] Failed to parse callback URL:', url)
    return { code: null, error: null }
  }
}

/**
 * Exchange a Supabase auth code for a full session.
 * This is the client-side equivalent of app/auth/callback/route.ts,
 * needed on native because the route handler runs server-side (Next.js).
 */
async function exchangeCodeForSession(code: string): Promise<boolean> {
  if (!supabase) {
    console.error('[OAuthDeepLink] Supabase not configured')
    return false
  }

  try {
    console.log('[OAuthDeepLink] Exchanging code for session...')
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error('[OAuthDeepLink] Exchange error:', error.message)
      return false
    }
    if (data.session) {
      console.log('[OAuthDeepLink] Session established successfully')
      return true
    }
    console.warn('[OAuthDeepLink] No session returned from code exchange')
    return false
  } catch (e) {
    console.error('[OAuthDeepLink] Exchange exception:', e)
    return false
  }
}

export function useOAuthDeepLink() {
  const initialized = useRef(false)

  useEffect(() => {
    // Nu e nevoie de deep link handling pe web (redirect-ul server-side funcționează)
    if (!isNativePlatform()) return
    if (initialized.current) return
    initialized.current = true

    let unsubscribe: (() => void) | null = null

    const setupListener = async () => {
      try {
        const { App } = await import('@capacitor/app')

        const handler = await App.addListener('appUrlOpen', (data) => {
          const url = data?.url
          if (!url) return

          console.log('[OAuthDeepLink] Received URL:', url)

          // Verifică dacă URL-ul e de la OAuth callback
          // HTTPS App Link: https://v0-bacsmart-app-design.vercel.app/auth/callback?code=xxx
          const isAuthCallback =
            url.includes('/auth/callback') ||
            url.includes('?code=')

          if (!isAuthCallback) {
            console.log('[OAuthDeepLink] Not an auth callback, ignoring:', url)
            return
          }

          const { code, error } = parseOAuthCallback(url)

          if (error) {
            console.error('[OAuthDeepLink] OAuth error from callback:', error)
            window.location.href = '/?error=' + encodeURIComponent(error)
            return
          }

          if (code) {
            exchangeCodeForSession(code).then((success) => {
              if (success) {
                console.log('[OAuthDeepLink] OAuth successful, reloading app...')
                window.location.href = '/'
              } else {
                console.error('[OAuthDeepLink] OAuth code exchange failed')
                window.location.href = '/?error=exchange_failed'
              }
            })
          } else {
            console.warn('[OAuthDeepLink] Auth callback URL without code or error:', url)
          }
        })

        unsubscribe = () => {
          try { handler.remove() } catch {}
        }
      } catch (e) {
        console.warn('[OAuthDeepLink] @capacitor/app not available (running on web or missing plugin):', e)
      }
    }

    setupListener()

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [])
}
