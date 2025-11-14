/**
 * PDF Export Strategy Types
 * 各PDF出力方法の共通インターフェースと型定義
 */

export type PdfExportMethod = 'offscreen' | 'jspdf-direct'

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
  'offscreen': {
    label: 'オフスクリーン方式（推奨）',
    description: 'PC・Mobile共通で安定した出力。プレビュー相当のPDFを生成'
  },
  'jspdf-direct': {
    label: 'jsPDF直接描画',
    description: 'Markdownから直接PDFを生成。テーブル・Mermaid対応（試験的）'
  }
}
