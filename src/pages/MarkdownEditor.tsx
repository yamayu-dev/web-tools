import { useState, useEffect, useRef, useMemo } from 'react'
import {
  Box,
  Container,
  Heading,
  Button,
  Textarea,
  Text,
  Flex,
  useBreakpointValue
} from '@chakra-ui/react'
import { marked } from 'marked'
import mermaid from 'mermaid'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { Download, Upload, FileText } from 'lucide-react'
import { useToast } from '../hooks/useToast'
import { useColorStyles } from '../hooks/useColorStyles'
import { TOAST_DURATIONS } from '../constants/uiConstants'

// Mermaidの初期化
mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
})

export function MarkdownEditor() {
  const [markdown, setMarkdown] = useState<string>('# Markdown Editor\n\n書いてみよう！\n\n## Features\n- Markdown preview\n- Mermaid diagrams\n- File save/load\n- PDF export\n\n## Mermaid Example\n```mermaid\ngraph TD\n  A[Start] --> B[Process]\n  B --> C[End]\n```')
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('split')
  const previewRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const colorStyles = useColorStyles()
  const { message: toastMessage, showToast } = useToast()
  
  // レスポンシブ対応: PCではsplit、モバイルではedit
  const isMobile = useBreakpointValue({ base: true, md: false })
  
  useEffect(() => {
    if (isMobile && viewMode === 'split') {
      setViewMode('edit')
    }
  }, [isMobile, viewMode])

  // Markdownをレンダリング
  const renderedHTML = useMemo(() => {
    try {
      return marked(markdown, { 
        breaks: true,
        gfm: true
      }) as string
    } catch (error) {
      console.error('Markdown parse error:', error)
      return '<p>Error rendering markdown</p>'
    }
  }, [markdown])

  // Mermaidダイアグラムを処理
  useEffect(() => {
    if (previewRef.current && (viewMode === 'preview' || viewMode === 'split')) {
      const renderMermaid = async () => {
        const mermaidDivs = previewRef.current?.querySelectorAll('.mermaid-diagram')
        if (mermaidDivs) {
          for (let i = 0; i < mermaidDivs.length; i++) {
            const div = mermaidDivs[i] as HTMLElement
            const code = div.textContent || ''
            try {
              const { svg } = await mermaid.render(`mermaid-${Date.now()}-${i}`, code)
              div.innerHTML = svg
              div.classList.add('mermaid-rendered')
            } catch (error) {
              console.error('Mermaid render error:', error)
              div.innerHTML = '<p style="color: red;">Error rendering Mermaid diagram</p>'
            }
          }
        }
      }
      
      // 少し遅延してから実行（DOM更新を待つ）
      const timer = setTimeout(renderMermaid, 100)
      return () => clearTimeout(timer)
    }
  }, [renderedHTML, viewMode])

  // Mermaidコードブロックを特別な要素に変換
  const processedHTML = useMemo(() => {
    return renderedHTML.replace(
      /<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/g,
      (_, code) => `<div class="mermaid-diagram">${code}</div>`
    )
  }, [renderedHTML])

  // ファイル保存
  const handleSave = () => {
    try {
      const blob = new Blob([markdown], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'document.md'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      showToast('ファイルを保存しました', TOAST_DURATIONS.SHORT)
    } catch (error) {
      console.error('Save error:', error)
      showToast('保存に失敗しました', TOAST_DURATIONS.ERROR)
    }
  }

  // ファイル読み込み
  const handleLoad = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const content = event.target?.result as string
        setMarkdown(content)
        showToast('ファイルを読み込みました', TOAST_DURATIONS.SHORT)
      }
      reader.onerror = () => {
        showToast('読み込みに失敗しました', TOAST_DURATIONS.ERROR)
      }
      reader.readAsText(file)
    }
  }

  // PDF出力
  const handleExportPDF = async () => {
    if (!previewRef.current) return
    
    try {
      showToast('PDF生成中...', TOAST_DURATIONS.SHORT)
      
      // プレビュー要素をキャンバスに変換
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        logging: false
      })
      
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })
      
      const imgWidth = 210 // A4 width in mm
      const pageHeight = 297 // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      let position = 0
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
      
      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }
      
      pdf.save('document.pdf')
      showToast('PDFを出力しました', TOAST_DURATIONS.SHORT)
    } catch (error) {
      console.error('PDF export error:', error)
      showToast('PDF出力に失敗しました', TOAST_DURATIONS.ERROR)
    }
  }

  const shouldShowEditor = viewMode === 'edit' || viewMode === 'split'
  const shouldShowPreview = viewMode === 'preview' || viewMode === 'split'

  return (
    <Container maxW="container.xl" py={6} px={4} mx="auto">
      <Box mb={6}>
        <Heading 
          as="h2" 
          size={{ base: 'lg', md: 'xl' }}
          color={colorStyles.text.primary}
          mb={2}>
          Markdown Editor
        </Heading>
        <Text color={colorStyles.text.secondary} fontSize={{ base: 'sm', md: 'md' }}>
          Markdown入力とプレビュー、Mermaidダイアグラム、PDF出力に対応
        </Text>
      </Box>

      {/* トースト表示 */}
      {toastMessage && (
        <Box
          position="fixed"
          top={4}
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
          
          {/* ビューモード切り替え */}
          <Box flex="1">
            <Text fontSize="sm" fontWeight="medium" mb={2} color={colorStyles.text.primary}>
              表示モード
            </Text>
            <Flex gap={2}>
              <Button 
                onClick={() => setViewMode('edit')}
                size="sm"
                colorScheme={viewMode === 'edit' ? 'blue' : 'gray'}
                bg={viewMode === 'edit' ? colorStyles.accent.blue.button : colorStyles.bg.primary}
                color={viewMode === 'edit' ? 'white' : colorStyles.text.primary}
                _hover={{
                  bg: viewMode === 'edit' ? colorStyles.accent.blue.buttonHover : colorStyles.bg.secondary
                }}>
                入力
              </Button>
              <Button 
                onClick={() => setViewMode('preview')}
                size="sm"
                colorScheme={viewMode === 'preview' ? 'blue' : 'gray'}
                bg={viewMode === 'preview' ? colorStyles.accent.blue.button : colorStyles.bg.primary}
                color={viewMode === 'preview' ? 'white' : colorStyles.text.primary}
                _hover={{
                  bg: viewMode === 'preview' ? colorStyles.accent.blue.buttonHover : colorStyles.bg.secondary
                }}>
                プレビュー
              </Button>
              {!isMobile && (
                <Button 
                  onClick={() => setViewMode('split')}
                  size="sm"
                  colorScheme={viewMode === 'split' ? 'blue' : 'gray'}
                  bg={viewMode === 'split' ? colorStyles.accent.blue.button : colorStyles.bg.primary}
                  color={viewMode === 'split' ? 'white' : colorStyles.text.primary}
                  _hover={{
                    bg: viewMode === 'split' ? colorStyles.accent.blue.buttonHover : colorStyles.bg.secondary
                  }}>
                  同時表示
                </Button>
              )}
            </Flex>
          </Box>

          {/* ファイル操作 */}
          <Flex gap={2} flexWrap="wrap">
            <input
              ref={fileInputRef}
              type="file"
              accept=".md,.markdown,.txt"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <Button 
              onClick={handleLoad}
              size="sm"
              leftIcon={<Upload size={16} />}
              bg={colorStyles.bg.primary}
              color={colorStyles.text.primary}
              borderColor={colorStyles.border.default}
              border="1px solid"
              _hover={{
                bg: colorStyles.bg.secondary
              }}>
              読み込み
            </Button>
            <Button 
              onClick={handleSave}
              size="sm"
              leftIcon={<Download size={16} />}
              bg={colorStyles.bg.primary}
              color={colorStyles.text.primary}
              borderColor={colorStyles.border.default}
              border="1px solid"
              _hover={{
                bg: colorStyles.bg.secondary
              }}>
              保存
            </Button>
            <Button 
              onClick={handleExportPDF}
              size="sm"
              leftIcon={<FileText size={16} />}
              colorScheme="blue"
              bg={colorStyles.accent.blue.button}
              color="white"
              _hover={{
                bg: colorStyles.accent.blue.buttonHover
              }}>
              PDF出力
            </Button>
          </Flex>
        </Flex>
      </Box>

      {/* エディタとプレビュー */}
      <Flex 
        gap={4} 
        direction={{ base: 'column', md: viewMode === 'split' ? 'row' : 'column' }}
        align="stretch">
        
        {/* エディタ */}
        {shouldShowEditor && (
          <Box flex={viewMode === 'split' ? 1 : undefined} minW={0}>
            <Text fontSize="sm" fontWeight="medium" mb={2} color={colorStyles.text.primary}>
              Markdown入力
            </Text>
            <Textarea
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              placeholder="Markdownを入力してください..."
              minH={{ base: '400px', md: '600px' }}
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
        )}

        {/* プレビュー */}
        {shouldShowPreview && (
          <Box flex={viewMode === 'split' ? 1 : undefined} minW={0}>
            <Text fontSize="sm" fontWeight="medium" mb={2} color={colorStyles.text.primary}>
              プレビュー
            </Text>
            <Box
              ref={previewRef}
              minH={{ base: '400px', md: '600px' }}
              p={4}
              bg={colorStyles.bg.primary}
              color={colorStyles.text.primary}
              borderColor={colorStyles.border.input}
              border="1px solid"
              rounded="md"
              overflowY="auto"
              css={{
                '& h1': { fontSize: '2em', fontWeight: 'bold', marginTop: '0.67em', marginBottom: '0.67em' },
                '& h2': { fontSize: '1.5em', fontWeight: 'bold', marginTop: '0.83em', marginBottom: '0.83em' },
                '& h3': { fontSize: '1.17em', fontWeight: 'bold', marginTop: '1em', marginBottom: '1em' },
                '& h4': { fontSize: '1em', fontWeight: 'bold', marginTop: '1.33em', marginBottom: '1.33em' },
                '& h5': { fontSize: '0.83em', fontWeight: 'bold', marginTop: '1.67em', marginBottom: '1.67em' },
                '& h6': { fontSize: '0.67em', fontWeight: 'bold', marginTop: '2.33em', marginBottom: '2.33em' },
                '& p': { marginTop: '1em', marginBottom: '1em' },
                '& ul, & ol': { marginTop: '1em', marginBottom: '1em', paddingLeft: '2em' },
                '& li': { marginTop: '0.5em', marginBottom: '0.5em' },
                '& code': { 
                  backgroundColor: colorStyles.bg.secondary, 
                  padding: '0.2em 0.4em', 
                  borderRadius: '3px',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
                  fontSize: '0.9em'
                },
                '& pre': { 
                  backgroundColor: colorStyles.bg.secondary, 
                  padding: '1em', 
                  borderRadius: '6px',
                  overflowX: 'auto',
                  marginTop: '1em',
                  marginBottom: '1em'
                },
                '& pre code': {
                  backgroundColor: 'transparent',
                  padding: 0
                },
                '& blockquote': {
                  borderLeft: `4px solid ${colorStyles.border.default}`,
                  paddingLeft: '1em',
                  marginLeft: 0,
                  marginTop: '1em',
                  marginBottom: '1em',
                  color: colorStyles.text.secondary
                },
                '& table': {
                  borderCollapse: 'collapse',
                  width: '100%',
                  marginTop: '1em',
                  marginBottom: '1em'
                },
                '& th, & td': {
                  border: `1px solid ${colorStyles.border.default}`,
                  padding: '0.5em',
                  textAlign: 'left'
                },
                '& th': {
                  backgroundColor: colorStyles.bg.secondary,
                  fontWeight: 'bold'
                },
                '& .mermaid-diagram': {
                  marginTop: '1em',
                  marginBottom: '1em',
                  display: 'flex',
                  justifyContent: 'center'
                },
                '& .mermaid-rendered svg': {
                  maxWidth: '100%',
                  height: 'auto'
                }
              }}
              dangerouslySetInnerHTML={{ __html: processedHTML }}
            />
          </Box>
        )}
      </Flex>
    </Container>
  )
}

export default MarkdownEditor
