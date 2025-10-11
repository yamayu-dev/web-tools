/**
 * クリップボード操作のユーティリティ関数
 * HTTPSとHTTPの両方の環境で動作する
 */

/**
 * クリップボードにテキストを書き込む
 * HTTPSでは navigator.clipboard.writeText() を使用し、
 * HTTPではテキストエリアを作成して document.execCommand() を使用する
 */
export const writeToClipboard = async (text: string): Promise<void> => {
  // HTTPS環境またはlocalhostでは navigator.clipboard を使用
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch (error) {
      console.warn('navigator.clipboard.writeText failed, falling back to execCommand', error);
    }
  }

  // HTTP環境またはnavigator.clipboardが失敗した場合のフォールバック
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    
    if (!successful) {
      throw new Error('execCommand copy failed');
    }
  } catch {
    throw new Error('クリップボードへの書き込みに失敗しました');
  }
};

/**
 * クリップボードからテキストを読み取る
 * HTTPSでは navigator.clipboard.readText() を使用し、
 * HTTPではテキストエリアを作成してペーストを促す
 */
export const readFromClipboard = async (): Promise<string> => {
  // HTTPS環境またはlocalhostでは navigator.clipboard を使用
  if (navigator.clipboard && window.isSecureContext) {
    try {
      return await navigator.clipboard.readText();
    } catch (error) {
      console.warn('navigator.clipboard.readText failed, falling back to manual paste', error);
    }
  }

  // HTTP環境またはnavigator.clipboardが失敗した場合のフォールバック
  // この場合はユーザーに手動でペーストしてもらう必要がある
  throw new Error('HTTP環境では手動でペーストしてください（Ctrl+V または Cmd+V）');
};

/**
 * クリップボード機能が利用可能かどうかを確認
 */
export const isClipboardAvailable = (): boolean => {
  return !!(navigator.clipboard && window.isSecureContext);
};

/**
 * 環境に応じたクリップボード操作のメッセージを取得
 */
export const getClipboardMessages = () => {
  const isSecure = isClipboardAvailable();
  
  return {
    copySuccess: isSecure 
      ? 'クリップボードにコピーしました' 
      : 'クリップボードにコピーしました',
    copyError: isSecure 
      ? 'クリップボードへのコピーに失敗しました' 
      : 'クリップボードへのコピーに失敗しました',
    pasteSuccess: isSecure 
      ? 'クリップボードから貼り付け完了' 
      : '貼り付け完了',
    pasteError: isSecure 
      ? 'クリップボードからの読み取りに失敗しました' 
      : 'HTTP環境では Ctrl+V（Cmd+V）で貼り付けてください',
    pasteInstruction: isSecure 
      ? '' 
      : 'HTTP環境のため、テキストエリアにフォーカスして Ctrl+V（Cmd+V）で貼り付けてください'
  };
};