/**
 * 数値を適切にフォーマットして表示用文字列に変換
 * 小数点以下12桁まで表示し、3桁区切りのカンマを追加
 */
export const formatNumber = (n: number): string => 
  new Intl.NumberFormat(undefined, { maximumFractionDigits: 12 }).format(n)