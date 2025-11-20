import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Box,
  Container,
  Heading,
  Button,
  Textarea,
  Flex,
  Text,
  Input,
  IconButton,
} from '@chakra-ui/react'
import {
  Code,
  Upload,
  ChevronDown,
  ChevronUp,
  FileArchive,
} from 'lucide-react'
import JSZip from 'jszip'
import { useToast } from '../hooks/useToast'
import { useColorStyles } from '../hooks/useColorStyles'
import { TOAST_DURATIONS } from '../constants/uiConstants'

// サンプルテンプレート
const SAMPLE_TEMPLATES = {
  basic: {
    html: `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>サンプルページ</title>
</head>
<body>
  <h1>Hello, World!</h1>
  <p>これは簡易Webエディタのサンプルです。</p>
</body>
</html>`,
    css: `body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background-color: #f5f5f5;
}

h1 {
  color: #333;
  border-bottom: 2px solid #007bff;
  padding-bottom: 10px;
}

p {
  line-height: 1.6;
  color: #666;
}`,
    js: `// JavaScriptコードをここに記述
console.log('ページが読み込まれました');

document.addEventListener('DOMContentLoaded', function() {
  console.log('DOMの準備が完了しました');
});`,
  },
  counter: {
    html: `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>カウンター</title>
</head>
<body>
  <div class="counter-container">
    <h1>カウンター</h1>
    <div class="counter-display">
      <span id="count">0</span>
    </div>
    <div class="button-group">
      <button id="decrement">-</button>
      <button id="reset">リセット</button>
      <button id="increment">+</button>
    </div>
  </div>
</body>
</html>`,
    css: `body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  margin: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.counter-container {
  background-color: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
  text-align: center;
}

h1 {
  color: #333;
  margin: 0 0 30px 0;
}

.counter-display {
  background-color: #f5f5f5;
  border-radius: 10px;
  padding: 30px;
  margin-bottom: 30px;
}

#count {
  font-size: 48px;
  font-weight: bold;
  color: #667eea;
}

.button-group {
  display: flex;
  gap: 15px;
  justify-content: center;
}

button {
  background-color: #667eea;
  color: white;
  border: none;
  border-radius: 10px;
  padding: 15px 30px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

button:hover {
  background-color: #764ba2;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.2);
}

button:active {
  transform: translateY(0);
}

#reset {
  background-color: #6c757d;
}

#reset:hover {
  background-color: #5a6268;
}`,
    js: `// カウンター機能
let count = 0;

const countElement = document.getElementById('count');
const incrementBtn = document.getElementById('increment');
const decrementBtn = document.getElementById('decrement');
const resetBtn = document.getElementById('reset');

function updateDisplay() {
  countElement.textContent = count;
}

incrementBtn.addEventListener('click', function() {
  count++;
  updateDisplay();
});

decrementBtn.addEventListener('click', function() {
  count--;
  updateDisplay();
});

resetBtn.addEventListener('click', function() {
  count = 0;
  updateDisplay();
});

console.log('カウンターが初期化されました');`,
  },
}

// タグ挿入用のスニペット
const TAG_SNIPPETS = {
  table: `<table>
  <thead>
    <tr>
      <th>ヘッダー1</th>
      <th>ヘッダー2</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>データ1</td>
      <td>データ2</td>
    </tr>
  </tbody>
</table>`,
  div: `<div class="container">
  <!-- コンテンツ -->
</div>`,
  form: `<form>
  <label for="name">名前:</label>
  <input type="text" id="name" name="name">
  <button type="submit">送信</button>
</form>`,
  list: `<ul>
  <li>項目1</li>
  <li>項目2</li>
  <li>項目3</li>
</ul>`,
  link: `<a href="https://example.com" target="_blank">リンクテキスト</a>`,
  image: `<img src="https://via.placeholder.com/300x200" alt="画像の説明">`,
}

