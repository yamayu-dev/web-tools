/**
 * テストデータ生成機能の型定義
 */

/** ファイル形式 */
export type FileFormat = 'csv' | 'tsv' | 'fixed-length'

/** 文字エンコーディング */
export type CharEncoding = 'UTF-8' | 'Shift_JIS'

/** データ型 */
export type DataType = 
  | 'sequential'      // 連番
  | 'random-number'   // ランダム数値
  | 'name'            // 名前
  | 'email'           // メールアドレス
  | 'phone'           // 電話番号
  | 'amount'          // 金額
  | 'date'            // 日付
  | 'text'            // テキスト
  | 'fixed'           // 固定値

/** 文字種別 */
export type CharacterType = 'full-width' | 'half-width' | 'mixed'

/** 名前の種類 */
export type NameType = 'japanese' | 'international'

/** 電話番号フォーマット */
export type PhoneFormat = 'hyphen' | 'no-hyphen'

/** 日付フォーマット */
export type DateFormat = 'yyyy-mm-dd' | 'yyyy/mm/dd' | 'yyyymmdd' | 'mm/dd/yyyy'

/** カラム設定 */
export interface ColumnConfig {
  id: string
  name: string
  dataType: DataType
  length: number
  // 連番設定
  sequentialStart?: number
  zeroPadding?: boolean
  // 数値設定
  randomMin?: number
  randomMax?: number
  allowNegative?: boolean
  decimalPlaces?: number
  // テキスト設定
  textLength?: number
  characterType?: CharacterType
  // 名前設定
  nameType?: NameType
  // 電話番号設定
  phoneFormat?: PhoneFormat
  // 日付設定
  dateFormat?: DateFormat
  // 固定値設定
  fixedValue?: string
}

/** テストデータ設定 */
export interface TestDataConfig {
  fileFormat: FileFormat
  encoding: CharEncoding
  hasHeader: boolean
  columns: ColumnConfig[]
  recordCount: number
  delimiter?: string
  quoteChar?: string
  fullWidthData?: boolean
  zipDownload?: boolean
}

/** デフォルト設定 */
export const DEFAULT_TEST_DATA_CONFIG: TestDataConfig = {
  fileFormat: 'csv',
  encoding: 'UTF-8',
  hasHeader: true,
  columns: [
    {
      id: '1',
      name: 'ID',
      dataType: 'sequential',
      length: 10,
      sequentialStart: 1,
      zeroPadding: false,
    },
    {
      id: '2',
      name: '名前',
      dataType: 'name',
      length: 20,
      nameType: 'japanese',
      characterType: 'full-width',
    },
    {
      id: '3',
      name: 'メール',
      dataType: 'email',
      length: 30,
    },
  ],
  recordCount: 100,
  delimiter: ',',
  quoteChar: '"',
  fullWidthData: false,
  zipDownload: false,
}

/** データ型のラベルマップ */
export const DATA_TYPE_LABELS: Record<DataType, string> = {
  'sequential': '連番',
  'random-number': 'ランダム数値',
  'name': '名前',
  'email': 'メール',
  'phone': '電話番号',
  'amount': '金額',
  'date': '日付',
  'text': 'テキスト',
  'fixed': '固定値',
}

/** 文字種別のラベルマップ */
export const CHARACTER_TYPE_LABELS: Record<CharacterType, string> = {
  'full-width': '全角のみ',
  'half-width': '半角のみ',
  'mixed': '混合',
}

/** 名前種別のラベルマップ */
export const NAME_TYPE_LABELS: Record<NameType, string> = {
  'japanese': '日本人',
  'international': '海外',
}

/** 電話番号フォーマットのラベルマップ */
export const PHONE_FORMAT_LABELS: Record<PhoneFormat, string> = {
  'hyphen': 'ハイフンあり',
  'no-hyphen': 'ハイフンなし',
}

/** 日付フォーマットのラベルマップ */
export const DATE_FORMAT_LABELS: Record<DateFormat, string> = {
  'yyyy-mm-dd': 'YYYY-MM-DD',
  'yyyy/mm/dd': 'YYYY/MM/DD',
  'yyyymmdd': 'YYYYMMDD',
  'mm/dd/yyyy': 'MM/DD/YYYY',
}

/** ファイル形式のラベルマップ */
export const FILE_FORMAT_LABELS: Record<FileFormat, string> = {
  'csv': 'CSV',
  'tsv': 'TSV',
  'fixed-length': '固定長',
}

/** 文字エンコーディングのラベルマップ */
export const CHAR_ENCODING_LABELS: Record<CharEncoding, string> = {
  'UTF-8': 'UTF-8',
  'Shift_JIS': 'Shift_JIS',
}
