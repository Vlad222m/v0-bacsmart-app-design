'use client'

/**
 * Isomorphic storage that uses @capacitor/preferences when running
 * inside the Capacitor WebView, and falls back to localStorage on the web.
 *
 * This solves the problem where Supabase auth tokens stored in web
 * localStorage are lost when the Capacitor app is relaunched on Android/iOS.
 */

let CapacitorPreferences: any = null
let isCapacitorEnv = false

// Detect Capacitor environment lazily
if (typeof window !== 'undefined') {
  try {
    // @capacitor/core is already a dependency
    const Core = require('@capacitor/core')
    isCapacitorEnv = !!(Core.Capacitor as any)?.isNativePlatform?.()
  } catch {
    isCapacitorEnv = false
  }
}

/**
 * Initialize the CapacitorPreferences module only when needed (lazy import).
 */
async function getPrefs() {
  if (!CapacitorPreferences && isCapacitorEnv) {
    try {
      CapacitorPreferences = await import('@capacitor/preferences')
    } catch {
      // Fallback to localStorage
      isCapacitorEnv = false
    }
  }
  return CapacitorPreferences
}

/**
 * Get a value from persistent storage.
 */
export async function getItem(key: string): Promise<string | null> {
  if (!isCapacitorEnv) {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(key)
  }
  try {
    const prefs = await getPrefs()
    if (!prefs) {
      if (typeof window !== 'undefined') return localStorage.getItem(key)
      return null
    }
    const { value } = await prefs.Preferences.get({ key })
    return value ?? null
  } catch {
    if (typeof window !== 'undefined') return localStorage.getItem(key)
    return null
  }
}

/**
 * Set a value in persistent storage.
 */
export async function setItem(key: string, value: string): Promise<void> {
  if (!isCapacitorEnv) {
    if (typeof window === 'undefined') return
    localStorage.setItem(key, value)
    return
  }
  try {
    const prefs = await getPrefs()
    if (!prefs) {
      if (typeof window !== 'undefined') localStorage.setItem(key, value)
      return
    }
    await prefs.Preferences.set({ key, value })
  } catch {
    if (typeof window !== 'undefined') localStorage.setItem(key, value)
  }
}

/**
 * Remove a value from persistent storage.
 */
export async function removeItem(key: string): Promise<void> {
  if (!isCapacitorEnv) {
    if (typeof window === 'undefined') return
    localStorage.removeItem(key)
    return
  }
  try {
    const prefs = await getPrefs()
    if (!prefs) {
      if (typeof window !== 'undefined') localStorage.removeItem(key)
      return
    }
    await prefs.Preferences.remove({ key })
  } catch {
    if (typeof window !== 'undefined') localStorage.removeItem(key)
  }
}

/**
 * Synchronous check: are we running inside a Capacitor native app?
 */
export function isNativePlatform(): boolean {
  return isCapacitorEnv
}
