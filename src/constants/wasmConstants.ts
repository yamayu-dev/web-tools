/**
 * C# WebAssembly実行環境の設定定数
 * 
 * これらの定数は以下の場所で使用されています：
 * - CodeRunner.tsx: WASM ファイルの存在確認
 * - csharp-wasm/CSharpRunner.csproj: ビルド出力先 (OutputPath)
 * - .github/workflows/build-csharp-wasm.yml: GitHub Actions でのビルド設定
 */

/** WASM関連のパス設定 */
export const WASM_CONFIG = {
  /** WASM ファイルの出力ディレクトリ (public/ からの相対パス) */
  OUTPUT_DIR: 'wasm',
  
  /** Blazor WebAssembly が生成するメインの WASM ファイル名 */
  WASM_FILENAME: 'dotnet.wasm',
  
  /** WASM バージョン情報ファイル名 */
  VERSION_FILENAME: 'version.json',
} as const

/**
 * WASM ファイルのフルパスを BASE_URL からの相対パスで取得
 * @param baseUrl - import.meta.env.BASE_URL (末尾にスラッシュを含む)
 * @returns WASM ファイルへのパス (例: '/web-tools/wasm/dotnet.wasm')
 */
export function getWasmFilePath(baseUrl: string): string {
  return `${baseUrl}${WASM_CONFIG.OUTPUT_DIR}/${WASM_CONFIG.WASM_FILENAME}`
}

/**
 * バージョン情報ファイルのパスを取得
 * @param baseUrl - import.meta.env.BASE_URL (末尾にスラッシュを含む)
 * @returns バージョン情報ファイルへのパス
 */
export function getVersionFilePath(baseUrl: string): string {
  return `${baseUrl}${WASM_CONFIG.OUTPUT_DIR}/${WASM_CONFIG.VERSION_FILENAME}`
}
