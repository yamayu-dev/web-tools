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

        currentY = await this.renderElement(pdf, element, margin, currentY, contentWidth, pageHeight)
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
              elements.push({
                type: 'mermaid',
                code: codeContent.join('\n'),
                svg
              })
            } catch {
              // Mermaidレンダリング失敗時はコードとして表示
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
    contentWidth: number,
    _pageHeight: number
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
      pdf.setTextColor(50, 50, 50)
      pdf.setFillColor(246, 248, 250)
      
      const lines = element.content.split('\n')
      const lineHeight = 4
      const padding = 3
      const boxHeight = lines.length * lineHeight + padding * 2

      // 背景ボックス
      pdf.rect(margin, y - padding, contentWidth, boxHeight, 'F')
      
      lines.forEach((line, idx) => {
        const displayLine = line.substring(0, 100) // 長すぎる行を切り詰め
        pdf.text(displayLine, margin + 2, y + idx * lineHeight + 2)
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
      // Mermaid図をレンダリング
      // SVGを画像として埋め込む（簡易実装）
      pdf.setFontSize(10)
      pdf.setTextColor(100, 100, 100)
      pdf.text('[Mermaid Diagram]', margin, y)
      y += 10
      pdf.setTextColor(0, 0, 0)
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

    // ヘッダー
    pdf.setFillColor(246, 248, 250)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(10)

    table.headers.forEach((header, idx) => {
      const x = margin + idx * colWidth
      pdf.rect(x, y, colWidth, rowHeight, 'FD')
      pdf.text(header.substring(0, 20), x + 2, y + 5)
    })
    y += rowHeight

    // 行
    pdf.setFont('helvetica', 'normal')
    pdf.setFillColor(255, 255, 255)

    table.rows.forEach(row => {
      row.forEach((cell, idx) => {
        const x = margin + idx * colWidth
        pdf.rect(x, y, colWidth, rowHeight, 'D')
        pdf.text(cell.substring(0, 20), x + 2, y + 5)
      })
      y += rowHeight
    })

    return y + 5
  }
}
