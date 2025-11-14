/**
 * jsPDF Direct Rendering Strategy
 * jsPDF直接描画方式：Markdownから直接PDFを生成（Mermaid・テーブル対応）
 */

import jsPDF from 'jspdf'
import mermaid from 'mermaid'
import type { IPdfExportStrategy, PdfExportOptions, PdfExportResult } from './types'

interface TextElement {
  type: 'text' | 'heading' | 'code' | 'list-item' | 'blockquote'
  content: string
  level?: number
  language?: string
}

interface TableElement {
  type: 'table'
  headers: string[]
  rows: string[][]
}

interface MermaidElement {
  type: 'mermaid'
  code: string
  svg?: string
}

type PdfElement = TextElement | TableElement | MermaidElement

export class JspdfDirectStrategy implements IPdfExportStrategy {
  name = 'jspdf-direct'
  description = 'jsPDF直接描画（Mermaid・テーブル対応）'

  async export(options: PdfExportOptions): Promise<PdfExportResult> {
    const { markdown, onProgress } = options

    try {
      // Mermaid初期化
      mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose'
      })

      onProgress?.('Markdownを解析中...')

      // Markdownをパース
      const elements = await this.parseMarkdown(markdown)

      onProgress?.('PDF生成中（jsPDF直接描画）...')

      // PDFを作成
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      const margin = 15
      const pageWidth = 210
      const pageHeight = 297
      const contentWidth = pageWidth - (margin * 2)
      let currentY = margin

      // フォント設定（日本語対応）
      pdf.setFont('helvetica')

      for (const element of elements) {
        // ページ末尾チェック
        if (currentY > pageHeight - margin - 20) {
          pdf.addPage()
          currentY = margin
        }

        currentY = await this.renderElement(pdf, element, margin, currentY, contentWidth)
      }

