import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Box,
  Container,
  Heading,
  Button,
  Textarea,
  Text,
  Flex
} from '@chakra-ui/react'
import { useToast } from '../hooks/useToast'
import { useColorStyles } from '../hooks/useColorStyles'
import { formatNumber, parseNumbers } from '../utils/numberUtils'
import { writeToClipboard, getClipboardMessages } from '../utils/clipboardUtils'
import { TOAST_DURATIONS, UI_CONSTANTS } from '../constants/uiConstants'
import type { Mode } from '../types/calculator'

export function Calc() {
  const [text, setText] = useState<string>('')
  const [mode, setMode] = useState<Mode>('perLineFirstNumber')
  const taRef = useRef<HTMLTextAreaElement | null>(null)
  const colorStyles = useColorStyles()
  const { message: toastMessage, showToast } = useToast()

  // 解析ロジック
  const { sum, count, numbers, errors } = useMemo(() => {
    return parseNumbers(text, mode)
  }, [text, mode])

  // Ctrl/Cmd+Enter で計算結果を表示、Ctrl/Cmd+V でペースト
  useEffect(() => {
    const el = taRef.current
    if (!el) return
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        const result = `計算完了: 合計 ${new Intl.NumberFormat().format(sum)}`
        showToast(result, TOAST_DURATIONS.LONG)
      }
      // HTTP環境でのペーストサポート
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && !window.isSecureContext) {
        // ブラウザの標準ペースト動作を許可し、成功メッセージを表示
        setTimeout(() => {
          showToast('貼り付け完了', TOAST_DURATIONS.MEDIUM)
        }, UI_CONSTANTS.PASTE_DELAY)
      }
    }
    el.addEventListener('keydown', handler)
    return () => el.removeEventListener('keydown', handler)
  }, [sum, showToast])

  const handlePasteFromClipboard = async () => {
    try {
      // 最新のブラウザではナビゲーター.クリップボードが優先
      if (navigator.clipboard) {
        try {
          const clipboardText = await navigator.clipboard.readText()
          setText(clipboardText)
          showToast('クリップボードから貼り付け完了')
          return
        } catch (clipError) {
          // クリップボード権限がない場合は下のフォールバックを試す
          console.log('Clipboard API failed, trying fallback:', clipError)
        }
      }
    } catch {
      // navigator.clipboardが存在しない場合
    }

    // フォールバック: execCommandを使用
    try {
      if (taRef.current) {
        const textarea = taRef.current
        
        // 一時的に空の値にして、ペースト結果を確実に検出
        const originalValue = textarea.value
        textarea.value = ''
        
        // フォーカスして選択
        textarea.focus()
        textarea.select()

        // 短時間待ってからペースト実行
        setTimeout(() => {
          document.execCommand('paste')
          
          // ペースト後の値を確認
          setTimeout(() => {
            if (textarea.value && textarea.value.trim()) {
              setText(textarea.value)
              showToast('クリップボードから貼り付け完了')
            } else {
              // ペーストが失敗した場合、元の値に戻す
              textarea.value = originalValue
              setText(originalValue)
              showToast('Ctrl+V (Cmd+V) で貼り付けてください', TOAST_DURATIONS.ERROR)
            }
          }, UI_CONSTANTS.PASTE_CHECK_DELAY)
        }, UI_CONSTANTS.PASTE_COMMAND_DELAY)
      }
    } catch {
      showToast('Ctrl+V (Cmd+V) で貼り付けてください', TOAST_DURATIONS.ERROR)
    }
  }

  const handleClear = () => {
    setText('')
    showToast('クリア完了', TOAST_DURATIONS.SHORT)
  }

  const handleCopySum = async () => {
    const messages = getClipboardMessages()
    try {
      await writeToClipboard(sum.toString())
      showToast(messages.copySuccess)
    } catch {
      showToast(messages.copyError, TOAST_DURATIONS.LONG)
    }
  }

  return (
    <Container maxW="container.xl" py={6} px={4} mx="auto">
      <Box mb={6}>
        {/* ヘッダー */}
        <Heading 
          as="h2" 
          size={{ base: 'lg', md: 'xl' }}
          color={colorStyles.text.primary}
          mb={2}>
          計算ツール
        </Heading>
        <Text color={colorStyles.text.secondary} fontSize={{ base: 'sm', md: 'md' }}>
          改行区切りのテキストから数値を抽出して合計を計算します
        </Text>
      </Box>

      {/* トースト表示 */}
      {toastMessage && (
        <Box
          position="fixed"
          top={UI_CONSTANTS.TOAST_POSITION_TOP}
          right={4}
          bg={colorStyles.accent.blue.button}
          color="white"
          px={4}
          py={2}
          rounded="md"
          shadow="lg"
          zIndex={UI_CONSTANTS.TOAST_Z_INDEX}>
          {toastMessage}
        </Box>
      )}

      {/* コントロール */}
      <Box 
        bg={colorStyles.bg.secondary} 
        p={4} 
        rounded="lg" 
        border="1px solid" 
        borderColor={colorStyles.border.default}
        mb={6}>
        <Flex 
          direction={{ base: 'column', md: 'row' }}
          gap={4}
          align={{ base: 'stretch', md: 'center' }}>
          
          <Box flex="1">
            <Text fontSize="sm" fontWeight="medium" mb={2} color={colorStyles.text.primary}>
              計算モード
            </Text>
            <select
              value={mode} 
              onChange={(e) => setMode(e.target.value as Mode)}
              className="calc-select"
              style={{
                borderRadius: '6px',
                padding: '8px 12px',
                fontSize: '14px',
                width: '100%'
              }}>
              <option value="perLineFirstNumber">
                行ごとに最初の数値を合計
              </option>
              <option value="allNumbersInText">
                全文中のすべての数値を合計
              </option>
            </select>
          </Box>

          <Flex gap={3} flexWrap="wrap">
            <Button 
              onClick={handleClear}
              variant="outline"
              colorScheme="red"
              size={{ base: 'sm', md: 'md' }}
              bg={colorStyles.bg.primary}
              color={colorStyles.accent.red.text}
              borderColor={colorStyles.accent.red.border}
              _hover={{
                bg: colorStyles.accent.red.bg,
                borderColor: colorStyles.accent.red.borderHover
              }}>
              クリア
            </Button>
            <Button 
              onClick={handlePasteFromClipboard}
              colorScheme="blue"
              size={{ base: 'sm', md: 'md' }}
              bg={colorStyles.accent.blue.button}
              color="white"
              _hover={{
                bg: colorStyles.accent.blue.buttonHover
              }}>
              クリップボードから貼り付け
            </Button>
          </Flex>
        </Flex>
      </Box>

      {/* テキストエリア */}
      <Box mb={6}>
        <Text fontSize="sm" fontWeight="medium" mb={2} color={colorStyles.text.primary}>
          計算対象のテキスト
        </Text>
        <Textarea
          ref={taRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`例）各行に金額や数値を貼り付け\n100\n-20.5\n1.2e3\tラベル付きでもOK\n合計したい値が行頭でなくてもOK`}
          minH={{ base: '200px', md: '240px' }}
          fontFamily="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
          fontSize={{ base: 'sm', md: 'md' }}
          bg={colorStyles.bg.primary}
          color={colorStyles.text.primary}
          borderColor={colorStyles.border.input}
          _focus={{
            borderColor: colorStyles.accent.blue.focus,
            boxShadow: `0 0 0 1px ${colorStyles.accent.blue.focus}`
          }}
          resize="vertical"
        />
      </Box>

      {/* 結果表示 */}
      <Result sum={sum} count={count} numbers={numbers} errors={errors} onCopySum={handleCopySum} />
    </Container>
  )
}

