/**
 * IconMaker機能に関する型定義
 */

/** アイコンの形状 */
export type IconShape = 'circle' | 'square' | 'rounded'

/** グラデーションの種類 */
export type GradientType = 'linear' | 'radial'

/** 出力ファイル形式 */
export type ExportFormat = 'png' | 'svg'

/** 出力サイズ */
export type ExportSize = 64 | 128 | 256

/** カラー設定 */
export interface ColorConfig {
  /** 単色の場合の背景色 */
  backgroundColor: string
  /** グラデーション使用フラグ */
  useGradient: boolean
  /** グラデーションの種類 */
  gradientType: GradientType
  /** グラデーション開始色 */
  gradientStartColor: string
  /** グラデーション終了色 */
  gradientEndColor: string
  /** 文字色 */
  textColor: string
  /** 文字色の自動調整フラグ */
  autoTextColor: boolean
}

/** フォント設定 */
export interface FontConfig {
  /** フォントファミリー */
  fontFamily: string
  /** フォントサイズ（アイコンサイズに対する比率 0-1） */
  fontSize: number
  /** フォントウェイト */
  fontWeight: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900'
}

/** アイコン設定 */
export interface IconConfig {
  /** 表示するテキスト（1-2文字） */
  text: string
  /** アイコンの形状 */
  shape: IconShape
  /** 透明背景フラグ（circle時のみ有効） */
  transparentBackground: boolean
  /** カラー設定 */
  color: ColorConfig
  /** フォント設定 */
  font: FontConfig
  /** アイコンサイズ（プレビュー用） */
  size: number
}

/** エクスポート設定 */
export interface ExportConfig {
  /** ファイル形式 */
  format: ExportFormat
  /** 出力サイズ */
  size: ExportSize
  /** ファイル名 */
  filename: string
}

/** デフォルトのアイコン設定 */
export const DEFAULT_ICON_CONFIG: IconConfig = {
  text: 'A',
  shape: 'circle',
  transparentBackground: false,
  color: {
    backgroundColor: '#3182CE',
    useGradient: false,
    gradientType: 'linear',
    gradientStartColor: '#3182CE',
    gradientEndColor: '#63B3ED',
    textColor: '#FFFFFF',
    autoTextColor: true,
  },
  font: {
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: 0.5,
    fontWeight: '600',
  },
  size: 128,
}

/** 利用可能なフォントファミリー */
export const FONT_FAMILIES = [
  { label: 'システムフォント', value: 'system-ui, -apple-system, sans-serif' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Helvetica', value: 'Helvetica, Arial, sans-serif' },
  { label: 'Times New Roman', value: 'Times New Roman, serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Courier New', value: 'Courier New, monospace' },
  { label: 'Verdana', value: 'Verdana, sans-serif' },
  { label: 'Trebuchet MS', value: 'Trebuchet MS, sans-serif' },
  { label: 'Impact', value: 'Impact, sans-serif' },
] as const

/** プリセットカラー */
export const PRESET_COLORS = [
  '#3182CE', '#E53E3E', '#38A169', '#D69E2E', '#805AD5',
  '#DD6B20', '#319795', '#C53030', '#2B6CB0', '#553C9A',
  '#000000', '#FFFFFF', '#718096', '#F7FAFC', '#1A202C'
] as const