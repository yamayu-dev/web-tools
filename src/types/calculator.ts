/**
 * 計算機能に関する型定義
 */

/** 計算モード */
export type Mode = 'perLineFirstNumber' | 'allNumbersInText'

/** 計算結果 */
export interface CalculationResult {
  sum: number
  count: number
  numbers: number[]
  errors: string[]
}