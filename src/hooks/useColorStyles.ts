import { useColorMode } from '../hooks/useColorMode'
import { COLOR_TOKENS } from '../constants/colorTokens'

/**
 * カラーモードに応じたスタイル定義を提供するカスタムフック
 * アプリ全体で一貫したカラーパレットを管理
 */
export const useColorStyles = () => {
  const { colorMode, isInitialized } = useColorMode()
  
  // 初期化が完了していない場合はライトモードのスタイルを返す
  const safeColorMode = isInitialized ? colorMode : 'light'
  
  return safeColorMode === 'light' ? COLOR_TOKENS.light : COLOR_TOKENS.dark
}