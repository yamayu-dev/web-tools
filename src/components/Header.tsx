import {
  Box, Flex, Button, Container
} from '@chakra-ui/react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Menu, X, Moon, Sun } from 'lucide-react'
import { useState } from 'react'
import { useColorMode } from '../hooks/useColorMode'
import { useColorStyles } from '../hooks/useColorStyles'
import { UI_CONSTANTS } from '../constants/uiConstants'
const NavItem = ({ to, children, onClick }: { to: string; children: React.ReactNode; onClick?: () => void }) => {
  const location = useLocation()
  const isActive = location.pathname === to
  const { colorMode } = useColorMode()
  const colorStyles = useColorStyles()
  
  const activeColor = colorMode === 'light' ? '#3182CE' : '#90CDF4'
  const textColor = colorStyles.text.secondary
  const activeBg = colorMode === 'light' ? '#EBF8FF' : '#1A365D'
  const hoverBg = colorStyles.bg.secondary
  
  return (
    <NavLink 
      to={to}
      onClick={onClick}
      style={{
        padding: '12px 16px',
        borderRadius: '8px',
        fontWeight: isActive ? 'bold' : 'normal',
        color: isActive ? activeColor : textColor,
        backgroundColor: isActive ? activeBg : 'transparent',
        textDecoration: 'none',
        fontSize: '14px',
        display: 'block',
        transition: 'all 0.2s'
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = hoverBg
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = 'transparent'
        }
      }}>
      {children}
    </NavLink>
  )
}

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const { colorMode, toggleColorMode } = useColorMode()
  const colorStyles = useColorStyles()
  
  const onToggle = () => setIsOpen(!isOpen)
  const closeMenu = () => setIsOpen(false)

  return (
    <>
      <Box 
        as="header" 
        position="fixed" 
        top={0} 
        left={0} 
        right={0} 
        zIndex={UI_CONSTANTS.HEADER_Z_INDEX}
        bg={colorStyles.bg.primary} 
        borderBottom="1px solid" 
        borderColor={colorStyles.border.default} 
        backdropFilter="saturate(180%) blur(8px)"
        shadow="sm">
        <Container maxW="container.xl" px={{ base: 4, md: 6 }}>
          <Flex h={{ base: UI_CONSTANTS.HEADER_HEIGHT_BASE, md: UI_CONSTANTS.HEADER_HEIGHT_MD }} align="center" justify="space-between">
            {/* ロゴ */}
            <Box>
              <Link
                to="/"
                style={{
                  fontWeight: 'bold',
                  fontSize: '20px',
                  color: colorMode === 'light' ? '#1A202C' : '#FFFFFF',
                  textDecoration: 'none',
                  transition: 'color 0.2s',
                  display: 'block'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#3182CE'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = colorMode === 'light' ? '#1A202C' : '#FFFFFF'
                }}>
                web-tools
              </Link>
            </Box>

            {/* デスクトップナビゲーション */}
            <Flex gap={2} display={{ base: 'none', md: 'flex' }} align="center">
              <NavItem to="/">Home</NavItem>
              <NavItem to="/calc">計算</NavItem>
              <NavItem to="/icon-maker">アイコン</NavItem>
              <NavItem to="/test-data-generator">テストデータ</NavItem>
              <Button
                aria-label="カラーモード切り替え"
                onClick={toggleColorMode}
                size="sm"
                variant="ghost"
                bg="transparent"
                color={colorStyles.text.secondary}
                _hover={{
                  bg: colorStyles.bg.secondary,
                  color: colorStyles.text.primary
                }}>
                {colorMode === 'light' ? <Moon size={UI_CONSTANTS.ICON_SIZE_SM} /> : <Sun size={UI_CONSTANTS.ICON_SIZE_SM} />}
              </Button>
            </Flex>

            {/* モバイルメニューボタン */}
            <Flex gap={2} display={{ base: 'flex', md: 'none' }} align="center">
              <Button
                aria-label="カラーモード切り替え"
                onClick={toggleColorMode}
                size="sm"
                variant="ghost"
                bg="transparent"
                color={colorStyles.text.secondary}
                _hover={{
                  bg: colorStyles.bg.secondary,
                  color: colorStyles.text.primary
                }}>
                {colorMode === 'light' ? <Moon size={UI_CONSTANTS.ICON_SIZE_SM} /> : <Sun size={UI_CONSTANTS.ICON_SIZE_SM} />}
              </Button>
              <Button
                aria-label={isOpen ? 'メニューを閉じる' : 'メニューを開く'}
                onClick={onToggle}
                size="sm"
                variant="ghost"
                bg="transparent"
                color={colorStyles.text.secondary}
                _hover={{
                  bg: colorStyles.bg.secondary,
                  color: colorStyles.text.primary
                }}>
                {isOpen ? <X size={UI_CONSTANTS.ICON_SIZE_SM} /> : <Menu size={UI_CONSTANTS.ICON_SIZE_SM} />}
              </Button>
            </Flex>
          </Flex>
        </Container>

        {/* モバイルメニュー */}
        {isOpen && (
          <Box 
            display={{ md: 'none' }} 
            borderTop="1px solid" 
            borderColor={colorStyles.border.default}
            bg={colorStyles.bg.primary}
            shadow="lg">
            <Container maxW="container.xl" px={4} py={3}>
              <Flex direction="column" gap={1}>
                <NavItem to="/" onClick={closeMenu}>Home</NavItem>
                <NavItem to="/calc" onClick={closeMenu}>計算</NavItem>
                <NavItem to="/icon-maker" onClick={closeMenu}>アイコン</NavItem>
                <NavItem to="/test-data-generator" onClick={closeMenu}>テストデータ</NavItem>
              </Flex>
            </Container>
          </Box>
        )}
      </Box>

      {/* ヘッダーの高さ分のスペーサー */}
      <Box h={{ base: UI_CONSTANTS.HEADER_HEIGHT_BASE, md: UI_CONSTANTS.HEADER_HEIGHT_MD }} />
    </>
  )
}
