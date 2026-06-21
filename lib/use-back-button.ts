'use client'

/**
 * Android/iOS hardware back button handler for Capacitor.
 *
 * Maintains a navigation stack (history of overlay screens) so the
 * back button navigates through open screens before exiting the app.
 *
 * When the user presses back, the hook calls onBackFromScreen(screenId)
 * so the parent (BACsmartApp) can close the correct screen.
 */

import { useEffect, useRef, useCallback, useState } from 'react'
import { isNativePlatform } from '@/lib/capacitor-storage'

type ScreenEntry = {
  id: string
  label: string
}

type BackHandler = (screenId: string) => void

/**
 * React hook that manages a navigation stack and responds to
 * the Capacitor hardware back button.
 *
 * @param onBackFromScreen - Called when back is pressed and there's a screen open.
 *                           Receives the screenId of the top screen to close.
 * @param onExitApp - Called when the stack is empty and back is pressed.
 *                    Default behavior exits the app.
 */
export function useBackButton(
  onBackFromScreen: BackHandler,
  onExitApp?: () => void,
) {
  const [stack, setStack] = useState<ScreenEntry[]>([])
  const stackRef = useRef<ScreenEntry[]>([])
  const onBackRef = useRef<BackHandler>(onBackFromScreen)
  const onExitRef = useRef(onExitApp)
  onBackRef.current = onBackFromScreen
  onExitRef.current = onExitApp

  const pushScreen = useCallback((id: string, label: string) => {
    // Avoid duplicate pushes for same screen
    if (stackRef.current.length > 0 && stackRef.current[stackRef.current.length - 1].id === id) return
    stackRef.current = [...stackRef.current, { id, label }]
    setStack(stackRef.current)
  }, [])

  const popScreen = useCallback((): ScreenEntry | undefined => {
    const entry = stackRef.current.pop()
    if (entry) setStack([...stackRef.current])
    return entry
  }, [])

  const clearStack = useCallback(() => {
    stackRef.current = []
    setStack([])
  }, [])

  const getStackSize = useCallback((): number => {
    return stackRef.current.length
  }, [])

  const getTopScreen = useCallback((): ScreenEntry | undefined => {
    const s = stackRef.current
    return s.length > 0 ? s[s.length - 1] : undefined
  }, [])

  // Set up the Capacitor back button listener
  useEffect(() => {
    if (!isNativePlatform()) return

    let AppPlugin: any = null

    const setup = async () => {
      try {
        AppPlugin = await import('@capacitor/app')
      } catch {
        // @capacitor/app not available — fall back to popstate (web)
        return
      }

      if (!AppPlugin?.App) return

      // Add listener for hardware back button
      AppPlugin.App.addListener('backButton', () => {
        if (stackRef.current.length > 0) {
          // Pop the top screen and call the handler with its ID
          const top = stackRef.current.pop()
          setStack([...stackRef.current])
          if (top) {
            onBackRef.current(top.id)
          }
        } else {
          // Stack is empty — confirm exit or call custom handler
          if (onExitRef.current) {
            onExitRef.current()
          } else {
            // Default: exit the app
            if (AppPlugin?.App?.exitApp) {
              AppPlugin.App.exitApp()
            }
          }
        }
      })
    }

    setup()

    // Fallback for web: listen to browser back/forward
    const handlePopState = () => {
      if (stackRef.current.length > 0) {
        const top = stackRef.current.pop()
        setStack([...stackRef.current])
        if (top) onBackRef.current(top.id)
      }
    }
    if (!isNativePlatform()) {
      window.addEventListener('popstate', handlePopState)
    }

    return () => {
      if (AppPlugin?.App) {
        AppPlugin.App.removeAllListeners()
      }
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  return {
    pushScreen,
    popScreen,
    clearStack,
    getStackSize,
    getTopScreen,
    stack,
  }
}
