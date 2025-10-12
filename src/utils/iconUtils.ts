import type { IconConfig, ExportFormat, ExportSize } from '../types/iconMaker'

/**
 * アイコン生成とエクスポートのユーティリティ関数
 */

/**
 * 文字色を自動的に決定する（コントラスト重視）
 * @param backgroundColor 背景色（16進数）
 * @returns 白または黒の文字色
 */
export const getAutoTextColor = (backgroundColor: string): string => {
  // 背景色の明度を計算
  const hex = backgroundColor.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  
  // 相対輝度を計算（WCAG基準）
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  
  return luminance > 0.5 ? '#000000' : '#FFFFFF'
}

/**
 * Canvasにアイコンをレンダリングする
 * @param canvas Canvas要素
 * @param config アイコン設定
 */
export const renderIconToCanvas = (canvas: HTMLCanvasElement, config: IconConfig): void => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const { size } = config
  canvas.width = size
  canvas.height = size

  // キャンバスをクリア
  ctx.clearRect(0, 0, size, size)

  // 背景を描画
  if (!config.transparentBackground || config.shape === 'square') {
    drawBackground(ctx, config, size)
  } else if (config.shape === 'circle' || config.shape === 'rounded') {
    // 円形や角丸の場合は、形状の外側を透明にするためクリッピングパスのみ設定
    drawBackground(ctx, config, size)
  }

  // テキストを描画
  drawText(ctx, config, size)
}

/**
 * 背景を描画する
 * @param ctx Canvas 2Dコンテキスト
 * @param config アイコン設定
 * @param size サイズ
 */
const drawBackground = (ctx: CanvasRenderingContext2D, config: IconConfig, size: number): void => {
  const { shape, color } = config
  const radius = size / 2

  ctx.save()

  // 形状に応じてクリッピングパスを設定
  ctx.beginPath()
  switch (shape) {
    case 'circle':
      ctx.arc(radius, radius, radius, 0, 2 * Math.PI)
      break
    case 'square':
      ctx.rect(0, 0, size, size)
      break
    case 'rounded':
      const cornerRadius = size * 0.125 // 12.5%の角丸
      ctx.roundRect(0, 0, size, size, cornerRadius)
      break
  }
  ctx.clip()

  // 背景色またはグラデーションを適用
  if (color.useGradient) {
    const gradient = color.gradientType === 'linear'
      ? ctx.createLinearGradient(0, 0, size, size)
      : ctx.createRadialGradient(radius, radius, 0, radius, radius, radius)
    
    gradient.addColorStop(0, color.gradientStartColor)
    gradient.addColorStop(1, color.gradientEndColor)
    ctx.fillStyle = gradient
  } else {
    ctx.fillStyle = color.backgroundColor
  }

  ctx.fill()
  ctx.restore()
}

/**
 * テキストを描画する
 * @param ctx Canvas 2Dコンテキスト
 * @param config アイコン設定
 * @param size サイズ
 */