      pdf.save('document.pdf')
      return { success: true }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'PDF出力に失敗しました'
      }
    }
  }

  private async parseMarkdown(markdown: string): Promise<PdfElement[]> {
    const elements: PdfElement[] = []
    const lines = markdown.split('\n')
    let i = 0
    let inCodeBlock = false
    let codeLanguage = ''
    let codeContent: string[] = []

    while (i < lines.length) {
      const line = lines[i]

      // コードブロック開始/終了
      if (line.startsWith('```')) {
        if (!inCodeBlock) {
          inCodeBlock = true
          codeLanguage = line.slice(3).trim()
          codeContent = []
        } else {
          if (codeLanguage === 'mermaid') {
            // Mermaid図として処理
            try {
              const svg = await this.renderMermaidToSvg(codeContent.join('\n'))
              console.log('Mermaid SVG rendered successfully, length:', svg.length)
              elements.push({
                type: 'mermaid',
                code: codeContent.join('\n'),
                svg
              })
            } catch (error) {
              // Mermaidレンダリング失敗時はコードとして表示
              console.error('Mermaid rendering failed:', error)
              elements.push({
                type: 'code',
                content: codeContent.join('\n'),
                language: 'mermaid'
              })
            }
          } else {
            elements.push({
              type: 'code',
              content: codeContent.join('\n'),
              language: codeLanguage
            })
          }
          inCodeBlock = false
          codeLanguage = ''
          codeContent = []
        }
        i++
        continue
      }

      if (inCodeBlock) {
        codeContent.push(line)
        i++
        continue
      }

      // 見出し
      if (line.startsWith('#')) {
        const match = line.match(/^(#{1,6})\s+(.+)/)
        if (match) {
          elements.push({
            type: 'heading',
            content: match[2],
            level: match[1].length
          })
          i++
          continue
        }
      }

      // リスト
      if (line.match(/^\s*[-*+]\s+(.+)/)) {
        const match = line.match(/^\s*[-*+]\s+(.+)/)
        if (match) {
          elements.push({
            type: 'list-item',
            content: match[1]
          })
          i++
          continue
        }
      }

      // blockquote
      if (line.startsWith('>')) {
        elements.push({
          type: 'blockquote',
          content: line.slice(1).trim()
        })
        i++
        continue
      }

      // テーブル
      if (line.includes('|')) {
        const tableLines: string[] = [line]
        i++
        // テーブル行を収集
        while (i < lines.length && lines[i].includes('|')) {
          tableLines.push(lines[i])
          i++
        }

        if (tableLines.length >= 2) {
          const headers = tableLines[0].split('|').map(h => h.trim()).filter(h => h)
          const rows = tableLines.slice(2).map(row => 
            row.split('|').map(cell => cell.trim()).filter(cell => cell)
          )
          elements.push({
            type: 'table',
            headers,
            rows
          })
        }
        continue
      }

      // 通常のテキスト
      if (line.trim()) {
        elements.push({
          type: 'text',
          content: line
        })
      }

      i++
    }

    return elements
  }

  private async renderMermaidToSvg(code: string): Promise<string> {
    const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`
    const { svg } = await mermaid.render(id, code)
    return svg
  }

  private async renderElement(
    pdf: jsPDF,
    element: PdfElement,
    margin: number,
    currentY: number,
    contentWidth: number
  ): Promise<number> {
    let y = currentY

    if (element.type === 'heading') {
      const fontSize = element.level ? (24 - (element.level - 1) * 3) : 16
      pdf.setFontSize(fontSize)
      pdf.setFont('helvetica', 'bold')
      pdf.text(element.content, margin, y)
      y += fontSize / 2 + 5
      pdf.setFont('helvetica', 'normal')
    } else if (element.type === 'text') {
      pdf.setFontSize(11)
      const lines = pdf.splitTextToSize(element.content, contentWidth)
      pdf.text(lines, margin, y)
      y += lines.length * 5 + 3
    } else if (element.type === 'code') {
      pdf.setFontSize(9)
      pdf.setFont('courier')
      pdf.setFillColor(246, 248, 250) // #f6f8fa GitHub風の背景色
      pdf.setDrawColor(208, 215, 222) // #d0d7de 枠線色
      
      const lines = element.content.split('\n')
      const lineHeight = 4
      const padding = 3
      const boxHeight = lines.length * lineHeight + padding * 2

      // 背景ボックスと枠線
      pdf.rect(margin, y - padding, contentWidth, boxHeight, 'FD')
      
      // C#のキーワード（基本的なもののみ）
      const keywords = ['public', 'private', 'protected', 'internal', 'static', 'void', 'string', 'int', 'bool', 'var', 'class', 'return', 'if', 'else', 'for', 'while', 'new', 'this']
      
      lines.forEach((line, idx) => {
        const yPos = y + idx * lineHeight + 2
        let xPos = margin + 2
        
        // 簡易的なトークン分割（スペースと記号で分割）
        const tokens = line.split(/(\s+|[(){};,=])/)
        
        tokens.forEach(token => {
          if (!token) return
          
          // キーワードの場合は青色
          if (keywords.includes(token)) {
            pdf.setTextColor(0, 92, 197) // #005cc5 キーワード色
          }
          // 文字列リテラルの場合（簡易判定）
          else if (token.startsWith('"') || token.startsWith("'")) {
            pdf.setTextColor(3, 47, 98) // #032f62 文字列色
          }
          // 数字の場合
          else if (/^\d+$/.test(token)) {
            pdf.setTextColor(0, 92, 197) // #005cc5 数字色
          }
          // コメントの場合
          else if (token.startsWith('//') || token.startsWith('/*')) {
            pdf.setTextColor(106, 115, 125) // #6a737d コメント色
          }
          // 通常のテキスト
          else {
            pdf.setTextColor(36, 41, 46) // #24292e 通常の文字色
          }
          
          pdf.text(token, xPos, yPos)
          xPos += pdf.getTextWidth(token)
        })
      })

      y += boxHeight + 5
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(0, 0, 0)
    } else if (element.type === 'list-item') {
      pdf.setFontSize(11)
      pdf.text('• ' + element.content, margin + 5, y)
      y += 6
    } else if (element.type === 'blockquote') {
      pdf.setFontSize(11)
      pdf.setTextColor(100, 100, 100)
      pdf.setDrawColor(200, 200, 200)
      pdf.line(margin, y - 2, margin, y + 4)
      pdf.text(element.content, margin + 5, y)
      y += 6
      pdf.setTextColor(0, 0, 0)
    } else if (element.type === 'table') {
      y = this.renderTable(pdf, element, margin, y, contentWidth)
    } else if (element.type === 'mermaid' && element.svg) {
      // Mermaid図をSVGから画像に変換して埋め込む
      try {
        console.log('Processing Mermaid diagram, SVG length:', element.svg.length)
        
        // SVGのサイズを取得
        const parser = new DOMParser()
        const svgDoc = parser.parseFromString(element.svg, 'image/svg+xml')
        const svgElement = svgDoc.querySelector('svg')
        
        if (!svgElement) {
          throw new Error('SVG element not found')
        }

        // SVGのviewBox属性からサイズを取得
        const viewBox = svgElement.getAttribute('viewBox')
        let svgWidth = 800
        let svgHeight = 600
        
        if (viewBox) {
          const [, , w, h] = viewBox.split(' ').map(Number)
          svgWidth = w
          svgHeight = h
        } else {
          svgWidth = parseFloat(svgElement.getAttribute('width') || '800')
          svgHeight = parseFloat(svgElement.getAttribute('height') || '600')
        }

        console.log('Mermaid SVG dimensions:', { svgWidth, svgHeight })

        // 明示的にサイズを設定
        svgElement.setAttribute('width', String(svgWidth))
        svgElement.setAttribute('height', String(svgHeight))
        
        // SVGをData URLに変換
        const svgString = new XMLSerializer().serializeToString(svgElement)
        const svgDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString)
        
        // 一時的なimgタグでSVGを読み込み、Canvasに描画
        const img = new Image()
        
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Mermaid image loading timeout'))
          }, 5000) // 5秒タイムアウト
          
          img.onload = () => {
            clearTimeout(timeout)
            console.log('Mermaid image loaded successfully')
            resolve()
          }
          img.onerror = (e) => {
            clearTimeout(timeout)
            console.error('Mermaid image loading error:', e)
            reject(new Error('Mermaid image loading error'))
          }
          img.src = svgDataUrl
        })
        
        // Canvasに描画（高解像度で描画）
        const scale = 3 // 解像度を上げる（2→3）
        const canvas = document.createElement('canvas')
        canvas.width = svgWidth * scale
        canvas.height = svgHeight * scale
        const ctx = canvas.getContext('2d')!
        ctx.scale(scale, scale)
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, svgWidth, svgHeight)
        ctx.drawImage(img, 0, 0, svgWidth, svgHeight)
        
        // PDFに追加（サイズを適切にスケーリング）
        const imgData = canvas.toDataURL('image/png')
        
        // 最大幅をcontentWidthに、最大高さを150mmに制限
        const maxHeight = 150 // mm
        let pdfImgWidth = contentWidth
        let pdfImgHeight = (svgHeight * contentWidth) / svgWidth
        
        // 高さが大きすぎる場合は縮小
        if (pdfImgHeight > maxHeight) {
          pdfImgHeight = maxHeight
          pdfImgWidth = (svgWidth * maxHeight) / svgHeight
        }
        
        console.log('Mermaid PDF dimensions (scaled, high-res):', { pdfImgWidth, pdfImgHeight, canvasScale: scale })
        
        // ページに収まるかチェック
        const pageHeight = 297
        const availableHeight = pageHeight - y - margin
        
        if (pdfImgHeight > availableHeight) {
          pdf.addPage()
          y = margin
        }
        
        pdf.addImage(imgData, 'PNG', margin, y, pdfImgWidth, pdfImgHeight)
        y += pdfImgHeight + 5
        
      } catch (error) {
        // 失敗時はプレースホルダー表示
        console.error('Mermaid rendering error:', error)
        pdf.setFontSize(10)
        pdf.setTextColor(100, 100, 100)
        pdf.text('[Mermaid図: レンダリングエラー]', margin, y)
        y += 10
        pdf.setTextColor(0, 0, 0)
      }
    }

    return y
  }

  private renderTable(
    pdf: jsPDF,
    table: TableElement,
    margin: number,
    currentY: number,
    contentWidth: number
  ): number {
    let y = currentY
    const colWidth = contentWidth / table.headers.length
    const rowHeight = 7

    // ヘッダー行（GitHub風の濃いグレー背景）
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(10)

    table.headers.forEach((header, idx) => {
      const x = margin + idx * colWidth
      // 各セルごとに色を明示的に設定
      pdf.setFillColor(233, 236, 239) // #e9ecef 背景色
      pdf.setDrawColor(208, 215, 222) // #d0d7de 枠線色
      pdf.setTextColor(36, 41, 46) // #24292e 文字色
      pdf.rect(x, y, colWidth, rowHeight, 'FD') // FD = Fill and Draw
      pdf.text(header.substring(0, 20), x + 2, y + 5)
    })
    y += rowHeight

    // データ行（白背景）
    pdf.setFont('helvetica', 'normal')

    table.rows.forEach(row => {
      row.forEach((cell, idx) => {
        const x = margin + idx * colWidth
        // 各セルごとに色を明示的に設定（ヘッダーと同じように）
        pdf.setFillColor(255, 255, 255) // 白背景
        pdf.setDrawColor(208, 215, 222) // 枠線色
        pdf.setTextColor(36, 41, 46) // 文字色（黒）
        pdf.rect(x, y, colWidth, rowHeight, 'FD') // FD = Fill and Draw (白で塗りつぶし)
        pdf.text(cell.substring(0, 20), x + 2, y + 5)
      })
      y += rowHeight
    })

    return y + 5
  }
}
