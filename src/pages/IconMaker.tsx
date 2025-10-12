import { useState, useEffect, useRef } from 'react'
import {
  Box,
  Container,
  Heading,
  Text,
  Grid,
  VStack,
  HStack,
  Input,
  Button,
  Flex,
} from '@chakra-ui/react'
import { Download, Image, FileText } from 'lucide-react'
import { useColorStyles } from '../hooks/useColorStyles'
import { useToast } from '../hooks/useToast'
import { ColorPicker } from '../components/ColorPicker'
import { SelectableButton } from '../components/SelectableButton'
import { TOAST_DURATIONS, UI_CONSTANTS, APP_CONFIG } from '../constants/uiConstants'
import { 
  DEFAULT_ICON_CONFIG,
  FONT_FAMILIES,
  type IconConfig, 
  type IconShape, 
  type ExportFormat,
  type ExportSize,
} from '../types/iconMaker'
import { 
  renderIconToCanvas, 
  exportIcon,
  getAutoTextColor,
} from '../utils/iconUtils'

export function IconMaker() {
  const [config, setConfig] = useState<IconConfig>(DEFAULT_ICON_CONFIG)
  const [exportFormat, setExportFormat] = useState<ExportFormat>('png')
  const [exportSize, setExportSize] = useState<ExportSize>(128)
  const [filename, setFilename] = useState('icon')
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const colorStyles = useColorStyles()
  const { message: toastMessage, showToast } = useToast()

  // Canvas描画の更新
  useEffect(() => {
    if (canvasRef.current) {
      renderIconToCanvas(canvasRef.current, config)
    }
  }, [config])

  // 設定更新のヘルパー関数
  const updateConfig = (updates: Partial<IconConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }))
  }

  const updateColorConfig = (updates: Partial<IconConfig['color']>) => {
    setConfig(prev => ({
      ...prev,
      color: { ...prev.color, ...updates }
    }))
  }

  const updateFontConfig = (updates: Partial<IconConfig['font']>) => {
    setConfig(prev => ({
      ...prev,
      font: { ...prev.font, ...updates }
    }))
  }

  // エクスポート処理
  const handleExport = () => {
    try {
      exportIcon(config, exportFormat, exportSize, filename)
      showToast(`${filename}.${exportFormat} をダウンロードしました`, TOAST_DURATIONS.MEDIUM)
    } catch {
      showToast('エクスポートに失敗しました', TOAST_DURATIONS.LONG)
    }
  }

  // 透明背景の制御（square以外で有効）
  const isTransparentDisabled = config.shape === 'square'
  useEffect(() => {
    if (isTransparentDisabled && config.transparentBackground) {
      updateConfig({ transparentBackground: false })
    }
  }, [config.shape, isTransparentDisabled, config.transparentBackground])

  // 文字色の自動更新
  useEffect(() => {
    if (config.color.autoTextColor) {
      const bgColor = config.color.useGradient 
        ? config.color.gradientStartColor 
        : config.color.backgroundColor
      const autoColor = getAutoTextColor(bgColor)
      updateColorConfig({ textColor: autoColor })
    }
  }, [
    config.color.autoTextColor,
    config.color.useGradient,
    config.color.backgroundColor,
    config.color.gradientStartColor
  ])

  return (
    <Container maxW="container.xl" py={6} px={4} mx="auto">
      {/* ヘッダー */}
      <Box mb={6}>
        <Heading 
          as="h2" 
          size={{ base: 'lg', md: 'xl' }}
          color={colorStyles.text.primary}
          mb={2}>
          アイコンメーカー
        </Heading>
        <Text color={colorStyles.text.secondary} fontSize={{ base: 'sm', md: 'md' }}>
          イニシャルやテキストからアイコンを作成します
        </Text>
      </Box>

      {/* トースト表示 */}
      {toastMessage && (
        <Box
          position="fixed"
          top={5}
          right={4}
          bg={colorStyles.accent.blue.button}
          color="white"
          px={4}
          py={2}
          rounded="md"
          shadow="lg"
          zIndex={1000}>
          {toastMessage}
        </Box>
      )}

      <Grid 
        templateColumns={{ base: '1fr', lg: '2fr 1fr' }} 
        gap={UI_CONSTANTS.GRID_GAP}>
        
        {/* 設定パネル */}
        <VStack 
          align="stretch" 
          gap={UI_CONSTANTS.FORM_GAP}
          bg={colorStyles.bg.secondary}
          p={6}
          rounded="lg"
          border="1px solid"
          borderColor={colorStyles.border.default}>
          
          {/* テキスト設定 */}
          <Box>
            <Text fontSize="sm" fontWeight="medium" color={colorStyles.text.primary} mb={2}>
              テキスト（1-2文字）
            </Text>
            <Input
              value={config.text}
              onChange={(e) => {
                const text = e.target.value.slice(0, APP_CONFIG.MAX_TEXT_LENGTH)
                updateConfig({ text })
              }}
              placeholder="A"
              bg={colorStyles.bg.primary}
              color={colorStyles.text.primary}
              borderColor={colorStyles.border.input}
              _focus={{
                borderColor: colorStyles.accent.blue.focus,
                boxShadow: `0 0 0 1px ${colorStyles.accent.blue.focus}`
              }}
            />
          </Box>

          {/* 形状設定 */}
          <Box>
            <Text fontSize="sm" fontWeight="medium" color={colorStyles.text.primary} mb={2}>
              形状
            </Text>
            <HStack gap={2}>
              {(['circle', 'square', 'rounded'] as IconShape[]).map((shape) => (
                <SelectableButton
                  key={shape}
                  isSelected={config.shape === shape}
                  onClick={() => updateConfig({ shape })}
                  size="sm"
                  flex={1}>
                  {shape === 'circle' ? '円形' : shape === 'square' ? '正方形' : '角丸'}
                </SelectableButton>
              ))}
            </HStack>
          </Box>

          {/* 透明背景オプション */}
          <Box>
            <Flex justify="space-between" align="center">
              <Text fontSize="sm" color={colorStyles.text.primary}>
                背景透明（外側を透明に）
              </Text>
              <SelectableButton
                size="sm"
                isSelected={config.transparentBackground}
                onClick={() => updateConfig({ transparentBackground: !config.transparentBackground })}
                disabled={isTransparentDisabled}>
                {config.transparentBackground ? 'ON' : 'OFF'}
              </SelectableButton>
            </Flex>
          </Box>

          {/* 区切り線 */}
          <Box h="1px" bg={colorStyles.border.default} />

          {/* カラー設定 */}
          <VStack align="stretch" gap={4}>
            <Text fontSize="md" fontWeight="medium" color={colorStyles.text.primary}>
              カラー設定
            </Text>
            
            {/* グラデーション切り替え */}
            <Flex justify="space-between" align="center">
              <Text fontSize="sm" color={colorStyles.text.primary}>
                グラデーション
              </Text>
              <SelectableButton
                size="sm"
                isSelected={config.color.useGradient}
                onClick={() => updateColorConfig({ useGradient: !config.color.useGradient })}>
                {config.color.useGradient ? 'ON' : 'OFF'}
              </SelectableButton>
            </Flex>

            {config.color.useGradient ? (
              <VStack align="stretch" gap={3}>
                {/* グラデーション種類 */}
                <Box>
                  <Text fontSize="sm" color={colorStyles.text.primary} mb={2}>
                    グラデーション種類
                  </Text>
                  <HStack gap={2}>
                    <SelectableButton
                      isSelected={config.color.gradientType === 'linear'}
                      onClick={() => updateColorConfig({ gradientType: 'linear' })}
                      size="sm"
                      flex={1}>
                      線形
                    </SelectableButton>
                    <SelectableButton
                      isSelected={config.color.gradientType === 'radial'}
                      onClick={() => updateColorConfig({ gradientType: 'radial' })}
                      size="sm"
                      flex={1}>
                      放射
                    </SelectableButton>
                  </HStack>
                </Box>
                
                {/* グラデーション開始色 */}
                <ColorPicker
                  label="開始色"
                  value={config.color.gradientStartColor}
                  onChange={(color) => updateColorConfig({ gradientStartColor: color })}
                />
                
                {/* グラデーション終了色 */}
                <ColorPicker
                  label="終了色"
                  value={config.color.gradientEndColor}
                  onChange={(color) => updateColorConfig({ gradientEndColor: color })}
                />
              </VStack>
            ) : (
              /* 単色背景 */
              <ColorPicker
                label="背景色"
                value={config.color.backgroundColor}
                onChange={(color) => updateColorConfig({ backgroundColor: color })}
              />
            )}

            {/* 文字色設定 */}
            <VStack align="stretch" gap={3}>
              <Flex justify="space-between" align="center">
                <Text fontSize="sm" color={colorStyles.text.primary}>
                  文字色を自動調整
                </Text>
                <SelectableButton
                  size="sm"
                  isSelected={config.color.autoTextColor}
                  onClick={() => updateColorConfig({ autoTextColor: !config.color.autoTextColor })}>
                  {config.color.autoTextColor ? 'ON' : 'OFF'}
                </SelectableButton>
              </Flex>

              {!config.color.autoTextColor && (
                <ColorPicker
                  label="文字色"
                  value={config.color.textColor}
                  onChange={(color) => updateColorConfig({ textColor: color })}
                />
              )}
            </VStack>
          </VStack>

          {/* 区切り線 */}
          <Box h="1px" bg={colorStyles.border.default} />

          {/* フォント設定 */}
          <VStack align="stretch" gap={4}>
            <Text fontSize="md" fontWeight="medium" color={colorStyles.text.primary}>
              フォント設定
            </Text>
            
            {/* フォントファミリー */}
            <Box>
              <Text fontSize="sm" color={colorStyles.text.primary} mb={2}>
                フォントファミリー
              </Text>
              <VStack align="stretch" gap={2}>
                {FONT_FAMILIES.slice(0, 4).map((font) => (
                  <SelectableButton
                    key={font.value}
                    isSelected={config.font.fontFamily === font.value}
                    onClick={() => updateFontConfig({ fontFamily: font.value })}
                    size="sm"
                    textAlign="left"
                    justifyContent="flex-start">
                    {font.label}
                  </SelectableButton>
                ))}
              </VStack>
            </Box>
            
            {/* フォントサイズ */}
            <Box>
              <Text fontSize="sm" color={colorStyles.text.primary} mb={2}>
                フォントサイズ: {Math.round(config.font.fontSize * 100)}%
              </Text>
              <HStack gap={2}>
                <Button
                  size="sm"
                  onClick={() => updateFontConfig({ fontSize: Math.max(0.2, config.font.fontSize - 0.1) })}
                  colorScheme="blue"
                  variant="outline"
                  bg={colorStyles.bg.primary}
                  color={colorStyles.text.primary}
                  borderColor={colorStyles.accent.blue.border}
                  _hover={{
                    bg: colorStyles.accent.blue.bg,
                    borderColor: colorStyles.accent.blue.text
                  }}>
                  -
                </Button>
                <Box flex={1} textAlign="center">
                  <Text fontSize="sm" color={colorStyles.text.secondary}>
                    {Math.round(config.font.fontSize * 100)}%
                  </Text>
                </Box>
                <Button
                  size="sm"
                  onClick={() => updateFontConfig({ fontSize: Math.min(0.8, config.font.fontSize + 0.1) })}
                  colorScheme="blue"
                  variant="outline"
                  bg={colorStyles.bg.primary}
                  color={colorStyles.text.primary}
                  borderColor={colorStyles.accent.blue.border}
                  _hover={{
                    bg: colorStyles.accent.blue.bg,
                    borderColor: colorStyles.accent.blue.text
                  }}>
                  +
                </Button>
              </HStack>
            </Box>

            {/* フォントウェイト */}
            <Box>
              <Text fontSize="sm" color={colorStyles.text.primary} mb={2}>
                フォントウェイト
              </Text>
              <HStack gap={2} wrap="wrap">
                {[
                  { value: '400', label: '標準' },
                  { value: '600', label: 'セミ' },
                  { value: '700', label: 'ボールド' }
                ].map((weight) => (
                  <SelectableButton
                    key={weight.value}
                    isSelected={config.font.fontWeight === weight.value}
                    onClick={() => updateFontConfig({ fontWeight: weight.value as any })}
                    size="sm"
                    flex={1}>
                    {weight.label}
                  </SelectableButton>
                ))}
              </HStack>
            </Box>
          </VStack>
        </VStack>

        {/* プレビューとエクスポート */}
        <VStack 
          align="stretch" 
          gap={UI_CONSTANTS.FORM_GAP}
          bg={colorStyles.bg.secondary}
          p={6}
          rounded="lg"
          border="1px solid"
          borderColor={colorStyles.border.default}>
          
          {/* プレビュー */}
          <Box>
            <Text fontSize="md" fontWeight="medium" color={colorStyles.text.primary} mb={4}>
              プレビュー
            </Text>
            <Flex justify="center" mb={4}>
              <canvas
                ref={canvasRef}
                width={UI_CONSTANTS.PREVIEW_SIZE}
                height={UI_CONSTANTS.PREVIEW_SIZE}
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                  border: `1px solid ${colorStyles.border.default}`,
                  borderRadius: '8px',
                }}
              />
            </Flex>
          </Box>

          {/* 区切り線 */}
          <Box h="1px" bg={colorStyles.border.default} />

          {/* エクスポート設定 */}
          <VStack align="stretch" gap={4}>
            <Text fontSize="md" fontWeight="medium" color={colorStyles.text.primary}>
              エクスポート
            </Text>

            {/* ファイル名 */}
            <Box>
              <Text fontSize="sm" color={colorStyles.text.primary} mb={2}>
                ファイル名
              </Text>
              <Input
                value={filename}
                onChange={(e) => setFilename(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                placeholder="icon"
                bg={colorStyles.bg.primary}
                color={colorStyles.text.primary}
                borderColor={colorStyles.border.input}
                _focus={{
                  borderColor: colorStyles.accent.blue.focus,
                  boxShadow: `0 0 0 1px ${colorStyles.accent.blue.focus}`
                }}
              />
            </Box>

            {/* ファイル形式 */}
            <Box>
              <Text fontSize="sm" color={colorStyles.text.primary} mb={2}>
                ファイル形式
              </Text>
              <HStack gap={3}>
                <SelectableButton
                  isSelected={exportFormat === 'png'}
                  onClick={() => setExportFormat('png')}
                  flex={1}
                  size="sm">
                  <Image size={16} style={{ marginRight: '8px' }} />
                  PNG
                </SelectableButton>
                <SelectableButton
                  isSelected={exportFormat === 'svg'}
                  onClick={() => setExportFormat('svg')}
                  flex={1}
                  size="sm">
                  <FileText size={16} style={{ marginRight: '8px' }} />
                  SVG
                </SelectableButton>
              </HStack>
            </Box>

            {/* サイズ選択 */}
            <Box>
              <Text fontSize="sm" color={colorStyles.text.primary} mb={2}>
                出力サイズ
              </Text>
              <HStack gap={2}>
                {([64, 128, 256] as ExportSize[]).map((size) => (
                  <SelectableButton
                    key={size}
                    isSelected={exportSize === size}
                    onClick={() => setExportSize(size)}
                    size="sm"
                    flex={1}>
                    {size}×{size}
                  </SelectableButton>
                ))}
              </HStack>
            </Box>

            {/* ダウンロードボタン */}
            <Button
              onClick={handleExport}
              colorScheme="blue"
              size="lg"
              bg={colorStyles.accent.blue.button}
              color="white"
              _hover={{ bg: colorStyles.accent.blue.buttonHover }}
              disabled={!filename.trim() || !config.text.trim()}>
              <Download size={20} style={{ marginRight: '8px' }} />
              ダウンロード
            </Button>
          </VStack>
        </VStack>
      </Grid>
    </Container>
  )
}

export default IconMaker