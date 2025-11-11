/**
 * PDF Export Strategy Manager
 * PDF出力方法の管理とファクトリー
 */

import type { IPdfExportStrategy, PdfExportMethod } from './types'
import { OverlayPdfExportStrategy } from './overlayStrategy'
import { OffscreenPdfExportStrategy } from './offscreenStrategy'
import { JspdfDirectStrategy } from './jspdfDirectStrategy'

export class PdfExportStrategyManager {
  private strategies: Map<PdfExportMethod, IPdfExportStrategy> = new Map()

  constructor() {
    // すべてのストラテジーを登録
    this.strategies.set('overlay', new OverlayPdfExportStrategy())
    this.strategies.set('offscreen', new OffscreenPdfExportStrategy())
    this.strategies.set('jspdf-direct', new JspdfDirectStrategy())
  }

  /**
   * 指定された方法のストラテジーを取得
   */
  getStrategy(method: PdfExportMethod): IPdfExportStrategy | undefined {
    return this.strategies.get(method)
  }

  /**
   * すべての利用可能なストラテジーを取得
   */
  getAllStrategies(): Array<{ method: PdfExportMethod; strategy: IPdfExportStrategy }> {
    return Array.from(this.strategies.entries()).map(([method, strategy]) => ({
      method,
      strategy
    }))
  }

  /**
   * ストラテジーを追加または置き換え（拡張性のため）
   */
  registerStrategy(method: PdfExportMethod, strategy: IPdfExportStrategy): void {
    this.strategies.set(method, strategy)
  }

  /**
   * ストラテジーを削除
   */
  unregisterStrategy(method: PdfExportMethod): boolean {
    return this.strategies.delete(method)
  }
}

// シングルトンインスタンス
export const pdfExportManager = new PdfExportStrategyManager()
