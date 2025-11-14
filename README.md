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
# ローカル開発用
npm run dev

# ネットワークアクセス可能で起動（同じWi-Fiのスマートフォンからアクセス可能）
npm run dev -- --host
```

ローカル: `http://localhost:5173/web-tools/`  
ネットワーク: `http://[IP]:5173/web-tools/`

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

### GitHub Pages自動デプロイ設定

このプロジェクトはGitHub Actionsによる自動デプロイが設定されています：

1. **ワークフロー**: `.github/workflows/pages.yml`
2. **トリガー**: `main`ブランチへのプッシュ
3. **デプロイ先**: https://yamayu-dev.github.io/web-tools/

### ビルド

```bash
# 本番用ビルドを作成
npm run build
```

ビルド結果は `dist/` ディレクトリに出力されます。

### GitHub Pagesへのデプロイ

このプロジェクトは GitHub Actions を使用して自動デプロイされます。

**自動デプロイ（推奨）**：
- `main` ブランチにプッシュすると自動的に GitHub Pages にデプロイされます
- `.github/workflows/pages.yml` でワークフローが定義されています
- デプロイ先: https://yamayu-dev.github.io/web-tools/

**手動ビルドの確認**：
```bash
# ローカルでビルドをテスト
npm run build

# ビルド結果をプレビュー
npm run preview
```

### プレビュー

```bash
# ビルド結果をローカルでプレビュー
npm run preview
```

## 開発ガイドライン

### コンポーネント設計

- **関数型コンポーネント**を使用
- **カスタムフック**で状態管理を分離
- **TypeScript**で型安全性を確保
- **Chakra UI**でスタイリング統一

### 新しいツールの追加

1. `src/pages/` に新しいページコンポーネントを作成
2. `src/App.tsx` にルートを追加
3. ホーム画面にリンクを追加

### デプロイフロー

1. 機能開発・修正を実施
2. ローカルでビルドテスト: `npm run build`
3. `main` ブランチにプッシュ
4. GitHub Actions が自動的にビルド・デプロイを実行
5. https://yamayu-dev.github.io/web-tools/ で確認

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

**Q: スマートフォンからアクセスできない**
```bash
# MacのIPアドレスを確認
ifconfig | grep "inet " | grep -v 127.0.0.1

# ネットワーク対応で開発サーバー起動
npm run dev -- --host

# ファイアウォール設定を確認（Mac）
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate
```
- 同じWi-Fiネットワークに接続されているか確認
- Macのファイアウォールでポート5173が許可されているか確認

**Q: GitHub Pagesで404エラー**
- リポジトリの Settings > Pages で Source が「GitHub Actions」になっているか確認
- `vite.config.ts` の `base: '/web-tools/'` 設定を確認
- `scripts/copy-404.js` が実行されているか確認（SPAの404対応）
- GitHub Actions ワークフローが正常に実行されているか Actions タブで確認

## 機能詳細

### MarkdownエディタのPDFエクスポート

PC・Mobile共通で安定したPDF出力を提供します。

#### PDF出力方式

1. **オフスクリーン方式（推奨・デフォルト）**
   - PC・Mobile共通で同じ内容のPDFを出力
   - プレビュー相当の文字サイズ・レイアウト
   - 適切な余白（15mm）とページ分割
   - テーブル・コードブロック・Mermaid図に対応
   - ページの重なりなし

2. **jsPDF直接描画方式（試験的）**
   - Markdownから直接PDFを生成
   - テーブルヘッダーの背景色を正しく表示
   - Mermaid図をSVGから画像変換して埋め込み
   - 軽量で高速（Canvasレンダリング不要）

#### 推奨設定
- **出力方式**: オフスクリーン方式
- **文字サイズ**: プレビュー相当（自動設定）
- **余白**: 15mm（A4用紙に最適）
- **対象幅**: 800px（PC・Mobile共通）
````
