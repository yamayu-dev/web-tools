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
} from '@chakra-ui/react'
import {
  Code,
  Upload,
  Maximize2,
  Minimize2,
} from 'lucide-react'
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
  table: {
    html: `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>テーブルサンプル</title>
</head>
<body>
  <h1>データテーブル</h1>
  <table>
    <thead>
      <tr>
        <th>名前</th>
        <th>年齢</th>
        <th>都市</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>山田太郎</td>
        <td>25</td>
        <td>東京</td>
      </tr>
      <tr>
        <td>佐藤花子</td>
        <td>30</td>
        <td>大阪</td>
      </tr>
    </tbody>
  </table>
</body>
</html>`,
    css: `body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
  background-color: #f5f5f5;
}

h1 {
  color: #333;
  margin-bottom: 20px;
}

table {
  width: 100%;
  border-collapse: collapse;
  background-color: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

th, td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

th {
  background-color: #007bff;
  color: white;
  font-weight: bold;
}

tr:hover {
  background-color: #f5f5f5;
}`,
    js: `// テーブル操作のサンプル
console.log('テーブルページが読み込まれました');`,
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
  const [viewMode, setViewMode] = useState<'split' | 'fullscreen'>('split')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const colorStyles = useColorStyles()
  const { showToast } = useToast()

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

  // タグ挿入
  const insertSnippet = (snippetKey: keyof typeof TAG_SNIPPETS) => {
    const snippet = TAG_SNIPPETS[snippetKey]
    setHtml((prev) => prev + '\n' + snippet)
    setHasUnsavedChanges(true)
    showToast(`${snippetKey}を挿入しました`, 'success', TOAST_DURATIONS.SHORT)
  }

  return (
    <Container maxW="100%" p={4} h="calc(100vh - 80px)">
      <Flex direction="column" h="100%">
        {/* ヘッダー */}
        <Flex
          mb={4}
          gap={2}
          flexWrap="wrap"
          alignItems="center"
          justifyContent="space-between"
        >
          <Heading size="lg" display="flex" alignItems="center" gap={2}>
            <Code size={24} />
            簡易Webエディタ
          </Heading>
          
          <Flex gap={2} flexWrap="wrap">
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
              <option value="">サンプル読込</option>
              <option value="basic">基本サンプル</option>
              <option value="table">テーブルサンプル</option>
            </Box>

            {/* タグ挿入 */}
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
                  insertSnippet(e.target.value as keyof typeof TAG_SNIPPETS)
                  e.target.value = ''
                }
              }}
              _hover={{
                borderColor: colorStyles.accent.blue.linkColor,
              }}
            >
              <option value="">タグ挿入</option>
              <option value="table">テーブル</option>
              <option value="div">Divコンテナ</option>
              <option value="form">フォーム</option>
              <option value="list">リスト</option>
              <option value="link">リンク</option>
              <option value="image">画像</option>
            </Box>

            {/* ファイル操作 */}
            <Button
              size="sm"
              leftIcon={<Upload size={16} />}
              onClick={() => fileInputRef.current?.click()}
              colorScheme="green"
            >
              読込
            </Button>
            <Input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={loadFromFile}
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
                if (e.target.value === 'json') {
                  saveToFile()
                } else if (e.target.value === 'html') {
                  saveAsHtml()
                }
                e.target.value = ''
              }}
              _hover={{
                borderColor: colorStyles.accent.blue.linkColor,
              }}
            >
              <option value="">保存</option>
              <option value="json">プロジェクト (.json)</option>
              <option value="html">HTML (.html)</option>
            </Box>

            {/* 表示切替 */}
            <Button
              size="sm"
              leftIcon={viewMode === 'split' ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
              onClick={() => setViewMode(viewMode === 'split' ? 'fullscreen' : 'split')}
              colorScheme="teal"
            >
              {viewMode === 'split' ? '全画面' : '分割'}
            </Button>
          </Flex>
        </Flex>

        {/* メインエリア */}
        <Flex flex="1" gap={4} overflow="hidden">
          {/* エディタエリア */}
          {viewMode === 'split' && (
            <Flex
              direction="column"
              flex="1"
              gap={3}
              overflow="auto"
              minW="300px"
            >
              {/* HTML */}
              <Box>
                <Text
                  fontSize="sm"
                  fontWeight="bold"
                  mb={1}
                  color={colorStyles.text.primary}
                >
                  HTML
                </Text>
                <Textarea
                  value={html}
                  onChange={(e) => handleCodeChange('html', e.target.value)}
                  fontFamily="monospace"
                  fontSize="sm"
                  minH="200px"
                  bg={colorStyles.bg.primary}
                  borderColor={colorStyles.border.default}
                  _focus={{
                    borderColor: colorStyles.accent.blue.linkColor,
                    boxShadow: `0 0 0 1px ${colorStyles.accent.blue.linkColor}`,
                  }}
                />
              </Box>

              {/* CSS */}
              <Box>
                <Text
                  fontSize="sm"
                  fontWeight="bold"
                  mb={1}
                  color={colorStyles.text.primary}
                >
                  CSS
                </Text>
                <Textarea
                  value={css}
                  onChange={(e) => handleCodeChange('css', e.target.value)}
                  fontFamily="monospace"
                  fontSize="sm"
                  minH="150px"
                  bg={colorStyles.bg.primary}
                  borderColor={colorStyles.border.default}
                  _focus={{
                    borderColor: colorStyles.accent.blue.linkColor,
                    boxShadow: `0 0 0 1px ${colorStyles.accent.blue.linkColor}`,
                  }}
                />
              </Box>

              {/* JavaScript */}
              <Box>
                <Text
                  fontSize="sm"
                  fontWeight="bold"
                  mb={1}
                  color={colorStyles.text.primary}
                >
                  JavaScript
                </Text>
                <Textarea
                  value={js}
                  onChange={(e) => handleCodeChange('js', e.target.value)}
                  fontFamily="monospace"
                  fontSize="sm"
                  minH="150px"
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
          <Box
            flex={viewMode === 'fullscreen' ? '1' : '1'}
            border="1px solid"
            borderColor={colorStyles.border.default}
            borderRadius="md"
            overflow="hidden"
            bg="white"
            minW={viewMode === 'fullscreen' ? 'auto' : '300px'}
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
        </Flex>
      </Flex>
    </Container>
  )
}
