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
import { formatNumber } from '../utils/numberUtils'
import type { Mode } from '../types/calculator'

// 数値解析ロジック
const parseNumbers = (text: string, mode: Mode) => {
  const lines = text.replace(/\r\n/g, '\n').split('\n')
  const nums: number[] = []
  const errs: string[] = []
  const numRegex = /[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?/g

  if (mode === 'perLineFirstNumber') {
    lines.forEach((line, i) => {
      const m = line.match(numRegex)
      if (m && m.length > 0) {
        const v = Number(m[0])
        if (Number.isFinite(v)) nums.push(v)
        else errs.push(`${i + 1}行目: 数値に変換できません (${m[0]})`)
      } else if (line.trim() !== '') {
        errs.push(`${i + 1}行目: 数値が見つかりません`)
      }
    })
  } else {
    const mAll = text.match(numRegex) ?? []
    mAll.forEach((s) => {
      const v = Number(s)
      if (Number.isFinite(v)) nums.push(v)
    })
  }

  const sum = nums.reduce((a, b) => a + b, 0)
  return { sum, count: nums.length, numbers: nums, errors: errs }
}

function Calc() {
  const [text, setText] = useState<string>('')
  const [mode, setMode] = useState<Mode>('perLineFirstNumber')
  const taRef = useRef<HTMLTextAreaElement | null>(null)
  const colorStyles = useColorStyles()
  const { message: toastMessage, showToast } = useToast()

  // 解析ロジック
  const { sum, count, numbers, errors } = useMemo(() => {
    return parseNumbers(text, mode)
  }, [text, mode])

  // Ctrl/Cmd+Enter で計算結果を表示
  useEffect(() => {
    const el = taRef.current
    if (!el) return
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        const result = `計算完了: 合計 ${new Intl.NumberFormat().format(sum)}`
        showToast(result, 3000)
      }
    }
    el.addEventListener('keydown', handler)
    return () => el.removeEventListener('keydown', handler)
  }, [sum, showToast])

  const handlePasteFromClipboard = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText()
      setText(clipboardText)
      showToast('クリップボードから貼り付け完了')
    } catch (error) {
      showToast('クリップボードからの読み取りに失敗しました', 3000)
    }
  }

  const handleClear = () => {
    setText('')
    showToast('クリア完了', 1000)
  }

  const handleCopySum = async () => {
    try {
      await navigator.clipboard.writeText(sum.toString())
      showToast('合計をクリップボードにコピーしました')
    } catch (error) {
      showToast('クリップボードへのコピーに失敗しました', 3000)
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
          top={20}
          right={4}
          bg="blue.500"
          color="white"
          px={4}
          py={2}
          rounded="md"
          shadow="lg"
          zIndex={1000}>
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
              style={{
                background: colorStyles.bg.primary,
                color: '#1A202C', // ライトモードでもダークモードでも見やすい濃い色
                border: `1px solid ${colorStyles.border.default}`,
                borderRadius: '6px',
                padding: '8px 12px',
                fontSize: '14px',
                width: '100%'
              }}>
              <option value="perLineFirstNumber" style={{ color: '#1A202C', backgroundColor: colorStyles.bg.primary }}>
                行ごとに最初の数値を合計
              </option>
              <option value="allNumbersInText" style={{ color: '#1A202C', backgroundColor: colorStyles.bg.primary }}>
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
              color="red.600"
              borderColor="red.200"
              _hover={{
                bg: "red.50",
                borderColor: "red.300"
              }}>
              クリア
            </Button>
            <Button 
              onClick={handlePasteFromClipboard}
              colorScheme="blue"
              size={{ base: 'sm', md: 'md' }}
              bg="blue.500"
              color="white"
              _hover={{
                bg: "blue.600"
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
            borderColor: 'blue.500',
            boxShadow: '0 0 0 1px #3182CE'
          }}
          resize="vertical"
        />
        <Text fontSize="xs" color={colorStyles.text.muted} mt={1}>
          ヒント: Ctrl/Cmd + Enter で計算結果を通知表示
        </Text>
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
          borderColor="blue.200"
          cursor="pointer"
          onClick={onCopySum}
          _hover={{
            borderColor: "blue.300",
            transform: 'scale(1.02)',
            shadow: 'md'
          }}
          transition="all 0.2s">
          <Text fontSize="sm" color={colorStyles.text.secondary} fontWeight="medium">
            合計 <Text as="span" fontSize="xs" color="blue.500">
              (タップでコピー)
            </Text>
          </Text>
          <Text 
            fontSize={{ base: '2xl', md: '3xl' }}
            fontWeight="bold"
            color="blue.600">
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
          borderColor="orange.200"
          p={4}
          rounded="lg"
          mb={4}>
          <Text color="orange.700" fontWeight="medium">
            ⚠️ {errors.length}行で数値が見つかりませんでした
          </Text>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowDetails(!showDetails)}
            mt={2}
            color="orange.600"
            bg="transparent"
            border="1px solid"
            borderColor="orange.300"
            _hover={{
              bg: "orange.50",
              borderColor: "orange.400"
            }}>
            {showDetails ? '詳細を隠す' : '詳細を表示'}
          </Button>
          {showDetails && (
            <Box mt={3}>
              {errors.map((error, i) => (
                <Text key={i} fontSize="sm" color="orange.600" mb={1}>
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
          borderColor="blue.200"
          p={4}
          rounded="lg">
          <Flex justify="space-between" align="center" mb={2}>
            <Text color="blue.700" fontWeight="medium">
              抽出された数値 ({numbers.length}個)
            </Text>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowNumbers(!showNumbers)}
              color="blue.600"
              bg="transparent"
              border="1px solid"
              borderColor="blue.300"
              _hover={{
                bg: "blue.50",
                borderColor: "blue.400"
              }}>
              {showNumbers ? '隠す' : '表示'}
            </Button>
          </Flex>
          
          {showNumbers && (
            <Box>
              <Text fontSize="sm" color="blue.600" mb={2}>
                抽出された数値の一覧:
              </Text>
              <Flex wrap="wrap" gap={2}>
                {numbers.slice(0, 50).map((num, i) => (
                  <Box 
                    key={i} 
                    bg="blue.100"
                    px={2}
                    py={1}
                    rounded="md"
                    fontSize="xs"
                    color="blue.800">
                    {formatNumber(num)}
                  </Box>
                ))}
                {numbers.length > 50 && (
                  <Box 
                    bg={colorStyles.bg.secondary}
                    px={2}
                    py={1}
                    rounded="md"
                    fontSize="xs"
                    color={colorStyles.text.secondary}>
                    ...他{numbers.length - 50}個
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