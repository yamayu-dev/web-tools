import { useState, useEffect, useRef } from 'react'
import {
  Box,
  Container,
  Heading,
  Button,
  Textarea,
  Flex,
  Text,
} from '@chakra-ui/react'
import { Play, RotateCcw, Code as CodeIcon } from 'lucide-react'
import { useToast } from '../hooks/useToast'
import { useColorStyles } from '../hooks/useColorStyles'
import { useColorMode } from '../hooks/useColorMode'
import { TOAST_DURATIONS } from '../constants/uiConstants'
import { WASM_CONFIG } from '../constants/wasmConstants'

/**
 * CodeRunner Component
 * 
 * Security Note: This component uses eval() for TypeScript execution, which is intentional
 * for a code playground/educational tool similar to paiza.io. Users should be aware they
 * are executing arbitrary code in their own browser context. For production use cases
 * requiring sandboxing, consider using Web Workers or iframe sandboxing.
 */

type Language = 'typescript' | 'python' | 'csharp'

// WASM runtime interface
interface WasmRuntime {
  runtime: unknown
  CSharpRunner: {
    CompileAndRun: (code: string) => string
  }
  loaded: boolean
}

// サンプルコード
const SAMPLE_CODE = {
  typescript: `// TypeScriptコード例
function greet(name: string): string {
  return \`Hello, \${name}!\`;
}

console.log(greet("World"));

// 簡単な計算
const numbers = [1, 2, 3, 4, 5];
const sum = numbers.reduce((a, b) => a + b, 0);
console.log(\`Sum: \${sum}\`);`,
  
  python: `# Pythonコード例
def greet(name):
    return f"Hello, {name}!"

print(greet("World"))

# 簡単な計算
numbers = [1, 2, 3, 4, 5]
total = sum(numbers)
print(f"Sum: {total}")`,
  
  csharp: `// C#コード例
using System;

class Program
{
    static void Main()
    {
        Console.WriteLine(Greet("World"));
        
        // 簡単な計算
        int[] numbers = { 1, 2, 3, 4, 5 };
        int sum = 0;
        foreach (int num in numbers)
        {
            sum += num;
        }
        Console.WriteLine($"Sum: {sum}");
    }
    
    static string Greet(string name)
    {
        return $"Hello, {name}!";
    }
}`
}

