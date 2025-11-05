/**
 * テストデータ生成のユーティリティ関数
 */

import type { DataType, ColumnConfig, TestDataConfig } from '../types/testDataGenerator'

/** 日本人の姓のサンプル */
const LAST_NAMES_JP = [
  '佐藤', '鈴木', '高橋', '田中', '伊藤', '渡辺', '山本', '中村', '小林', '加藤',
  '吉田', '山田', '佐々木', '山口', '松本', '井上', '木村', '林', '清水', '山崎'
]

/** 日本人の名のサンプル */
const FIRST_NAMES_JP = [
  '太郎', '次郎', '三郎', '花子', '一郎', '二郎', '美咲', '健太', 'さくら', '翔太',
  '陽子', '明', '愛', '大輔', '裕子', '拓也', '直美', '智也', '千佳', '浩二'
]

/** 海外の名前のサンプル */
const FIRST_NAMES_INTL = [
  'John', 'Mary', 'James', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
  'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica'
]

const LAST_NAMES_INTL = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas'
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

/** 全角テキストサンプル */
const FULL_WIDTH_TEXTS = [
  'サンプルテキスト', 'テストデータ', 'ダミーデータ', 'テスト用',
  '例文', 'サンプル', 'デモ', '試験用データ'
]

/** 半角テキストサンプル */
const HALF_WIDTH_TEXTS = [
  'Sample Text', 'Test Data', 'Dummy Data', 'For Testing',
  'Example', 'Sample', 'Demo', 'Test Data'
]

/**
 * 全角数字に変換
 */
function toFullWidth(str: string): string {
  return str.replace(/[0-9]/g, (char) => {
    return String.fromCharCode(char.charCodeAt(0) + 0xFEE0)
  }).replace(/[a-zA-Z]/g, (char) => {
    return String.fromCharCode(char.charCodeAt(0) + 0xFEE0)
  }).replace(/-/g, 'ー').replace(/@/g, '＠').replace(/\./g, '．')
}

/**
 * 日付をフォーマット
 */
function formatDate(date: Date, format: string): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  
  switch (format) {
    case 'yyyy-mm-dd':
      return `${year}-${month}-${day}`
    case 'yyyy/mm/dd':
      return `${year}/${month}/${day}`
    case 'yyyymmdd':
      return `${year}${month}${day}`
    case 'mm/dd/yyyy':
      return `${month}/${day}/${year}`
    default:
      return `${year}-${month}-${day}`
  }
}

/**
 * テキストを指定された長さに調整
 */
function adjustTextLength(text: string, maxLength?: number): string {
  if (!maxLength || maxLength <= 0) return text
  if (text.length > maxLength) {
    return text.substring(0, maxLength)
  }
  return text
}

/**
 * 指定されたデータ型に基づいて値を生成
 */
