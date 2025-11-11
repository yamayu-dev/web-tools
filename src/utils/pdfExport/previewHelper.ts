/**
 * Preview Helper for PDF Export
 * プレビュー要素が存在しない場合に一時的に作成するヘルパー
 */

import { marked } from 'marked'
import DOMPurify from 'dompurify'
import mermaid from 'mermaid'
import hljs from 'highlight.js'

/**
 * Markdownからプレビュー要素を作成
 */
export async function createPreviewElement(
  markdown: string,
  colorMode: 'light' | 'dark'
): Promise<HTMLElement> {
  // コンテナ要素を作成
  const container = document.createElement('div')
  container.style.position = 'fixed'
  container.style.left = '-10000px'
  container.style.top = '0'
  container.style.width = '800px'
  container.style.padding = '16px'
  container.style.opacity = '0'
  container.style.pointerEvents = 'none'
  container.style.zIndex = '-9999'

  // Markdownをレンダリング
  const rawHTML = marked(markdown, {
    breaks: true,
    gfm: true
  }) as string

  // DOMPurifyでサニタイズ
  const sanitizedHTML = DOMPurify.sanitize(rawHTML, {
    ADD_TAGS: ['iframe', 'input'],
    ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling', 'type', 'checked', 'disabled']
  })

  // Mermaidコードブロックを変換
  const processedHTML = sanitizedHTML.replace(
    /<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/g,
    (_, code) => `<div class="mermaid-diagram">${code}</div>`
  )

  container.innerHTML = processedHTML

  // DOMに追加（レンダリングのため）
  document.body.appendChild(container)

  // スタイルを適用
  applyPreviewStyles(container, colorMode)

  // Mermaidダイアグラムをレンダリング
  await renderMermaidDiagrams(container, colorMode)

  // シンタックスハイライトを適用
  applyHighlighting(container)

  return container
}

/**
 * プレビュースタイルを適用
 */
function applyPreviewStyles(element: HTMLElement, colorMode: 'light' | 'dark'): void {
  element.style.backgroundColor = colorMode === 'dark' ? '#0d1117' : '#ffffff'
  element.style.color = colorMode === 'dark' ? '#e6edf3' : '#24292f'
  element.style.fontFamily = 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  element.style.fontSize = '16px'
  element.style.lineHeight = '1.6'
}

/**
 * Mermaidダイアグラムをレンダリング
 */
async function renderMermaidDiagrams(container: HTMLElement, colorMode: 'light' | 'dark'): Promise<void> {
  // Mermaidを初期化
  mermaid.initialize({
    startOnLoad: false,
    theme: colorMode === 'dark' ? 'dark' : 'default',
    securityLevel: 'strict',
    fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  })

  const mermaidDivs = container.querySelectorAll('.mermaid-diagram:not(.mermaid-rendered)')
  
  for (let i = 0; i < mermaidDivs.length; i++) {
    const div = mermaidDivs[i] as HTMLElement
    const code = div.textContent || ''
    
    if (!code.trim()) {
      continue
    }
    
    try {
      const uniqueId = `mermaid-temp-${Math.random().toString(36).substr(2, 9)}-${Date.now()}-${i}`
      const { svg } = await mermaid.render(uniqueId, code)
      // Sanitize SVG before inserting into DOM
      const sanitizedSvg = DOMPurify.sanitize(svg, { 
        ADD_TAGS: ['svg', 'g', 'path', 'text', 'circle', 'rect', 'line', 'polyline', 'polygon', 'ellipse', 'tspan', 'marker', 'defs', 'style', 'clipPath', 'foreignObject'],
        ADD_ATTR: ['viewBox', 'xmlns', 'width', 'height', 'x', 'y', 'cx', 'cy', 'r', 'rx', 'ry', 'd', 'fill', 'stroke', 'stroke-width', 'transform', 'class', 'id', 'style', 'points', 'x1', 'y1', 'x2', 'y2', 'text-anchor', 'dominant-baseline', 'font-family', 'font-size', 'font-weight', 'markerWidth', 'markerHeight', 'refX', 'refY', 'orient', 'clip-path', 'filter']
      })
      div.innerHTML = sanitizedSvg
      div.classList.add('mermaid-rendered')
    } catch (error) {
      console.error('Mermaid render error:', error)
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      div.textContent = `Error rendering Mermaid diagram: ${errorMsg}`
      div.classList.add('mermaid-rendered')
    }
  }
}

/**
 * シンタックスハイライトを適用
 */
function applyHighlighting(container: HTMLElement): void {
  const codeBlocks = container.querySelectorAll('pre code:not(.mermaid-diagram)')
  codeBlocks.forEach((block) => {
    const element = block as HTMLElement
    try {
      hljs.highlightElement(element)
    } catch (error) {
      console.warn('Highlight error:', error)
    }
  })
}

/**
 * 一時プレビュー要素をクリーンアップ
 */
export function cleanupPreviewElement(element: HTMLElement): void {
  if (element.parentNode) {
    // Mermaidが生成した一時要素もクリーンアップ
    const mermaidElements = document.querySelectorAll('[id^="mermaid-temp-"]')
    mermaidElements.forEach(el => {
      if (!el.closest('.mermaid-diagram')) {
        el.remove()
      }
    })
    
    document.body.removeChild(element)
  }
}
