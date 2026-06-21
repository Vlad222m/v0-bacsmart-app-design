"use client"

import { ArrowLeft } from "lucide-react"

interface PageHeaderProps {
  title: string
  subtitle?: string
  onBack?: () => void
  /** Optional action element rendered on the right side */
  action?: React.ReactNode
}

/**
 * Consistent page header used across all tabs and overlay screens.
 * - With onBack: shows back arrow + title
 * - Without onBack: title only (optionally with subtitle)
 */
export function PageHeader({ title, subtitle, onBack, action }: PageHeaderProps) {
  if (onBack) {
    return (
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Înapoi</span>
        </button>
        <h1
          className="text-lg font-bold text-foreground text-center"
          style={{ fontFamily: "var(--font-syne)" }}
        >
          {title}
        </h1>
        {action ? action : <div className="w-20" />}
      </div>
    )
  }

  return (
    <div className="mb-6">
      <h1
        className="text-2xl font-bold text-foreground"
        style={{ fontFamily: "var(--font-syne)" }}
      >
        {title}
      </h1>
      {subtitle && (
        <p className="text-muted-foreground text-sm mt-1">{subtitle}</p>
      )}
    </div>
  )
}