function Result({ sum, count, numbers, errors, onCopySum }: { 
  sum: number; 
  count: number; 
  numbers: number[]; 
  errors: string[];
  onCopySum: () => Promise<void>;
}) {
  const [showDetails, setShowDetails] = useState(false)
  const [showNumbers, setShowNumbers] = useState(false)
  const colorStyles = useColorStyles()
  
  const avg = numbers.length ? numbers.reduce((a, b) => a + b, 0) / numbers.length : 0

  return (
    <Box>
      <Heading as="h3" size="md" color={colorStyles.text.primary} mb={4}>
        計算結果
      </Heading>

      {/* メイン結果 */}
      <Box
        display="grid"
        gridTemplateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }}
        gap={4}
        mb={6}>
        
        <Box 
          bg={colorStyles.bg.primary} 
          p={4} 
          rounded="lg" 
          border="1px solid" 
          borderColor={colorStyles.border.default}>
          <Text fontSize="sm" color={colorStyles.text.secondary} fontWeight="medium">件数</Text>
          <Text fontSize={{ base: 'xl', md: '2xl' }} fontWeight="bold" color={colorStyles.text.primary}>
            {count}
          </Text>
          <Text fontSize="xs" color={colorStyles.text.muted}>処理した数値の個数</Text>
        </Box>

        <Box 
          bg={colorStyles.bg.primary} 
          p={4} 
          rounded="lg" 
          border="1px solid" 
          borderColor={colorStyles.accent.blue.border}
          cursor="pointer"
          onClick={onCopySum}
          _hover={{
            borderColor: colorStyles.accent.blue.label,
            transform: `scale(${UI_CONSTANTS.SCALE_HOVER})`,
            shadow: 'md'
          }}
          transition="all 0.2s">
          <Text fontSize="sm" color={colorStyles.text.secondary} fontWeight="medium">
            合計 <Text as="span" fontSize="xs" color={colorStyles.accent.blue.label}>
              (タップでコピー)
            </Text>
          </Text>
          <Text 
            fontSize={{ base: '2xl', md: '3xl' }}
            fontWeight="bold"
            color={colorStyles.accent.blue.label}>
            {formatNumber(sum)}
          </Text>
          <Text fontSize="xs" color={colorStyles.text.muted}>すべての数値の合計</Text>
        </Box>

        <Box 
          bg={colorStyles.bg.primary} 
          p={4} 
          rounded="lg" 
          border="1px solid" 
          borderColor={colorStyles.border.default}>
          <Text fontSize="sm" color={colorStyles.text.secondary} fontWeight="medium">平均</Text>
          <Text fontSize={{ base: 'xl', md: '2xl' }} fontWeight="bold" color={colorStyles.text.primary}>
            {count ? formatNumber(avg) : '-'}
          </Text>
          <Text fontSize="xs" color={colorStyles.text.muted}>数値の平均値</Text>
        </Box>
      </Box>

      {/* エラー表示 */}
      {errors.length > 0 && (
        <Box
          bg={colorStyles.bg.secondary}
          border="1px solid"
          borderColor={colorStyles.accent.orange.border}
          p={4}
          rounded="lg"
          mb={4}>
          <Text color={colorStyles.accent.orange.label} fontWeight="medium">
            ⚠️ {errors.length}行で数値が見つかりませんでした
          </Text>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowDetails(!showDetails)}
            mt={2}
            color={colorStyles.accent.orange.text}
            bg="transparent"
            border="1px solid"
            borderColor={colorStyles.accent.orange.border}
            _hover={{
              bg: colorStyles.accent.orange.bg,
              borderColor: colorStyles.accent.orange.borderHover
            }}>
            {showDetails ? '詳細を隠す' : '詳細を表示'}
          </Button>
          {showDetails && (
            <Box mt={3}>
              {errors.map((error, i) => (
                <Text key={i} fontSize="sm" color={colorStyles.accent.orange.text} mb={1}>
                  • {error}
                </Text>
              ))}
            </Box>
          )}
        </Box>
      )}

      {/* 抽出された数値 */}
      {numbers.length > 0 && (
        <Box
          bg={colorStyles.bg.secondary}
          border="1px solid"
          borderColor={colorStyles.accent.blue.border}
          p={4}
          rounded="lg">
          <Flex justify="space-between" align="center" mb={2}>
            <Text color={colorStyles.accent.blue.label} fontWeight="medium">
              抽出された数値 ({numbers.length}個)
            </Text>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowNumbers(!showNumbers)}
              color={colorStyles.accent.blue.label}
              bg="transparent"
              border="1px solid"
              borderColor={colorStyles.accent.blue.label}
              _hover={{
                bg: colorStyles.bg.secondary,
                borderColor: colorStyles.accent.blue.text
              }}>
              {showNumbers ? '隠す' : '表示'}
            </Button>
          </Flex>
          
          {showNumbers && (
            <Box>
              <Text fontSize="sm" color={colorStyles.accent.blue.label} mb={2}>
                抽出された数値の一覧:
              </Text>
              <Flex wrap="wrap" gap={2}>
                {numbers.slice(0, UI_CONSTANTS.NUMBERS_DISPLAY_LIMIT).map((num, i) => (
                  <Box 
                    key={i} 
                    bg={colorStyles.accent.blue.bg}
                    px={2}
                    py={1}
                    rounded="md"
                    fontSize="xs"
                    color={colorStyles.accent.blue.text}>
                    {formatNumber(num)}
                  </Box>
                ))}
                {numbers.length > UI_CONSTANTS.NUMBERS_DISPLAY_LIMIT && (
                  <Box 
                    bg={colorStyles.bg.secondary}
                    px={2}
                    py={1}
                    rounded="md"
                    fontSize="xs"
                    color={colorStyles.text.secondary}>
                    ...他{numbers.length - UI_CONSTANTS.NUMBERS_DISPLAY_LIMIT}個
                  </Box>
                )}
              </Flex>
            </Box>
          )}
        </Box>
      )}
    </Box>
  )
}

export default Calc