import { createContext } from 'react'

type ColorMode = 'light' | 'dark'

export interface ColorModeContextType {
  colorMode: ColorMode
  toggleColorMode: () => void
  setColorMode: (mode: ColorMode) => void
  isInitialized: boolean
}

export const ColorModeContext = createContext<ColorModeContextType | undefined>(undefined)
