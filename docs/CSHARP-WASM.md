# C# WebAssembly 実行システム

このドキュメントは、C#コードをブラウザ上で実行するためのWebAssembly統合システムについて説明します。

## 概要

コード実行機能は2つのモードをサポートします：

1. **API版**: Wandbox APIを使用してサーバー側でC#をコンパイル・実行
2. **WASM版**: ブラウザ上でC#を直接実行（WebAssembly使用）

## 設定管理

WASM ファイルの出力パスとファイル名は、以下のように管理されています：

### 単一の真実の源: `csharp-wasm.config.json`

```json
{
  "buildVersion": "1.0.0",
  "outputPath": "public/wasm",
  "wasmFilename": "dotnet.wasm",
  "versionFilename": "version.json"
}
```

### 各ファイルでの使用方法

| ファイル | 用途 | 設定値の参照元 |
|---------|------|--------------|
| `csharp-wasm.config.json` | **マスター設定** | - |
| `.github/workflows/build-csharp-wasm.yml` | GitHub Actions でビルド・配置 | `jq` コマンドで config から読み取り |
| `csharp-wasm/CSharpRunner.csproj` | .NET ビルド出力先 | `OutputPath` を手動で一致させる |
| `src/constants/wasmConstants.ts` | TypeScript からのアクセス | 値を手動で一致させる |

### 設定変更時の手順

WASM 出力パスやファイル名を変更する場合は、以下の手順で行います：

1. **`csharp-wasm.config.json` を更新**
   ```json
   {
     "outputPath": "public/wasm",  // ← 変更
     "wasmFilename": "dotnet.wasm",
     "versionFilename": "version.json"
   }
   ```

2. **`csharp-wasm/CSharpRunner.csproj` の `OutputPath` を更新**
   ```xml
   <OutputPath>../public/wasm/</OutputPath>  <!-- ← 変更 -->
   ```

3. **`src/constants/wasmConstants.ts` の定数を更新**
   ```typescript
   export const WASM_CONFIG = {
     OUTPUT_DIR: 'wasm',  // ← public/ からの相対パス
     WASM_FILENAME: 'dotnet.wasm',
     VERSION_FILENAME: 'version.json',
   }
   ```

4. **変更をテスト**
   - TypeScript ビルド: `npm run build`
   - GitHub Actions ワークフローが正常に動作することを確認

### 配置パスの詳細

- **ビルド時の出力先**: `public/wasm/`
  - .NET プロジェクトが `dotnet publish` でビルド
  - GitHub Actions が成果物をコミット
  
- **ブラウザからのアクセス**: `{BASE_URL}wasm/dotnet.wasm`
  - 例: `https://yamayu-dev.github.io/web-tools/wasm/dotnet.wasm`
  - `BASE_URL` は Vite の設定で `/web-tools/` に設定

## 使用方法

### UI で切り替え

1. コード実行ページを開く
2. 言語で「C#」を選択
3. ドロップダウンから「API版」または「WASM版」を選択
4. コードを入力して「実行」をクリック

### WASM版のビルド

`csharp-wasm.config.json` の `buildVersion` を更新してコミット:

```json
{
  "buildVersion": "1.0.1",  // ← この番号を変更
  "wasmEnabled": true
}
```

GitHub Actionsが自動的にビルドします。

## 参考資料

- [Blazor WebAssembly](https://learn.microsoft.com/aspnet/core/blazor/)
- [Wandbox API](https://wandbox.org/)
