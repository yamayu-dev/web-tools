import { useState } from 'react'

/**
 * トースト表示機能を提供するカスタムフック
 * 一時的なメッセージ表示とタイマー管理を統一的に扱う
 */
export const useToast = () => {
  const [message, setMessage] = useState('')
  
  const showToast = (msg: string, duration = 2000) => {
    setMessage(msg)
    setTimeout(() => setMessage(''), duration)
  }
  
  return { message, showToast }
}