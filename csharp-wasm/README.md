# C# WebAssembly Runner

This project compiles C# code into WebAssembly for client-side execution in the browser.

## Building

### ローカルでのビルド (推奨)

```bash
# リポジトリルートから実行
./scripts/build-csharp-wasm.sh
```

詳細は [`scripts/README.md`](../scripts/README.md) を参照してください。

### 手動ビルド

```bash
cd csharp-wasm
dotnet publish -c Release
```

The output will be placed in `../public/wasm/`

## Configuration

To trigger a rebuild via GitHub Actions, update the `buildVersion` in `../csharp-wasm.config.json`.

## Architecture

- Uses Blazor WebAssembly as the runtime
- Exports functions via JSExport for JavaScript interop
- Intended to provide client-side C# compilation and execution

### Trimming Configuration

The project uses IL trimming to reduce the WASM bundle size. The following assemblies are marked as `TrimmerRootAssembly` to ensure they are fully preserved for dynamic code execution:

- `System.Runtime` - Core runtime functionality
- `System.Linq` - LINQ operations
- `System.Linq.Expressions` - Expression trees
- `System.Threading.Tasks` - Task-based async operations
- `System.Threading` - Threading primitives
- `System.Threading.Thread` - Thread management
- `System.Threading.ThreadPool` - ThreadPool support
- `System.Threading.Timer` - Timer functionality
- `System.Runtime.CompilerServices.Unsafe` - Unsafe operations
- `System.Collections` - Collection types
- `System.Console` - Console I/O operations
- `mscorlib` - Legacy core library

These assemblies are required for user code that is compiled and executed dynamically at runtime.

#### 新しい.NET機能を追加する場合

全ての.NETライブラリを事前に記載する必要はありません。現在の方法は「必要なものだけを明示的に保持する」アプローチです。

**新しい機能を使用する場合：**
1. `CSharpRunner.csproj` の `<TrimmerRootAssembly>` セクションに該当するアセンブリを追加
2. `csharp-wasm.config.json` の `buildVersion` を更新してリビルドをトリガー

**代替案（全てのライブラリを保持）：**
```xml
<PublishTrimmed>false</PublishTrimmed>
```
この設定で全てのライブラリが保持されますが、WASMバンドルサイズが大幅に増加します（推奨しません）。

## TODO

- Integrate Roslyn compiler for dynamic C# compilation
- Implement code execution sandbox
- Add error handling and output capture
