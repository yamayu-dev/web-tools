import type { Mode, CalculationResult } from '../types/calculator'

/**
 * 数値を適切にフォーマットして表示用文字列に変換
 * 小数点以下12桁まで表示し、3桁区切りのカンマを追加
 */
export const formatNumber = (n: number): string => 
  new Intl.NumberFormat(undefined, { maximumFractionDigits: 12 }).format(n)

/**
 * テキストから数値を解析して計算結果を返す
 * @param text 解析対象のテキスト
 * @param mode 解析モード
 * @returns 計算結果（合計、個数、数値配列、エラー配列）
 */
export const parseNumbers = (text: string, mode: Mode): CalculationResult => {
  const lines = text.replace(/\r\n/g, '\n').split('\n')
  const nums: number[] = []
  const errs: string[] = []
  const numRegex = /[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?/g

  if (mode === 'perLineFirstNumber') {
    lines.forEach((line, i) => {
      const m = line.match(numRegex)
      if (m && m.length > 0) {
        const v = Number(m[0])
        if (Number.isFinite(v)) nums.push(v)
        else errs.push(`${i + 1}行目: 数値に変換できません (${m[0]})`)
      } else if (line.trim() !== '') {
        errs.push(`${i + 1}行目: 数値が見つかりません`)
      }
    })
  } else {
    const mAll = text.match(numRegex) ?? []
    mAll.forEach((s) => {
      const v = Number(s)
      if (Number.isFinite(v)) nums.push(v)
    })
  }

  const sum = nums.reduce((a, b) => a + b, 0)
  return { sum, count: nums.length, numbers: nums, errors: errs }
}