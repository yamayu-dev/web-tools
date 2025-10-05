import { useEffect, useMemo, useRef, useState } from 'react'

type Mode = 'perLineFirstNumber' | 'allNumbersInText'

function Calc() {
  const [text, setText] = useState<string>('')
  const [mode, setMode] = useState<Mode>('perLineFirstNumber')
  const taRef = useRef<HTMLTextAreaElement | null>(null)

  // 解析ロジック
  const { sum, count, numbers, errors } = useMemo(() => {
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

    const s = nums.reduce((a, b) => a + b, 0)
    return { sum: s, count: nums.length, numbers: nums, errors: errs }
  }, [text, mode])

  // Ctrl/Cmd+Enter で全選択→合計計算の結果へフォーカス移動
  useEffect(() => {
    const el = taRef.current
    if (!el) return
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        // ここでは特に処理不要（リアルタイム計算のため）
        // 必要なら何かトースト表示等
      }
    }
    el.addEventListener('keydown', handler)
    return () => el.removeEventListener('keydown', handler)
  }, [])

  // クリップボードの改行テキストを貼り付け → そのまま反映（デフォでOK）

  return (
    <section>
      <h2>計算（改行テキストの合計）</h2>

      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <label>
          モード：
          <select value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
            <option value="perLineFirstNumber">行ごとに最初の数値を合計</option>
            <option value="allNumbersInText">全文中のすべての数値を合計</option>
          </select>
        </label>
        <button type="button" onClick={() => setText('')}>クリア</button>
        <button type="button" onClick={() => navigator.clipboard.readText().then(setText).catch(() => {})}>
          クリップボードから貼り付け
        </button>
      </div>

      <textarea
        ref={taRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={`例）各行に金額や数値を貼り付け\n100\n-20.5\n1.2e3\tラベル付きでもOK\n合計したい値が行頭でなくてもOK`}
        style={{ width: '100%', height: 240, marginTop: 12, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' }}
      />

      <Result sum={sum} count={count} numbers={numbers} errors={errors} />
    </section>
  )
}

function Result({ sum, count, numbers, errors }: { sum: number; count: number; numbers: number[]; errors: string[] }) {
  const fmt = (n: number) => new Intl.NumberFormat(undefined, { maximumFractionDigits: 12 }).format(n)
  const avg = numbers.length ? numbers.reduce((a, b) => a + b, 0) / numbers.length : 0

  return (
    <div style={{ marginTop: 16 }}>
      <h3>結果</h3>
      <dl style={{ display: 'grid', gridTemplateColumns: '10em 1fr', rowGap: 4 }}>
        <dt>件数</dt><dd>{count}</dd>
        <dt>合計</dt><dd><strong style={{ fontSize: 24 }}>{fmt(sum)}</strong></dd>
        <dt>平均</dt><dd>{count ? fmt(avg) : '-'}</dd>
      </dl>

      {errors.length > 0 && (
        <details style={{ marginTop: 8 }}>
          <summary>解析メモ（数値なし行など）</summary>
          <ul>
            {errors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </details>
      )}
    </div>
  )
}

export default Calc