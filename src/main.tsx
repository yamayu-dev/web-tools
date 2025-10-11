import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import {
  ChakraProvider,
  createSystem,
  defaultConfig,
  defineConfig,
} from "@chakra-ui/react"
import { ColorModeProvider } from './components/ColorModeProvider.tsx'
import { COLOR_TOKENS } from './constants/colorTokens'
import App from './App'
import './index.css'

/**
 * 共通のカラートークンを使用してChakra UI設定を作成
 * useColorStyles.tsと同じカラートークンを参照
 */
const createConfigWithColorStyles = () => {
  return defineConfig({
    theme: {
      tokens: {
        colors: {},
      },
      semanticTokens: {
        colors: {
          // アプリケーションで使用される基本カラー
          'app.text.primary': {
            value: { 
              base: COLOR_TOKENS.light.text.primary, 
              _dark: COLOR_TOKENS.dark.text.primary 
            }
          },
          'app.bg.primary': {
            value: { 
              base: COLOR_TOKENS.light.bg.primary, 
              _dark: COLOR_TOKENS.dark.bg.primary 
            }
          },
        }
      }
    },
    globalCss: {
      body: {
        bg: 'app.bg.primary',
        color: 'app.text.primary',
      },
    },
  })
}

const config = createConfigWithColorStyles()

const system = createSystem(defaultConfig, config)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ChakraProvider value={system}>
      <ColorModeProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <App />
        </BrowserRouter>
      </ColorModeProvider>
    </ChakraProvider>
  </StrictMode>
)
