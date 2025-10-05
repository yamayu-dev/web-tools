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
import { useColorMode } from '../components/ColorModeProvider'

type Mode = 'perLineFirstNumber' | 'allNumbersInText'

function Calc() {
  const [text, setText] = useState<string>('')
  const [mode, setMode] = useState<Mode>('perLineFirstNumber')
  const [showToast, setShowToast] = useState('')
  const taRef = useRef<HTMLTextAreaElement | null>(null)
  const { colorMode } = useColorMode()

  // 解析ロジック
  const { sum, count, numbers, errors } = useMemo(() => {
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

    const s = nums.reduce((a, b) => a + b, 0)
    return { sum: s, count: nums.length, numbers: nums, errors: errs }
  }, [text, mode])

  // Ctrl/Cmd+Enter で計算結果を表示
  useEffect(() => {
    const el = taRef.current
    if (!el) return
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        const result = `計算完了: 合計 ${new Intl.NumberFormat().format(sum)}`
        setShowToast(result)
        setTimeout(() => setShowToast(''), 3000)
      }
    }
    el.addEventListener('keydown', handler)
    return () => el.removeEventListener('keydown', handler)
  }, [sum])

  const handlePasteFromClipboard = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText()
      setText(clipboardText)
      setShowToast('クリップボードから貼り付け完了')
      setTimeout(() => setShowToast(''), 2000)
    } catch (error) {
      setShowToast('クリップボードからの読み取りに失敗しました')
      setTimeout(() => setShowToast(''), 3000)
    }
  }

  const handleClear = () => {
    setText('')
    setShowToast('クリア完了')
    setTimeout(() => setShowToast(''), 1000)
  }

  const handleCopySum = async () => {
    try {
      await navigator.clipboard.writeText(String(sum))
      setShowToast('合計をクリップボードにコピーしました')
      setTimeout(() => setShowToast(''), 2000)
    } catch (error) {
      setShowToast('クリップボードへのコピーに失敗しました')
      setTimeout(() => setShowToast(''), 3000)
    }
  }

  return (
    <Container maxW="container.xl" py={6} px={4} mx="auto">
      <Box mb={6}>
        {/* ヘッダー */}
        <Heading 
          as="h2" 
          size={{ base: 'lg', md: 'xl' }}
          color={colorMode === 'light' ? 'gray.800' : 'gray.100'}
          mb={2}>
          計算ツール
        </Heading>
        <Text color={colorMode === 'light' ? 'gray.600' : 'gray.300'} fontSize={{ base: 'sm', md: 'md' }}>
          改行区切りのテキストから数値を抽出して合計を計算します
        </Text>
      </Box>

      {/* トースト表示 */}
      {showToast && (
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
          {showToast}
        </Box>
      )}

      {/* コントロール */}
      <Box 
        bg={colorMode === 'light' ? 'gray.50' : 'gray.700'} 
        p={4} 
        rounded="lg" 
        border="1px solid" 
        borderColor={colorMode === 'light' ? 'gray.200' : 'gray.600'}
        mb={6}>
        <Flex 
          direction={{ base: 'column', md: 'row' }}
          gap={4}
          align={{ base: 'stretch', md: 'center' }}>
          
          <Box flex="1">
            <Text fontSize="sm" fontWeight="medium" mb={2} color={colorMode === 'light' ? 'gray.700' : 'gray.200'}>
              計算モード
            </Text>
            <select
              value={mode} 
              onChange={(e) => setMode(e.target.value as Mode)}
              style={{
                background: colorMode === 'light' ? 'white' : '#2D3748',
                color: colorMode === 'light' ? '#1A202C' : '#E2E8F0',
                border: `1px solid ${colorMode === 'light' ? '#D2D6DC' : '#4A5568'}`,
                borderRadius: '6px',
                padding: '8px 12px',
                fontSize: '14px',
                width: '100%'
              }}>
              <option value="perLineFirstNumber">行ごとに最初の数値を合計</option>
              <option value="allNumbersInText">全文中のすべての数値を合計</option>
            </select>
          </Box>

          <Flex gap={3} flexWrap="wrap">
            <Button 
              onClick={handleClear}
              variant="outline"
              colorScheme="red"
              size={{ base: 'sm', md: 'md' }}
              bg={colorMode === 'light' ? 'white' : 'gray.800'}
              color={colorMode === 'light' ? 'red.600' : 'red.300'}
              borderColor={colorMode === 'light' ? 'red.200' : 'red.600'}
              _hover={{
                bg: colorMode === 'light' ? 'red.50' : 'red.900',
                borderColor: colorMode === 'light' ? 'red.300' : 'red.500'
              }}>
              クリア
            </Button>
            <Button 
              onClick={handlePasteFromClipboard}
              colorScheme="blue"
              size={{ base: 'sm', md: 'md' }}
              bg={colorMode === 'light' ? 'blue.500' : 'blue.600'}
              color="white"
              _hover={{
                bg: colorMode === 'light' ? 'blue.600' : 'blue.700'
              }}>
              クリップボードから貼り付け
            </Button>
          </Flex>
        </Flex>
      </Box>

      {/* テキストエリア */}
      <Box mb={6}>
        <Text fontSize="sm" fontWeight="medium" mb={2} color={colorMode === 'light' ? 'gray.700' : 'gray.200'}>
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
          bg={colorMode === 'light' ? 'white' : 'gray.800'}
          color={colorMode === 'light' ? 'gray.900' : 'gray.100'}
          borderColor={colorMode === 'light' ? 'gray.300' : 'gray.600'}
          _focus={{
            borderColor: 'blue.500',
            boxShadow: '0 0 0 1px #3182CE'
          }}
          resize="vertical"
        />
        <Text fontSize="xs" color={colorMode === 'light' ? 'gray.500' : 'gray.400'} mt={1}>
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
  const { colorMode } = useColorMode()
  
  const fmt = (n: number) => new Intl.NumberFormat(undefined, { maximumFractionDigits: 12 }).format(n)
  const avg = numbers.length ? numbers.reduce((a, b) => a + b, 0) / numbers.length : 0

  return (
    <Box>
      <Heading as="h3" size="md" color={colorMode === 'light' ? 'gray.800' : 'gray.100'} mb={4}>
        計算結果
      </Heading>

      {/* メイン結果 */}
      <Box
        display="grid"
        gridTemplateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }}
        gap={4}
        mb={6}>
        
        <Box 
          bg={colorMode === 'light' ? 'white' : 'gray.800'} 
          p={4} 
          rounded="lg" 
          border="1px solid" 
          borderColor={colorMode === 'light' ? 'gray.200' : 'gray.600'}>
          <Text fontSize="sm" color={colorMode === 'light' ? 'gray.600' : 'gray.300'} fontWeight="medium">件数</Text>
          <Text fontSize={{ base: 'xl', md: '2xl' }} fontWeight="bold" color={colorMode === 'light' ? 'gray.800' : 'gray.100'}>
            {count}
          </Text>
          <Text fontSize="xs" color={colorMode === 'light' ? 'gray.500' : 'gray.400'}>処理した数値の個数</Text>
        </Box>

        <Box 
          bg={colorMode === 'light' ? 'white' : 'gray.800'} 
          p={4} 
          rounded="lg" 
          border="1px solid" 
          borderColor={colorMode === 'light' ? 'blue.200' : 'blue.600'}
          cursor="pointer"
          onClick={onCopySum}
          _hover={{
            borderColor: colorMode === 'light' ? 'blue.300' : 'blue.500',
            transform: 'scale(1.02)',
            shadow: 'md'
          }}
          transition="all 0.2s">
          <Text fontSize="sm" color={colorMode === 'light' ? 'gray.600' : 'gray.300'} fontWeight="medium">
            合計 <Text as="span" fontSize="xs" color={colorMode === 'light' ? 'blue.500' : 'blue.300'}>
              (タップでコピー)
            </Text>
          </Text>
          <Text 
            fontSize={{ base: '2xl', md: '3xl' }}
            fontWeight="bold"
            color={colorMode === 'light' ? 'blue.600' : 'blue.300'}>
            {fmt(sum)}
          </Text>
          <Text fontSize="xs" color={colorMode === 'light' ? 'gray.500' : 'gray.400'}>すべての数値の合計</Text>
        </Box>

        <Box 
          bg={colorMode === 'light' ? 'white' : 'gray.800'} 
          p={4} 
          rounded="lg" 
          border="1px solid" 
          borderColor={colorMode === 'light' ? 'gray.200' : 'gray.600'}>
          <Text fontSize="sm" color={colorMode === 'light' ? 'gray.600' : 'gray.300'} fontWeight="medium">平均</Text>
          <Text fontSize={{ base: 'xl', md: '2xl' }} fontWeight="bold" color={colorMode === 'light' ? 'gray.800' : 'gray.100'}>
            {count ? fmt(avg) : '-'}
          </Text>
          <Text fontSize="xs" color={colorMode === 'light' ? 'gray.500' : 'gray.400'}>数値の平均値</Text>
        </Box>
      </Box>

      {/* エラー表示 */}
      {errors.length > 0 && (
        <Box
          bg={colorMode === 'light' ? 'orange.50' : 'orange.900'}
          border="1px solid"
          borderColor={colorMode === 'light' ? 'orange.200' : 'orange.600'}
          p={4}
          rounded="lg"
          mb={4}>
          <Text color={colorMode === 'light' ? 'orange.700' : 'orange.200'} fontWeight="medium">
            ⚠️ {errors.length}行で数値が見つかりませんでした
          </Text>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowDetails(!showDetails)}
            mt={2}
            color={colorMode === 'light' ? 'orange.600' : 'orange.300'}
            bg="transparent"
            border="1px solid"
            borderColor={colorMode === 'light' ? 'orange.300' : 'orange.600'}
            _hover={{
              bg: colorMode === 'light' ? 'orange.50' : 'orange.900',
              borderColor: colorMode === 'light' ? 'orange.400' : 'orange.500'
            }}>
            {showDetails ? '詳細を隠す' : '詳細を表示'}
          </Button>
          {showDetails && (
            <Box mt={3}>
              {errors.map((error, i) => (
                <Text key={i} fontSize="sm" color={colorMode === 'light' ? 'orange.600' : 'orange.300'} mb={1}>
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
          bg={colorMode === 'light' ? 'blue.50' : 'blue.900'}
          border="1px solid"
          borderColor={colorMode === 'light' ? 'blue.200' : 'blue.600'}
          p={4}
          rounded="lg">
          <Flex justify="space-between" align="center" mb={2}>
            <Text color={colorMode === 'light' ? 'blue.700' : 'blue.200'} fontWeight="medium">
              抽出された数値 ({numbers.length}個)
            </Text>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowNumbers(!showNumbers)}
              color={colorMode === 'light' ? 'blue.600' : 'blue.300'}
              bg="transparent"
              border="1px solid"
              borderColor={colorMode === 'light' ? 'blue.300' : 'blue.600'}
              _hover={{
                bg: colorMode === 'light' ? 'blue.50' : 'blue.900',
                borderColor: colorMode === 'light' ? 'blue.400' : 'blue.500'
              }}>
              {showNumbers ? '隠す' : '表示'}
            </Button>
          </Flex>
          
          {showNumbers && (
            <Box>
              <Text fontSize="sm" color={colorMode === 'light' ? 'blue.600' : 'blue.300'} mb={2}>
                抽出された数値の一覧:
              </Text>
              <Flex wrap="wrap" gap={2}>
                {numbers.slice(0, 50).map((num, i) => (
                  <Box 
                    key={i} 
                    bg={colorMode === 'light' ? 'blue.100' : 'blue.800'}
                    px={2}
                    py={1}
                    rounded="md"
                    fontSize="xs"
                    color={colorMode === 'light' ? 'blue.800' : 'blue.100'}>
                    {fmt(num)}
                  </Box>
                ))}
                {numbers.length > 50 && (
                  <Box 
                    bg={colorMode === 'light' ? 'gray.100' : 'gray.700'}
                    px={2}
                    py={1}
                    rounded="md"
                    fontSize="xs"
                    color={colorMode === 'light' ? 'gray.600' : 'gray.300'}>
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