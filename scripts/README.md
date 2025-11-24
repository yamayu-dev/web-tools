# ローカルビルドガイド

このディレクトリには、C# WebAssembly をローカル環境でビルドするためのスクリプトが含まれています。

## 前提条件

### 必須ツール

1. **.NET 8.0 SDK**
   - インストール: https://dotnet.microsoft.com/download
   - バージョン確認: `dotnet --version`

2. **jq** (JSON パーサー)
   - Ubuntu/Debian: `sudo apt-get install jq`
   - macOS: `brew install jq`
   - Windows (Git Bash): `choco install jq` または手動インストール

3. **Node.js** (開発サーバー用)
   - プロジェクトルートで `npm install` を実行済みであること

## ビルド手順

### 1. C# WASM のビルド

```bash
# リポジトリルートから実行
./scripts/build-csharp-wasm.sh
```

このスクリプトは以下の処理を自動で実行します:
- 前提条件のチェック (.NET SDK, jq)
- WASM ワークロードのインストール (未インストールの場合)
- C# プロジェクトのビルド (`dotnet publish -c Release`)
- WASM ファイルを `public/wasm/` にコピー
- バージョン情報ファイルの作成

### 2. 開発サーバーの起動

```bash
npm run dev
```

### 3. ブラウザでテスト

1. ブラウザで開発サーバーのURLを開く (通常は http://localhost:5173/web-tools/)
   - URLは `npm run dev` の出力を確認してください
2. 「コード実行」ページに移動
3. 言語セレクタで「C#」を選択
4. C# 実行環境が正常に初期化されることを確認
5. サンプルコードを実行してテスト

## トラブルシューティング

### WASM ワークロードのエラー

```bash
# ワークロードの一覧を確認
dotnet workload list

# 手動でインストール
dotnet workload install wasm-tools
```

### ビルドエラーが発生した場合

```bash
# ビルドキャッシュをクリア
cd csharp-wasm
dotnet clean
cd ..

# 再度ビルドスクリプトを実行
./scripts/build-csharp-wasm.sh
```

### ファイルが見つからないエラー

```bash
# public/wasm ディレクトリが存在するか確認
ls -la public/wasm/

# 必要に応じてディレクトリを作成
mkdir -p public/wasm
```

## GitHub Actions との対応

このローカルビルドスクリプトは、`.github/workflows/build-csharp-wasm.yml` で定義されている GitHub Actions ワークフローと同じ手順を実行します。

| ワークフロー ステップ | ローカルスクリプト |
|---------------------|------------------|
| Setup .NET | 前提条件チェック |
| Install WASM workload | `dotnet workload install` |
| Build C# WebAssembly | `dotnet publish -c Release` |
| Copy WASM files | ファイルコピーと整理 |
| Create version info | version.json の作成 |

## 設定ファイル

ビルド設定は `csharp-wasm.config.json` で管理されています:

```json
{
  "buildVersion": "1.0.2",
  "wasmEnabled": true,
  "outputPath": "public/wasm",
  "wasmFilename": "dotnet.native.wasm",
  "versionFilename": "version.json"
}
```

- `buildVersion`: ビルドのバージョン番号
- `outputPath`: WASM ファイルの出力先
- `wasmFilename`: メイン WASM ファイル名
- `versionFilename`: バージョン情報ファイル名

## 参考リンク

- [.NET WebAssembly ビルドツール](https://learn.microsoft.com/ja-jp/aspnet/core/blazor/tooling)
- [Blazor WebAssembly](https://learn.microsoft.com/ja-jp/aspnet/core/blazor/)
