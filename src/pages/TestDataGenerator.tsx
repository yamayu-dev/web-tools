import { useState } from 'react'
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  Input,
  VStack,
  HStack,
  Flex,
  Grid,
} from '@chakra-ui/react'
import { Download, Plus, Trash2 } from 'lucide-react'
import { useColorStyles } from '../hooks/useColorStyles'
import { useToast } from '../hooks/useToast'
import { SelectableButton } from '../components/SelectableButton'
import { TOAST_DURATIONS, UI_CONSTANTS } from '../constants/uiConstants'
import {
  type TestDataConfig,
  type FileFormat,
  type CharEncoding,
  type DataType,
  type ColumnConfig,
  DEFAULT_TEST_DATA_CONFIG,
  DATA_TYPE_LABELS,
  FILE_FORMAT_LABELS,
  CHAR_ENCODING_LABELS,
} from '../types/testDataGenerator'
import { generateTestData, downloadTestData } from '../utils/testDataUtils'

export function TestDataGenerator() {
  const [config, setConfig] = useState<TestDataConfig>(DEFAULT_TEST_DATA_CONFIG)
  const [filename, setFilename] = useState('testdata')
  
  const colorStyles = useColorStyles()
  const { message: toastMessage, showToast } = useToast()

  // 設定更新のヘルパー関数
  const updateConfig = (updates: Partial<TestDataConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }))
  }

  const updateColumn = (id: string, updates: Partial<ColumnConfig>) => {
    setConfig(prev => ({
      ...prev,
      columns: prev.columns.map(col =>
        col.id === id ? { ...col, ...updates } : col
      )
    }))
  }

  const addColumn = () => {
    const newColumn: ColumnConfig = {
      id: String(Date.now()),
      name: `カラム${config.columns.length + 1}`,
      dataType: 'text',
      length: 20,
    }
    setConfig(prev => ({
      ...prev,
      columns: [...prev.columns, newColumn]
    }))
  }

  const removeColumn = (id: string) => {
    if (config.columns.length <= 1) {
      showToast('最低1つのカラムが必要です', TOAST_DURATIONS.ERROR)
      return
    }
    setConfig(prev => ({
      ...prev,
      columns: prev.columns.filter(col => col.id !== id)
    }))
  }

  const handleGenerate = () => {
    try {
      const data = generateTestData(config)
      const extension = config.fileFormat === 'fixed-length' ? 'txt' : config.fileFormat
      downloadTestData(data, `${filename}.${extension}`, config.encoding)
      showToast(`${filename}.${extension} をダウンロードしました`, TOAST_DURATIONS.MEDIUM)
    } catch (error) {
      console.error(error)
      showToast('データ生成に失敗しました', TOAST_DURATIONS.ERROR)
    }
  }

  return (
    <Container maxW="container.xl" py={6} px={4} mx="auto">
      {/* ヘッダー */}
      <Box mb={6}>
        <Heading 
          as="h2" 
          size={{ base: 'lg', md: 'xl' }}
          color={colorStyles.text.primary}
          mb={2}>
          テストデータ作成
        </Heading>
        <Text color={colorStyles.text.secondary} fontSize={{ base: 'sm', md: 'md' }}>
          CSV、TSV、固定長形式のテストデータを生成してダウンロードします
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
          
          {/* ファイル形式 */}
          <Box>
            <Text fontSize="sm" fontWeight="medium" color={colorStyles.text.primary} mb={2}>
              ファイル形式
            </Text>
            <HStack gap={2}>
              {(Object.keys(FILE_FORMAT_LABELS) as FileFormat[]).map((format) => (
                <SelectableButton
                  key={format}
                  isSelected={config.fileFormat === format}
                  onClick={() => updateConfig({ fileFormat: format })}
                  size="sm"
                  flex={1}>
                  {FILE_FORMAT_LABELS[format]}
                </SelectableButton>
              ))}
            </HStack>
          </Box>

          {/* 文字エンコーディング */}
          <Box>
            <Text fontSize="sm" fontWeight="medium" color={colorStyles.text.primary} mb={2}>
              文字エンコーディング
            </Text>
            <HStack gap={2}>
              {(Object.keys(CHAR_ENCODING_LABELS) as CharEncoding[]).map((encoding) => (
                <SelectableButton
                  key={encoding}
                  isSelected={config.encoding === encoding}
                  onClick={() => updateConfig({ encoding })}
                  size="sm"
                  flex={1}>
                  {CHAR_ENCODING_LABELS[encoding]}
                </SelectableButton>
              ))}
            </HStack>
          </Box>

          {/* ヘッダー有無 */}
          <Box>
            <Flex justify="space-between" align="center">
              <Text fontSize="sm" color={colorStyles.text.primary}>
                ヘッダー行
              </Text>
              <SelectableButton
                size="sm"
                isSelected={config.hasHeader}
                onClick={() => updateConfig({ hasHeader: !config.hasHeader })}>
                {config.hasHeader ? 'あり' : 'なし'}
              </SelectableButton>
            </Flex>
          </Box>

          {/* CSV/TSV固有の設定 */}
          {config.fileFormat !== 'fixed-length' && (
            <>
              <Box>
                <Text fontSize="sm" fontWeight="medium" color={colorStyles.text.primary} mb={2}>
                  区切り文字
                </Text>
                <Input
                  value={config.fileFormat === 'tsv' ? 'TAB' : config.delimiter}
                  onChange={(e) => updateConfig({ delimiter: e.target.value })}
                  placeholder=","
                  disabled={config.fileFormat === 'tsv'}
                  bg={colorStyles.bg.primary}
                  color={colorStyles.text.primary}
                  borderColor={colorStyles.border.input}
                  size="sm"
                />
              </Box>

              <Box>
                <Text fontSize="sm" fontWeight="medium" color={colorStyles.text.primary} mb={2}>
                  囲み文字
                </Text>
                <Input
                  value={config.quoteChar}
                  onChange={(e) => updateConfig({ quoteChar: e.target.value })}
                  placeholder='"'
                  maxLength={1}
                  bg={colorStyles.bg.primary}
                  color={colorStyles.text.primary}
                  borderColor={colorStyles.border.input}
                  size="sm"
                />
              </Box>
            </>
          )}

          {/* レコード数 */}
          <Box>
            <Text fontSize="sm" fontWeight="medium" color={colorStyles.text.primary} mb={2}>
              レコード数
            </Text>
            <Input
              type="number"
              value={config.recordCount}
              onChange={(e) => updateConfig({ recordCount: Math.max(1, parseInt(e.target.value) || 1) })}
              min={1}
              max={100000}
              bg={colorStyles.bg.primary}
              color={colorStyles.text.primary}
              borderColor={colorStyles.border.input}
              size="sm"
            />
          </Box>

          {/* 区切り線 */}
          <Box h="1px" bg={colorStyles.border.default} />

          {/* カラム設定 */}
          <VStack align="stretch" gap={4}>
            <Flex justify="space-between" align="center">
              <Text fontSize="md" fontWeight="medium" color={colorStyles.text.primary}>
                カラム設定
              </Text>
              <Button
                size="sm"
                onClick={addColumn}
                colorScheme="blue"
                variant="outline"
                bg={colorStyles.bg.primary}
                color={colorStyles.text.primary}
                borderColor={colorStyles.accent.blue.border}
                _hover={{
                  bg: colorStyles.accent.blue.bg,
                  borderColor: colorStyles.accent.blue.text
                }}>
                <Plus size={16} style={{ marginRight: '4px' }} />
                追加
              </Button>
            </Flex>

            {config.columns.map((column, index) => (
              <Box
                key={column.id}
                p={4}
                bg={colorStyles.bg.primary}
                rounded="md"
                border="1px solid"
                borderColor={colorStyles.border.default}>
                <Flex justify="space-between" align="center" mb={3}>
                  <Text fontSize="sm" fontWeight="medium" color={colorStyles.text.primary}>
                    カラム {index + 1}
                  </Text>
                  <Button
                    size="xs"
                    onClick={() => removeColumn(column.id)}
                    colorScheme="red"
                    variant="ghost"
                    disabled={config.columns.length <= 1}>
                    <Trash2 size={14} />
                  </Button>
                </Flex>

                <VStack align="stretch" gap={3}>
                  {/* カラム名 */}
                  <Box>
                    <Text fontSize="xs" color={colorStyles.text.secondary} mb={1}>
                      カラム名
                    </Text>
                    <Input
                      value={column.name}
                      onChange={(e) => updateColumn(column.id, { name: e.target.value })}
                      size="sm"
                      bg={colorStyles.bg.secondary}
                      color={colorStyles.text.primary}
                      borderColor={colorStyles.border.input}
                    />
                  </Box>

                  {/* データ型 */}
                  <Box>
                    <Text fontSize="xs" color={colorStyles.text.secondary} mb={1}>
                      データ型
                    </Text>
                    <select
                      value={column.dataType}
                      onChange={(e) => updateColumn(column.id, { dataType: e.target.value as DataType })}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        fontSize: '14px',
                        backgroundColor: colorStyles.bg.secondary,
                        color: colorStyles.text.primary,
                        border: `1px solid ${colorStyles.border.input}`,
                      }}>
                      {(Object.keys(DATA_TYPE_LABELS) as DataType[]).map((type) => (
                        <option key={type} value={type}>
                          {DATA_TYPE_LABELS[type]}
                        </option>
                      ))}
                    </select>
                  </Box>

                  {/* 固定長の場合の長さ */}
                  {config.fileFormat === 'fixed-length' && (
                    <Box>
                      <Text fontSize="xs" color={colorStyles.text.secondary} mb={1}>
                        長さ
                      </Text>
                      <Input
                        type="number"
                        value={column.length}
                        onChange={(e) => updateColumn(column.id, { length: Math.max(1, parseInt(e.target.value) || 1) })}
                        size="sm"
                        bg={colorStyles.bg.secondary}
                        color={colorStyles.text.primary}
                        borderColor={colorStyles.border.input}
                      />
                    </Box>
                  )}

                  {/* 連番の開始値 */}
                  {column.dataType === 'sequential' && (
                    <Box>
                      <Text fontSize="xs" color={colorStyles.text.secondary} mb={1}>
                        開始値
                      </Text>
                      <Input
                        type="number"
                        value={column.sequentialStart ?? 1}
                        onChange={(e) => updateColumn(column.id, { sequentialStart: parseInt(e.target.value) || 1 })}
                        size="sm"
                        bg={colorStyles.bg.secondary}
                        color={colorStyles.text.primary}
                        borderColor={colorStyles.border.input}
                      />
                    </Box>
                  )}

                  {/* ランダム数値の範囲 */}
                  {column.dataType === 'random-number' && (
                    <>
                      <Box>
                        <Text fontSize="xs" color={colorStyles.text.secondary} mb={1}>
                          最小値
                        </Text>
                        <Input
                          type="number"
                          value={column.randomMin ?? 0}
                          onChange={(e) => updateColumn(column.id, { randomMin: parseInt(e.target.value) || 0 })}
                          size="sm"
                          bg={colorStyles.bg.secondary}
                          color={colorStyles.text.primary}
                          borderColor={colorStyles.border.input}
                        />
                      </Box>
                      <Box>
                        <Text fontSize="xs" color={colorStyles.text.secondary} mb={1}>
                          最大値
                        </Text>
                        <Input
                          type="number"
                          value={column.randomMax ?? 10000}
                          onChange={(e) => updateColumn(column.id, { randomMax: parseInt(e.target.value) || 10000 })}
                          size="sm"
                          bg={colorStyles.bg.secondary}
                          color={colorStyles.text.primary}
                          borderColor={colorStyles.border.input}
                        />
                      </Box>
                    </>
                  )}
                </VStack>
              </Box>
            ))}
          </VStack>
        </VStack>

        {/* エクスポートパネル */}
        <VStack 
          align="stretch" 
          gap={UI_CONSTANTS.FORM_GAP}
          bg={colorStyles.bg.secondary}
          p={6}
          rounded="lg"
          border="1px solid"
          borderColor={colorStyles.border.default}>
          
          <Text fontSize="md" fontWeight="medium" color={colorStyles.text.primary}>
            ダウンロード
          </Text>

          {/* ファイル名 */}
          <Box>
            <Text fontSize="sm" color={colorStyles.text.primary} mb={2}>
              ファイル名
            </Text>
            <Input
              value={filename}
              onChange={(e) => setFilename(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
              placeholder="testdata"
              bg={colorStyles.bg.primary}
              color={colorStyles.text.primary}
              borderColor={colorStyles.border.input}
              _focus={{
                borderColor: colorStyles.accent.blue.focus,
                boxShadow: `0 0 0 1px ${colorStyles.accent.blue.focus}`
              }}
            />
            <Text fontSize="xs" color={colorStyles.text.muted} mt={1}>
              拡張子は自動的に付加されます
            </Text>
          </Box>

          {/* プレビュー情報 */}
          <Box
            p={4}
            bg={colorStyles.bg.primary}
            rounded="md"
            border="1px solid"
            borderColor={colorStyles.border.default}>
            <VStack align="stretch" gap={2}>
              <Flex justify="space-between">
                <Text fontSize="sm" color={colorStyles.text.secondary}>
                  形式
                </Text>
                <Text fontSize="sm" color={colorStyles.text.primary} fontWeight="medium">
                  {FILE_FORMAT_LABELS[config.fileFormat]}
                </Text>
              </Flex>
              <Flex justify="space-between">
                <Text fontSize="sm" color={colorStyles.text.secondary}>
                  エンコーディング
                </Text>
                <Text fontSize="sm" color={colorStyles.text.primary} fontWeight="medium">
                  {config.encoding}
                </Text>
              </Flex>
              <Flex justify="space-between">
                <Text fontSize="sm" color={colorStyles.text.secondary}>
                  カラム数
                </Text>
                <Text fontSize="sm" color={colorStyles.text.primary} fontWeight="medium">
                  {config.columns.length}
                </Text>
              </Flex>
              <Flex justify="space-between">
                <Text fontSize="sm" color={colorStyles.text.secondary}>
                  レコード数
                </Text>
                <Text fontSize="sm" color={colorStyles.text.primary} fontWeight="medium">
                  {config.recordCount.toLocaleString()}
                </Text>
              </Flex>
            </VStack>
          </Box>

          {/* ダウンロードボタン */}
          <Button
            onClick={handleGenerate}
            colorScheme="blue"
            size="lg"
            bg={colorStyles.accent.blue.button}
            color="white"
            _hover={{ bg: colorStyles.accent.blue.buttonHover }}
            disabled={!filename.trim() || config.columns.length === 0}>
            <Download size={20} style={{ marginRight: '8px' }} />
            生成してダウンロード
          </Button>
        </VStack>
      </Grid>
    </Container>
  )
}

export default TestDataGenerator
