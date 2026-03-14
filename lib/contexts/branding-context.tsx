"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { CompanyBranding, BrandingContextType } from "@/lib/types"

// Default branding settings
const defaultBranding: CompanyBranding = {
  id: "default",
  name: "DeskFlow",
  primaryColor: "#3b82f6",
  secondaryColor: "#10b981",
  textColor: "#111827",
  activeButtonTextColor: "#ffffff",
  description: "Nowoczesne rozwiązania do zarządzania biurem",
}

const BrandingContext = createContext<BrandingContextType | null>(null)

interface BrandingProviderProps {
  children: ReactNode
}

export function BrandingProvider({ children }: BrandingProviderProps) {
  const [branding, setBranding] = useState<CompanyBranding>(defaultBranding)
  const [isLoaded, setIsLoaded] = useState(false)

  // Apply theme colors to CSS variables
  const applyTheme = React.useCallback((
    primaryColor: string,
    secondaryColor: string,
    textColor = "#111827",
    activeButtonTextColor = "#ffffff"
  ) => {
    const root = document.documentElement

    const hexToRgb = (hex: string) => {
      const normalized = hex.replace("#", "")
      if (normalized.length !== 6) {
        return null
      }

      const r = parseInt(normalized.slice(0, 2), 16)
      const g = parseInt(normalized.slice(2, 4), 16)
      const b = parseInt(normalized.slice(4, 6), 16)

      if ([r, g, b].some((value) => Number.isNaN(value))) {
        return null
      }

      return { r, g, b }
    }

    const blendWithBlack = (hex: string, ratio: number) => {
      const rgb = hexToRgb(hex)
      if (!rgb) return hex

      const nextR = Math.round(rgb.r * (1 - ratio))
      const nextG = Math.round(rgb.g * (1 - ratio))
      const nextB = Math.round(rgb.b * (1 - ratio))

      return `rgb(${nextR}, ${nextG}, ${nextB})`
    }

    const blendWithWhite = (hex: string, ratio: number) => {
      const rgb = hexToRgb(hex)
      if (!rgb) return hex

      const nextR = Math.round(rgb.r + (255 - rgb.r) * ratio)
      const nextG = Math.round(rgb.g + (255 - rgb.g) * ratio)
      const nextB = Math.round(rgb.b + (255 - rgb.b) * ratio)

      return `rgb(${nextR}, ${nextG}, ${nextB})`
    }

    try {
      // Keep original hue from selected brand colors.
      root.style.setProperty('--primary', primaryColor)
      root.style.setProperty('--accent', secondaryColor)
      root.style.setProperty('--ring', primaryColor)
      root.style.setProperty('--foreground', textColor)
      root.style.setProperty('--card-foreground', textColor)
      root.style.setProperty('--popover-foreground', textColor)
      root.style.setProperty('--muted-foreground', blendWithWhite(textColor, 0.35))
      root.style.setProperty('--primary-foreground', activeButtonTextColor)
      root.style.setProperty('--accent-foreground', activeButtonTextColor)

      // Sidebar variables control active/hover states on the left menu.
      root.style.setProperty('--sidebar-primary', primaryColor)
      root.style.setProperty('--sidebar-accent', blendWithBlack(secondaryColor, 0.72))
      root.style.setProperty('--sidebar-ring', primaryColor)
      root.style.setProperty('--sidebar-border', blendWithBlack(primaryColor, 0.7))
      
      // Update company-specific variables for custom components
      root.style.setProperty('--company-primary', primaryColor)
      root.style.setProperty('--company-secondary', secondaryColor)
      root.style.setProperty('--company-text', textColor)
      root.style.setProperty('--company-active-button-text', activeButtonTextColor)
      const primaryRgb = hexToRgb(primaryColor)
      const secondaryRgb = hexToRgb(secondaryColor)
      const textRgb = hexToRgb(textColor)
      const activeButtonTextRgb = hexToRgb(activeButtonTextColor)
      if (primaryRgb) {
        root.style.setProperty('--company-primary-rgb', `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`)
      }
      if (secondaryRgb) {
        root.style.setProperty('--company-secondary-rgb', `${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}`)
      }
      if (textRgb) {
        root.style.setProperty('--company-text-rgb', `${textRgb.r}, ${textRgb.g}, ${textRgb.b}`)
      }
      if (activeButtonTextRgb) {
        root.style.setProperty('--company-active-button-text-rgb', `${activeButtonTextRgb.r}, ${activeButtonTextRgb.g}, ${activeButtonTextRgb.b}`)
      }
      
      // Update floor plan element colors
      root.style.setProperty('--desk-available', secondaryColor)
      root.style.setProperty('--desk-reserved', primaryColor)
      root.style.setProperty('--room-available', secondaryColor)
      root.style.setProperty('--room-reserved', primaryColor)
      root.style.setProperty('--room-occupied', '#ef4444') // Keep red for occupied
      
      console.log('Theme applied successfully:', { 
        primary: primaryColor, 
        secondary: secondaryColor,
        text: textColor,
        activeButtonText: activeButtonTextColor,
      })
    } catch (error) {
      console.error('Error applying theme:', error)
    }
  }, [])

  // Update branding settings
  const updateBranding = React.useCallback(async (updates: Partial<CompanyBranding>) => {
    try {
      const nextBranding = { ...branding, ...updates }

      const response = await fetch('/api/company/active', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextBranding),
      })

      if (!response.ok) {
        throw new Error('Failed to save branding')
      }

      setBranding(nextBranding)
      applyTheme(
        nextBranding.primaryColor,
        nextBranding.secondaryColor,
        nextBranding.textColor || defaultBranding.textColor,
        nextBranding.activeButtonTextColor || defaultBranding.activeButtonTextColor
      )
      
      return Promise.resolve()
    } catch (error) {
      console.error('Error updating branding:', error)
      return Promise.reject(error)
    }
  }, [applyTheme, branding])

  // Load branding from API on mount.
  useEffect(() => {
    const loadBranding = async () => {
      try {
        const response = await fetch('/api/company/active', { cache: 'no-store' })
        if (response.ok) {
          const data = await response.json()
          if (data?.branding) {
            setBranding({
              id: data.company?.id || defaultBranding.id,
              ...defaultBranding,
              ...data.branding,
            })
          }
        }
      } catch (error) {
        console.error('Error loading branding:', error)
      } finally {
        setIsLoaded(true)
      }
    }

    loadBranding()
  }, [])

  // Apply theme when branding changes
  useEffect(() => {
    applyTheme(
      branding.primaryColor,
      branding.secondaryColor,
      branding.textColor || defaultBranding.textColor,
      branding.activeButtonTextColor || defaultBranding.activeButtonTextColor
    )
  }, [branding.primaryColor, branding.secondaryColor, branding.textColor, branding.activeButtonTextColor, applyTheme])

  if (!isLoaded) {
    return null
  }

  const contextValue: BrandingContextType = {
    branding,
    updateBranding,
    applyTheme,
  }

  return (
    <BrandingContext.Provider value={contextValue}>
      {children}
    </BrandingContext.Provider>
  )
}

export function useBranding() {
  const context = useContext(BrandingContext)
  if (!context) {
    throw new Error('useBranding must be used within a BrandingProvider')
  }
  return context
}

// Hook to get company logo with fallback
export function useCompanyLogo() {
  const { branding } = useBranding()
  
  return {
    logo: branding.logo,
    fallback: branding.name.substring(0, 2).toUpperCase(),
    primaryColor: branding.primaryColor,
    companyName: branding.name,
  }
}