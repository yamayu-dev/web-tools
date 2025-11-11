/**
 * PDF Export Strategy Types
 * 各PDF出力方法の共通インターフェースと型定義
 */

export type PdfExportMethod = 'overlay' | 'offscreen' | 'jspdf-direct'

export interface PdfExportOptions {
  markdown: string
  previewElement: HTMLElement
  colorMode: 'light' | 'dark'
  isMobile: boolean
  onProgress?: (message: string) => void
}

export interface PdfExportResult {
  success: boolean
  error?: string
}

export interface IPdfExportStrategy {
  name: string
  description: string
  export(options: PdfExportOptions): Promise<PdfExportResult>
}

export const PDF_EXPORT_METHODS: Record<PdfExportMethod, { label: string; description: string }> = {
  'overlay': {
    label: 'オーバーレイ方式',
    description: '現在の実装。画面にオーバーレイを表示して変化を隠す'
  },
  'offscreen': {
    label: 'オフスクリーン方式',
    description: '画面外でレンダリングして出力'
  },
  'jspdf-direct': {
    label: 'jsPDF直接描画',
    description: 'Markdownから直接PDFを生成（Mermaid・テーブル対応）'
  }
}
