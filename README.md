# web-tools

## 技術スタック

- **Frontend**: React 19.1.1, TypeScript 5.9.3
- **UI**: Chakra UI v3.27.0
- **Router**: React Router v7.9.3
- **Icons**: Lucide React 0.544.0
- **Build**: Vite 7.1.7
- **Deploy**: GitHub Pages

## セットアップ

### 必要な環境

- Node.js 18以上
- npm または yarn

### インストール

```bash
# リポジトリをクローン
git clone https://github.com/yamayu-dev/web-tools.git
cd web-tools

# 依存関係をインストール
npm install
```

## 開発

### 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:5173/web-tools/` を開く

### コードの品質チェック

```bash
# ESLintでコードチェック
npm run lint

# TypeScriptの型チェック
npx tsc --noEmit
```

### ディレクトリ構造

```
src/
├── components/          # 共通コンポーネント
│   ├── Header.tsx      # ヘッダーナビゲーション
│   └── ColorModeProvider.tsx  # ダークモード管理
├── pages/              # ページコンポーネント
│   └── Calc.tsx        # 計算ツールページ
├── hooks/              # カスタムフック
│   ├── useToast.ts     # トースト表示
│   └── useColorStyles.ts  # カラーモードスタイル
├── utils/              # ユーティリティ関数
│   └── numberUtils.ts  # 数値処理関数
├── types/              # 型定義
│   └── calculator.ts   # 計算ツール関連の型
├── App.tsx             # メインアプリケーション
└── main.tsx            # エントリーポイント
```

## デプロイ

### ビルド

```bash
# 本番用ビルドを作成
npm run build
```

ビルド結果は `dist/` ディレクトリに出力されます。

### GitHub Pagesへのデプロイ

```bash
# ビルドとデプロイを実行
npm run build

# GitHub Pagesに手動デプロイする場合
# dist/フォルダの内容をgh-pagesブランチにpush
```

### プレビュー

```bash
# ビルド結果をローカルでプレビュー
npm run preview
```

## 🎨 開発ガイドライン

### コンポーネント設計

- **関数型コンポーネント**を使用
- **カスタムフック**で状態管理を分離
- **TypeScript**で型安全性を確保
- **Chakra UI**でスタイリング統一

### 新しいツールの追加

1. `src/pages/` に新しいページコンポーネントを作成
2. `src/App.tsx` にルートを追加
3. ホーム画面にリンクを追加

## トラブルシューティング

### よくある問題

**Q: 開発サーバーが起動しない**
```bash
# node_modulesを削除して再インストール
rm -rf node_modules package-lock.json
npm install
```

**Q: ビルドエラーが発生する**
```bash
# 型チェックを実行
npx tsc --noEmit

# ESLintエラーを確認
npm run lint
```

**Q: GitHub Pagesで404エラー**
- `vite.config.ts` の `base` 設定を確認
- `scripts/copy-404.js` が実行されているか確認
