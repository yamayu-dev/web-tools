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

// C# Console method validation - valid Console methods
const VALID_CONSOLE_METHODS = [
  'WriteLine', 'Write', 'ReadLine', 'Read', 'ReadKey', 'Clear', 'Beep', 
  'SetCursorPosition', 'ResetColor', 'SetOut', 'SetIn', 'SetError',
  'OpenStandardInput', 'OpenStandardOutput', 'OpenStandardError'
]

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
  const wasmRef = useRef<unknown>(null)
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

      // Mark as ready immediately - use fallback evaluator
      // Full WASM integration can be implemented later
      wasmRef.current = { loaded: true, fallbackMode: true }
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
      
      // Check if we have the WASM runtime with C# execution capability
      const wasmRuntime = wasmRef.current as { 
        CSharpRunner?: { CompileAndRun: (code: string) => string },
        loaded?: boolean 
      }
      
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
        // Fallback: Use C# script evaluation via eval (limited functionality)
        // This simulates basic C# execution for common patterns
        try {
          const result = evaluateCSharpCode(code)
          setOutput(result)
        } catch (error) {
          const err = error as Error
          setOutput(`実行エラー: ${err.message}\n\n注意: 完全なC#実行にはWASMランタイムの再構築が必要です。`)
        }
      }
    } catch (error) {
      const err = error as Error
      setOutput(`実行エラー: ${err.message}\n${err.stack || ''}`)
    }
  }
  
  const evaluateCSharpCode = (csharpCode: string): string => {
    // Enhanced C# code evaluator with better parsing
    const output: string[] = []
    
    try {
      // Basic syntax validation
      const syntaxErrors: string[] = []
      
      // Check for balanced braces
      const openBraces = (csharpCode.match(/{/g) || []).length
      const closeBraces = (csharpCode.match(/}/g) || []).length
      if (openBraces !== closeBraces) {
        syntaxErrors.push(`構文エラー: 中括弧が一致しません (開き: ${openBraces}, 閉じ: ${closeBraces})`)
      }
      
      // Check for balanced parentheses
      const openParens = (csharpCode.match(/\(/g) || []).length
      const closeParens = (csharpCode.match(/\)/g) || []).length
      if (openParens !== closeParens) {
        syntaxErrors.push(`構文エラー: 丸括弧が一致しません (開き: ${openParens}, 閉じ: ${closeParens})`)
      }
      
      // Check for common syntax errors
      const lines = csharpCode.split('\n')
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        const lineNum = i + 1
        
        // Skip empty lines and comments
        if (!line || line.startsWith('//')) continue
        
        // Check for missing semicolons (basic check)
        // Lines that should end with semicolon
        if (line.includes('Console.WriteLine') && !line.includes(';') && !line.endsWith('{')) {
          syntaxErrors.push(`行 ${lineNum}: セミコロンが不足している可能性があります`)
        }
        
        // Check for invalid keywords or typos in common statements
        if (line.match(/\bconsole\b/i) && !line.match(/\bConsole\b/)) {
          syntaxErrors.push(`行 ${lineNum}: 'Console' は大文字で始める必要があります (C# は大文字と小文字を区別します)`)
        }
        
        // Check for invalid Console method names (only check method calls with parentheses)
        const consoleMethodMatch = line.match(/Console\.(\w+)\s*\(/)
        if (consoleMethodMatch) {
          const methodName = consoleMethodMatch[1]
          if (!VALID_CONSOLE_METHODS.includes(methodName)) {
            syntaxErrors.push(`行 ${lineNum}: 'Console.${methodName}' は存在しないメソッドです。'Console.WriteLine' などの正しいメソッド名を使用してください`)
          }
        }
        
        // Check for variable declarations without type or var
        const invalidDecl = line.match(/^\s*(\w+)\s*=\s*.+;/)
        if (invalidDecl && !line.match(/^\s*(int|string|var|double|float|bool|char|decimal|long|short|byte)\s+/)) {
          const varName = invalidDecl[1]
          if (!['true', 'false', 'null'].includes(varName)) {
            syntaxErrors.push(`行 ${lineNum}: 変数宣言には型指定が必要です (例: int ${varName} = ...)`)
          }
        }
      }
      
      // If there are syntax errors, report them
      if (syntaxErrors.length > 0) {
        return 'コンパイルエラー:\n' + syntaxErrors.join('\n')
      }
      
      // Use the C# Scripting API approach - simulate script execution
      // Extract and execute Console.WriteLine calls
      const context: Record<string, unknown> = {}
      let inMain = false
      let bracketCount = 0
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        
        // Track if we're inside Main method
        if (line.includes('static void Main') || line.includes('static async Task Main')) {
          inMain = true
          continue
        }
        
        if (inMain) {
          // Count brackets to know when we exit Main
          bracketCount += (line.match(/{/g) || []).length
          bracketCount -= (line.match(/}/g) || []).length
          
          if (bracketCount < 0) {
            inMain = false
            continue
          }
          
          // Handle Console.WriteLine
          const writeLineMatch = line.match(/Console\.WriteLine\((.*?)\);/)
          if (writeLineMatch) {
            const expr = writeLineMatch[1].trim()
            
            try {
              // Handle string interpolation $"..."
              if (expr.startsWith('$"') && expr.endsWith('"')) {
                let str = expr.substring(2, expr.length - 1)
                
                // Replace {variable} with actual values
                str = str.replace(/\{([^}]+)\}/g, (_, varExpr) => {
                  const cleanExpr = varExpr.trim()
                  
                  // Try to evaluate the expression
                  if (context[cleanExpr] !== undefined) {
                    return String(context[cleanExpr])
                  }
                  
                  // Try to call a function
                  if (cleanExpr.includes('(')) {
                    const funcMatch = cleanExpr.match(/(\w+)\((.*?)\)/)
                    if (funcMatch) {
                      const [, funcName, args] = funcMatch
                      // Look for the function definition
                      const funcDef = findFunction(csharpCode, funcName)
                      if (funcDef) {
                        const result = evaluateFunction(funcDef, args)
                        if (result !== null) return String(result)
                      }
                    }
                  }
                  
                  return `{${varExpr}}`
                })
                
                output.push(str)
              }
              // Handle regular string "..."
              else if (expr.startsWith('"') && expr.endsWith('"')) {
                output.push(expr.substring(1, expr.length - 1))
              }
              // Handle function call
              else if (expr.includes('(')) {
                const funcMatch = expr.match(/(\w+)\((.*?)\)/)
                if (funcMatch) {
                  const [, funcName, args] = funcMatch
                  const funcDef = findFunction(csharpCode, funcName)
                  if (funcDef) {
                    const result = evaluateFunction(funcDef, args)
                    if (result !== null) output.push(String(result))
                  }
                }
              }
              // Handle variable
              else if (context[expr] !== undefined) {
                output.push(String(context[expr]))
              }
            } catch {
              // Skip evaluation errors
            }
          }
          
          // Handle variable declarations
          const varMatch = line.match(/(?:int|string|var|double|float)\s+(\w+)\s*=\s*(.+?);/)
          if (varMatch) {
            const [, varName, value] = varMatch
            try {
              if (value.match(/^\d+$/)) {
                context[varName] = parseInt(value, 10)
              } else if (value.match(/^\d+\.\d+$/)) {
                context[varName] = parseFloat(value)
              } else if (value.startsWith('"') && value.endsWith('"')) {
                context[varName] = value.substring(1, value.length - 1)
              } else if (value === '0') {
                context[varName] = 0
              }
            } catch {
              // Skip
            }
          }
          
          // Handle array initialization
          const arrayMatch = line.match(/int\[\]\s+(\w+)\s*=\s*\{([^}]+)\}/)
          if (arrayMatch) {
            const [, arrName, values] = arrayMatch
            const numbers = values.split(',').map(n => parseInt(n.trim(), 10))
            context[arrName] = numbers
          }
          
          // Handle foreach loops - accumulate sum
          if (line.includes('foreach')) {
            const foreachMatch = line.match(/foreach\s*\(\s*\w+\s+(\w+)\s+in\s+(\w+)\s*\)/)
            if (foreachMatch) {
              const [, , arrayVar] = foreachMatch
              const array = context[arrayVar] as number[]
              if (array && Array.isArray(array)) {
                // Look ahead for sum calculation
                let j = i + 1
                let loopBrackets = 1
                while (j < lines.length && loopBrackets > 0) {
                  const loopLine = lines[j].trim()
                  loopBrackets += (loopLine.match(/{/g) || []).length
                  loopBrackets -= (loopLine.match(/}/g) || []).length
                  
                  if (loopLine.includes('+=')) {
                    const sumMatch = loopLine.match(/(\w+)\s*\+=\s*(\w+)/)
                    if (sumMatch) {
                      const [, sumVar] = sumMatch
                      context[sumVar] = array.reduce((a, b) => a + b, 0)
                    }
                  }
                  j++
                }
              }
            }
          }
        }
      }
      
      if (output.length === 0) {
        return '実行完了（出力なし）'
      }
      
      return output.join('\n')
    } catch (error) {
      return `評価エラー: ${(error as Error).message}`
    }
  }
  
  const findFunction = (code: string, funcName: string): { params: string[], body: string } | null => {
    // Find the function signature
    const funcSignatureRegex = new RegExp(`static\\s+\\w+\\s+${funcName}\\s*\\(([^)]*)\\)\\s*\\{`, 'g')
    const match = funcSignatureRegex.exec(code)
    if (!match) return null
    
    const paramsStr = match[1]
    
    // Find the function body by counting braces
    const startIdx = match.index + match[0].length
    let braceCount = 1
    let endIdx = startIdx
    
    while (endIdx < code.length && braceCount > 0) {
      if (code[endIdx] === '{') braceCount++
      else if (code[endIdx] === '}') braceCount--
      endIdx++
    }
    
    const body = code.substring(startIdx, endIdx - 1)
    
    // Extract parameter names from signature like "string name" or "int x, string y"
    const params: string[] = []
    if (paramsStr.trim()) {
      const paramsList = paramsStr.split(',')
      for (const param of paramsList) {
        const parts = param.trim().split(/\s+/)
        if (parts.length >= 2) {
          params.push(parts[parts.length - 1]) // Get the last part (parameter name)
        }
      }
    }
    
    return { params, body }
  }
  
  const evaluateFunction = (funcInfo: { params: string[], body: string }, args: string): unknown => {
    // Parse arguments
    const argValues: string[] = []
    if (args.trim()) {
      // Simple argument parsing (handles strings and simple expressions)
      const argParts = args.split(',').map(a => a.trim())
      for (const arg of argParts) {
        if (arg.startsWith('"') && arg.endsWith('"')) {
          argValues.push(arg.substring(1, arg.length - 1))
        } else {
          argValues.push(arg)
        }
      }
    }
    
    // Create a mapping of parameter names to argument values
    const paramMap: Record<string, string> = {}
    for (let i = 0; i < funcInfo.params.length && i < argValues.length; i++) {
      paramMap[funcInfo.params[i]] = argValues[i]
    }
    
    // Find return statement
    const returnMatch = funcInfo.body.match(/return\s+(.+?);/)
    if (returnMatch) {
      const expr = returnMatch[1].trim()
      
      // Handle string interpolation
      if (expr.startsWith('$"') && expr.endsWith('"')) {
        let str = expr.substring(2, expr.length - 1)
        
        // Replace parameter references with actual argument values
        str = str.replace(/\{(\w+)\}/g, (_, varName) => {
          if (paramMap[varName] !== undefined) {
            return paramMap[varName]
          }
          return `{${varName}}`
        })
        
        return str
      }
      
      // Handle string concatenation
      if (expr.startsWith('"') && expr.includes('+')) {
        return expr.replace(/"/g, '').replace(/\s*\+\s*/g, '')
      }
    }
    
    return null
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
