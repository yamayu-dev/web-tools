import { useColorMode } from '../components/ColorModeProvider'

/**
 * カラーモードに応じたスタイル定義を提供するカスタムフック
 * アプリ全体で一貫したカラーパレットを管理
 */
export const useColorStyles = () => {
  const { colorMode } = useColorMode()
  
  return {
    text: {
      primary: colorMode === 'light' ? 'gray.800' : 'gray.100',
      secondary: colorMode === 'light' ? 'gray.600' : 'gray.300',
      muted: colorMode === 'light' ? 'gray.500' : 'gray.400',
    },
    bg: {
      primary: colorMode === 'light' ? 'white' : 'gray.800',
      secondary: colorMode === 'light' ? 'gray.50' : 'gray.700',
    },
    border: {
      default: colorMode === 'light' ? 'gray.200' : 'gray.600',
      input: colorMode === 'light' ? 'gray.300' : 'gray.600',
    }
  }
}