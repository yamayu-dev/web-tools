/**
 * アプリケーション全体で使用するUI関連の定数定義
 */

/** トースト表示時間（ミリ秒） */
export const TOAST_DURATIONS = {
  SHORT: 1000,
  MEDIUM: 1500,
  LONG: 3000,
  ERROR: 2500,
} as const

/** UI要素のサイズや間隔 */
export const UI_CONSTANTS = {
  // アイコンサイズ
  ICON_SIZE_SM: 16,
  ICON_SIZE_MD: 20,
  
  // プレビューサイズ
  PREVIEW_SIZE: 200,
  MOBILE_PREVIEW_SIZE: 150,
  
  // グリッドとスペーシング
  GRID_GAP: 6,
  FORM_GAP: 4,
  
  // アニメーション
  SCALE_HOVER: 1.02,
  
  // 数値表示制限
  NUMBERS_DISPLAY_LIMIT: 50,
  
  // Z-index
  TOAST_Z_INDEX: 1000,
  HEADER_Z_INDEX: 1000,
  
  // 位置
  TOAST_POSITION_TOP: 20,
  
  // タイミング（ミリ秒）
  PASTE_DELAY: 100,
  PASTE_CHECK_DELAY: 50,
  PASTE_COMMAND_DELAY: 10,
  
  // ヘッダー高さ
  HEADER_HEIGHT_BASE: 16,
  HEADER_HEIGHT_MD: 14,
} as const

/** カラーテーマ定数 */
export const COLOR_CONSTANTS = {
  TRANSPARENT: 'transparent',
  WHITE: '#FFFFFF',
  BLACK: '#000000',
} as const

/** フォントサイズ倍率 */
export const FONT_SIZE_RATIOS = {
  MIN: 0.2,
  MAX: 0.8,
  STEP: 0.1,
} as const

/** エクスポートサイズ定数 */
export const EXPORT_SIZES = [64, 128, 256] as const

/** アプリケーション設定 */
export const APP_CONFIG = {
  MAX_TEXT_LENGTH: 2, // アイコンテキストの最大文字数
  CORNER_RADIUS_RATIO: 0.125, // 角丸の半径比率
} as const

/** ファイル名の検証用正規表現 */
export const FILENAME_VALIDATION_REGEX = /[^a-zA-Z0-9_-]/g

/** レコード数の制限 */
export const RECORD_COUNT_LIMITS = {
  MIN: 1,
  MAX: 100000,
} as const