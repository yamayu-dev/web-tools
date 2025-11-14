/**
 * PDF Export Module
 * PDF出力機能のエントリーポイント
 */

export * from './types'
export * from './manager'
export { OffscreenPdfExportStrategy } from './offscreenStrategy'
export { JspdfDirectStrategy } from './jspdfDirectStrategy'

// デフォルトのマネージャーインスタンスをエクスポート
import { PdfExportStrategyManager } from './manager'
export const pdfExportManager = new PdfExportStrategyManager()
