/**
 * C# WebAssembly実行環境の設定定数
 * 
 * ⚠️ 重要: これらの定数は csharp-wasm.config.json の設定と一致している必要があります
 * 
 * 設定ファイルの場所:
 * - csharp-wasm.config.json: GitHub Actions ビルド時に使用される単一の真実の源
 *   - outputPath: "public/wasm" → WASM ファイルの出力先
 *   - wasmFilename: "dotnet.wasm" → メインの WASM ファイル名
 *   - versionFilename: "version.json" → バージョン情報ファイル名
 * 
 * このファイルの定数:
 * - OUTPUT_DIR: 'wasm/net8.0/wwwroot/_framework' (public/ からの相対パス、ブラウザからのアクセス用)
 * - WASM_FILENAME: 'dotnet.wasm' (Blazor WebAssembly が生成するファイル名)
 * - VERSION_FILENAME: 'version.json' (バージョン情報ファイル名)
 * 
 * 使用箇所:
 * - CodeRunner.tsx: WASM ファイルの存在確認とロード
 * - csharp-wasm/CSharpRunner.csproj: ビルド出力先 (OutputPath)
 * - .github/workflows/build-csharp-wasm.yml: GitHub Actions でのビルド・配置
 */

/** WASM関連のパス設定 */
export const WASM_CONFIG = {
  /** 
   * WASM ファイルの出力ディレクトリ (public/ からの相対パス)
   * ブラウザからのアクセス時は BASE_URL に続けてこのパスが使われる
   * 例: BASE_URL が '/web-tools/' の場合、'/web-tools/wasm/net8.0/wwwroot/_framework/' になる
   * 
   * ⚠️ csharp-wasm.config.json の outputPath "public/wasm" と対応
   */
  OUTPUT_DIR: 'wasm/net8.0/wwwroot/_framework',
  
  /** 
   * Blazor WebAssembly が生成するメインの WASM ファイル名
   * 
   * ⚠️ csharp-wasm.config.json の wasmFilename と一致させること
   */
  WASM_FILENAME: 'dotnet.native.wasm',
  
  /** 
   * WASM バージョン情報ファイル名
   * 
   * ⚠️ csharp-wasm.config.json の versionFilename と一致させること
   */
  VERSION_FILENAME: 'version.json',
} as const

/**
 * WASM ファイルのフルパスを BASE_URL からの相対パスで取得
 * @param baseUrl - import.meta.env.BASE_URL (末尾にスラッシュを含む)
 * @returns WASM ファイルへのパス (例: '/web-tools/wasm/net8.0/wwwroot/_framework/dotnet.wasm')
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
