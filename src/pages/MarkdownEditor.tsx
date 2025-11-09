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
import DOMPurify from 'dompurify'
import hljs from 'highlight.js'
import { Download, Upload, FileText } from 'lucide-react'
import { useToast } from '../hooks/useToast'
import { useColorStyles } from '../hooks/useColorStyles'
import { useColorMode } from '../components/ColorModeProvider'
import { TOAST_DURATIONS } from '../constants/uiConstants'

// Mermaid will be initialized dynamically based on color mode

export function MarkdownEditor() {
  const [markdown, setMarkdown] = useState<string>('')
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('split')
  const previewRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const colorStyles = useColorStyles()
  const { colorMode } = useColorMode()
  const { message: toastMessage, showToast } = useToast()
  
  // レスポンシブ対応: PCではsplit、モバイルではedit
  const isMobile = useBreakpointValue({ base: true, md: false })
  
  // カラーモードに応じてhighlight.jsテーマを動的にロード
  useEffect(() => {
    const loadHighlightTheme = async () => {
      // カスタムクラス名でスタイル要素を識別
      const existingLightStyle = document.getElementById('hljs-light-theme')
      const existingDarkStyle = document.getElementById('hljs-dark-theme')
      
      // 既存のスタイルの有効/無効を切り替え
      if (existingLightStyle) {
        existingLightStyle.disabled = colorMode === 'dark'
      }
      if (existingDarkStyle) {
        existingDarkStyle.disabled = colorMode === 'light'
      }
      
      // テーマが未読み込みの場合のみ動的インポート
      if (colorMode === 'dark' && !existingDarkStyle) {
        await import('highlight.js/styles/github-dark-dimmed.css')
        // インポート後にスタイルを特定してIDを付与
        const styles = document.querySelectorAll('style')
        styles.forEach(style => {
          if (style.textContent?.includes('.hljs') && !style.id) {
            style.id = 'hljs-dark-theme'
            style.disabled = false
          }
        })
      } else if (colorMode === 'light' && !existingLightStyle) {
        await import('highlight.js/styles/github.css')
        // インポート後にスタイルを特定してIDを付与
        const styles = document.querySelectorAll('style')
        styles.forEach(style => {
          if (style.textContent?.includes('.hljs') && !style.id) {
            style.id = 'hljs-light-theme'
            style.disabled = false
          }
        })
      }
      
      // コードブロックを再ハイライト
      if (previewRef.current) {
        const codeBlocks = previewRef.current.querySelectorAll('pre code:not(.mermaid-diagram)')
        codeBlocks.forEach((block) => {
          // クラスをリセットしてから再適用
          const classes = Array.from(block.classList).filter(cls => !cls.startsWith('hljs'))
          block.className = classes.join(' ')
          hljs.highlightElement(block as HTMLElement)
        })
      }
    }
    
    loadHighlightTheme()
  }, [colorMode])
  
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
      securityLevel: 'loose',
    })
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

  // Mermaidダイアグラムを処理
  useEffect(() => {
    if (!previewRef.current || (viewMode !== 'preview' && viewMode !== 'split')) {
      return
    }

    const renderMermaid = async () => {
      const mermaidDivs = previewRef.current?.querySelectorAll('.mermaid-diagram')
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
          const { svg } = await mermaid.render(`mermaid-${Date.now()}-${i}`, code)
          // DOMPurserを使用してSVGを安全に挿入
          const parser = new DOMParser()
          const svgDoc = parser.parseFromString(svg, 'image/svg+xml')
          const svgElement = svgDoc.documentElement
          
          // 既存の内容をクリアしてSVG要素を追加
          div.textContent = ''
          div.appendChild(svgElement)
          div.classList.add('mermaid-rendered')
        } catch (error) {
          console.error('Mermaid render error:', error)
          // エラーメッセージをテキストとして安全に表示
          div.textContent = 'Error rendering Mermaid diagram'
          div.style.color = 'red'
        }
      }
    }
    
    // 少し遅延してから実行（DOM更新を待つ）
    const timer = setTimeout(renderMermaid, 100)
    return () => clearTimeout(timer)
  }, [renderedHTML, viewMode, colorMode])

  // Mermaidコードブロックを特別な要素に変換
  const processedHTML = useMemo(() => {
    return renderedHTML.replace(
      /<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/g,
      (_, code) => `<div class="mermaid-diagram">${code}</div>`
    )
  }, [renderedHTML])

  // コードブロックにシンタックスハイライトを適用
  useEffect(() => {
    if (!previewRef.current || (viewMode !== 'preview' && viewMode !== 'split')) {
      return
    }
    
    const codeBlocks = previewRef.current.querySelectorAll('pre code:not(.mermaid-diagram)')
    if (codeBlocks.length === 0) return
    
    codeBlocks.forEach((block) => {
      try {
        // 既存のハイライトクラスを削除してから再適用
        const classes = Array.from(block.classList).filter(cls => !cls.startsWith('hljs'))
        block.className = classes.join(' ')
        hljs.highlightElement(block as HTMLElement)
      } catch (error) {
        console.error('Highlighting error:', error)
      }
    })
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
  }

  // PDF出力
  const handleExportPDF = async () => {
    if (!previewRef.current) {
      showToast('プレビューが表示されていません', TOAST_DURATIONS.ERROR)
      return
    }
    
    if (!markdown.trim()) {
      showToast('出力する内容がありません', TOAST_DURATIONS.ERROR)
      return
    }
    
    try {
      showToast('PDF生成中...', TOAST_DURATIONS.SHORT)
      
      const previewElement = previewRef.current
      const originalWidth = previewElement.style.width
      const originalMaxWidth = previewElement.style.maxWidth
      
      // PDF用に一時的にライトモードのスタイルを適用
      const originalBgColor = previewElement.style.backgroundColor
      const originalColor = previewElement.style.color
      previewElement.setAttribute('data-pdf-export', 'true')
      
      // ライトモード用の一時的なスタイルを設定
      if (colorMode === 'dark') {
        previewElement.style.backgroundColor = '#ffffff'
        previewElement.style.color = '#24292f'
        
        // コードブロックのスタイルを一時的に変更
        const codeBlocks = previewElement.querySelectorAll('pre')
        const inlineCodes = previewElement.querySelectorAll('code')
        const originalStyles: Array<{element: HTMLElement, bgColor: string, color: string}> = []
        
        codeBlocks.forEach((pre) => {
          const element = pre as HTMLElement
          originalStyles.push({
            element,
            bgColor: element.style.backgroundColor,
            color: element.style.color
          })
          element.style.backgroundColor = '#f6f8fa'
          element.style.borderColor = '#d0d7de'
          
          const code = pre.querySelector('code')
          if (code) {
            const codeEl = code as HTMLElement
            originalStyles.push({
              element: codeEl,
              bgColor: codeEl.style.backgroundColor,
              color: codeEl.style.color
            })
            codeEl.style.color = '#24292f'
          }
        })
        
        inlineCodes.forEach((code) => {
          const element = code as HTMLElement
          // <pre>内の<code>は既に処理済みなので、親が<pre>でない場合のみ処理
          if (element.parentElement?.tagName !== 'PRE') {
            originalStyles.push({
              element,
              bgColor: element.style.backgroundColor,
              color: element.style.color
            })
            element.style.backgroundColor = 'rgba(175, 184, 193, 0.2)'
            element.style.color = '#24292f'
          }
        })
        
        // モバイルの場合、一時的に幅を広げてPDF生成
        if (isMobile) {
          previewElement.style.width = '800px'
          previewElement.style.maxWidth = '800px'
        }
        
        // プレビュー要素をキャンバスに変換
        const canvas = await html2canvas(previewElement, {
          scale: 2,
          useCORS: true,
          logging: false,
          windowWidth: isMobile ? 800 : undefined,
          width: isMobile ? 800 : undefined
        })
        
        // スタイルを元に戻す
        previewElement.style.backgroundColor = originalBgColor
        previewElement.style.color = originalColor
        originalStyles.forEach(({element, bgColor, color}) => {
          element.style.backgroundColor = bgColor
          element.style.color = color
        })
        
        if (isMobile) {
          previewElement.style.width = originalWidth
          previewElement.style.maxWidth = originalMaxWidth
        }
        previewElement.removeAttribute('data-pdf-export')
        
        const imgData = canvas.toDataURL('image/png')
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        })
        
        const pdfWidth = 210 // A4 width in mm
        const pdfHeight = 297 // A4 height in mm
        const margin = 10 // マージン
        const contentWidth = pdfWidth - (margin * 2)
        const imgWidth = contentWidth
        const imgHeight = (canvas.height * contentWidth) / canvas.width
        let heightLeft = imgHeight
        let position = margin
        
        // 最初のページ
        pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight)
        heightLeft -= (pdfHeight - margin * 2)
        
        // 複数ページの場合
        while (heightLeft > 0) {
          position = -(imgHeight - heightLeft) + margin
          pdf.addPage()
          pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight)
          heightLeft -= (pdfHeight - margin * 2)
        }
        
        pdf.save('document.pdf')
        showToast('PDFを出力しました', TOAST_DURATIONS.SHORT)
      } else {
        // ライトモードの場合は通常通り
        // モバイルの場合、一時的に幅を広げてPDF生成
        if (isMobile) {
          previewElement.style.width = '800px'
          previewElement.style.maxWidth = '800px'
        }
        
        // プレビュー要素をキャンバスに変換
        const canvas = await html2canvas(previewElement, {
          scale: 2,
          useCORS: true,
          logging: false,
          windowWidth: isMobile ? 800 : undefined,
          width: isMobile ? 800 : undefined
        })
        
        // スタイルを元に戻す
        if (isMobile) {
          previewElement.style.width = originalWidth
          previewElement.style.maxWidth = originalMaxWidth
        }
        previewElement.removeAttribute('data-pdf-export')
        
        const imgData = canvas.toDataURL('image/png')
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        })
        
        const pdfWidth = 210 // A4 width in mm
        const pdfHeight = 297 // A4 height in mm
        const margin = 10 // マージン
        const contentWidth = pdfWidth - (margin * 2)
        const imgWidth = contentWidth
        const imgHeight = (canvas.height * contentWidth) / canvas.width
        let heightLeft = imgHeight
        let position = margin
        
        // 最初のページ
        pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight)
        heightLeft -= (pdfHeight - margin * 2)
        
        // 複数ページの場合
        while (heightLeft > 0) {
          position = -(imgHeight - heightLeft) + margin
          pdf.addPage()
          pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight)
          heightLeft -= (pdfHeight - margin * 2)
        }
        
        pdf.save('document.pdf')
        showToast('PDFを出力しました', TOAST_DURATIONS.SHORT)
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
          <Flex gap={2} flexWrap="wrap">
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
              leftIcon={<Upload size={16} />}
              bg={colorStyles.bg.primary}
              color={colorStyles.text.primary}
              borderColor={colorStyles.border.default}
              border="1px solid"
              aria-label="Markdownファイルを読み込む"
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
              aria-label="Markdownファイルを保存"
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
              aria-label="PDFとして出力"
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
                '& *': { textAlign: 'left !important' },
                '& h1': { fontSize: '2em', fontWeight: 'bold', marginTop: '0.67em', marginBottom: '0.67em', textAlign: 'left' },
                '& h2': { fontSize: '1.5em', fontWeight: 'bold', marginTop: '0.83em', marginBottom: '0.83em', borderBottom: `1px solid ${colorStyles.border.default}`, paddingBottom: '0.3em', textAlign: 'left' },
                '& h3': { fontSize: '1.17em', fontWeight: 'bold', marginTop: '1em', marginBottom: '1em', textAlign: 'left' },
                '& h4': { fontSize: '1em', fontWeight: 'bold', marginTop: '1.33em', marginBottom: '1.33em', textAlign: 'left' },
                '& h5': { fontSize: '0.83em', fontWeight: 'bold', marginTop: '1.67em', marginBottom: '1.67em', textAlign: 'left' },
                '& h6': { fontSize: '0.67em', fontWeight: 'bold', marginTop: '2.33em', marginBottom: '2.33em', textAlign: 'left' },
                '& p': { marginTop: '1em', marginBottom: '1em', lineHeight: '1.6', textAlign: 'left' },
                '& ul': { marginTop: '1em', marginBottom: '1em', paddingLeft: '2em', listStyleType: 'disc', textAlign: 'left' },
                '& ol': { marginTop: '1em', marginBottom: '1em', paddingLeft: '2em', listStyleType: 'decimal', textAlign: 'left' },
                '& li': { marginTop: '0.25em', marginBottom: '0.25em', display: 'list-item', lineHeight: '1.6', textAlign: 'left' },
                '& ul ul': { marginTop: '0.25em', marginBottom: '0.25em', listStyleType: 'circle' },
                '& ol ol': { marginTop: '0.25em', marginBottom: '0.25em', listStyleType: 'lower-alpha' },
                '& ul li::marker': { color: colorStyles.text.primary },
                '& ol li::marker': { color: colorStyles.text.primary },
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
                  textAlign: 'left'
                },
                '& pre code': {
                  backgroundColor: 'transparent',
                  padding: 0,
                  color: colorMode === 'dark' ? '#e6edf3' : '#24292f'
                },
                '& input[type="checkbox"]': {
                  width: '1em',
                  height: '1em',
                  marginRight: '0.5em',
                  verticalAlign: 'middle',
                  accentColor: colorMode === 'dark' ? '#58a6ff' : '#0969da',
                  cursor: 'pointer',
                  backgroundColor: colorMode === 'dark' ? '#161b22' : '#ffffff',
                  border: `1px solid ${colorMode === 'dark' ? '#6e7681' : '#d0d7de'}`,
                  borderRadius: '3px'
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
                  padding: '0.5em'
                },
                '& th': {
                  backgroundColor: colorStyles.bg.secondary,
                  fontWeight: 'bold'
                },
                '& .mermaid-diagram': {
                  marginTop: '1em',
                  marginBottom: '1em',
                  display: 'flex',
                  justifyContent: 'center',
                  textAlign: 'center'
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
