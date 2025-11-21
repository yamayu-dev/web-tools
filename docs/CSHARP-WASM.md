# C# WebAssembly 実行システム

このドキュメントは、C#コードをブラウザ上で実行するためのWebAssembly統合システムについて説明します。

## 概要

コード実行機能は2つのモードをサポートします：

1. **API版**: Wandbox APIを使用してサーバー側でC#をコンパイル・実行
2. **WASM版**: ブラウザ上でC#を直接実行（WebAssembly使用）

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
