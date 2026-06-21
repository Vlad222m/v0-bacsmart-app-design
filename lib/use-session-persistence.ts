'use client'

/**
 * Supabase session persistence bridge for Capacitor.
 *
 * Supabase SSR's createBrowserClient stores auth tokens in localStorage.
 * On Capacitor (Android/iOS), localStorage is not reliably persisted between
 * app launches. This hook syncs the session tokens to @capacitor/preferences
 * on mount and restores them.
 *
 * Call this hook once in AuthProvider.
 */

import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { getItem, setItem, removeItem, isNativePlatform } from '@/lib/capacitor-storage'

const SESSION_STORAGE_KEY = 'bacsmart_supabase_session'

/**
 * Synchronizes the Supabase session to @capacitor/preferences on every change.
 * On mount, tries to restore a saved session.
 */
export function useSessionPersistence() {
  const initialized = useRef(false)

  useEffect(() => {
    if (!supabase || !isNativePlatform()) return
    if (initialized.current) return
    initialized.current = true

    const sb = supabase // local non-nullable ref for TS

    // On mount: try to restore session from Capacitor Preferences
    const restoreSession = async () => {
      try {
        const savedSessionJson = await getItem(SESSION_STORAGE_KEY)
        if (!savedSessionJson) return

        const savedSession = JSON.parse(savedSessionJson)
        if (!savedSession?.access_token) return

        // Check if there's already a valid session
        const { data: { session: currentSession } } = await sb.auth.getSession()
        if (currentSession?.access_token) return // Already have a session

        // Try to set the session from saved tokens
        const { error } = await sb.auth.setSession({
          access_token: savedSession.access_token,
          refresh_token: savedSession.refresh_token,
        })

        if (error) {
          console.warn('[SessionPersistence] Could not restore session:', error.message)
          await removeItem(SESSION_STORAGE_KEY)
        }
      } catch (e) {
        console.warn('[SessionPersistence] Restore error:', e)
      }
    }

    restoreSession()

    // Listen for auth state changes and persist the session
    const { data: { subscription } } = sb.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.access_token && session?.refresh_token) {
            await setItem(SESSION_STORAGE_KEY, JSON.stringify({
              access_token: session.access_token,
              refresh_token: session.refresh_token,
            }))
          }
        } else if (event === 'SIGNED_OUT') {
          await removeItem(SESSION_STORAGE_KEY)
        }
      }
    )

    return () => {
      try { subscription.unsubscribe() } catch {}
    }
  }, [])
}