export default function WebEditor() {
  const [html, setHtml] = useState('')
  const [css, setCss] = useState('')
  const [js, setJs] = useState('')
  const [activeTab, setActiveTab] = useState<'html' | 'css' | 'js'>('html')
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('split')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isToolbarCollapsed, setIsToolbarCollapsed] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const zipInputRef = useRef<HTMLInputElement>(null)
  const colorStyles = useColorStyles()
  const { showToast } = useToast()

  // Check if screen is PC size
  const [isPCSize, setIsPCSize] = useState(window.innerWidth >= 768)

  useEffect(() => {
    const handleResize = () => {
      const newIsPCSize = window.innerWidth >= 768
      setIsPCSize(newIsPCSize)
      // On mobile, disable split mode
      if (!newIsPCSize && viewMode === 'split') {
        setViewMode('edit')
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [viewMode])

  // サンプル読み込み
  const loadSample = useCallback((templateKey: keyof typeof SAMPLE_TEMPLATES) => {
    const template = SAMPLE_TEMPLATES[templateKey]
    setHtml(template.html)
    setCss(template.css)
    setJs(template.js)
    setHasUnsavedChanges(false)
    showToast('サンプルを読み込みました', 'success', TOAST_DURATIONS.SHORT)
  }, [showToast])

  // プレビュー更新
  const updatePreview = useCallback(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    const document = iframe.contentDocument
    if (!document) return

    const content = `
      <!DOCTYPE html>
      <html lang="ja">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${css}</style>
      </head>
      <body>
        ${html}
        <script>${js}</script>
      </body>
      </html>
    `

    document.open()
    document.write(content)
    document.close()
  }, [html, css, js])

  // 初期サンプルをロード
  useEffect(() => {
    loadSample('basic')
  }, [loadSample])

  // プレビュー更新
  useEffect(() => {
    updatePreview()
  }, [updatePreview])

  // ページ離脱時の警告
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  // コード変更時
  const handleCodeChange = (
    type: 'html' | 'css' | 'js',
    value: string
  ) => {
    setHasUnsavedChanges(true)
    if (type === 'html') setHtml(value)
    else if (type === 'css') setCss(value)
    else setJs(value)
  }

  // ファイル読み込み
  const loadFromFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = JSON.parse(e.target?.result as string)
        setHtml(content.html || '')
        setCss(content.css || '')
        setJs(content.js || '')
        setHasUnsavedChanges(false)
        showToast('ファイルを読み込みました', 'success', TOAST_DURATIONS.SHORT)
      } catch {
        showToast('ファイルの読み込みに失敗しました', 'error', TOAST_DURATIONS.LONG)
      }
    }
    reader.readAsText(file)
    
    // ファイル入力をリセット
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // ファイル保存
  const saveToFile = () => {
    const content = {
      html,
      css,
      js,
    }
    const blob = new Blob([JSON.stringify(content, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'web-editor-project.json'
    a.click()
    URL.revokeObjectURL(url)
    setHasUnsavedChanges(false)
    showToast('ファイルを保存しました', 'success', TOAST_DURATIONS.SHORT)
  }

  // HTML単体で保存
  const saveAsHtml = () => {
    const content = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Web Editor Export</title>
  <style>
${css}
  </style>
</head>
<body>
${html}
  <script>
${js}
  </script>
</body>
</html>`

    const blob = new Blob([content], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'index.html'
    a.click()
    URL.revokeObjectURL(url)
    showToast('HTMLファイルを保存しました', 'success', TOAST_DURATIONS.SHORT)
  }

  // タグをクリップボードにコピー
  const copySnippetToClipboard = async (snippetKey: keyof typeof TAG_SNIPPETS) => {
    const snippet = TAG_SNIPPETS[snippetKey]
    try {
      await navigator.clipboard.writeText(snippet)
      showToast(`${snippetKey}をクリップボードにコピーしました`, 'success', TOAST_DURATIONS.SHORT)
    } catch {
      showToast('クリップボードへのコピーに失敗しました', 'error', TOAST_DURATIONS.SHORT)
    }
  }

  // 個別ファイル保存（HTML）
  const saveHtmlFile = () => {
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'index.html'
    a.click()
    URL.revokeObjectURL(url)
    showToast('HTMLファイルを保存しました', 'success', TOAST_DURATIONS.SHORT)
  }

  // 個別ファイル保存（CSS）
  const saveCssFile = () => {
    const blob = new Blob([css], { type: 'text/css' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'style.css'
    a.click()
    URL.revokeObjectURL(url)
    showToast('CSSファイルを保存しました', 'success', TOAST_DURATIONS.SHORT)
  }

  // 個別ファイル保存（JS）
  const saveJsFile = () => {
    const blob = new Blob([js], { type: 'text/javascript' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'script.js'
    a.click()
    URL.revokeObjectURL(url)
    showToast('JavaScriptファイルを保存しました', 'success', TOAST_DURATIONS.SHORT)
  }

  // ZIP保存
  const saveAsZip = async () => {
    try {
      const zip = new JSZip()
      
      // HTMLファイル（CSS・JSは外部参照）
      const htmlContent = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Web Editor Export</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
${html}
  <script src="script.js"></script>
</body>
</html>`
      
      zip.file('index.html', htmlContent)
      zip.file('style.css', css)
      zip.file('script.js', js)
      
      const blob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'web-project.zip'
      a.click()
      URL.revokeObjectURL(url)
      setHasUnsavedChanges(false)
      showToast('ZIPファイルを保存しました', 'success', TOAST_DURATIONS.SHORT)
    } catch {
      showToast('ZIP保存に失敗しました', 'error', TOAST_DURATIONS.LONG)
    }
  }

  // ZIP読み込み
  const loadFromZip = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const zip = await JSZip.loadAsync(file)
      
      let loadedHtml = ''
      let loadedCss = ''
      let loadedJs = ''
      
      // HTMLファイルを探す
      const htmlFile = zip.file(/\.html?$/i)[0]
      if (htmlFile) {
        const content = await htmlFile.async('string')
        // HTML内容を抽出（bodyタグの中身のみ）
        const bodyMatch = content.match(/<body[^>]*>([\s\S]*)<\/body>/i)
        loadedHtml = bodyMatch ? bodyMatch[1].trim() : content
      }
      
      // CSSファイルを探す
      const cssFile = zip.file(/\.css$/i)[0]
      if (cssFile) {
        loadedCss = await cssFile.async('string')
      }
      
      // JSファイルを探す
      const jsFile = zip.file(/\.js$/i)[0]
      if (jsFile) {
        loadedJs = await jsFile.async('string')
      }
      
      setHtml(loadedHtml)
      setCss(loadedCss)
      setJs(loadedJs)
      setHasUnsavedChanges(false)
      showToast('ZIPファイルを読み込みました', 'success', TOAST_DURATIONS.SHORT)
    } catch {
      showToast('ZIPファイルの読み込みに失敗しました', 'error', TOAST_DURATIONS.LONG)
    }
    
    // ファイル入力をリセット
    if (zipInputRef.current) {
      zipInputRef.current.value = ''
    }
  }

  return (
    <Container maxW="100%" p={4} h="calc(100vh - 80px)">
      <Flex direction="column" h="100%">
        {/* ヘッダー */}
        <Box mb={4}>
          <Flex alignItems="center" justifyContent="space-between" mb={2}>
            <Heading size="lg" display="flex" alignItems="center" gap={2}>
              <Code size={24} />
              簡易Webエディタ
            </Heading>
            <IconButton
              aria-label="ツールバーを折りたたむ"
              icon={isToolbarCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
              onClick={() => setIsToolbarCollapsed(!isToolbarCollapsed)}
              size="sm"
              variant="ghost"
            />
          </Flex>
          
          {!isToolbarCollapsed && (
            <Flex gap={2} flexWrap="wrap" pb={2}>
              {/* サンプル読み込み */}
              <Box
                as="select"
                size="sm"
                fontSize="sm"
                px={3}
                py={2}
                borderRadius="md"
                borderWidth="1px"
                borderColor={colorStyles.border.default}
                bg={colorStyles.bg.primary}
                color={colorStyles.text.primary}
                cursor="pointer"
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  if (e.target.value) {
                    loadSample(e.target.value as keyof typeof SAMPLE_TEMPLATES)
                    e.target.value = ''
                  }
                }}
                _hover={{
                  borderColor: colorStyles.accent.blue.linkColor,
                }}
              >
                <option value="">サンプル</option>
                <option value="basic">基本</option>
                <option value="counter">カウントアップ</option>
              </Box>

              {/* タグをクリップボードにコピー */}
              <Box
                as="select"
                size="sm"
                fontSize="sm"
                px={3}
                py={2}
                borderRadius="md"
                borderWidth="1px"
                borderColor={colorStyles.border.default}
                bg={colorStyles.bg.primary}
                color={colorStyles.text.primary}
                cursor="pointer"
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  if (e.target.value) {
                    copySnippetToClipboard(e.target.value as keyof typeof TAG_SNIPPETS)
                    e.target.value = ''
                  }
                }}
                _hover={{
                  borderColor: colorStyles.accent.blue.linkColor,
                }}
              >
                <option value="">タグコピー</option>
                <option value="table">テーブル</option>
                <option value="div">Divコンテナ</option>
                <option value="form">フォーム</option>
                <option value="list">リスト</option>
                <option value="link">リンク</option>
                <option value="image">画像</option>
              </Box>

              {/* ファイル読み込み */}
              <Button
                size="sm"
                leftIcon={<Upload size={16} />}
                onClick={() => fileInputRef.current?.click()}
                colorScheme="green"
              >
                JSON
              </Button>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={loadFromFile}
                display="none"
              />
              
              {/* ZIP読み込み */}
              <Button
                size="sm"
                leftIcon={<FileArchive size={16} />}
                onClick={() => zipInputRef.current?.click()}
                colorScheme="green"
              >
                ZIP
              </Button>
              <Input
                ref={zipInputRef}
                type="file"
                accept=".zip"
                onChange={loadFromZip}
                display="none"
              />

              {/* 保存 */}
              <Box
                as="select"
                size="sm"
                fontSize="sm"
                px={3}
                py={2}
                borderRadius="md"
                borderWidth="1px"
                borderColor={colorStyles.border.default}
                bg={colorStyles.bg.primary}
                color={colorStyles.text.primary}
                cursor="pointer"
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  const value = e.target.value
                  if (value === 'html-only') saveHtmlFile()
                  else if (value === 'css-only') saveCssFile()
                  else if (value === 'js-only') saveJsFile()
                  else if (value === 'html-combined') saveAsHtml()
                  else if (value === 'zip') saveAsZip()
                  else if (value === 'json') saveToFile()
                  e.target.value = ''
                }}
                _hover={{
                  borderColor: colorStyles.accent.blue.linkColor,
                }}
              >
                <option value="">保存</option>
                <option value="html-only">HTML のみ</option>
                <option value="css-only">CSS のみ</option>
                <option value="js-only">JS のみ</option>
                <option value="html-combined">HTML 統合</option>
                <option value="zip">ZIP</option>
                <option value="json">JSON</option>
              </Box>

              {/* 表示モード切替 */}
              <Button
                size="sm"
                onClick={() => {
                  if (viewMode === 'edit') setViewMode('preview')
                  else if (viewMode === 'preview') setViewMode(isPCSize ? 'split' : 'edit')
                  else setViewMode('edit')
                }}
                colorScheme="blue"
              >
                {viewMode === 'edit' ? '編集' : viewMode === 'preview' ? 'プレビュー' : '同時'}
              </Button>
            </Flex>
          )}
        </Box>

        {/* メインエリア */}
        <Flex flex="1" gap={4} overflow="hidden">
          {/* エディタエリア */}
          {(viewMode === 'edit' || viewMode === 'split') && (
            <Flex
              direction="column"
              flex={viewMode === 'split' ? '1' : '1'}
              gap={2}
              overflow="hidden"
              minW={viewMode === 'split' ? '300px' : 'auto'}
            >
              {/* タブ */}
              <Flex gap={1} borderBottom="1px solid" borderColor={colorStyles.border.default}>
                {(['html', 'css', 'js'] as const).map((tab) => (
                  <Button
                    key={tab}
                    size="sm"
                    variant={activeTab === tab ? 'solid' : 'ghost'}
                    colorScheme={activeTab === tab ? 'blue' : 'gray'}
                    onClick={() => setActiveTab(tab)}
                    borderRadius="md md 0 0"
                  >
                    {tab.toUpperCase()}
                  </Button>
                ))}
              </Flex>

              {/* エディタ */}
              <Box flex="1" overflow="hidden">
                <Textarea
                  value={activeTab === 'html' ? html : activeTab === 'css' ? css : js}
                  onChange={(e) => handleCodeChange(activeTab, e.target.value)}
                  fontFamily="monospace"
                  fontSize="sm"
                  h="100%"
                  resize="none"
                  bg={colorStyles.bg.primary}
                  borderColor={colorStyles.border.default}
                  _focus={{
                    borderColor: colorStyles.accent.blue.linkColor,
                    boxShadow: `0 0 0 1px ${colorStyles.accent.blue.linkColor}`,
                  }}
                />
              </Box>
            </Flex>
          )}

          {/* プレビューエリア */}
          {(viewMode === 'preview' || viewMode === 'split') && (
            <Box
              flex="1"
              border="1px solid"
              borderColor={colorStyles.border.default}
              borderRadius="md"
              overflow="hidden"
              bg="white"
              minW={viewMode === 'split' ? '300px' : 'auto'}
            >
              <Box
                bg={colorStyles.bg.secondary}
                borderBottom="1px solid"
                borderColor={colorStyles.border.default}
                px={3}
                py={2}
              >
                <Text fontSize="sm" fontWeight="bold" color={colorStyles.text.primary}>
                  プレビュー
                </Text>
              </Box>
              <iframe
                ref={iframeRef}
                style={{
                  width: '100%',
                  height: 'calc(100% - 40px)',
                  border: 'none',
                }}
                title="preview"
              />
            </Box>
          )}
        </Flex>
      </Flex>
    </Container>
  )
}
