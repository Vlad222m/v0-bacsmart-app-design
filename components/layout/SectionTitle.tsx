"use client"

/**
 * Consistent section title used within tab content.
 * Renders a labeled section heading with an optional action link.
 */
interface SectionTitleProps {
  children: React.ReactNode
  action?: React.ReactNode
}

export function SectionTitle({ children, action }: SectionTitleProps) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2
        className="text-sm font-semibold text-foreground uppercase tracking-wider"
        style={{ fontFamily: "var(--font-syne)" }}
      >
        {children}
      </h2>
      {action && <div className="text-xs text-primary font-medium">{action}</div>}
    </div>
  )
}
