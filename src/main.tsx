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
import App from './App'
import './index.css'

const config = defineConfig({
  theme: {
    tokens: {
      colors: {},
    },
  },
  globalCss: {
    body: {
      bg: 'gray.50',
      color: 'gray.900',
      _dark: {
        bg: 'gray.900',
        color: 'gray.50',
      },
    },
  },
})

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
