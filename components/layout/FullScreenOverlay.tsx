"use client"

/**
 * Full-screen overlay wrapper for secondary screens (profile, settings, help, etc.).
 * Renders a fixed full-viewport container that sits on top of the main layout.
 * Includes safe-area padding and consistent inner max-width.
 */
interface FullScreenOverlayProps {
  children: React.ReactNode
  /** z-index for stacking. Default: 150 (above main layout) */
  zIndex?: number
}

export function FullScreenOverlay({ children, zIndex = 150 }: FullScreenOverlayProps) {
  return (
    <div
      className="fixed inset-0 bg-background z-[150] animate-in slide-in-from-right duration-300 overflow-y-auto overflow-x-hidden"
      style={{ zIndex }}
    >
      <div className="h-full flex flex-col px-4 sm:px-6 py-4 w-full max-w-xl mx-auto safe-bottom">
        {children}
      </div>
    </div>
  )
}
