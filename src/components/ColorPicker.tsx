import { useState } from 'react'
import {
  Box,
  Input,
  Flex,
  Text,
  Grid,
  VStack,
  HStack,
} from '@chakra-ui/react'
import { useColorStyles } from '../hooks/useColorStyles'
import { PRESET_COLORS } from '../types/iconMaker'

interface ColorPickerProps {
  /** 現在の色（16進数） */
  value: string
  /** 色が変更された時のコールバック */
  onChange: (color: string) => void
  /** ラベル */
  label?: string
  /** 無効化フラグ */
  disabled?: boolean
}

/**
 * カラーピッカーコンポーネント
 * 16進数入力とブラウザネイティブのカラーピッカーが連動
 */
export const ColorPicker: React.FC<ColorPickerProps> = ({
  value,
  onChange,
  label,
  disabled = false,
}) => {
  const colorStyles = useColorStyles()
  const [hexInput, setHexInput] = useState(value)

  // 16進数の形式をバリデート
  const isValidHex = (hex: string): boolean => {
    return /^#[0-9A-Fa-f]{6}$/.test(hex)
  }

  // 16進数入力の変更処理
  const handleHexChange = (newHex: string) => {
    setHexInput(newHex)
    if (isValidHex(newHex)) {
      onChange(newHex.toUpperCase())
    }
  }

  // カラーピッカーの変更処理
  const handleColorPickerChange = (newColor: string) => {
    const upperColor = newColor.toUpperCase()
    setHexInput(upperColor)
    onChange(upperColor)
  }

  // プリセットカラーの選択処理
  const handlePresetSelect = (color: string) => {
    const upperColor = color.toUpperCase()
    setHexInput(upperColor)
    onChange(upperColor)
  }

  return (
    <VStack align="stretch" gap={3}>
      {label && (
        <Text fontSize="sm" fontWeight="medium" color={colorStyles.text.primary}>
          {label}
        </Text>
      )}
      
      {/* カラーピッカーと16進数入力 */}
      <HStack gap={3}>
        {/* ネイティブカラーピッカー */}
        <Box position="relative">
          <Input
            type="color"
            value={value}
            onChange={(e) => handleColorPickerChange(e.target.value)}
            disabled={disabled}
            w="50px"
            h="40px"
            p={0}
            border="1px solid"
            borderColor={colorStyles.border.input}
            borderRadius="md"
            cursor={disabled ? 'not-allowed' : 'pointer'}
            _disabled={{
              opacity: 0.5,
            }}
          />
        </Box>

        {/* 16進数入力 */}
        <Input
          value={hexInput}
          onChange={(e) => handleHexChange(e.target.value)}
          placeholder="#000000"
          maxLength={7}
          disabled={disabled}
          flex={1}
          bg={colorStyles.bg.primary}
          color={colorStyles.text.primary}
          borderColor={isValidHex(hexInput) ? colorStyles.border.input : colorStyles.accent.red.border}
          _focus={{
            borderColor: colorStyles.accent.blue.focus,
            boxShadow: `0 0 0 1px ${colorStyles.accent.blue.focus}`,
          }}
          _disabled={{
            opacity: 0.5,
            cursor: 'not-allowed',
          }}
        />
      </HStack>

      {/* プリセットカラー */}
      <Box>
        <Text fontSize="xs" color={colorStyles.text.secondary} mb={2}>
          プリセットカラー
        </Text>
        <Grid templateColumns="repeat(5, 1fr)" gap={2}>
          {PRESET_COLORS.map((color) => (
            <Box
              key={color}
              w="30px"
              h="30px"
              bg={color}
              borderRadius="md"
              border="2px solid"
              borderColor={value.toUpperCase() === color.toUpperCase() ? colorStyles.accent.blue.border : colorStyles.border.default}
              cursor={disabled ? 'not-allowed' : 'pointer'}
              opacity={disabled ? 0.5 : 1}
              onClick={() => !disabled && handlePresetSelect(color)}
              _hover={!disabled ? {
                transform: 'scale(1.1)',
                borderColor: colorStyles.accent.blue.border,
              } : {}}
              transition="all 0.2s"
            />
          ))}
        </Grid>
      </Box>

      {/* 色プレビュー */}
      <Flex align="center" gap={3}>
        <Box
          w="40px"
          h="20px"
          bg={isValidHex(value) ? value : colorStyles.bg.secondary}
          border="1px solid"
          borderColor={colorStyles.border.default}
          borderRadius="md"
        />
        <Text fontSize="xs" color={colorStyles.text.secondary}>
          {isValidHex(value) ? value : '無効な色'}
        </Text>
      </Flex>
    </VStack>
  )
}