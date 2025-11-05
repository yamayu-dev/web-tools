/**
 * テストデータ生成のユーティリティ関数
 */

import type { DataType, ColumnConfig, TestDataConfig } from '../types/testDataGenerator'

/** 日本人の姓のサンプル */
const LAST_NAMES = [
  '佐藤', '鈴木', '高橋', '田中', '伊藤', '渡辺', '山本', '中村', '小林', '加藤',
  '吉田', '山田', '佐々木', '山口', '松本', '井上', '木村', '林', '清水', '山崎'
]

/** 日本人の名のサンプル */
const FIRST_NAMES = [
  '太郎', '次郎', '三郎', '花子', '一郎', '二郎', '美咲', '健太', 'さくら', '翔太',
  '陽子', '明', '愛', '大輔', '裕子', '拓也', '直美', '智也', '千佳', '浩二'
]

/** メールドメインのサンプル */
const EMAIL_DOMAINS = [
  'example.com', 'test.jp', 'sample.co.jp', 'demo.com', 'mail.jp'
]

/** 金額の範囲 */
const AMOUNT_MIN = 1000
const AMOUNT_MAX = 1000000

/** 日付の範囲 */
const DATE_RANGE_START = new Date(2020, 0, 1)
const DATE_RANGE_END = new Date(2025, 11, 31)

/**
 * 指定されたデータ型に基づいて値を生成
 */
export function generateValue(
  dataType: DataType,
  rowIndex: number,
  columnConfig: ColumnConfig
): string {
  switch (dataType) {
    case 'sequential': {
      const start = columnConfig.sequentialStart ?? 1
      return String(start + rowIndex)
    }
    
    case 'random-number': {
      const min = columnConfig.randomMin ?? 0
      const max = columnConfig.randomMax ?? 10000
      const value = Math.floor(Math.random() * (max - min + 1)) + min
      return String(value)
    }
    
    case 'name': {
      const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]
      const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]
      return `${lastName} ${firstName}`
    }
    
    case 'email': {
      const domain = EMAIL_DOMAINS[Math.floor(Math.random() * EMAIL_DOMAINS.length)]
      // ローマ字化の簡易版（実際のローマ字変換ではなく、英数字で代用）
      const user = `user${Math.floor(Math.random() * 10000)}`
      return `${user}@${domain}`
    }
    
    case 'phone': {
      // 日本の電話番号形式: 090-XXXX-XXXX
      const prefix = ['090', '080', '070'][Math.floor(Math.random() * 3)]
      const middle = String(Math.floor(Math.random() * 10000)).padStart(4, '0')
      const last = String(Math.floor(Math.random() * 10000)).padStart(4, '0')
      return `${prefix}-${middle}-${last}`
    }
    
    case 'amount': {
      // 金額の範囲で生成
      const amount = Math.floor(Math.random() * (AMOUNT_MAX - AMOUNT_MIN)) + AMOUNT_MIN
      return amount.toLocaleString('ja-JP')
    }
    
    case 'date': {
      // 指定された日付範囲で生成
      const start = DATE_RANGE_START.getTime()
      const end = DATE_RANGE_END.getTime()
      const randomTime = start + Math.random() * (end - start)
      const date = new Date(randomTime)
      return date.toISOString().split('T')[0]
    }
    
    case 'text': {
      const texts = [
        'サンプルテキスト', 'テストデータ', 'ダミーデータ', 'テスト用',
        '例文', 'サンプル', 'デモ', '試験用データ'
      ]
      return texts[Math.floor(Math.random() * texts.length)]
    }
    
    default:
      return ''
  }
}

/**
 * 値を指定された長さに調整（固定長フォーマット用）
 */
export function padToLength(value: string, length: number, padChar: string = ' '): string {
  if (value.length > length) {
    return value.substring(0, length)
  }
  return value.padEnd(length, padChar)
}

/**
 * CSV/TSV形式で値をエスケープ
 */
export function escapeDelimitedValue(value: string, delimiter: string, quoteChar: string): string {
  // 値に区切り文字、引用符、改行が含まれる場合は引用符で囲む
  if (value.includes(delimiter) || value.includes(quoteChar) || value.includes('\n') || value.includes('\r')) {
    // 引用符をエスケープ（二重にする）
    const escapedValue = value.replace(new RegExp(quoteChar, 'g'), quoteChar + quoteChar)
    return `${quoteChar}${escapedValue}${quoteChar}`
  }
  return value
}

/**
 * テストデータを生成
 */
export function generateTestData(config: TestDataConfig): string {
  const lines: string[] = []
  
  // ヘッダー行の生成
  if (config.hasHeader) {
    const headerLine = generateHeaderLine(config)
    lines.push(headerLine)
  }
  
  // データ行の生成
  for (let i = 0; i < config.recordCount; i++) {
    const dataLine = generateDataLine(config, i)
    lines.push(dataLine)
  }
  
  return lines.join('\n')
}

/**
 * ヘッダー行を生成
 */
function generateHeaderLine(config: TestDataConfig): string {
  const { fileFormat, columns, delimiter, quoteChar } = config
  
  if (fileFormat === 'fixed-length') {
    // 固定長の場合、カラム名をそれぞれの長さに合わせる
    return columns.map(col => padToLength(col.name, col.length)).join('')
  } else {
    // CSV/TSVの場合
    const actualDelimiter = fileFormat === 'tsv' ? '\t' : (delimiter ?? ',')
    const actualQuoteChar = quoteChar ?? '"'
    return columns
      .map(col => escapeDelimitedValue(col.name, actualDelimiter, actualQuoteChar))
      .join(actualDelimiter)
  }
}

/**
 * データ行を生成
 */
function generateDataLine(config: TestDataConfig, rowIndex: number): string {
  const { fileFormat, columns, delimiter, quoteChar } = config
  
  const values = columns.map(col => generateValue(col.dataType, rowIndex, col))
  
  if (fileFormat === 'fixed-length') {
    // 固定長の場合、値をそれぞれの長さに合わせる
    return columns.map((col, i) => padToLength(values[i], col.length)).join('')
  } else {
    // CSV/TSVの場合
    const actualDelimiter = fileFormat === 'tsv' ? '\t' : (delimiter ?? ',')
    const actualQuoteChar = quoteChar ?? '"'
    return values
      .map(value => escapeDelimitedValue(value, actualDelimiter, actualQuoteChar))
      .join(actualDelimiter)
  }
}

/**
 * テストデータをダウンロード
 */
export function downloadTestData(
  content: string,
  filename: string,
  encoding: string
): void {
  let blob: Blob
  
  if (encoding === 'UTF-8') {
    // UTF-8の場合はBOMなし
    blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  } else if (encoding === 'Shift_JIS') {
    // Shift_JISはブラウザで直接エンコードできないため、UTF-8でダウンロード
    // 実際のプロダクション環境では、encoding-japanese等のライブラリを使用して適切なエンコーディングを行う必要があります
    console.warn('Shift_JIS encoding is not fully supported in browser without external libraries, falling back to UTF-8')
    blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  } else if (encoding === 'EUC-JP') {
    // EUC-JPもブラウザで直接エンコードできないため、UTF-8でダウンロード
    // 実際のプロダクション環境では、encoding-japanese等のライブラリを使用して適切なエンコーディングを行う必要があります
    console.warn('EUC-JP encoding is not fully supported in browser without external libraries, falling back to UTF-8')
    blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  } else {
    blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  }
  
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
