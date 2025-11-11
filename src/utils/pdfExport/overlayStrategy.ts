/**
 * Overlay PDF Export Strategy
 * オーバーレイ方式：画面上でクローンを作成し、オーバーレイで隠してPDF生成
 */

import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import type { IPdfExportStrategy, PdfExportOptions, PdfExportResult } from './types'

export class OverlayPdfExportStrategy implements IPdfExportStrategy {
  name = 'overlay'
  description = 'オーバーレイ方式（現在の実装）'

  async export(options: PdfExportOptions): Promise<PdfExportResult> {
    const { previewElement, colorMode, isMobile, onProgress } = options

    let clonedElement: HTMLElement | null = null
    let overlayElement: HTMLElement | null = null

    try {
      onProgress?.('PDF生成中...')

      // 画面を一時的に覆うオーバーレイを作成
      overlayElement = document.createElement('div')
      overlayElement.style.position = 'fixed'
      overlayElement.style.top = '0'
      overlayElement.style.left = '0'
      overlayElement.style.width = '100vw'
      overlayElement.style.height = '100vh'
      overlayElement.style.backgroundColor = colorMode === 'dark' ? '#0d1117' : '#ffffff'
      overlayElement.style.zIndex = '9999'
      overlayElement.style.display = 'flex'
      overlayElement.style.alignItems = 'center'
      overlayElement.style.justifyContent = 'center'
      overlayElement.style.color = colorMode === 'dark' ? '#e6edf3' : '#24292f'
      overlayElement.style.fontSize = '18px'
      overlayElement.style.fontWeight = 'bold'
      overlayElement.textContent = 'PDF生成中...'
      document.body.appendChild(overlayElement)

      await new Promise(resolve => setTimeout(resolve, 100))

      // プレビュー要素のクローンを作成
      clonedElement = previewElement.cloneNode(true) as HTMLElement
      clonedElement.style.position = 'fixed'
      clonedElement.style.left = '0'
      clonedElement.style.top = '0'
      clonedElement.style.zIndex = '10000'
      clonedElement.style.pointerEvents = 'none'

      if (isMobile) {
        clonedElement.style.width = '800px'
        clonedElement.style.maxWidth = '800px'
      }

      document.body.appendChild(clonedElement)

      // ライトモードのスタイルを適用
      this.applyLightModeStyles(clonedElement)

      await new Promise(resolve => setTimeout(resolve, 100))

      // html2canvasでキャンバスに変換
      const canvas = await html2canvas(clonedElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        windowWidth: isMobile ? 800 : undefined,
        width: isMobile ? 800 : undefined,
        backgroundColor: '#ffffff'
      })

      // クリーンアップ
      if (clonedElement?.parentNode) {
        document.body.removeChild(clonedElement)
        clonedElement = null
      }
      if (overlayElement?.parentNode) {
        document.body.removeChild(overlayElement)
        overlayElement = null
      }

      // PDFを生成
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      const pdfWidth = 210
      const pdfHeight = 297
      const margin = 10
      const contentWidth = pdfWidth - (margin * 2)
      const imgWidth = contentWidth
      const imgHeight = (canvas.height * contentWidth) / canvas.width
      let heightLeft = imgHeight
      let position = margin

      pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight)
      heightLeft -= (pdfHeight - margin * 2)

      while (heightLeft > 0) {
        position = -(imgHeight - heightLeft) + margin
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight)
        heightLeft -= (pdfHeight - margin * 2)
      }

      pdf.save('document.pdf')
      return { success: true }

    } catch (error) {
      // クリーンアップ
      if (clonedElement?.parentNode) {
        document.body.removeChild(clonedElement)
      }
      if (overlayElement?.parentNode) {
        document.body.removeChild(overlayElement)
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'PDF出力に失敗しました'
      }
    }
  }

  private applyLightModeStyles(element: HTMLElement): void {
    element.style.backgroundColor = '#ffffff'
    element.style.color = '#24292f'

    // すべてのテキスト要素
    const allElements = element.querySelectorAll('*')
    allElements.forEach((el) => {
      const htmlEl = el as HTMLElement
      const computedColor = window.getComputedStyle(htmlEl).color
      if (computedColor.includes('255, 255, 255') || computedColor.includes('230, 237, 243')) {
        htmlEl.style.color = '#24292f'
      }
    })

    // 見出し
    element.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((heading) => {
      (heading as HTMLElement).style.color = '#24292f'
    })

    // 段落
    element.querySelectorAll('p').forEach((p) => {
      (p as HTMLElement).style.color = '#24292f'
    })

    // リスト
    element.querySelectorAll('li').forEach((li) => {
      (li as HTMLElement).style.color = '#24292f'
    })

    // コードブロック
    element.querySelectorAll('pre').forEach((pre) => {
      const preEl = pre as HTMLElement
      preEl.style.backgroundColor = '#f6f8fa'
      preEl.style.borderColor = '#d0d7de'

      const code = pre.querySelector('code')
      if (code) {
        const codeEl = code as HTMLElement
        codeEl.style.color = '#24292f'

        // シンタックスハイライトの色変換
        codeEl.querySelectorAll('[class*="hljs"]').forEach((hlEl) => {
          const hlElement = hlEl as HTMLElement
          const color = window.getComputedStyle(hlElement).color
          
          if (color.includes('230, 237, 243')) hlElement.style.color = '#24292f'
          else if (color.includes('139, 148, 158')) hlElement.style.color = '#6a737d'
          else if (color.includes('255, 123, 114')) hlElement.style.color = '#d73a49'
          else if (color.includes('121, 192, 255')) hlElement.style.color = '#005cc5'
          else if (color.includes('165, 214, 255')) hlElement.style.color = '#032f62'
          else if (color.includes('210, 168, 255')) hlElement.style.color = '#6f42c1'
          else if (color.includes('255, 166, 87')) hlElement.style.color = '#e36209'
          else if (color.includes('126, 231, 135')) hlElement.style.color = '#22863a'
        })
      }
    })

    // インラインコード
    element.querySelectorAll('code').forEach((code) => {
      const codeEl = code as HTMLElement
      if (codeEl.parentElement?.tagName !== 'PRE') {
        codeEl.style.backgroundColor = 'rgba(175, 184, 193, 0.2)'
        codeEl.style.color = '#24292f'
      }
    })

    // blockquote
    element.querySelectorAll('blockquote').forEach((bq) => {
      const bqEl = bq as HTMLElement
      bqEl.style.color = '#57606a'
      bqEl.style.borderLeftColor = '#d0d7de'
    })

    // テーブル
    element.querySelectorAll('table').forEach((table) => {
      (table as HTMLElement).style.color = '#24292f'

      table.querySelectorAll('th').forEach((th) => {
        const thEl = th as HTMLElement
        thEl.style.backgroundColor = '#f6f8fa'
        thEl.style.borderColor = '#d0d7de'
        thEl.style.color = '#24292f'
      })

      table.querySelectorAll('td').forEach((td) => {
        const tdEl = td as HTMLElement
        tdEl.style.borderColor = '#d0d7de'
        tdEl.style.color = '#24292f'
      })
    })
  }
}
