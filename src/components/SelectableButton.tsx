import { Button, type ButtonProps } from '@chakra-ui/react'
import { useColorStyles } from '../hooks/useColorStyles'

interface SelectableButtonProps extends Omit<ButtonProps, 'variant' | 'colorScheme'> {
  /** 選択状態かどうか */
  isSelected: boolean
  /** 子要素 */
  children: React.ReactNode
  /** クリック時のコールバック */
  onClick?: () => void
  /** ボタンサイズ */
  size?: 'sm' | 'md' | 'lg'
  /** 無効状態 */
  disabled?: boolean
  /** カスタムスタイル */
  customStyle?: {
    selectedBg?: string
    selectedColor?: string
    unselectedBg?: string
    unselectedColor?: string
  }
}

/**
 * 選択可能なボタンコンポーネント
 * IconMakerの選択ボタンで使用される共通スタイルを提供
 */
export const SelectableButton: React.FC<SelectableButtonProps> = ({
  isSelected,
  children,
  onClick,
  size = 'sm',
  disabled = false,
  customStyle,
  ...rest
}) => {
  const colorStyles = useColorStyles()

  // デフォルトスタイル
  const selectedBg = customStyle?.selectedBg ?? colorStyles.accent.blue.button
  const selectedColor = customStyle?.selectedColor ?? 'white'
  const unselectedBg = customStyle?.unselectedBg ?? 'transparent'
  const unselectedColor = customStyle?.unselectedColor ?? colorStyles.text.primary
  
  const selectedHoverBg = colorStyles.accent.blue.buttonHover
  const unselectedHoverBg = colorStyles.accent.blue.bg

  return (
    <Button
      variant={isSelected ? 'solid' : 'outline'}
      colorScheme="blue"
      onClick={onClick}
      size={size}
      disabled={disabled}
      bg={isSelected ? selectedBg : unselectedBg}
      color={isSelected ? selectedColor : unselectedColor}
      borderColor={colorStyles.accent.blue.border}
      _hover={{
        bg: isSelected ? selectedHoverBg : unselectedHoverBg
      }}
      _disabled={{
        opacity: 0.5,
        cursor: 'not-allowed',
        _hover: {
          bg: isSelected ? selectedBg : unselectedBg
        }
      }}
      transition="all 0.2s"
      {...rest}>
      {children}
    </Button>
  )
}