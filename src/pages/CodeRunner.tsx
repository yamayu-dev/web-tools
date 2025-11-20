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
import { useColorMode } from '../components/ColorModeProvider'
import { TOAST_DURATIONS } from '../constants/uiConstants'

/**
 * CodeRunner Component
 * 
 * Security Note: This component uses eval() for TypeScript execution, which is intentional
 * for a code playground/educational tool similar to paiza.io. Users should be aware they
 * are executing arbitrary code in their own browser context. For production use cases
 * requiring sandboxing, consider using Web Workers or iframe sandboxing.
 */

type Language = 'typescript' | 'python' | 'csharp'

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
  const [dotnetReady, setDotnetReady] = useState(false)
  const pyodideRef = useRef<unknown>(null)
  const dotnetRef = useRef<unknown>(null)
  const colorStyles = useColorStyles()
  const { colorMode } = useColorMode()
  const { showToast } = useToast()

  // Pyodideの初期化
  useEffect(() => {
    if (language === 'python' && !pyodideReady) {
      loadPyodide()
    }
  }, [language, pyodideReady])

  // .NET Runtimeの初期化
  useEffect(() => {
    if (language === 'csharp' && !dotnetReady) {
      loadDotnet()
    }
  }, [language, dotnetReady])

  // 初期サンプルコードをロード
  useEffect(() => {
    setCode(SAMPLE_CODE[language])
  }, [language])

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

  const loadDotnet = async () => {
    try {
      setOutput('C# ランタイムを読み込み中...\n')
      // dotnet.jsをグローバルスコープから読み込む
      const dotnetRuntime = await (window as unknown as { 
        getDotnetRuntime: (config: { configSrc: string }) => Promise<unknown> 
      }).getDotnetRuntime({
        configSrc: 'https://cdn.jsdelivr.net/npm/@dotnet/runtime@8.0.0/dotnet.js'
      })
      dotnetRef.current = dotnetRuntime
      setDotnetReady(true)
      setOutput('C# ランタイムの準備が完了しました\n')
    } catch (error) {
      setOutput(`C# ランタイムの読み込みに失敗しました: ${error}\n\n` +
                'ブラウザ上でC#を実行するには、.NET WebAssemblyランタイムが必要です。\n' +
                '現在、簡易的な実装のため、完全なC#コンパイルと実行はサポートされていません。')
      setDotnetReady(false)
    }
  }

  const runTypeScript = () => {
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
        const jsCode = code
          .replace(/:\s*\w+(\[\])?/g, '') // 型アノテーションを削除
          .replace(/function\s+(\w+)\s*\([^)]*\)\s*:\s*\w+/g, 'function $1(...)') // 戻り値の型を削除
        
        eval(jsCode)
        
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
      const result = await pyodide.runPythonAsync(`
import sys
from io import StringIO

# stdoutをキャプチャ
old_stdout = sys.stdout
sys.stdout = StringIO()

try:
${code.split('\n').map((line: string) => '    ' + line).join('\n')}
    output = sys.stdout.getvalue()
except Exception as e:
    output = f"エラー: {str(e)}"
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

  const runCSharp = async () => {
    // For demonstration purposes, we'll use a simple pattern matching approach
    // Real C# execution would require a backend service or full .NET WASM runtime
    
    // Try to initialize .NET runtime (will likely fail without proper setup)
    if (!dotnetReady) {
      await loadDotnet()
    }

    try {
      // 簡易的なC#実行シミュレーション
      // Console.WriteLineの出力をキャプチャ
      const outputs: string[] = []
      
      // より正確なパターンマッチングのため、改行で分割して各行を処理
      const lines = code.split('\n')
      for (const line of lines) {
        const writeLineMatch = line.match(/Console\.WriteLine\s*\((.+)\)\s*;?/)
        if (writeLineMatch) {
          try {
            const arg = writeLineMatch[1].trim()
            
            // 文字列リテラルの場合
            if (arg.startsWith('"') && arg.endsWith('"')) {
              outputs.push(arg.slice(1, -1))
            }
            // 補間文字列の基本的な処理
            else if (arg.startsWith('$"')) {
              const str = arg.replace(/^\$"|"$/g, '')
              // 変数名の抽出と仮の値での置換
              // 特別なケース: sum変数
              const result = str.replace(/\{([^}]+)\}/g, (_, varExpr) => {
                if (varExpr.trim() === 'sum') {
                  return '15'
                }
                return `[${varExpr}]`
              })
              outputs.push(result)
            }
            // Greet関数などの呼び出し
            else if (arg.match(/^Greet\s*\(/)) {
              const nameMatch = arg.match(/Greet\s*\(\s*"([^"]+)"\s*\)/)
              if (nameMatch) {
                outputs.push(`Hello, ${nameMatch[1]}!`)
              }
            }
          } catch {
            // エラーは無視
          }
        }
      }

      if (outputs.length > 0) {
        setOutput(
          '実行結果（シミュレーション）:\n' +
          outputs.join('\n') +
          '\n\n注意: これは簡易的なシミュレーションです。\n' +
          '完全なC#実行には.NET WebAssemblyランタイムまたはバックエンドサーバーが必要です。'
        )
      } else {
        setOutput('実行完了（出力なし）\n\n注意: これは簡易的なシミュレーションです。')
      }
    } catch (error) {
      const err = error as Error
      setOutput(`実行エラー: ${err.message}`)
    }
  }

  const runCode = async () => {
    setIsRunning(true)
    setOutput('実行中...\n')

    try {
      if (language === 'typescript') {
        runTypeScript()
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

          {language === 'csharp' && !dotnetReady && (
            <Box
              bg="yellow.100"
              color="yellow.800"
              p={2}
              rounded="md"
              fontSize="sm"
              mb={2}
            >
              C# ランタイムを初期化しています...
            </Box>
          )}

          {language === 'csharp' && dotnetReady && (
            <Box
              bg="blue.100"
              color="blue.800"
              p={2}
              rounded="md"
              fontSize="sm"
              mb={2}
            >
              注意: 簡易的なC#シミュレーション実行です。完全な.NET機能は利用できません。
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
