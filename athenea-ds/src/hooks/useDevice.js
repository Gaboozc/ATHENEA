import { useState, useEffect } from 'react'

/* ============================================================
   ATHENEA — useDevice
   Detecta si estamos en mobile/desktop y si es nativo (Capacitor)
   ============================================================ */

const MOBILE_BREAKPOINT = 768

function getIsMobile() {
  return window.innerWidth < MOBILE_BREAKPOINT
}

function getIsNative() {
  // Capacitor expone esto cuando corre en iOS/Android
  try {
    return window.Capacitor?.isNativePlatform?.() === true
  } catch {
    return false
  }
}

function getPlatform() {
  try {
    return window.Capacitor?.getPlatform?.() || 'web' // 'ios' | 'android' | 'web'
  } catch {
    return 'web'
  }
}

export function useDevice() {
  const [isMobile, setIsMobile] = useState(getIsMobile)
  const isNative = getIsNative()
  const platform = getPlatform()

  useEffect(() => {
    const handler = () => setIsMobile(getIsMobile())
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  return {
    isMobile,
    isDesktop: !isMobile,
    isNative,
    platform,         // 'ios' | 'android' | 'web'
    isIOS: platform === 'ios',
    isAndroid: platform === 'android',
  }
}
