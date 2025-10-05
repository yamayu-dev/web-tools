import React, { createContext, useContext, useEffect, useState } from 'react'

type ColorMode = 'light' | 'dark'

interface ColorModeContextType {
  colorMode: ColorMode
  toggleColorMode: () => void
  setColorMode: (mode: ColorMode) => void
}

const ColorModeContext = createContext<ColorModeContextType | undefined>(undefined)

export const useColorMode = () => {
  const context = useContext(ColorModeContext)
  if (!context) {
    throw new Error('useColorMode must be used within ColorModeProvider')
  }
  return context
}

interface ColorModeProviderProps {
  children: React.ReactNode
}

export const ColorModeProvider: React.FC<ColorModeProviderProps> = ({ children }) => {
  const [colorMode, setColorModeState] = useState<ColorMode>(() => {
    // ローカルストレージから初期値を取得
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('chakra-ui-color-mode')
      if (saved === 'light' || saved === 'dark') {
        return saved
      }
    }
    
    // システム設定を確認
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    
    return 'light'
  })

  const setColorMode = (mode: ColorMode) => {
    setColorModeState(mode)
    localStorage.setItem('chakra-ui-color-mode', mode)
    
    // HTMLにclass属性を設定してCSSでテーマを適用
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('light', 'dark')
      document.documentElement.classList.add(mode)
      document.documentElement.setAttribute('data-theme', mode)
    }
  }

  const toggleColorMode = () => {
    setColorMode(colorMode === 'light' ? 'dark' : 'light')
  }

  useEffect(() => {
    // 初期設定でHTMLにclass属性を設定
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('light', 'dark')
      document.documentElement.classList.add(colorMode)
      document.documentElement.setAttribute('data-theme', colorMode)
    }
  }, [colorMode])

  useEffect(() => {
    // システムのカラーモード変更を監視
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = (e: MediaQueryListEvent) => {
        // ユーザーが手動で設定していない場合のみシステム設定に従う
        const saved = localStorage.getItem('chakra-ui-color-mode')
        if (!saved) {
          setColorMode(e.matches ? 'dark' : 'light')
        }
      }
      
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  const value = {
    colorMode,
    toggleColorMode,
    setColorMode,
  }

  return (
    <ColorModeContext.Provider value={value}>
      {children}
    </ColorModeContext.Provider>
  )
}