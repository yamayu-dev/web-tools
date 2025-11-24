# C# WebAssembly Threading Issue Fix

## 問題概要 (Problem Summary)

C# WebAssemblyランタイムで以下の2つのエラーが発生していました：

1. **スレッディングエラー**: "Cannot wait on monitors on this runtime"
   - Roslynコンパイラーが内部的にスレッドを使用しようとした
   - WebAssembly環境ではスレッド機能が制限されている

2. **コンパイルエラー**: "Identifier expected", "} expected" など
   - 完全なプログラム（class と Main メソッドを含む）をラップした結果、無効な構文になった

## 原因分析 (Root Cause)

### 1. スレッディングの問題

Roslynコンパイラーは `compilation.Emit()` 時にCLS準拠チェックを実行し、その際にマルチスレッドを使用します。
WebAssembly環境では Monitor.Wait() などのスレッド同期機能がサポートされていないため、エラーが発生しました。

スタックトレース:
```
at System.Threading.Monitor.ObjWait(Int32 , Object )
at System.Threading.Monitor.Wait(Object , Int32 )
at System.Threading.ManualResetEventSlim.Wait(Int32 , CancellationToken )
at Microsoft.CodeAnalysis.CSharp.ClsComplianceChecker.WaitForWorkers()
```

### 2. コードラッピングの問題

旧実装では、すべてのユーザーコードを以下のようにラップしていました：

```csharp
public class UserProgram
{
    public static void Execute()
    {
        // ユーザーコードをここに挿入
    }
}
```

しかし、ユーザーが完全なプログラムを書いた場合：

```csharp
class Program
{
    static void Main()
    {
        Console.WriteLine("Hello");
    }
}
```

これをラップすると無効な構文になります（classの中にclassは定義できない）。

## 解決策 (Solution)

### 1. スレッディング問題の修正

`CSharpCompilationOptions` に以下のオプションを追加：

```csharp
new CSharpCompilationOptions(
    OutputKind.DynamicallyLinkedLibrary,
    concurrentBuild: false,              // 並行ビルドを無効化
    reportSuppressedDiagnostics: false)  // 抑制された診断を報告しない
```

- `concurrentBuild: false`: マルチスレッド処理を無効化
- これによりCLS準拠チェックがシングルスレッドで実行される

### 2. 柔軟なコード処理

ユーザーコードの形式を検出し、適切に処理：

```csharp
// クラス定義の検出（正規表現でワード境界を使用）
bool hasClassDefinition = Regex.IsMatch(
    code, 
    @"\bclass\s+\w+", 
    RegexOptions.Multiline);

if (hasClassDefinition)
{
    // 完全なプログラム: using文を追加（必要な場合のみ）
    wrappedCode = hasUsingStatements ? code : $"using System;...\n{code}";
}
else
{
    // コードスニペット: UserProgram.Execute() でラップ
    wrappedCode = $"public class UserProgram {{ ... {code} ... }}";
}
```

### 3. エントリーポイントの動的検索

すべてのタイプを検索して Main メソッドを探す：

```csharp
// まず UserProgram.Execute を探す（ラップされたコード用）
var method = assembly.GetType("UserProgram")
    ?.GetMethod("Execute", BindingFlags.Public | BindingFlags.Static);

// 見つからない場合は、すべてのタイプから Main メソッドを探す
if (method == null)
{
    foreach (var type in assembly.GetTypes())
    {
        method = type.GetMethod("Main", 
            BindingFlags.Public | BindingFlags.Static | BindingFlags.NonPublic);
        if (method != null) break;
    }
}
```

## サポートされるコード形式 (Supported Code Formats)

### 形式1: 完全なプログラム

```csharp
using System;

class Program
{
    static void Main()
    {
        Console.WriteLine("Hello, World!");
    }
}
```

### 形式2: コードスニペット

```csharp
Console.WriteLine("Hello, World!");
int sum = 1 + 2 + 3;
Console.WriteLine($"Sum: {sum}");
```

### 形式3: カスタムクラス名

```csharp
using System;

class MyApp
{
    static void Main()
    {
        Console.WriteLine("Hello from MyApp!");
    }
}
```

## テスト結果 (Test Results)

### ビルド
- ✅ C# プロジェクト: ビルド成功
- ✅ フロントエンド: ビルド成功
- ✅ ESLint: エラーなし

### セキュリティ
- ✅ CodeQL分析: 0件のアラート
- ✅ 新しい脆弱性なし

## 技術詳細 (Technical Details)

### WebAssemblyのスレッド制限

WebAssembly（特にブラウザ環境）では：
- `Monitor.Wait()` / `Monitor.Pulse()` が使用不可
- `Thread.Sleep()` が制限付き
- SharedArrayBuffer がない限り、真のマルチスレッドは不可

### Roslynコンパイラーの動作

デフォルトでは以下の処理で並行処理を使用：
1. シンタックスツリーの解析
2. シンボル解決
3. CLS準拠チェック ← ここでエラー発生
4. IL生成

`concurrentBuild: false` により、これらがシーケンシャルに実行されます。

## 参考資料 (References)

- [Roslyn Compilation Options](https://learn.microsoft.com/en-us/dotnet/api/microsoft.codeanalysis.csharp.csharpcompilationoptions)
- [WebAssembly Threading](https://webassembly.org/roadmap/)
- [Blazor WebAssembly](https://learn.microsoft.com/aspnet/core/blazor/)

## 変更ファイル (Changed Files)

- `csharp-wasm/Program.cs`: コンパイルオプションとコード処理ロジックの修正