const drawText = (ctx: CanvasRenderingContext2D, config: IconConfig, size: number): void => {
  const { text, font, color } = config
  
  if (!text.trim()) return

  // フォント設定
  const fontSize = size * font.fontSize
  ctx.font = `${font.fontWeight} ${fontSize}px ${font.fontFamily}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  
  // 文字色を設定
  if (color.autoTextColor) {
    const bgColor = color.useGradient ? color.gradientStartColor : color.backgroundColor
    ctx.fillStyle = getAutoTextColor(bgColor)
  } else {
    ctx.fillStyle = color.textColor
  }

  // テキストを中央に描画
  ctx.fillText(text, size / 2, size / 2)
}

/**
 * CanvasからPNGデータURLを生成する
 * @param canvas Canvas要素
 * @returns PNG形式のデータURL
 */
export const canvasToPNG = (canvas: HTMLCanvasElement): string => {
  return canvas.toDataURL('image/png')
}

/**
 * アイコン設定からSVGを生成する
 * @param config アイコン設定
 * @param size 出力サイズ
 * @returns SVG文字列
 */
export const generateSVG = (config: IconConfig, size: number): string => {
  const { shape, color, font, text } = config
  const radius = size / 2
  const fontSize = size * font.fontSize

  // 背景の定義
  let backgroundElement = ''
  let defsElement = ''

  if (!config.transparentBackground || config.shape !== 'circle') {
    if (color.useGradient) {
      const gradientId = 'iconGradient'
      const gradientType = color.gradientType === 'linear' ? 'linearGradient' : 'radialGradient'
      
      defsElement = `
        <defs>
          <${gradientType} id="${gradientId}" ${color.gradientType === 'linear' ? 'x1="0%" y1="0%" x2="100%" y2="100%"' : 'cx="50%" cy="50%" r="50%"'}>
            <stop offset="0%" style="stop-color:${color.gradientStartColor}" />
            <stop offset="100%" style="stop-color:${color.gradientEndColor}" />
          </${gradientType}>
        </defs>`
      
      const fillStyle = `url(#${gradientId})`
      backgroundElement = getShapeElement(shape, size, fillStyle)
    } else {
      backgroundElement = getShapeElement(shape, size, color.backgroundColor)
    }
  }

  // テキスト色を決定
  const textColor = color.autoTextColor 
    ? getAutoTextColor(color.useGradient ? color.gradientStartColor : color.backgroundColor)
    : color.textColor

  // SVGを構築
  const svgContent = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      ${defsElement}
      ${backgroundElement}
      <text x="${radius}" y="${radius}" 
            font-family="${font.fontFamily}" 
            font-size="${fontSize}" 
            font-weight="${font.fontWeight}"
            fill="${textColor}" 
            text-anchor="middle" 
            dominant-baseline="middle">${text}</text>
    </svg>`.trim()

  return svgContent
}

/**
 * 形状に応じたSVG要素を生成する
 * @param shape 形状
 * @param size サイズ
 * @param fill 塗りつぶし色
 * @returns SVG要素文字列
 */
const getShapeElement = (shape: IconConfig['shape'], size: number, fill: string): string => {
  const radius = size / 2

  switch (shape) {
    case 'circle':
      return `<circle cx="${radius}" cy="${radius}" r="${radius}" fill="${fill}" />`
    case 'square':
      return `<rect x="0" y="0" width="${size}" height="${size}" fill="${fill}" />`
    case 'rounded':
      const cornerRadius = size * 0.125
      return `<rect x="0" y="0" width="${size}" height="${size}" rx="${cornerRadius}" ry="${cornerRadius}" fill="${fill}" />`
  }
}

/**
 * ファイルをダウンロードする
 * @param content ファイル内容
 * @param filename ファイル名
 * @param mimeType MIMEタイプ
 */
export const downloadFile = (content: string, filename: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}

/**
 * Canvas内容をPNGファイルとしてダウンロードする
 * @param canvas Canvas要素
 * @param filename ファイル名（拡張子なし）
 */
export const downloadCanvasAsPNG = (canvas: HTMLCanvasElement, filename: string): void => {
  canvas.toBlob((blob) => {
    if (!blob) return
    
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${filename}.png`
    link.style.display = 'none'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(url)
  }, 'image/png')
}

/**
 * アイコンをSVGファイルとしてダウンロードする
 * @param config アイコン設定
 * @param size 出力サイズ
 * @param filename ファイル名（拡張子なし）
 */
export const downloadIconAsSVG = (config: IconConfig, size: number, filename: string): void => {
  const svgContent = generateSVG(config, size)
  downloadFile(svgContent, `${filename}.svg`, 'image/svg+xml')
}

/**
 * 指定サイズでアイコンをエクスポートする
 * @param config アイコン設定
 * @param format ファイル形式
 * @param size 出力サイズ
 * @param filename ファイル名（拡張子なし）
 */
export const exportIcon = (
  config: IconConfig, 
  format: ExportFormat, 
  size: ExportSize, 
  filename: string
): void => {
  if (format === 'svg') {
    downloadIconAsSVG(config, size, filename)
  } else {
    // PNG出力用の一時的なCanvasを作成
    const tempCanvas = document.createElement('canvas')
    const tempConfig = { ...config, size }
    renderIconToCanvas(tempCanvas, tempConfig)
    downloadCanvasAsPNG(tempCanvas, filename)
  }
}