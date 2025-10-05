import { Route, Routes, NavLink } from 'react-router-dom'
import { Box } from '@chakra-ui/react'
import { Calculator } from 'lucide-react'
import { useColorMode } from './components/ColorModeProvider'
import Header from './components/Header'
import Calc from './pages/Calc.tsx'
import './App.css'

function App() {
  return (
    <>
      <Header />
      <Box as="main" flex="1" w="100%">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/calc" element={<Calc />} />
        </Routes>
      </Box>
    </>
  )
}

function Home() {
  const { colorMode } = useColorMode()
  
  return (
    <Box maxW="container.xl" mx="auto" py={6} px={4}>
      <Box
        bg={colorMode === 'light' ? 'white' : 'gray.800'}
        color={colorMode === 'light' ? 'gray.800' : 'white'}
        p={6}
        rounded="lg"
        border="1px solid"
        borderColor={colorMode === 'light' ? 'gray.200' : 'gray.600'}
        shadow="sm">
        <Box as="h2" fontSize="2xl" fontWeight="bold" mb={4}>
          web-tools
        </Box>
        <Box as="p" color={colorMode === 'light' ? 'gray.600' : 'gray.300'} mb={6}>
          便利なウェブツール集
        </Box>
        <Box as="h3" fontSize="lg" fontWeight="medium" mb={3}>
          利用可能なツール
        </Box>
        <Box
          as="ul"
          listStyleType="none"
          m={0}
          p={0}>
          <Box
            as="li"
            p={3}
            bg={colorMode === 'light' ? 'blue.50' : 'blue.900'}
            border="1px solid"
            borderColor={colorMode === 'light' ? 'blue.200' : 'blue.700'}
            rounded="md"
            _hover={{
              bg: colorMode === 'light' ? 'blue.100' : 'blue.800'
            }}
            transition="background-color 0.2s">
            <NavLink 
              to="/calc"
              style={{
                textDecoration: 'none',
                color: colorMode === 'light' ? '#3182CE' : '#90CDF4',
                fontWeight: 'medium',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%'
              }}>
              <Calculator size={20} />
              計算ツール - 改行テキストの数値を合計
            </NavLink>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default App
