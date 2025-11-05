/**
 * テストデータ生成機能の型定義
 */

/** ファイル形式 */
export type FileFormat = 'csv' | 'tsv' | 'fixed-length'

/** 文字エンコーディング */
export type CharEncoding = 'UTF-8' | 'Shift_JIS' | 'EUC-JP'

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

/** カラム設定 */
export interface ColumnConfig {
  id: string
  name: string
  dataType: DataType
  length: number
  sequentialStart?: number
  randomMin?: number
  randomMax?: number
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
    },
    {
      id: '2',
      name: '名前',
      dataType: 'name',
      length: 20,
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
  'EUC-JP': 'EUC-JP',
}
