"use client"

import { Home, MessageCircle, FileText, Camera, TrendingUp, Crown } from "lucide-react"
import type { Tab } from "@/components/types"

const tabs: { id: Tab; icon: React.ComponentType<{ className?: string }>; label: string }[] = [
  { id: "home", icon: Home, label: "Acasă" },
  { id: "chat", icon: MessageCircle, label: "Chat" },
  { id: "tests", icon: FileText, label: "Teste" },
  { id: "rezumate", icon: Camera, label: "Rezumate" },
  { id: "progress", icon: TrendingUp, label: "Progres" },
  { id: "premium", icon: Crown, label: "Premium" },
]

interface AppLayoutProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
  children: React.ReactNode
  /** When true, the bottom nav bar is hidden (for secondary/full-screen overlays) */
  hideNav?: boolean
}

export function AppLayout({ activeTab, onTabChange, children, hideNav = false }: AppLayoutProps) {
  return (
    <div className="h-full w-full flex flex-col bg-background text-foreground">
      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto mobile-scrollbar px-3 sm:px-4 md:px-6 lg:px-8 safe-top flex flex-col">
        <div className="max-w-lg mx-auto lg:max-w-xl flex flex-col flex-1 min-h-0">{children}</div>
      </div>

      {/* Bottom Tab Navigation — persistent on main screens, hidden on secondary */}
      {!hideNav && (
        <nav
          className="sticky bottom-0 left-0 right-0 bg-card border-t border-border px-1 py-2 sm:py-3 safe-bottom"
          style={{ zIndex: 50 }}
        >
          <div className="max-w-lg mx-auto lg:max-w-xl">
            <div className="flex justify-around items-center">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`flex flex-col items-center gap-0.5 sm:gap-1 px-1 sm:px-2 md:px-3 py-1 rounded-xl transition-all ${
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 sm:w-5 sm:h-5 ${
                        isActive ? "fill-primary/20" : ""
                      }`}
                    />
                    <span className="text-[9px] sm:text-[10px] md:text-[11px] font-medium leading-none">
                      {tab.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </nav>
      )}
    </div>
  )
}
