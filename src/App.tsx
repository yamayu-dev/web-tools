import { Route, Routes, NavLink } from 'react-router-dom'
import { Box } from '@chakra-ui/react'
import { Calculator, Palette } from 'lucide-react'
import { useColorStyles } from './hooks/useColorStyles'
import Header from './components/Header'
import Calc from './pages/Calc.tsx'
import IconMaker from './pages/IconMaker.tsx'
import './App.css'

// 定数定義
const APP_CONSTANTS = {
  CALCULATOR_ICON_SIZE: 20,
  GAP_SIZE: '8px',
} as const

function App() {
  return (
    <>
      <Header />
      <Box as="main" flex="1" w="100%">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/calc" element={<Calc />} />
          <Route path="/icon-maker" element={<IconMaker />} />
        </Routes>
      </Box>
    </>
  )
}

function Home() {
  const colorStyles = useColorStyles()
  
  return (
    <Box maxW="container.xl" mx="auto" py={6} px={4}>
      <Box
        bg={colorStyles.bg.primary}
        color={colorStyles.text.primary}
        p={6}
        rounded="lg"
        border="1px solid"
        borderColor={colorStyles.border.default}
        shadow="sm">
        <Box as="h2" fontSize="2xl" fontWeight="bold" mb={4}>
          web-tools
        </Box>
        <Box
          as="ul"
          listStyleType="none"
          m={0}
          p={0}
          gap={4}
          display="flex"
          flexDirection="column">
          <Box
            as="li"
            p={3}
            bg={colorStyles.accent.blue.cardBg}
            border="1px solid"
            borderColor={colorStyles.accent.blue.cardBorder}
            rounded="md"
            _hover={{
              bg: colorStyles.accent.blue.cardHover
            }}
            transition="background-color 0.2s">
            <NavLink 
              to="/calc"
              style={{
                textDecoration: 'none',
                color: colorStyles.accent.blue.linkColor,
                fontWeight: 'medium',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: APP_CONSTANTS.GAP_SIZE,
                width: '100%'
              }}>
              <Calculator size={APP_CONSTANTS.CALCULATOR_ICON_SIZE} />
              計算ツール - 改行テキストの数値合計
            </NavLink>
          </Box>
          <Box
            as="li"
            p={3}
            bg={colorStyles.accent.blue.cardBg}
            border="1px solid"
            borderColor={colorStyles.accent.blue.cardBorder}
            rounded="md"
            _hover={{
              bg: colorStyles.accent.blue.cardHover
            }}
            transition="background-color 0.2s">
            <NavLink 
              to="/icon-maker"
              style={{
                textDecoration: 'none',
                color: colorStyles.accent.blue.linkColor,
                fontWeight: 'medium',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: APP_CONSTANTS.GAP_SIZE,
                width: '100%'
              }}>
              <Palette size={APP_CONSTANTS.CALCULATOR_ICON_SIZE} />
              アイコンメーカー - アイコンを作成
            </NavLink>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default App
