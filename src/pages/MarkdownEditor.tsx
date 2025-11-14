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
import DOMPurify from 'dompurify'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'
import 'highlight.js/styles/github-dark-dimmed.css'
import { Download, Upload, FileText } from 'lucide-react'
import { useToast } from '../hooks/useToast'
import { useColorStyles } from '../hooks/useColorStyles'
import { useColorMode } from '../components/ColorModeProvider'
import { TOAST_DURATIONS } from '../constants/uiConstants'
import { pdfExportManager, PDF_EXPORT_METHODS, type PdfExportMethod } from '../utils/pdfExport'

// Mermaid will be initialized dynamically based on color mode

export function MarkdownEditor() {
  const [markdown, setMarkdown] = useState<string>('')
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('split')
  const [pdfExportMethod, setPdfExportMethod] = useState<PdfExportMethod>('offscreen')
  const previewRef = useRef<HTMLDivElement>(null)
  const lastProcessedHTMLRef = useRef<string>('') // Track last processed HTML
  const fileInputRef = useRef<HTMLInputElement>(null)
  const colorStyles = useColorStyles()
  const { colorMode } = useColorMode()
  const { message: toastMessage, showToast } = useToast()
  
  // レスポンシブ対応: PCではsplit、モバイルではedit
  const isMobile = useBreakpointValue({ base: true, md: false })
  
  // カラーモードに応じてhighlight.jsテーマを動的にロード
  useEffect(() => {
    const loadHighlightTheme = () => {
      // カスタムクラス名でスタイル要素を識別
      const styles = document.querySelectorAll('style')
      let lightStyle: HTMLStyleElement | undefined
      let darkStyle: HTMLStyleElement | undefined
      
      // highlight.jsのスタイルを特定
      styles.forEach(style => {
        if (style.textContent?.includes('.hljs')) {
          // github.css（ライトテーマ）
          if (style.textContent.includes('.hljs') && !style.id) {
            if (style.textContent.includes('color:#24292e') || style.textContent.includes('color:#24292f')) {
              style.id = 'hljs-light-theme'
              lightStyle = style as HTMLStyleElement
            } else if (style.textContent.includes('color:#e6edf3') || style.textContent.includes('color:#c9d1d9')) {
              style.id = 'hljs-dark-theme'
              darkStyle = style as HTMLStyleElement
            }
          } else if (style.id === 'hljs-light-theme') {
            lightStyle = style as HTMLStyleElement
          } else if (style.id === 'hljs-dark-theme') {
            darkStyle = style as HTMLStyleElement
          }
        }
      })
      
      // テーマに応じて有効/無効を切り替え
      if (lightStyle) {
        (lightStyle as HTMLStyleElement).disabled = colorMode === 'dark'
      }
      if (darkStyle) {
        (darkStyle as HTMLStyleElement).disabled = colorMode === 'light'
      }
    }
    
    loadHighlightTheme()
  }, [colorMode])
  
  // ハイライトを再適用する関数
  const reapplyHighlighting = () => {
    if (!previewRef.current) return
    
    const codeBlocks = previewRef.current.querySelectorAll('pre code:not(.mermaid-diagram)')
    codeBlocks.forEach((block) => {
      const element = block as HTMLElement
      // クラスをリセットしてから再適用
      const classes = Array.from(element.classList).filter(cls => !cls.startsWith('hljs'))
      element.className = classes.join(' ')
      
      // data-highlighted属性を削除（highlight.jsの再適用を可能にする）
      delete element.dataset.highlighted
      
      // ハイライトを再適用
      try {
        hljs.highlightElement(element)
      } catch (error) {
        console.warn('Highlight error:', error)
      }
    })
  }
  
  useEffect(() => {
    if (isMobile && viewMode === 'split') {
      setViewMode('edit')
    }
  }, [isMobile, viewMode])

  // Mermaidをカラーモードに応じて初期化
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: colorMode === 'dark' ? 'dark' : 'default',
      securityLevel: 'strict',
      fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    })
    
    // カラーモード変更時に、既存のMermaid図を再レンダリング可能にする
    if (previewRef.current) {
      const mermaidDivs = previewRef.current.querySelectorAll('.mermaid-diagram.mermaid-rendered')
      mermaidDivs.forEach((div) => {
        const element = div as HTMLElement
        // 元のコードを取得して復元
        const originalCode = element.getAttribute('data-mermaid-code')
        if (originalCode) {
          element.textContent = originalCode
        }
        element.classList.remove('mermaid-rendered')
      })
    }
  }, [colorMode])

  // Markdownをレンダリング
  const renderedHTML = useMemo(() => {
    try {
      const rawHTML = marked(markdown, { 
        breaks: true,
        gfm: true
      }) as string
      // DOMPurifyでHTMLをサニタイズ（XSS対策）
      return DOMPurify.sanitize(rawHTML, {
        ADD_TAGS: ['iframe', 'input'], // Mermaidとチェックボックス用
        ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling', 'type', 'checked', 'disabled'] // チェックボックス属性を追加
      })
    } catch (error) {
      console.error('Markdown parse error:', error)
      return '<p>Error rendering markdown</p>'
    }
  }, [markdown])

  // Mermaidコードブロックを特別な要素に変換
  const processedHTML = useMemo(() => {
    return renderedHTML.replace(
      /<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/g,
      (_, code) => `<div class="mermaid-diagram">${code}</div>`
    )
  }, [renderedHTML])

  // Update preview innerHTML when processedHTML changes or when switching to preview mode
  useEffect(() => {
    const shouldShowPreview = viewMode === 'preview' || viewMode === 'split'
    if (previewRef.current && shouldShowPreview) {
      // Always update innerHTML when switching to preview mode or when content changes
      if (processedHTML !== lastProcessedHTMLRef.current || previewRef.current.innerHTML === '') {
        previewRef.current.innerHTML = processedHTML
        lastProcessedHTMLRef.current = processedHTML
      }
    }
  }, [processedHTML, viewMode])

  // Mermaidダイアグラムを処理
  useEffect(() => {
    if (!previewRef.current || (viewMode !== 'preview' && viewMode !== 'split')) {
      return
    }

    const renderMermaid = async () => {
      const mermaidDivs = previewRef.current?.querySelectorAll('.mermaid-diagram:not(.mermaid-rendered)')
      if (!mermaidDivs || mermaidDivs.length === 0) return
      
      for (let i = 0; i < mermaidDivs.length; i++) {
        const div = mermaidDivs[i] as HTMLElement
        // 元のコードを保存または取得
        const savedCode = div.getAttribute('data-mermaid-code')
        const code = savedCode || div.textContent || ''
        
        if (!savedCode && code) {
          div.setAttribute('data-mermaid-code', code)
        }
        
        if (!code.trim()) {
          continue
        }
        
        try {
          // 一意のIDを生成 - タイムスタンプを使用して確実にユニークにする
          const uniqueId = `mermaid-${Math.random().toString(36).substr(2, 9)}-${Date.now()}-${i}`
          
          // セキュリティ対策: Mermaidコードのサイズ制限（10KB）
          const maxCodeSize = 10 * 1024
          if (code.length > maxCodeSize) {
            throw new Error('Mermaid diagram too large')
          }
          
          // 古いMermaid要素をクリーンアップ
          const oldMermaidElements = document.querySelectorAll(`[id^="mermaid-"]`)
          oldMermaidElements.forEach(el => {
            if (el.id !== uniqueId && !el.closest('.mermaid-diagram')) {
              el.remove()
            }
          })
          
          const { svg } = await mermaid.render(uniqueId, code)
          
          // Mermaidが生成するSVGを挿入
          div.innerHTML = svg
          div.classList.add('mermaid-rendered')
        } catch (error) {
          console.error('Mermaid render error:', error)
          // エラーメッセージをテキストとして安全に表示
          const errorMsg = error instanceof Error ? error.message : 'Unknown error'
          div.textContent = `Error rendering Mermaid diagram: ${errorMsg}`
          div.style.color = colorMode === 'dark' ? '#ff7b72' : '#d73a49'
          div.style.padding = '1em'
          div.style.backgroundColor = colorMode === 'dark' ? 'rgba(255, 123, 114, 0.1)' : 'rgba(215, 58, 73, 0.1)'
          div.style.borderRadius = '6px'
          div.classList.add('mermaid-rendered') // Mark as processed even on error
        }
      }
    }
    
    // 少し遅延してから実行（DOM更新を待つ）
    const timer = setTimeout(renderMermaid, 100)
    return () => clearTimeout(timer)
  }, [processedHTML, viewMode, colorMode])

  // コードブロックにシンタックスハイライトを適用
  useEffect(() => {
    if (!previewRef.current || (viewMode !== 'preview' && viewMode !== 'split')) {
      return
    }
    
    // Mermaid rendering completes after 100ms, so we wait 150ms to ensure it's done
    const timer = setTimeout(() => {
      reapplyHighlighting()
    }, 150)
    
    return () => clearTimeout(timer)
  }, [processedHTML, viewMode, colorMode])

  // ファイル保存
  const handleSave = () => {
    if (!markdown.trim()) {
      showToast('保存する内容がありません', TOAST_DURATIONS.ERROR)
      return
    }
    
    try {
      // UTF-8 BOMを追加してiPhoneでも正しく読めるようにする
      const BOM = '\uFEFF'
      const content = BOM + markdown
      const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      // 日付を含むファイル名を生成
      const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      a.download = `document_${date}.md`
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
      // ファイルサイズチェック (10MB制限)
      const maxSize = 10 * 1024 * 1024
      if (file.size > maxSize) {
        showToast('ファイルサイズが大きすぎます（10MB以下にしてください）', TOAST_DURATIONS.ERROR)
        return
      }
      
      const reader = new FileReader()
      reader.onload = (event) => {
        let content = event.target?.result as string
        // UTF-8 BOMを削除
        if (content.charCodeAt(0) === 0xFEFF) {
          content = content.substring(1)
        }
        setMarkdown(content)
        showToast('ファイルを読み込みました', TOAST_DURATIONS.SHORT)
      }
      reader.onerror = () => {
        showToast('ファイルの読み込みに失敗しました', TOAST_DURATIONS.ERROR)
      }
      reader.readAsText(file, 'UTF-8')
    }
    // input要素をリセット（同じファイルを再度選択できるように）
    e.target.value = ''
  }

  // PDF出力
  const handleExportPDF = async () => {
    if (!markdown.trim()) {
      showToast('出力する内容がありません', TOAST_DURATIONS.ERROR)
      return
    }

    // プレビューが表示されていない場合の警告
    if (viewMode === 'edit') {
      showToast('プレビュータブまたは分割モードに切り替えてからPDFを出力してください', TOAST_DURATIONS.ERROR)
      return
    }

    try {
      // 選択されたストラテジーを取得
      const strategy = pdfExportManager.getStrategy(pdfExportMethod)
      
      if (!strategy) {
        showToast('選択されたPDF出力方法が見つかりません', TOAST_DURATIONS.ERROR)
        return
      }

      // PDF出力を実行
      const result = await strategy.export({
        markdown,
        previewElement: previewRef.current as HTMLElement,
        colorMode,
        isMobile: isMobile || false,
        onProgress: (message) => showToast(message, TOAST_DURATIONS.SHORT)
      })

      if (result.success) {
        showToast('PDFを出力しました', TOAST_DURATIONS.SHORT)
      } else {
        showToast(result.error || 'PDF出力に失敗しました', TOAST_DURATIONS.ERROR)
      }
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
                aria-label="入力モードに切り替え"
                aria-pressed={viewMode === 'edit'}
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
                aria-label="プレビューモードに切り替え"
                aria-pressed={viewMode === 'preview'}
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
                  aria-label="同時表示モードに切り替え"
                  aria-pressed={viewMode === 'split'}
                  _hover={{
                    bg: viewMode === 'split' ? colorStyles.accent.blue.buttonHover : colorStyles.bg.secondary
                  }}>
                  同時表示
                </Button>
              )}
            </Flex>
          </Box>

          {/* ファイル操作 */}
          <Flex gap={2} flexWrap="wrap" alignItems="flex-end">
            {/* PDF出力方法選択 */}
            <Box>
              <Text fontSize="xs" fontWeight="medium" mb={1} color={colorStyles.text.primary}>
                PDF出力方法
              </Text>
              <select
                value={pdfExportMethod}
                onChange={(e) => setPdfExportMethod(e.target.value as PdfExportMethod)}
                style={{
                  fontSize: '14px',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  backgroundColor: colorStyles.bg.primary,
                  color: colorStyles.text.primary,
                  border: `1px solid ${colorStyles.border.default}`,
                  cursor: 'pointer',
                  width: '200px',
                  height: '32px'
                }}>
                {(Object.keys(PDF_EXPORT_METHODS) as PdfExportMethod[]).map((method) => (
                  <option key={method} value={method}>
                    {PDF_EXPORT_METHODS[method].label}
                  </option>
                ))}
              </select>
            </Box>

            <input
              ref={fileInputRef}
              type="file"
              accept=".md,.markdown,.txt"
              style={{ display: 'none' }}
              onChange={handleFileChange}
              aria-label="ファイル選択"
            />
            <Button 
              onClick={handleLoad}
              size="sm"
              bg={colorStyles.bg.primary}
              color={colorStyles.text.primary}
              borderColor={colorStyles.border.default}
              border="1px solid"
              aria-label="Markdownファイルを読み込む"
              _hover={{
                bg: colorStyles.bg.secondary
              }}>
              <Upload size={16} style={{ marginRight: '8px' }} />
              読み込み
            </Button>
            <Button 
              onClick={handleSave}
              size="sm"
              bg={colorStyles.bg.primary}
              color={colorStyles.text.primary}
              borderColor={colorStyles.border.default}
              border="1px solid"
              aria-label="Markdownファイルを保存"
              _hover={{
                bg: colorStyles.bg.secondary
              }}>
              <Download size={16} style={{ marginRight: '8px' }} />
              保存
            </Button>
            <Button 
              onClick={handleExportPDF}
              size="sm"
              colorScheme="blue"
              bg={colorStyles.accent.blue.button}
              color="white"
              aria-label="PDFとして出力"
              _hover={{
                bg: colorStyles.accent.blue.buttonHover
              }}>
              <FileText size={16} style={{ marginRight: '8px' }} />
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
              aria-label="Markdown入力エリア"
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
              textAlign="left"
              role="region"
              aria-label="Markdownプレビュー"
              css={{
                // すべてのテキストを左揃えにする
                textAlign: 'left',
                '& > *': { textAlign: 'left' },
                '& h1': { 
                  fontSize: '2em', 
                  fontWeight: 'bold', 
                  marginTop: '0.67em', 
                  marginBottom: '0.67em', 
                  textAlign: 'left !important',
                  color: colorStyles.text.primary 
                },
                '& h2': { 
                  fontSize: '1.5em', 
                  fontWeight: 'bold', 
                  marginTop: '0.83em', 
                  marginBottom: '0.83em', 
                  borderBottom: `1px solid ${colorStyles.border.default}`, 
                  paddingBottom: '0.3em', 
                  textAlign: 'left !important',
                  color: colorStyles.text.primary 
                },
                '& h3': { 
                  fontSize: '1.17em', 
                  fontWeight: 'bold', 
                  marginTop: '1em', 
                  marginBottom: '1em', 
                  textAlign: 'left !important',
                  color: colorStyles.text.primary 
                },
                '& h4': { 
                  fontSize: '1em', 
                  fontWeight: 'bold', 
                  marginTop: '1.33em', 
                  marginBottom: '1.33em', 
                  textAlign: 'left !important',
                  color: colorStyles.text.primary 
                },
                '& h5': { 
                  fontSize: '0.83em', 
                  fontWeight: 'bold', 
                  marginTop: '1.67em', 
                  marginBottom: '1.67em', 
                  textAlign: 'left !important',
                  color: colorStyles.text.primary 
                },
                '& h6': { 
                  fontSize: '0.67em', 
                  fontWeight: 'bold', 
                  marginTop: '2.33em', 
                  marginBottom: '2.33em', 
                  textAlign: 'left !important',
                  color: colorStyles.text.primary 
                },
                '& p': { 
                  marginTop: '1em', 
                  marginBottom: '1em', 
                  lineHeight: '1.6', 
                  textAlign: 'left !important',
                  color: colorStyles.text.primary 
                },
                '& ul, & ol': { 
                  marginTop: '1em', 
                  marginBottom: '1em', 
                  paddingLeft: '2em', 
                  textAlign: 'left !important' 
                },
                '& ul': { 
                  listStyleType: 'disc',
                  listStylePosition: 'outside'
                },
                '& ol': { 
                  listStyleType: 'decimal',
                  listStylePosition: 'outside'
                },
                '& li': { 
                  marginTop: '0.25em', 
                  marginBottom: '0.25em', 
                  display: 'list-item', 
                  lineHeight: '1.6', 
                  textAlign: 'left !important',
                  color: colorStyles.text.primary 
                },
                '& ul ul': { 
                  marginTop: '0.25em', 
                  marginBottom: '0.25em', 
                  listStyleType: 'circle' 
                },
                '& ol ol': { 
                  marginTop: '0.25em', 
                  marginBottom: '0.25em', 
                  listStyleType: 'lower-alpha' 
                },
                '& ul li::marker, & ol li::marker': { 
                  color: colorStyles.text.primary 
                },
                '& code': { 
                  backgroundColor: colorMode === 'dark' ? 'rgba(110, 118, 129, 0.4)' : 'rgba(175, 184, 193, 0.2)',
                  color: colorMode === 'dark' ? '#e6edf3' : '#24292f',
                  padding: '0.2em 0.4em', 
                  borderRadius: '3px',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
                  fontSize: '0.9em'
                },
                '& pre': { 
                  backgroundColor: colorMode === 'dark' ? '#0d1117' : '#f6f8fa',
                  padding: '1em', 
                  borderRadius: '6px',
                  overflowX: 'auto',
                  marginTop: '1em',
                  marginBottom: '1em',
                  border: `1px solid ${colorMode === 'dark' ? '#30363d' : '#d0d7de'}`,
                  textAlign: 'left !important'
                },
                '& pre code': {
                  backgroundColor: 'transparent',
                  padding: 0,
                  color: 'inherit',
                  fontSize: '0.85em'
                },
                '& input[type="checkbox"]': {
                  width: '1em',
                  height: '1em',
                  marginRight: '0.5em',
                  verticalAlign: 'middle',
                  accentColor: colorMode === 'dark' ? '#58a6ff' : '#0969da',
                  cursor: 'pointer',
                  backgroundColor: colorMode === 'dark' ? '#0d1117' : '#ffffff',
                  border: `2px solid ${colorMode === 'dark' ? '#6e7681' : '#d0d7de'}`,
                  borderRadius: '3px',
                  appearance: 'auto',
                  WebkitAppearance: 'auto'
                },
                '& li:has(> input[type="checkbox"])': {
                  listStyleType: 'none',
                  marginLeft: '-1.5em'
                },
                '& blockquote': {
                  borderLeft: `4px solid ${colorStyles.border.default}`,
                  paddingLeft: '1em',
                  marginLeft: 0,
                  marginTop: '1em',
                  marginBottom: '1em',
                  color: colorStyles.text.secondary,
                  textAlign: 'left !important'
                },
                '& table': {
                  borderCollapse: 'collapse',
                  width: '100%',
                  marginTop: '1em',
                  marginBottom: '1em',
                  textAlign: 'left !important',
                  border: colorMode === 'dark' ? '1px solid #30363d !important' : '1px solid #d0d7de !important'
                },
                '& th, & td': {
                  border: colorMode === 'dark' ? '1px solid #30363d !important' : '1px solid #d0d7de !important',
                  padding: '0.5em 0.75em',
                  textAlign: 'left !important'
                },
                '& thead': {
                  backgroundColor: `${colorMode === 'dark' ? '#161b22' : '#f6f8fa'} !important`
                },
                '& th': {
                  backgroundColor: `${colorMode === 'dark' ? '#161b22' : '#f6f8fa'} !important`,
                  fontWeight: 'bold',
                  color: colorStyles.text.primary
                },
                '& tbody tr': {
                  backgroundColor: `${colorMode === 'dark' ? '#0d1117' : '#ffffff'} !important`
                },
                '& tbody tr:hover': {
                  backgroundColor: `${colorMode === 'dark' ? '#161b22' : '#f6f8fa'} !important`
                },
                '& .mermaid-diagram': {
                  marginTop: '1em',
                  marginBottom: '1em',
                  display: 'flex',
                  justifyContent: 'center',
                  textAlign: 'center !important'
                },
                '& .mermaid-rendered svg': {
                  maxWidth: '100%',
                  height: 'auto'
                },
                // highlight.jsのダークモードカラーを上書き
                '& .hljs': {
                  color: colorMode === 'dark' ? '#e6edf3' : '#24292f',
                  background: 'transparent'
                },
                '& .hljs-comment': {
                  color: colorMode === 'dark' ? '#8b949e' : '#6a737d'
                },
                '& .hljs-keyword, & .hljs-selector-tag, & .hljs-meta .hljs-keyword, & .hljs-template-tag, & .hljs-template-variable, & .hljs-type, & .hljs-variable.language_': {
                  color: colorMode === 'dark' ? '#ff7b72' : '#d73a49'
                },
                '& .hljs-variable, & .hljs-literal, & .hljs-number': {
                  color: colorMode === 'dark' ? '#79c0ff' : '#005cc5'
                },
                '& .hljs-string, & .hljs-doctag': {
                  color: colorMode === 'dark' ? '#a5d6ff' : '#032f62'
                },
                '& .hljs-title, & .hljs-section, & .hljs-selector-id': {
                  color: colorMode === 'dark' ? '#d2a8ff' : '#6f42c1'
                },
                '& .hljs-attr, & .hljs-attribute': {
                  color: colorMode === 'dark' ? '#79c0ff' : '#005cc5'
                },
                '& .hljs-built_in, & .hljs-class .hljs-title': {
                  color: colorMode === 'dark' ? '#ffa657' : '#e36209'
                },
                '& .hljs-name, & .hljs-property, & .hljs-quote, & .hljs-selector-class, & .hljs-selector-pseudo': {
                  color: colorMode === 'dark' ? '#7ee787' : '#22863a'
                },
                '& .hljs-tag': {
                  color: colorMode === 'dark' ? '#7ee787' : '#22863a'
                },
                '& .hljs-subst': {
                  color: colorMode === 'dark' ? '#e6edf3' : '#24292f'
                },
                '& .hljs-formula': {
                  color: colorMode === 'dark' ? '#e6edf3' : '#24292f'
                },
                '& .hljs-emphasis': {
                  fontStyle: 'italic'
                },
                '& .hljs-strong': {
                  fontWeight: 'bold'
                }
              }}
            />
          </Box>
        )}
      </Flex>
    </Container>
  )
}

export default MarkdownEditor