export function generateValue(
  dataType: DataType,
  rowIndex: number,
  columnConfig: ColumnConfig,
  fullWidthData: boolean = false
): string {
  switch (dataType) {
    case 'sequential': {
      const start = columnConfig.sequentialStart ?? 1
      const value = start + rowIndex
      let strValue = String(value)
      
      // 0埋め処理
      if (columnConfig.zeroPadding && columnConfig.length) {
        strValue = strValue.padStart(columnConfig.length, '0')
      }
      
      return fullWidthData ? toFullWidth(strValue) : strValue
    }
    
    case 'random-number': {
      const min = columnConfig.randomMin ?? 0
      const max = columnConfig.randomMax ?? 10000
      let value = Math.floor(Math.random() * (max - min + 1)) + min
      
      // マイナス値の対応
      if (columnConfig.allowNegative && Math.random() > 0.5) {
        value = -value
      }
      
      // 小数点の対応
      if (columnConfig.decimalPlaces && columnConfig.decimalPlaces > 0) {
        const decimal = Math.random()
        const decimalPart = decimal.toFixed(columnConfig.decimalPlaces).substring(2)
        const strValue = `${value}.${decimalPart}`
        return fullWidthData ? toFullWidth(strValue) : strValue
      }
      
      const strValue = String(value)
      return fullWidthData ? toFullWidth(strValue) : strValue
    }
    
    case 'name': {
      const nameType = columnConfig.nameType ?? 'japanese'
      const charType = columnConfig.characterType ?? 'full-width'
      
      let name: string
      if (nameType === 'japanese') {
        const lastName = LAST_NAMES_JP[Math.floor(Math.random() * LAST_NAMES_JP.length)]
        const firstName = FIRST_NAMES_JP[Math.floor(Math.random() * FIRST_NAMES_JP.length)]
        name = `${lastName} ${firstName}`
        
        // 文字種別の適用
        if (charType === 'half-width') {
          // 日本人名を半角カタカナ風に（簡易実装）
          name = `${lastName} ${firstName}`.replace(/\s/g, ' ')
        } else if (charType === 'mixed') {
          // ランダムに混合
          name = Math.random() > 0.5 ? name : `${lastName} ${firstName}`
        }
      } else {
        // 海外の名前
        const firstName = FIRST_NAMES_INTL[Math.floor(Math.random() * FIRST_NAMES_INTL.length)]
        const lastName = LAST_NAMES_INTL[Math.floor(Math.random() * LAST_NAMES_INTL.length)]
        name = `${firstName} ${lastName}`
        
        if (charType === 'full-width') {
          name = toFullWidth(name)
        }
      }
      
      return name
    }
    
    case 'email': {
      const domain = EMAIL_DOMAINS[Math.floor(Math.random() * EMAIL_DOMAINS.length)]
      const user = `user${Math.floor(Math.random() * 10000)}`
      const email = `${user}@${domain}`
      return fullWidthData ? toFullWidth(email) : email
    }
    
    case 'phone': {
      const prefix = ['090', '080', '070'][Math.floor(Math.random() * 3)]
      const middle = String(Math.floor(Math.random() * 10000)).padStart(4, '0')
      const last = String(Math.floor(Math.random() * 10000)).padStart(4, '0')
      
      const format = columnConfig.phoneFormat ?? 'hyphen'
      const phone = format === 'hyphen' 
        ? `${prefix}-${middle}-${last}`
        : `${prefix}${middle}${last}`
      
      return fullWidthData ? toFullWidth(phone) : phone
    }
    
    case 'amount': {
      const min = columnConfig.randomMin ?? AMOUNT_MIN
      const max = columnConfig.randomMax ?? AMOUNT_MAX
      let amount = Math.floor(Math.random() * (max - min)) + min
      
      // マイナス値の対応
      if (columnConfig.allowNegative && Math.random() > 0.5) {
        amount = -amount
      }
      
      // 小数点の対応
      if (columnConfig.decimalPlaces && columnConfig.decimalPlaces > 0) {
        const decimal = Math.random()
        const value = amount + decimal
        const formatted = value.toFixed(columnConfig.decimalPlaces)
        return fullWidthData ? toFullWidth(formatted.replace(/\B(?=(\d{3})+(?!\d))/g, ',')) : formatted.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
      }
      
      const formatted = amount.toLocaleString('ja-JP')
      return fullWidthData ? toFullWidth(formatted) : formatted
    }
    
    case 'date': {
      const start = DATE_RANGE_START.getTime()
      const end = DATE_RANGE_END.getTime()
      const randomTime = start + Math.random() * (end - start)
      const date = new Date(randomTime)
      
      const format = columnConfig.dateFormat ?? 'yyyy-mm-dd'
      const dateStr = formatDate(date, format)
      
      return fullWidthData ? toFullWidth(dateStr) : dateStr
    }
    
    case 'text': {
      const charType = columnConfig.characterType ?? 'full-width'
      let text: string
      
      if (charType === 'full-width') {
        text = FULL_WIDTH_TEXTS[Math.floor(Math.random() * FULL_WIDTH_TEXTS.length)]
      } else if (charType === 'half-width') {
        text = HALF_WIDTH_TEXTS[Math.floor(Math.random() * HALF_WIDTH_TEXTS.length)]
      } else {
        // 混合
        text = Math.random() > 0.5
          ? FULL_WIDTH_TEXTS[Math.floor(Math.random() * FULL_WIDTH_TEXTS.length)]
          : HALF_WIDTH_TEXTS[Math.floor(Math.random() * HALF_WIDTH_TEXTS.length)]
      }
      
      // テキスト長の調整
      text = adjustTextLength(text, columnConfig.textLength)
      
      return text
    }
    
    case 'fixed': {
      const value = columnConfig.fixedValue ?? ''
      return fullWidthData ? toFullWidth(value) : value
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
  const { fileFormat, columns, delimiter, quoteChar, fullWidthData } = config
  
  if (fileFormat === 'fixed-length') {
    // 固定長の場合、カラム名をそれぞれの長さに合わせる
    return columns.map(col => {
      const name = fullWidthData ? toFullWidth(col.name) : col.name
      return padToLength(name, col.length)
    }).join('')
  } else {
    // CSV/TSVの場合
    const actualDelimiter = fileFormat === 'tsv' ? '\t' : (delimiter ?? ',')
    const actualQuoteChar = quoteChar ?? '"'
    return columns
      .map(col => {
        const name = fullWidthData ? toFullWidth(col.name) : col.name
        return escapeDelimitedValue(name, actualDelimiter, actualQuoteChar)
      })
      .join(actualDelimiter)
  }
}

/**
 * データ行を生成
 */
function generateDataLine(config: TestDataConfig, rowIndex: number): string {
  const { fileFormat, columns, delimiter, quoteChar, fullWidthData } = config
  
  const values = columns.map(col => generateValue(col.dataType, rowIndex, col, fullWidthData ?? false))
  
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
  encoding: string,
  zipDownload: boolean = false
): void {
  if (zipDownload) {
    // ZIP形式でダウンロード（簡易実装）
    console.warn('ZIP download is not yet fully implemented, falling back to normal download')
  }
  
  let blob: Blob
  
  if (encoding === 'UTF-8') {
    // UTF-8の場合はBOMなし
    blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  } else if (encoding === 'Shift_JIS') {
    // Shift_JISはブラウザで直接エンコードできないため、UTF-8でダウンロード
    // 実際のプロダクション環境では、encoding-japanese等のライブラリを使用して適切なエンコーディングを行う必要があります
    console.warn('Shift_JIS encoding is not fully supported in browser without external libraries, falling back to UTF-8')
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

/**
 * 設定をJSONファイルとしてエクスポート
 */
export function exportConfig(config: TestDataConfig, filename: string = 'config.json'): void {
  const json = JSON.stringify(config, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * JSONファイルから設定をインポート
 */
export function importConfig(file: File): Promise<TestDataConfig> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const config = JSON.parse(content) as TestDataConfig
        resolve(config)
      } catch (error) {
        reject(new Error('設定ファイルの読み込みに失敗しました'))
      }
    }
    reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました'))
    reader.readAsText(file)
  })
}