export default function CodeRunner() {
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState<Language>('typescript')
  const [output, setOutput] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [pyodideReady, setPyodideReady] = useState(false)
  const [wasmReady, setWasmReady] = useState(false)
  const pyodideRef = useRef<unknown>(null)
  const wasmRef = useRef<WasmRuntime | null>(null)
  const colorStyles = useColorStyles()
  const { colorMode } = useColorMode()
  const { showToast } = useToast()

  // Pyodideの初期化
  useEffect(() => {
    if (language === 'python' && !pyodideReady) {
      loadPyodide()
    }
  }, [language, pyodideReady])

  // 初期サンプルコードをロード
  useEffect(() => {
    setCode(SAMPLE_CODE[language])
  }, [language])

  // C# WASMランタイムの初期化
  useEffect(() => {
    if (language === 'csharp' && !wasmReady) {
      loadCSharpWasm()
    }
  }, [language, wasmReady])

  const loadPyodide = async () => {
    try {
      setOutput('Pythonランタイムを読み込み中...\n')
      // Pyodideをグローバルスコープから読み込む
      const pyodide = await (window as unknown as { loadPyodide: (config: { indexURL: string }) => Promise<unknown> }).loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/'
      })
      pyodideRef.current = pyodide
      setPyodideReady(true)
      setOutput('Pythonランタイムの準備が完了しました\n')
    } catch (error) {
      setOutput(`Pythonランタイムの読み込みに失敗しました: ${error}\n`)
    }
  }

  const runTypeScript = async () => {
    try {
      // console.logをキャプチャ
      const logs: string[] = []
      const originalLog = console.log
      const originalError = console.error
      const originalWarn = console.warn

      console.log = (...args: unknown[]) => {
        logs.push(args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' '))
        originalLog.apply(console, args)
      }

      console.error = (...args: unknown[]) => {
        logs.push('Error: ' + args.map(arg => String(arg)).join(' '))
        originalError.apply(console, args)
      }

      console.warn = (...args: unknown[]) => {
        logs.push('Warning: ' + args.map(arg => String(arg)).join(' '))
        originalWarn.apply(console, args)
      }

      try {
        // TypeScriptの型アノテーションを削除してJavaScriptとして実行
        let jsCode = code
        
        // クラス定義内のコンストラクタパラメータプロパティを実際のプロパティ代入に変換
        // この処理を最初に行う（型アノテーションが残っているうちに）
        jsCode = jsCode.replace(
          /class\s+(\w+)\s*\{([^}]*constructor\s*\(([^)]+)\)[^}]*)\}/gs,
          (match: string, className: string, classBody: string, constructorParams: string) => {
            // コンストラクタパラメータからプロパティ名を抽出
            const paramProps = constructorParams
              .split(',')
              .map((p: string) => {
                const trimmed = p.trim()
                const hasModifier = /^(public|private|protected|readonly)\s+/.test(trimmed)
                if (hasModifier) {
                  // public name: string -> name
                  const paramName = trimmed
                    .replace(/^(public|private|protected|readonly)\s+/, '')
                    .replace(/:\s*[^,=]+/, '')
                    .trim()
                  return paramName
                }
                return null
              })
              .filter((p): p is string => p !== null)
            
            if (paramProps.length === 0) {
              return match // 変更なし
            }
            
            // コンストラクタ本体にプロパティ代入を追加
            const modifiedBody = classBody.replace(
              /constructor\s*\([^)]*\)\s*\{/,
              (ctorMatch: string) => {
                const assignments = paramProps
                  .map((prop: string) => `this.${prop} = ${prop};`)
                  .join('\n    ')
                return `${ctorMatch}\n    ${assignments}`
              }
            )
            
            return `class ${className} {${modifiedBody}}`
          }
        )
        
        // クラス定義のコンストラクタパラメータから public/private/protected/readonly を削除
        jsCode = jsCode.replace(
          /constructor\s*\(\s*([^)]+)\s*\)/g,
          (match: string, params: string) => {
            // public/private/protected/readonly を削除
            const cleanParams = params
              .split(',')
              .map((p: string) => {
                return p.trim()
                  .replace(/^(public|private|protected|readonly)\s+/, '')
                  .replace(/:\s*[^,=]+/, '') // 型アノテーションを削除
                  .trim()
              })
              .join(', ')
            return `constructor(${cleanParams})`
          }
        )
        
        // 型アノテーションを削除（変数、パラメータ、戻り値）
        jsCode = jsCode.replace(/:\s*([a-zA-Z_$][\w$]*(<[^>]+>)?(\[\])?(\s*\|\s*[a-zA-Z_$][\w$]*)*)/g, '')
        
        // インターフェースと型定義を削除
        jsCode = jsCode.replace(/interface\s+\w+\s*\{[^}]*\}/g, '')
        jsCode = jsCode.replace(/type\s+\w+\s*=\s*[^;\n]+[;\n]/g, '')
        
        // as キャストを削除
        jsCode = jsCode.replace(/\s+as\s+\w+/g, '')
        
        // 非同期コードをサポートするために、async関数でラップして実行
        const wrappedCode = `
          (async () => {
            ${jsCode}
          })()
        `
        
        // evalの代わりにPromiseを返す関数として実行
        const result = eval(wrappedCode)
        
        // Promiseが返された場合は待機
        if (result instanceof Promise) {
          await result
          // 非同期処理が完全に完了するのを待つ（タイマーなどを考慮）
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
        
        setOutput(logs.length > 0 ? logs.join('\n') : '実行完了（出力なし）')
      } catch (error) {
        const err = error as Error
        setOutput(`実行エラー:\n${err.message}\n\nスタックトレース:\n${err.stack}`)
      } finally {
        // console.logを元に戻す
        console.log = originalLog
        console.error = originalError
        console.warn = originalWarn
      }
    } catch (error) {
      const err = error as Error
      setOutput(`実行エラー: ${err.message}`)
    }
  }

  const runPython = async () => {
    if (!pyodideReady || !pyodideRef.current) {
      setOutput('Pythonランタイムがまだ準備できていません')
      return
    }

    try {
      // stdoutをキャプチャ
      const pyodide = pyodideRef.current as { runPythonAsync: (code: string) => Promise<string> }
      
      // asyncio.run() を使わずに直接 await する形に変換
      let modifiedCode = code
      
      // asyncio.run(main()) パターンを検出して変換
      if (modifiedCode.includes('asyncio.run(')) {
        // asyncio.run() を削除し、直接awaitする形に変換
        modifiedCode = modifiedCode.replace(
          /asyncio\.run\(([^)]+)\)/g,
          'await $1'
        )
        // if __name__ == "__main__": ブロックを削除
        modifiedCode = modifiedCode.replace(
          /if\s+__name__\s*==\s*["']__main__["']\s*:\s*/g,
          ''
        )
      }
      
      const result = await pyodide.runPythonAsync(`
import sys
from io import StringIO
import asyncio

# stdoutをキャプチャ
old_stdout = sys.stdout
sys.stdout = StringIO()

try:
${modifiedCode.split('\n').map((line: string) => '    ' + line).join('\n')}
    output = sys.stdout.getvalue()
except Exception as e:
    import traceback
    output = f"エラー: {str(e)}\\n\\nトレースバック:\\n{traceback.format_exc()}"
finally:
    sys.stdout = old_stdout

output
      `)
      
      setOutput(result || '実行完了（出力なし）')
    } catch (error) {
      const err = error as Error
      setOutput(`実行エラー:\n${err.message}`)
    }
  }

  const loadCSharpWasm = async () => {
    try {
      setOutput('C# WebAssemblyランタイムを読み込み中...\n')
      
      // BASE_URL includes trailing slash (e.g., '/web-tools/' or '/')
      const baseUrl = import.meta.env.BASE_URL
      const wasmPath = `${baseUrl}${WASM_CONFIG.OUTPUT_DIR}/${WASM_CONFIG.WASM_FILENAME}`
      
      // Check if WASM files are available
      try {
        const response = await fetch(wasmPath)
        
        // Check if the response is actually a WASM file, not HTML from SPA routing
        if (!response.ok) {
          throw new Error('WASM files not found')
        }
        
        const contentType = response.headers.get('content-type')
        const isWasmContentType = contentType && contentType.toLowerCase().includes('application/wasm')
        if (!isWasmContentType) {
          throw new Error('WASM files not found')
        }
      } catch {
        setOutput(
          'C# WebAssemblyファイルが見つかりません。\n\n' +
          '【パス情報】\n' +
          `- BASE_URL: ${baseUrl}\n` +
          `- 読み込みパス: ${wasmPath}\n` +
          `- 配置先: public/${WASM_CONFIG.OUTPUT_DIR}/${WASM_CONFIG.WASM_FILENAME}\n\n` +
          'WASMファイルをビルドするには：\n' +
          '1. csharp-wasm.config.json のbuildVersionを更新\n' +
          '2. GitHub Actionsが自動的にビルドを実行\n' +
          '3. ビルド完了後、このページをリロード\n\n' +
          '現在はAPI版を使用してください。'
        )
        setWasmReady(false)
        return
      }

      // Load the dotnet runtime and initialize it
      const dotnetJsPath = `${baseUrl}${WASM_CONFIG.OUTPUT_DIR}/dotnet.js`
      
      // Dynamically import the dotnet runtime
      const { dotnet } = await import(/* @vite-ignore */ dotnetJsPath)
      
      // Initialize the runtime
      const runtime = await dotnet
        .withDiagnosticTracing(false)
        .withApplicationEnvironment('Production')
        .create()
      
      // Get the exported CSharpRunner class
      const exports = await runtime.getAssemblyExports('CSharpRunner')
      const csharpRunner = exports.CSharpRunner
      
      if (!csharpRunner || !csharpRunner.CompileAndRun) {
        throw new Error('CSharpRunner.CompileAndRun method not found in WASM exports')
      }
      
      // Store the runtime and runner
      wasmRef.current = { 
        runtime,
        CSharpRunner: csharpRunner,
        loaded: true
      }
      
      setWasmReady(true)
      setOutput('C# 実行環境の準備が完了しました\n')
    } catch (error) {
      setOutput(`C# 実行環境の読み込みに失敗しました: ${error}\n`)
      setWasmReady(false)
    }
  }

  const runCSharp = async () => {
    // C# execution using WASM
    await runCSharpWasm()
  }

  const runCSharpWasm = async () => {
    if (!wasmReady) {
      setOutput(`C# WebAssemblyランタイムが準備できていません。
初期化を待ってください。`)
      return
    }

    try {
      setOutput('C#コードを実行中...\n')
      
      const wasmRuntime = wasmRef.current
      
      if (wasmRuntime?.CSharpRunner?.CompileAndRun) {
        // Execute using the actual WASM runtime with Roslyn
        try {
          const result = wasmRuntime.CSharpRunner.CompileAndRun(code)
          setOutput(result || '実行完了（出力なし）')
        } catch (error) {
          const err = error as Error
          setOutput(`実行エラー: ${err.message}`)
        }
      } else {
        // WASM runtime not properly initialized
        setOutput(
          'エラー: C# WebAssemblyランタイムが正しく初期化されていません。\n\n' +
          'C#コードの実行にはWASMランタイムが必要です。\n' +
          'ページを再読み込みしてもう一度お試しください。'
        )
      }
    } catch (error) {
      const err = error as Error
      setOutput(`実行エラー: ${err.message}\n${err.stack || ''}`)
    }
  }
  

  const runCode = async () => {
    setIsRunning(true)
    setOutput('実行中...\n')

    try {
      if (language === 'typescript') {
        await runTypeScript()
      } else if (language === 'python') {
        await runPython()
      } else if (language === 'csharp') {
        await runCSharp()
      }
      showToast('コードを実行しました', 'success', TOAST_DURATIONS.SHORT)
    } catch (error) {
      const err = error as Error
      setOutput(`予期しないエラー: ${err.message}`)
      showToast('実行中にエラーが発生しました', 'error', TOAST_DURATIONS.SHORT)
    } finally {
      setIsRunning(false)
    }
  }

  const resetCode = () => {
    setCode(SAMPLE_CODE[language])
    setOutput('')
    showToast('コードをリセットしました', 'success', TOAST_DURATIONS.SHORT)
  }

  return (
    <Container maxW="100%" p={4} h="calc(100vh - 80px)">
      <Flex direction="column" h="100%">
        {/* ヘッダー */}
        <Box mb={4}>
          <Flex alignItems="center" justifyContent="space-between" mb={3}>
            <Heading size="lg" display="flex" alignItems="center" gap={2}>
              <CodeIcon size={24} />
              コード実行
            </Heading>
          </Flex>

          <Flex gap={2} flexWrap="wrap" mb={3}>
            {/* 言語選択 */}
            <select
              key={`language-${colorMode}`}
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              style={{
                fontSize: '14px',
                padding: '6px 12px',
                borderRadius: '6px',
                backgroundColor: colorStyles.bg.primary,
                color: colorStyles.text.primary,
                border: `1px solid ${colorStyles.border.default}`,
                cursor: 'pointer',
                height: '32px',
                width: '200px'
              }}
              onMouseOver={(e) => {
                (e.target as HTMLSelectElement).style.borderColor = colorStyles.accent.blue.linkColor
              }}
              onMouseOut={(e) => {
                (e.target as HTMLSelectElement).style.borderColor = colorStyles.border.default
              }}
            >
              <option value="typescript">TypeScript</option>
              <option value="python">Python</option>
              <option value="csharp">C#</option>
            </select>

            {/* 実行ボタン */}
            <Button
              leftIcon={<Play size={16} />}
              onClick={runCode}
              isLoading={isRunning}
              bg={colorStyles.accent.blue.button}
              color="white"
              _hover={{
                bg: colorStyles.accent.blue.buttonHover
              }}
            >
              実行
            </Button>

            {/* リセットボタン */}
            <Button
              leftIcon={<RotateCcw size={16} />}
              onClick={resetCode}
              bg={colorStyles.bg.primary}
              color={colorStyles.text.primary}
              borderColor={colorStyles.border.default}
              border="1px solid"
              _hover={{
                bg: colorStyles.bg.secondary
              }}
            >
              リセット
            </Button>
          </Flex>

          {language === 'python' && !pyodideReady && (
            <Box
              bg="yellow.100"
              color="yellow.800"
              p={2}
              rounded="md"
              fontSize="sm"
              mb={2}
            >
              Pythonランタイムを初期化しています...
            </Box>
          )}

          {language === 'csharp' && !wasmReady && (
            <Box
              bg="yellow.100"
              color="yellow.800"
              p={2}
              rounded="md"
              fontSize="sm"
              mb={2}
            >
              C# WebAssemblyランタイムを初期化しています...
            </Box>
          )}

          {language === 'csharp' && wasmReady && (
            <Box
              bg="green.100"
              color="green.800"
              p={2}
              rounded="md"
              fontSize="sm"
              mb={2}
            >
              C# 実行環境が準備完了 - カスタムコードを実行できます
            </Box>
          )}
        </Box>

        {/* メインエリア */}
        <Flex flex="1" gap={4} overflow="hidden" direction={{ base: 'column', md: 'row' }}>
          {/* エディタエリア */}
          <Box flex="1" minH="200px">
            <Text
              fontSize="sm"
              fontWeight="bold"
              mb={2}
              color={colorStyles.text.primary}
            >
              コードエディタ
            </Text>
            <Textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              fontFamily="monospace"
              fontSize="sm"
              h="calc(100% - 30px)"
              resize="none"
              bg={colorStyles.bg.primary}
              borderColor={colorStyles.border.default}
              _focus={{
                borderColor: colorStyles.accent.blue.linkColor,
                boxShadow: `0 0 0 1px ${colorStyles.accent.blue.linkColor}`,
              }}
            />
          </Box>

          {/* 出力エリア */}
          <Box flex="1" minH="200px">
            <Text
              fontSize="sm"
              fontWeight="bold"
              mb={2}
              color={colorStyles.text.primary}
            >
              実行結果
            </Text>
            <Box
              h="calc(100% - 30px)"
              bg={colorStyles.bg.primary}
              borderColor={colorStyles.border.default}
              border="1px solid"
              rounded="md"
              p={3}
              overflowY="auto"
              fontFamily="monospace"
              fontSize="sm"
              whiteSpace="pre-wrap"
            >
              {output || 'ここに実行結果が表示されます'}
            </Box>
          </Box>
        </Flex>
      </Flex>
    </Container>
  )
}
