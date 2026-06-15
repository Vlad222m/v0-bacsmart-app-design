'use client'

import { Suspense } from 'react'
import { AuthProvider } from '@/components/AuthProvider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-6 animate-pulse">
            <span className="text-3xl font-bold text-white">B</span>
          </div>
          <p className="text-foreground">Se incarca...</p>
        </div>
      </div>
    }>
      <AuthProvider>
        {children}
      </AuthProvider>
    </Suspense>
  )
}
